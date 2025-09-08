-- Critical Security Fixes Phase 1
-- Fix is_secure_admin function with proper search_path
CREATE OR REPLACE FUNCTION public.is_secure_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = _user_id 
    AND role = 'admin' 
    AND is_active = true
  ) OR EXISTS (
    SELECT 1 FROM public.admin_users 
    WHERE user_id = _user_id 
    AND is_active = true
  );
$function$;

-- Secure AI business intelligence - restrict public access
DROP POLICY IF EXISTS "Users can view all skills" ON public.ai_employee_skills;
DROP POLICY IF EXISTS "Users can view all templates" ON public.ai_employee_templates;

CREATE POLICY "Authenticated users can view skills" 
ON public.ai_employee_skills FOR SELECT 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can view templates" 
ON public.ai_employee_templates FOR SELECT 
USING (auth.uid() IS NOT NULL);