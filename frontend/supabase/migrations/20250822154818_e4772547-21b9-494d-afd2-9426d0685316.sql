-- Create webhook_events table for idempotency
CREATE TABLE IF NOT EXISTS public.webhook_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stripe_event_id TEXT UNIQUE NOT NULL,
  event_type TEXT NOT NULL,
  processed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.webhook_events ENABLE ROW LEVEL SECURITY;

-- Only service role can manage webhook events
CREATE POLICY "Service role can manage webhook events" 
ON public.webhook_events 
FOR ALL 
USING (auth.role() = 'service_role');

-- Create environment_configs table for centralized config management
CREATE TABLE IF NOT EXISTS public.environment_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  environment TEXT NOT NULL CHECK (environment IN ('development', 'staging', 'production')),
  config_key TEXT NOT NULL,
  config_value JSONB NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(environment, config_key)
);

-- Enable RLS
ALTER TABLE public.environment_configs ENABLE ROW LEVEL SECURITY;

-- Only admins can manage environment configs
CREATE POLICY "Admins can manage environment configs" 
ON public.environment_configs 
FOR ALL 
USING (is_secure_admin(auth.uid()));

-- Insert default environment configurations
INSERT INTO public.environment_configs (environment, config_key, config_value) VALUES
('development', 'amadeus_base_url', '"https://test.api.amadeus.com"'),
('development', 'sabre_base_url', '"https://api-crt.cert.havail.sabre.com"'),
('development', 'hotelbeds_base_url', '"https://api.test.hotelbeds.com"'),
('production', 'amadeus_base_url', '"https://api.amadeus.com"'),
('production', 'sabre_base_url', '"https://api.havail.sabre.com"'),
('production', 'hotelbeds_base_url', '"https://api.hotelbeds.com"'),
('development', 'stripe_mode', '"test"'),
('production', 'stripe_mode', '"live"')
ON CONFLICT (environment, config_key) DO NOTHING;