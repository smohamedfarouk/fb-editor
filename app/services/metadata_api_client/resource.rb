module MetadataApiClient
  class Resource
    SERVICE_NAME_EXISTS = 'Name has already been taken'.freeze

    attr_accessor :id, :name, :metadata

    def initialize(attributes = {})
      @id = attributes['service_id']
      @name = attributes['service_name']
      @metadata = attributes
    end

    def self.connection
      Connection.new
    end

    def self.error_messages(exception)
      errors = JSON.parse(
        exception.response_body, symbolize_names: true
      )[:message]

      sentry_errors = errors.reject { |err| err == SERVICE_NAME_EXISTS }
      Sentry.capture_message(sentry_errors.join(' | ')) if sentry_errors.present?

      MetadataApiClient::ErrorMessages.new(errors)
    end

    def ==(other)
      id == other.id
    end

    def errors?
      false
    end
  end
end
