-- Emergency security fix: Add RLS policies for provider_configs
CREATE POLICY "Only admins can view provider configs" ON public.provider_configs
FOR SELECT USING (is_secure_admin(auth.uid()));

CREATE POLICY "Only admins can manage provider configs" ON public.provider_configs  
FOR ALL USING (is_secure_admin(auth.uid()));

-- Fix database function search path security vulnerabilities
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

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
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

-- Critical alert table for tracking issues
CREATE TABLE IF NOT EXISTS public.provider_health (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('healthy', 'degraded', 'critical', 'down')),
  response_time_ms INTEGER,
  error_rate NUMERIC(5,2) DEFAULT 0,
  last_checked TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  error_details JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Enable RLS on provider_health
ALTER TABLE public.provider_health ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role can manage provider health" ON public.provider_health
FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Admins can view provider health" ON public.provider_health  
FOR SELECT USING (is_secure_admin(auth.uid()));

-- Create proper provider_quotas table with security
CREATE TABLE IF NOT EXISTS public.provider_quotas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id TEXT NOT NULL UNIQUE,
  daily_limit INTEGER NOT NULL DEFAULT 1000,
  current_usage INTEGER NOT NULL DEFAULT 0,
  percentage_used NUMERIC(5,2) GENERATED ALWAYS AS (
    CASE 
      WHEN daily_limit = 0 THEN 0 
      ELSE (current_usage * 100.0 / daily_limit)
    END
  ) STORED,
  status TEXT NOT NULL DEFAULT 'healthy' CHECK (status IN ('healthy', 'warning', 'critical', 'exceeded')),
  reset_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (date_trunc('day', NOW()) + INTERVAL '1 day'),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

ALTER TABLE public.provider_quotas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role can manage provider quotas" ON public.provider_quotas
FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Admins can view provider quotas" ON public.provider_quotas
FOR SELECT USING (is_secure_admin(auth.uid()));

-- Function to update quota status based on usage
CREATE OR REPLACE FUNCTION public.update_quota_status()
RETURNS TRIGGER AS $$
BEGIN
  NEW.status = CASE
    WHEN NEW.percentage_used >= 100 THEN 'exceeded'
    WHEN NEW.percentage_used >= 90 THEN 'critical'  
    WHEN NEW.percentage_used >= 75 THEN 'warning'
    ELSE 'healthy'
  END;
  
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public';

CREATE TRIGGER trigger_update_quota_status
  BEFORE UPDATE ON public.provider_quotas
  FOR EACH ROW 
  EXECUTE FUNCTION public.update_quota_status();