-- Phase 1: Critical Security Fixes

-- 1. Secure provider_configs table (currently public)
DROP POLICY IF EXISTS "provider_configs_public_read" ON public.provider_configs;
CREATE POLICY "Admin only access to provider configs" ON public.provider_configs
  FOR ALL USING (is_secure_admin(auth.uid()));

-- 2. Secure provider_metrics table if it exists and has public policies
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'provider_metrics' AND table_schema = 'public') THEN
    EXECUTE 'DROP POLICY IF EXISTS "provider_metrics_public_read" ON public.provider_metrics';
    EXECUTE 'CREATE POLICY "Admin only access to provider metrics" ON public.provider_metrics FOR ALL USING (is_secure_admin(auth.uid()))';
  END IF;
END $$;

-- 3. Fix database functions to have proper search_path
-- Update all functions that don't have search_path set to 'public'
CREATE OR REPLACE FUNCTION public.generate_gift_card_code()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  code TEXT;
  exists BOOLEAN;
BEGIN
  LOOP
    -- Generate a random 12-character code using base64 encoding and clean it up
    code := upper(translate(substring(encode(extensions.gen_random_bytes(9), 'base64'), 1, 12), '/+', 'XZ'));
    
    -- Check if code already exists
    SELECT EXISTS(SELECT 1 FROM public.gift_cards WHERE gift_cards.code = code) INTO exists;
    
    IF NOT exists THEN
      RETURN code;
    END IF;
  END LOOP;
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

-- 4. Create RLS policies for sensitive admin tables if they don't exist
DO $$
BEGIN
  -- Ensure system_health_snapshots has proper RLS
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'system_health_snapshots' 
    AND policyname = 'Admin only access to system health'
  ) THEN
    EXECUTE 'CREATE POLICY "Admin only access to system health" ON public.system_health_snapshots FOR ALL USING (is_secure_admin(auth.uid()))';
  END IF;
  
  -- Ensure provider_health has proper RLS  
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'provider_health' 
    AND policyname = 'Admin only access to provider health'
  ) THEN
    EXECUTE 'CREATE POLICY "Admin only access to provider health" ON public.provider_health FOR ALL USING (is_secure_admin(auth.uid()))';
  END IF;
END $$;