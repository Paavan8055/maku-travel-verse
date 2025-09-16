-- Fix critical security issue: provider_configs table should not be publicly readable
-- This is a security risk as it exposes internal provider configuration

-- Remove public read access to provider_configs (if it exists)
DROP POLICY IF EXISTS "Public read access to provider configs" ON public.provider_configs;

-- Create provider_configs table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.provider_configs (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('flight', 'hotel', 'activity')),
  enabled BOOLEAN NOT NULL DEFAULT true,
  priority INTEGER NOT NULL DEFAULT 1,
  circuit_breaker JSONB NOT NULL DEFAULT '{"failureCount": 0, "lastFailure": null, "timeout": 30000, "state": "closed"}',
  health_score INTEGER NOT NULL DEFAULT 100,
  response_time INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on provider_configs
ALTER TABLE public.provider_configs ENABLE ROW LEVEL SECURITY;

-- Add secure access only for service role and authenticated admin users
CREATE POLICY "Service role can manage provider configs" 
ON public.provider_configs 
FOR ALL 
USING (auth.role() = 'service_role');

CREATE POLICY "Admins can view provider configs" 
ON public.provider_configs 
FOR SELECT 
USING (is_secure_admin(auth.uid()));

-- Create provider_metrics table if it doesn't exist for monitoring
CREATE TABLE IF NOT EXISTS public.provider_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id TEXT NOT NULL,
  success BOOLEAN NOT NULL,
  response_time INTEGER NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on provider_metrics
ALTER TABLE public.provider_metrics ENABLE ROW LEVEL SECURITY;

-- Add policies for provider_metrics
CREATE POLICY "Service role can manage provider metrics" 
ON public.provider_metrics 
FOR ALL 
USING (auth.role() = 'service_role');

CREATE POLICY "Admins can view provider metrics" 
ON public.provider_metrics 
FOR SELECT 
USING (is_secure_admin(auth.uid()));

-- Insert default provider configurations if not exist
INSERT INTO public.provider_configs (id, name, type, enabled, priority, circuit_breaker, health_score, response_time) VALUES
('amadeus-flight', 'Amadeus', 'flight', true, 1, '{"failureCount": 0, "lastFailure": null, "timeout": 30000, "state": "closed"}', 100, 0),
('sabre-flight', 'Sabre', 'flight', true, 2, '{"failureCount": 0, "lastFailure": null, "timeout": 30000, "state": "closed"}', 100, 0),
('amadeus-hotel', 'Amadeus', 'hotel', true, 1, '{"failureCount": 0, "lastFailure": null, "timeout": 30000, "state": "closed"}', 100, 0),
('hotelbeds-hotel', 'HotelBeds', 'hotel', true, 2, '{"failureCount": 0, "lastFailure": null, "timeout": 30000, "state": "closed"}', 100, 0),
('sabre-hotel', 'Sabre', 'hotel', true, 3, '{"failureCount": 0, "lastFailure": null, "timeout": 30000, "state": "closed"}', 100, 0),
('amadeus-activity', 'Amadeus', 'activity', true, 1, '{"failureCount": 0, "lastFailure": null, "timeout": 30000, "state": "closed"}', 100, 0),
('hotelbeds-activity', 'HotelBeds', 'activity', true, 2, '{"failureCount": 0, "lastFailure": null, "timeout": 30000, "state": "closed"}', 100, 0)
ON CONFLICT (id) DO NOTHING;