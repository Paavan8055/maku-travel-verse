-- Create environment table for secrets management
-- This table stores API keys and configuration values securely

CREATE TABLE IF NOT EXISTS public.environment (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  environment TEXT NOT NULL CHECK (environment IN ('development', 'staging', 'production')),
  key TEXT NOT NULL,
  value TEXT NOT NULL,
  is_secret BOOLEAN NOT NULL DEFAULT true,
  is_active BOOLEAN NOT NULL DEFAULT true,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  UNIQUE(environment, key)
);

-- Enable RLS for security
ALTER TABLE public.environment ENABLE ROW LEVEL SECURITY;

-- Only service role can read secrets (for get-secrets function)
CREATE POLICY "Service role can read environment secrets" 
ON public.environment 
FOR SELECT 
USING (auth.role() = 'service_role');

-- Only admins can manage environment secrets
CREATE POLICY "Admins can manage environment secrets" 
ON public.environment 
FOR ALL 
USING (is_secure_admin(auth.uid()));

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_environment_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER environment_updated_at_trigger
  BEFORE UPDATE ON public.environment
  FOR EACH ROW
  EXECUTE FUNCTION update_environment_updated_at();

-- Insert essential API keys for development environment
INSERT INTO public.environment (environment, key, value, is_secret, description) VALUES
-- Travel Provider Keys
('development', 'AMADEUS_CLIENT_ID', 'your-amadeus-client-id', true, 'Amadeus API Client ID for development'),
('development', 'AMADEUS_CLIENT_SECRET', 'your-amadeus-client-secret', true, 'Amadeus API Client Secret for development'),
('development', 'SABRE_CLIENT_ID', 'your-sabre-client-id', true, 'Sabre API Client ID for development'),
('development', 'SABRE_CLIENT_SECRET', 'your-sabre-client-secret', true, 'Sabre API Client Secret for development'),
('development', 'VIATOR_API_KEY', 'your-viator-api-key', true, 'Viator API Key for development'),
('development', 'DUFFLE_API_KEY', 'your-duffle-api-key', true, 'Duffle API Key for development'),
('development', 'RATEHAWK_API_KEY', 'your-ratehawk-api-key', true, 'RateHawk API Key for development'),
('development', 'EXPEDIA_API_KEY', 'your-expedia-api-key', true, 'Expedia API Key for development'),

-- Payment Provider Keys
('development', 'STRIPE_PUBLISHABLE_KEY', 'pk_test_your-stripe-publishable-key', false, 'Stripe Publishable Key for development'),
('development', 'STRIPE_SECRET_KEY', 'sk_test_your-stripe-secret-key', true, 'Stripe Secret Key for development'),

-- AI/LLM Provider Keys
('development', 'OPENAI_API_KEY', 'sk-your-openai-api-key', true, 'OpenAI API Key for development'),
('development', 'ANTHROPIC_API_KEY', 'sk-ant-your-anthropic-api-key', true, 'Anthropic API Key for development'),
('development', 'GEMINI_API_KEY', 'your-gemini-api-key', true, 'Google Gemini API Key for development'),

-- Configuration Values (non-secret)
('development', 'ENVIRONMENT_NAME', 'development', false, 'Environment identifier'),
('development', 'API_BASE_URL', 'https://api.test.example.com', false, 'API base URL for development'),
('development', 'FRONTEND_URL', 'http://localhost:3000', false, 'Frontend URL for development'),

-- Production placeholders (to be updated with real values)
('production', 'AMADEUS_CLIENT_ID', 'prod-amadeus-client-id', true, 'Amadeus API Client ID for production'),
('production', 'AMADEUS_CLIENT_SECRET', 'prod-amadeus-client-secret', true, 'Amadeus API Client Secret for production'),
('production', 'SABRE_CLIENT_ID', 'prod-sabre-client-id', true, 'Sabre API Client ID for production'),
('production', 'SABRE_CLIENT_SECRET', 'prod-sabre-client-secret', true, 'Sabre API Client Secret for production'),
('production', 'VIATOR_API_KEY', 'prod-viator-api-key', true, 'Viator API Key for production'),
('production', 'DUFFLE_API_KEY', 'prod-duffle-api-key', true, 'Duffle API Key for production'),
('production', 'RATEHAWK_API_KEY', 'prod-ratehawk-api-key', true, 'RateHawk API Key for production'),
('production', 'EXPEDIA_API_KEY', 'prod-expedia-api-key', true, 'Expedia API Key for production'),
('production', 'STRIPE_PUBLISHABLE_KEY', 'pk_live_your-stripe-publishable-key', false, 'Stripe Publishable Key for production'),
('production', 'STRIPE_SECRET_KEY', 'sk_live_your-stripe-secret-key', true, 'Stripe Secret Key for production'),
('production', 'OPENAI_API_KEY', 'sk-prod-openai-api-key', true, 'OpenAI API Key for production'),
('production', 'ANTHROPIC_API_KEY', 'sk-ant-prod-anthropic-api-key', true, 'Anthropic API Key for production'),
('production', 'GEMINI_API_KEY', 'prod-gemini-api-key', true, 'Google Gemini API Key for production'),
('production', 'ENVIRONMENT_NAME', 'production', false, 'Environment identifier'),
('production', 'API_BASE_URL', 'https://api.maku.travel', false, 'API base URL for production'),
('production', 'FRONTEND_URL', 'https://maku.travel', false, 'Frontend URL for production')

ON CONFLICT (environment, key) DO NOTHING;

-- Create an index for faster lookups
CREATE INDEX idx_environment_lookup ON public.environment (environment, key) WHERE is_active = true;
CREATE INDEX idx_environment_secrets ON public.environment (environment, is_secret) WHERE is_active = true;