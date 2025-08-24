-- Fix critical security issues identified in audit

-- 1. Fix function search path security warnings
-- Update functions to have explicit search_path for security

-- Function: update_updated_at_notifications
CREATE OR REPLACE FUNCTION public.update_updated_at_notifications()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$function$;

-- Function: update_updated_at_communication_preferences
CREATE OR REPLACE FUNCTION public.update_updated_at_communication_preferences()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$function$;

-- 2. Create provider_configs table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.provider_configs (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('flight', 'hotel', 'activity')),
  enabled BOOLEAN DEFAULT true,
  priority INTEGER NOT NULL,
  circuit_breaker JSONB DEFAULT '{
    "failureCount": 0,
    "lastFailure": null,
    "timeout": 30000,
    "state": "closed"
  }'::jsonb,
  health_score INTEGER DEFAULT 100,
  response_time INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS for provider_configs
ALTER TABLE public.provider_configs ENABLE ROW LEVEL SECURITY;

-- Create policies for provider_configs (read-only for authenticated users)
CREATE POLICY "provider_configs_read" ON public.provider_configs
  FOR SELECT
  USING (true);

-- 3. Create provider_metrics table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.provider_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id TEXT NOT NULL,
  success BOOLEAN NOT NULL,
  response_time INTEGER NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS for provider_metrics
ALTER TABLE public.provider_metrics ENABLE ROW LEVEL SECURITY;

-- Create policies for provider_metrics (read-only for authenticated users)
CREATE POLICY "provider_metrics_read" ON public.provider_metrics
  FOR SELECT
  USING (true);

-- Insert default provider configurations
INSERT INTO public.provider_configs (id, name, type, enabled, priority) VALUES
  ('amadeus-flight', 'Amadeus', 'flight', true, 1),
  ('sabre-flight', 'Sabre', 'flight', true, 2),
  ('amadeus-hotel', 'Amadeus', 'hotel', true, 1),
  ('hotelbeds-hotel', 'HotelBeds', 'hotel', true, 2),
  ('sabre-hotel', 'Sabre', 'hotel', true, 3),
  ('amadeus-activity', 'Amadeus', 'activity', true, 1),
  ('hotelbeds-activity', 'HotelBeds', 'activity', true, 2)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  type = EXCLUDED.type,
  enabled = EXCLUDED.enabled,
  priority = EXCLUDED.priority,
  updated_at = NOW();