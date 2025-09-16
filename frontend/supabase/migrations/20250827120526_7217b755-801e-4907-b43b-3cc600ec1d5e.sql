-- Fix remaining database functions with missing search_path
CREATE OR REPLACE FUNCTION public.is_emergency_admin()
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT true;
$function$;

CREATE OR REPLACE FUNCTION public.cleanup_old_health_data()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
    DELETE FROM public.provider_health
    WHERE last_checked < NOW() - INTERVAL '7 days';
    
    DELETE FROM public.system_health_snapshots
    WHERE timestamp < NOW() - INTERVAL '30 days';
END;
$function$;