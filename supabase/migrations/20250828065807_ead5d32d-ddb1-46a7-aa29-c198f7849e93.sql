-- Phase 1: Critical Security Fixes
-- Remove public read access from sensitive provider tables

-- Drop the dangerous public read policies
DROP POLICY IF EXISTS "provider_configs_read" ON public.provider_configs;
DROP POLICY IF EXISTS "provider_metrics_read" ON public.provider_metrics;

-- Add MFA requirement for admin operations
-- Create a table to track admin sessions requiring MFA
CREATE TABLE IF NOT EXISTS public.admin_mfa_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    session_token TEXT NOT NULL UNIQUE,
    mfa_verified BOOLEAN DEFAULT FALSE,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (NOW() + INTERVAL '1 hour'),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on MFA sessions
ALTER TABLE public.admin_mfa_sessions ENABLE ROW LEVEL SECURITY;

-- Create policy for MFA sessions
CREATE POLICY "Users can manage their own MFA sessions"
ON public.admin_mfa_sessions
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Create enhanced admin verification function that requires MFA
CREATE OR REPLACE FUNCTION public.is_mfa_verified_admin(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT CASE 
    WHEN _user_id IS NULL THEN FALSE
    WHEN NOT public.is_secure_admin(_user_id) THEN FALSE
    ELSE EXISTS (
      SELECT 1
      FROM public.admin_mfa_sessions
      WHERE user_id = _user_id
        AND mfa_verified = TRUE
        AND expires_at > NOW()
    )
  END;
$$;

-- Add provider health monitoring table
CREATE TABLE IF NOT EXISTS public.provider_health_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider_id TEXT NOT NULL,
    endpoint TEXT NOT NULL,
    status_code INTEGER,
    response_time_ms INTEGER,
    error_message TEXT,
    tested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    test_type TEXT DEFAULT 'automated'
);

-- Enable RLS on provider health logs
ALTER TABLE public.provider_health_logs ENABLE ROW LEVEL SECURITY;

-- Create policy for provider health logs (admin only)
CREATE POLICY "Only admins can access provider health logs"
ON public.provider_health_logs
FOR ALL
USING (public.is_secure_admin(auth.uid()))
WITH CHECK (public.is_secure_admin(auth.uid()));