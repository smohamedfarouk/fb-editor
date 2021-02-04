FactoryBot.define do
  factory :service_configuration do
    service_id { SecureRandom.uuid }

    trait :dev do
      deployment_environment { 'dev' }
    end

    trait :production do
      deployment_environment { 'production' }
    end

    trait :username do
      name { 'USERNAME' }
      value { 'eC13aW5nCg==' }
    end

    trait :password do
      name { 'PASSWORD' }
      value { 'dGllLWZpZ2h0ZXIK' }
    end
  end
end
