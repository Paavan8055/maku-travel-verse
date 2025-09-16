-- Add missing Amadeus providers to provider_configs table
INSERT INTO public.provider_configs (id, name, type, enabled, priority, endpoint_url, config)
VALUES 
  ('amadeus-flight', 'Amadeus Flight', 'flight', true, 1, 'amadeus-flight-search', '{"timeout": 30000, "retries": 2}'::jsonb),
  ('amadeus-hotel', 'Amadeus Hotel', 'hotel', true, 2, 'amadeus-hotel-search', '{"timeout": 30000, "retries": 2}'::jsonb)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  enabled = EXCLUDED.enabled,
  priority = EXCLUDED.priority,
  endpoint_url = EXCLUDED.endpoint_url,
  config = EXCLUDED.config,
  updated_at = now();

-- Initialize provider health records for all active providers
INSERT INTO public.provider_health (provider_id, status, response_time_ms, error_count, last_checked)
SELECT 
  pc.id,
  'unknown'::text,
  0,
  0,
  now()
FROM public.provider_configs pc
WHERE pc.enabled = true
ON CONFLICT (provider_id) DO UPDATE SET
  last_checked = now();

-- Initialize provider quotas for quota management
INSERT INTO public.provider_quotas (provider_id, daily_limit, current_usage, status, percentage_used)
SELECT 
  pc.id,
  10000, -- Default daily limit
  0,
  'healthy'::text,
  0.0
FROM public.provider_configs pc
WHERE pc.enabled = true
ON CONFLICT (provider_id) DO UPDATE SET
  updated_at = now();

-- Create critical_alert_system table if it doesn't exist (for critical alerts)
CREATE TABLE IF NOT EXISTS public.critical_alert_system (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  alert_type text NOT NULL,
  title text NOT NULL,
  message text NOT NULL,
  severity text NOT NULL DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  metadata jsonb DEFAULT '{}'::jsonb,
  resolved boolean DEFAULT false,
  resolved_by uuid,
  resolved_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on critical_alert_system table
ALTER TABLE public.critical_alert_system ENABLE ROW LEVEL SECURITY;

-- Create policies for critical_alert_system
DO $$ 
BEGIN
  -- Check if policies exist before creating them
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'critical_alert_system' 
    AND policyname = 'Admins can manage critical alert system'
  ) THEN
    CREATE POLICY "Admins can manage critical alert system" 
    ON public.critical_alert_system 
    FOR ALL 
    USING (is_secure_admin(auth.uid()));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'critical_alert_system' 
    AND policyname = 'Service role can manage critical alert system'
  ) THEN
    CREATE POLICY "Service role can manage critical alert system" 
    ON public.critical_alert_system 
    FOR ALL 
    USING (auth.role() = 'service_role'::text);
  END IF;
END
$$;