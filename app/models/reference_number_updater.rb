class ReferenceNumberUpdater
  attr_reader :service, :reference_number_settings

  CONFIGS = %w[REFERENCE_NUMBER].freeze

  def initialize(service:, reference_number_settings:)
    @service = service
    @reference_number_settings = reference_number_settings
  end

  def create_or_update!
    ActiveRecord::Base.transaction do
      save_config
    end
  end

  def save_config
    CONFIGS.each do |config|
      if reference_number_settings.enabled?
        create_or_update_service_configuration(config: config, deployment_environment: 'dev')
        create_or_update_service_configuration(config: config, deployment_environment: 'production')
      else
        remove_service_configuration(config, 'dev')
        remove_service_configuration(config, 'production')
      end
      save_config_with_defaults
    end
  end

  def create_or_update_service_configuration(config:, deployment_environment:, value: reference_number)
    setting = find_or_initialize_setting(config, deployment_environment)
    setting.value = value
    setting.save!
  end

  def find_or_initialize_setting(config, deployment_environment)
    ServiceConfiguration.find_or_initialize_by(
      service_id: service.service_id,
      deployment_environment: deployment_environment,
      name: config
    )
  end

  def remove_service_configuration(config, deployment_environment)
    setting = find_or_initialize_setting(config, deployment_environment)
    setting.destroy!
  end

  def save_config_with_defaults
    email_settings.each do |settings|
      EmailSettingsUpdater.new(
        email_settings: settings,
        service: service
      ).create_or_update!
    end

    confirmation_emails_settings.each do |settings|
      ConfirmationEmailSettingsUpdater.new(
        confirmation_email_settings: settings,
        service: service
      ).create_or_update!
    end
  end

  private

  def reference_number
    @reference_number ||= reference_number_settings.reference_number
  end

  def confirmation_emails_settings
    [
      assign_confirmation_email_settings('dev'),
      assign_confirmation_email_settings('production')
    ]
  end

  def email_settings
    [assign_email_settings('dev'), assign_email_settings('production')]
  end

  def assign_email_settings(deployment_environment)
    EmailSettings.new(
      deployment_environment: deployment_environment,
      service_email_subject: content_substitutor(deployment_environment).service_email_subject,
      service_email_body: content_substitutor(deployment_environment).service_email_body,
      service_email_pdf_heading: content_substitutor(deployment_environment).service_email_pdf_heading
    )
  end

  def assign_confirmation_email_settings(deployment_environment)
    ConfirmationEmailSettings.new(
      deployment_environment: deployment_environment,
      confirmation_email_subject: content_substitutor(deployment_environment).confirmation_email_subject,
      confirmation_email_body: content_substitutor(deployment_environment).confirmation_email_body
    )
  end

  def content_substitutor(deployment_environment)
    @content_substitutor ||= ContentSubstitutor.new(
      service_name: service.service_name,
      reference_number_enabled: reference_number_enabled(deployment_environment)
    )
  end

  def reference_number_enabled(deployment_environment)
    ServiceConfiguration.find_by(
      service_id: service.service_id,
      deployment_environment: deployment_environment,
      name: 'REFERENCE_NUMBER'
    ).present?
  end
end
