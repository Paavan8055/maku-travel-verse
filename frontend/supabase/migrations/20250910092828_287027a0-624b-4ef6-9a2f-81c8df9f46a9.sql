-- Phase 3: Final Security Hardening & Performance Optimization (Simplified)

-- 1. Fix remaining function search_path security warnings
DO $$ 
BEGIN
  -- Set search_path for existing functions that need it
  EXECUTE 'ALTER FUNCTION public.verify_admin_access() SET search_path = ''public''';
  EXECUTE 'ALTER FUNCTION public.log_secure_admin_action(text, text, text, jsonb) SET search_path = ''public''';
  EXECUTE 'ALTER FUNCTION public.get_admin_status() SET search_path = ''public''';
  EXECUTE 'ALTER FUNCTION public.is_secure_admin(uuid) SET search_path = ''public''';
  EXECUTE 'ALTER FUNCTION public.is_admin(uuid) SET search_path = ''public''';
  EXECUTE 'ALTER FUNCTION public.is_user_admin(uuid) SET search_path = ''public''';
END $$;

-- 2. Create system health monitoring function
CREATE OR REPLACE FUNCTION public.get_system_health_status()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
    health_data jsonb;
    db_size text;
    active_connections integer;
    recent_errors integer;
    provider_health jsonb;
BEGIN
    -- Only admins can access system health
    IF NOT public.is_secure_admin(auth.uid()) THEN
        RAISE EXCEPTION 'Unauthorized access to system health data';
    END IF;
    
    -- Get database size
    SELECT pg_size_pretty(pg_database_size(current_database())) INTO db_size;
    
    -- Get active connections
    SELECT count(*) INTO active_connections
    FROM pg_stat_activity 
    WHERE state = 'active';
    
    -- Get recent errors (last hour)
    SELECT count(*) INTO recent_errors
    FROM public.system_logs 
    WHERE log_level = 'error' 
    AND created_at > NOW() - INTERVAL '1 hour';
    
    -- Get provider health summary
    SELECT jsonb_object_agg(
        provider_id,
        jsonb_build_object(
            'status', status,
            'last_checked', last_checked,
            'response_time_ms', response_time_ms
        )
    ) INTO provider_health
    FROM public.provider_health
    WHERE last_checked > NOW() - INTERVAL '5 minutes';
    
    -- Build comprehensive health report
    health_data := jsonb_build_object(
        'database', jsonb_build_object(
            'size', db_size,
            'active_connections', active_connections,
            'status', CASE WHEN active_connections < 50 THEN 'healthy' ELSE 'warning' END
        ),
        'errors', jsonb_build_object(
            'recent_count', recent_errors,
            'status', CASE WHEN recent_errors < 10 THEN 'healthy' ELSE 'critical' END
        ),
        'providers', COALESCE(provider_health, '{}'::jsonb),
        'overall_status', CASE 
            WHEN recent_errors > 20 THEN 'critical'
            WHEN recent_errors > 10 OR active_connections > 50 THEN 'warning'
            ELSE 'healthy'
        END,
        'timestamp', NOW()
    );
    
    -- Log health check
    PERFORM public.log_secure_admin_action('health_check_accessed', 'system', 'health_status');
    
    RETURN health_data;
END;
$$;

-- 3. Create performance optimization tracking
CREATE TABLE IF NOT EXISTS public.performance_metrics (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    metric_type text NOT NULL,
    metric_name text NOT NULL,
    metric_value numeric NOT NULL,
    metadata jsonb DEFAULT '{}'::jsonb,
    recorded_at timestamptz DEFAULT NOW(),
    created_at timestamptz DEFAULT NOW()
);

-- Enable RLS on performance metrics
ALTER TABLE public.performance_metrics ENABLE ROW LEVEL SECURITY;

-- Performance metrics policies
CREATE POLICY "Admins can manage performance metrics"
ON public.performance_metrics
FOR ALL
USING (is_secure_admin(auth.uid()));

-- 4. Create automated cleanup scheduler
CREATE OR REPLACE FUNCTION public.run_automated_system_cleanup()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
    -- Clean old system logs (keep 90 days)
    DELETE FROM public.system_logs 
    WHERE created_at < NOW() - INTERVAL '90 days';
    
    -- Clean old performance metrics (keep 30 days)
    DELETE FROM public.performance_metrics 
    WHERE created_at < NOW() - INTERVAL '30 days';
    
    -- Clean expired agent memory
    DELETE FROM public.agentic_memory 
    WHERE expires_at IS NOT NULL AND expires_at < NOW();
    
    -- Clean old provider health records (keep 7 days)
    DELETE FROM public.provider_health 
    WHERE last_checked < NOW() - INTERVAL '7 days';
    
    -- Log cleanup completion
    PERFORM public.log_system_event(
        gen_random_uuid()::text,
        'system_cleanup',
        'info',
        'Automated system cleanup completed'
    );
END;
$$;