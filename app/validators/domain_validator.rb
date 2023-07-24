class DomainValidator < ActiveModel::EachValidator
  def validate_each(record, attribute, value)
    domain = value.split('@').last
    if value.present? && !domain.in?(Rails.application.config.allowed_domains)
      record.errors.add(
        attribute,
        I18n.t('activemodel.errors.models.email_settings.domain_invalid')
      )
    end
  end
end
