-- Fix remaining search_path security warnings for the last few functions
-- These functions need SECURITY DEFINER and search_path for complete security hardening

-- Fix initialize_user_loyalty function
CREATE OR REPLACE FUNCTION public.initialize_user_loyalty()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_catalog'
AS $function$
BEGIN
  INSERT INTO public.loyalty_points (user_id)
  VALUES (NEW.user_id)
  ON CONFLICT (user_id) DO NOTHING;
  
  INSERT INTO public.travel_analytics (user_id, year)
  VALUES (NEW.user_id, EXTRACT(YEAR FROM CURRENT_DATE))
  ON CONFLICT (user_id, year) DO NOTHING;
  
  RETURN NEW;
END;
$function$;

-- Fix update_agent_consolidated_updated_at function  
CREATE OR REPLACE FUNCTION public.update_agent_consolidated_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_catalog'
AS $function$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$function$;

-- Fix update_agent_management_updated_at function
CREATE OR REPLACE FUNCTION public.update_agent_management_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_catalog'
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;