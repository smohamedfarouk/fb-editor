class FromAddress < ApplicationRecord
  before_save :encrypt_email
  after_save :update_status

  validates :email, format: {
    with: URI::MailTo::EMAIL_REGEXP,
    message: lambda do |_object, _|
      I18n.t(
        'activemodel.errors.models.from_address.invalid'
      )
    end
  }, allow_blank: true

  enum status: {
    unverified: 0,
    pending: 1,
    verified: 2
  }

  DEFAULT_EMAIL_FROM = I18n.t('default_values.service_email_from')

  def email_address
    decrypt_email
  rescue ActiveSupport::MessageEncryptor::InvalidMessage
    email
  end

  def decrypt_email
    if email.present?
      @decrypt_email ||=
        EncryptionService.new.decrypt(email)
    end
  end

  private

  def update_status
    if email_address == DEFAULT_EMAIL_FROM
      update_status_column(:verified)
    else
      update_status_column(:unverified)
    end
  end

  def update_status_column(status)
    update_column(:status, status)
  end

  def encrypt_email
    self.email = EncryptionService.new.encrypt(email)
  end
end
