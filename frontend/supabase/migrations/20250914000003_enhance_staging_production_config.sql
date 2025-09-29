-- Enhanced environment table to support staging environment
-- Add staging environment configurations

INSERT INTO public.environment (environment, key, value, is_secret, description) VALUES
-- STAGING Environment Configuration
-- Travel Provider Keys (Staging)
('staging', 'AMADEUS_CLIENT_ID', 'staging-amadeus-client-id', true, 'Amadeus API Client ID for staging'),
('staging', 'AMADEUS_CLIENT_SECRET', 'staging-amadeus-client-secret', true, 'Amadeus API Client Secret for staging'),
('staging', 'SABRE_CLIENT_ID', 'staging-sabre-client-id', true, 'Sabre API Client ID for staging'),
('staging', 'SABRE_CLIENT_SECRET', 'staging-sabre-client-secret', true, 'Sabre API Client Secret for staging'),
('staging', 'VIATOR_API_KEY', 'staging-viator-api-key', true, 'Viator API Key for staging'),
('staging', 'DUFFLE_API_KEY', 'staging-duffle-api-key', true, 'Duffle API Key for staging'),
('staging', 'RATEHAWK_API_KEY', 'staging-ratehawk-api-key', true, 'RateHawk API Key for staging'),
('staging', 'EXPEDIA_API_KEY', 'staging-expedia-api-key', true, 'Expedia API Key for staging'),

-- Payment Provider Keys (Staging)
('staging', 'STRIPE_PUBLISHABLE_KEY', 'pk_test_staging-stripe-publishable-key', false, 'Stripe Publishable Key for staging'),
('staging', 'STRIPE_SECRET_KEY', 'sk_test_staging-stripe-secret-key', true, 'Stripe Secret Key for staging'),

-- AI/LLM Provider Keys (Staging)
('staging', 'OPENAI_API_KEY', 'sk-staging-openai-api-key', true, 'OpenAI API Key for staging'),
('staging', 'ANTHROPIC_API_KEY', 'sk-ant-staging-anthropic-api-key', true, 'Anthropic API Key for staging'),
('staging', 'GEMINI_API_KEY', 'staging-gemini-api-key', true, 'Google Gemini API Key for staging'),

-- Configuration Values (Staging - non-secret)
('staging', 'ENVIRONMENT_NAME', 'staging', false, 'Environment identifier for staging'),
('staging', 'API_BASE_URL', 'https://api.staging.maku.travel', false, 'API base URL for staging'),
('staging', 'FRONTEND_URL', 'https://staging.maku.travel', false, 'Frontend URL for staging'),
('staging', 'DEBUG_MODE', 'true', false, 'Enable debug logging for staging'),
('staging', 'RATE_LIMIT_ENABLED', 'true', false, 'Enable rate limiting for staging'),

-- Analytics & Monitoring (Staging)
('staging', 'POSTHOG_API_KEY', 'staging-posthog-api-key', true, 'PostHog analytics key for staging'),
('staging', 'SENTRY_DSN', 'staging-sentry-dsn', true, 'Sentry error tracking DSN for staging'),
('staging', 'MONITORING_ENABLED', 'true', false, 'Enable monitoring and alerts for staging')

ON CONFLICT (environment, key) DO UPDATE SET
  value = EXCLUDED.value,
  description = EXCLUDED.description,
  updated_at = now();

-- Insert additional environment_configs for staging
INSERT INTO public.environment_configs (environment, config_key, config_value, is_active) VALUES
-- Staging Provider Base URLs
('staging', 'amadeus_base_url', '"https://test.api.amadeus.com"', true),
('staging', 'amadeus_token_url', '"https://test.api.amadeus.com/v1/security/oauth2/token"', true),
('staging', 'sabre_base_url', '"https://api-crt.cert.havail.sabre.com"', true),
('staging', 'sabre_token_url', '"https://api-crt.cert.havail.sabre.com/v2/auth/token"', true),
('staging', 'hotelbeds_base_url', '"https://api.test.hotelbeds.com"', true),
('staging', 'viator_base_url', '"https://api.sandbox-viatorapi.com"', true),
('staging', 'duffle_base_url', '"https://api.duffel.com"', true),
('staging', 'ratehawk_base_url', '"https://api.ratehawk.com"', true),
('staging', 'expedia_base_url', '"https://api.sandbox.expediagroup.com"', true),

-- Staging Payment Configuration
('staging', 'stripe_mode', '"test"', true),
('staging', 'stripe_webhook_endpoint', '"https://staging.maku.travel/webhooks/stripe"', true),

-- Staging Feature Flags
('staging', 'feature_nft_enabled', 'true', true),
('staging', 'feature_airdrop_enabled', 'true', true),
('staging', 'feature_smart_dreams_enabled', 'true', true),
('staging', 'feature_ai_intelligence_enabled', 'true', true),
('staging', 'feature_analytics_enabled', 'true', true),

-- Staging Performance Settings
('staging', 'cache_ttl_seconds', '300', true),
('staging', 'api_timeout_seconds', '30', true),
('staging', 'max_concurrent_requests', '100', true),

-- Production Provider Base URLs (Updated)
('production', 'amadeus_base_url', '"https://api.amadeus.com"', true),
('production', 'amadeus_token_url', '"https://api.amadeus.com/v1/security/oauth2/token"', true),
('production', 'sabre_base_url', '"https://api.havail.sabre.com"', true),
('production', 'sabre_token_url', '"https://api.havail.sabre.com/v2/auth/token"', true),
('production', 'hotelbeds_base_url', '"https://api.hotelbeds.com"', true),
('production', 'viator_base_url', '"https://api.viatorapi.com"', true),
('production', 'duffle_base_url', '"https://api.duffel.com"', true),
('production', 'ratehawk_base_url', '"https://api.ratehawk.com"', true),
('production', 'expedia_base_url', '"https://api.expediagroup.com"', true),

-- Production Payment Configuration
('production', 'stripe_mode', '"live"', true),
('production', 'stripe_webhook_endpoint', '"https://maku.travel/webhooks/stripe"', true),

-- Production Feature Flags
('production', 'feature_nft_enabled', 'true', true),
('production', 'feature_airdrop_enabled', 'true', true),
('production', 'feature_smart_dreams_enabled', 'true', true),
('production', 'feature_ai_intelligence_enabled', 'true', true),
('production', 'feature_analytics_enabled', 'true', true),

-- Production Performance Settings
('production', 'cache_ttl_seconds', '600', true),
('production', 'api_timeout_seconds', '45', true),
('production', 'max_concurrent_requests', '500', true)

ON CONFLICT (environment, config_key) DO UPDATE SET
  config_value = EXCLUDED.config_value,
  is_active = EXCLUDED.is_active,
  updated_at = now();