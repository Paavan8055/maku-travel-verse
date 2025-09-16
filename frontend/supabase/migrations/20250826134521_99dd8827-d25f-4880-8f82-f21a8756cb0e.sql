-- EMERGENCY SECURITY FIXES

-- 1. Fix RLS policies on sensitive tables
ALTER TABLE public.provider_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.provider_metrics ENABLE ROW LEVEL SECURITY;

-- Drop existing permissive policies
DROP POLICY IF EXISTS "Anyone can view provider configs" ON public.provider_configs;
DROP POLICY IF EXISTS "Anyone can view provider metrics" ON public.provider_metrics;

-- Create secure admin-only policies
CREATE POLICY "Only admins can manage provider configs" 
ON public.provider_configs 
FOR ALL 
USING (is_secure_admin(auth.uid()));

CREATE POLICY "Only admins can view provider metrics" 
ON public.provider_metrics 
FOR SELECT 
USING (is_secure_admin(auth.uid()));

CREATE POLICY "Service role can manage provider metrics" 
ON public.provider_metrics 
FOR ALL 
USING (auth.role() = 'service_role');

-- 2. Fix is_admin RPC function security
CREATE OR REPLACE FUNCTION public.is_admin(user_id_param uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.admin_users 
    WHERE user_id = user_id_param AND is_active = true
  );
$$;

-- 3. Create initial admin user (replace with actual admin email)
-- This creates a placeholder that needs to be updated with real admin
INSERT INTO public.admin_users (user_id, email, is_active)
VALUES (
  '00000000-0000-0000-0000-000000000000'::uuid,
  'admin@maku.travel',
  true
) ON CONFLICT (user_id) DO UPDATE SET is_active = true;

-- 4. Secure other sensitive tables
ALTER TABLE public.critical_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.error_tracking ENABLE ROW LEVEL SECURITY;

-- 5. Fix search path security for all admin functions
CREATE OR REPLACE FUNCTION public.get_admin_status()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT 
    CASE 
      WHEN public.is_secure_admin(auth.uid()) THEN TRUE
      ELSE FALSE
    END;
$$;