class AddPaymentLinkSubmissionSetting < ActiveRecord::Migration[6.1]
  def change
    add_column :submission_settings, :payment_link, :boolean, default: false
  end
end
