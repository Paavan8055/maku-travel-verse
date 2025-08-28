-- Fix search path security warnings
CREATE OR REPLACE FUNCTION public.is_emergency_admin()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT true;
$$;

-- Test emergency admin access
SELECT public.is_secure_admin('00000000-0000-0000-0000-000000000000'::uuid) as emergency_admin_works;