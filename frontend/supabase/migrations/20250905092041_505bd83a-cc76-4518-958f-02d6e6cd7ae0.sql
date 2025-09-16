-- Fix missing level column in system_logs table
ALTER TABLE public.system_logs ADD COLUMN IF NOT EXISTS level TEXT DEFAULT 'info';

-- Fix search_path security issues in database functions
-- Update log_system_event function to be SECURITY DEFINER with proper search_path
CREATE OR REPLACE FUNCTION public.log_system_event(
    p_correlation_id text, 
    p_service_name text, 
    p_log_level text, 
    p_message text, 
    p_metadata jsonb DEFAULT '{}'::jsonb, 
    p_request_id text DEFAULT NULL::text, 
    p_user_id uuid DEFAULT NULL::uuid, 
    p_duration_ms integer DEFAULT NULL::integer, 
    p_status_code integer DEFAULT NULL::integer, 
    p_error_details jsonb DEFAULT NULL::jsonb
)
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public', 'pg_catalog'
AS $function$
  INSERT INTO public.system_logs (
    correlation_id, service_name, log_level, level, message, metadata,
    request_id, user_id, duration_ms, status_code, error_details
  ) VALUES (
    p_correlation_id, p_service_name, p_log_level, p_log_level, p_message, p_metadata,
    p_request_id, p_user_id, p_duration_ms, p_status_code, p_error_details
  ) RETURNING id;
$function$;

-- Fix other functions with missing search_path
CREATE OR REPLACE FUNCTION public.cleanup_old_audit_data()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_catalog'
AS $function$
BEGIN
    -- Clean up old system logs (keep last 90 days)
    DELETE FROM public.system_logs 
    WHERE created_at < NOW() - INTERVAL '90 days';
    
    -- Clean up old booking access audit (keep last 180 days)
    DELETE FROM public.booking_access_audit 
    WHERE created_at < NOW() - INTERVAL '180 days';
    
    -- Clean up old error tracking (keep last 30 days)
    DELETE FROM public.error_tracking 
    WHERE created_at < NOW() - INTERVAL '30 days';
    
    -- Log cleanup completion
    INSERT INTO public.system_logs (
        correlation_id, service_name, log_level, level, message
    ) VALUES (
        gen_random_uuid()::text, 'database_cleanup', 'info', 'info',
        'Automated cleanup completed for audit tables'
    );
END;
$function$;