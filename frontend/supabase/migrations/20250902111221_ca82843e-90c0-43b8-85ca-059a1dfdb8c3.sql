-- Fix critical security vulnerabilities

-- 1. Secure the funds table - restrict access to user's own records
DROP POLICY IF EXISTS "Allow service role access" ON public.funds;

CREATE POLICY "Users can view their own funds" 
ON public.funds 
FOR SELECT 
USING (user_id = auth.uid()::text OR auth.role() = 'service_role');

CREATE POLICY "Users can update their own funds" 
ON public.funds 
FOR UPDATE 
USING (user_id = auth.uid()::text OR auth.role() = 'service_role');

CREATE POLICY "Service role can insert funds" 
ON public.funds 
FOR INSERT 
WITH CHECK (auth.role() = 'service_role');

-- 2. Secure the local_insights table - restrict to admins only
ALTER TABLE public.local_insights ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Only admins can manage local insights" 
ON public.local_insights 
FOR ALL 
USING (is_secure_admin(auth.uid()) OR auth.role() = 'service_role')
WITH CHECK (is_secure_admin(auth.uid()) OR auth.role() = 'service_role');

-- 3. Fix database function security paths - update all functions to use proper search_path
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.generate_booking_reference()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  RETURN 'BK' || UPPER(SUBSTRING(gen_random_uuid()::text FROM 1 FOR 8));
END;
$function$;