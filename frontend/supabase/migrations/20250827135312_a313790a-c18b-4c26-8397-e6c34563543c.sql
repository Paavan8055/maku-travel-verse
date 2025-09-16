-- MAKU.Travel Database Optimization Migration (Part 1 - Fixed)
-- Critical Security & Function Fixes + Missing Indexes for existing columns only

-- Fix the function security issue with mutable search path
CREATE OR REPLACE FUNCTION public.update_provider_quotas_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

-- Add missing indexes on high-traffic foreign key columns (verified to exist)
CREATE INDEX IF NOT EXISTS idx_bookings_user_id ON public.bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_pnr_records_user_id ON public.pnr_records(user_id);
CREATE INDEX IF NOT EXISTS idx_price_alerts_user_id ON public.price_alerts(user_id);
CREATE INDEX IF NOT EXISTS idx_user_activity_logs_user_id ON public.user_activity_logs(user_id);

-- Add time-based indexes for cleanup operations (verified columns)
CREATE INDEX IF NOT EXISTS idx_health_checks_created_at ON public.health_checks(created_at);
CREATE INDEX IF NOT EXISTS idx_system_logs_created_at ON public.system_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_booking_access_audit_created_at ON public.booking_access_audit(created_at);

-- Add composite indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_bookings_user_status ON public.bookings(user_id, status);
CREATE INDEX IF NOT EXISTS idx_bookings_user_created ON public.bookings(user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_user_activity_logs_user_type ON public.user_activity_logs(user_id, activity_type);
CREATE INDEX IF NOT EXISTS idx_booking_updates_user_created ON public.booking_updates(user_id, created_at);

-- Add indexes for provider tables (verified)
CREATE INDEX IF NOT EXISTS idx_provider_health_last_checked ON public.provider_health(last_checked);
CREATE INDEX IF NOT EXISTS idx_provider_quotas_updated_at ON public.provider_quotas(updated_at);
CREATE INDEX IF NOT EXISTS idx_provider_configs_enabled ON public.provider_configs(enabled);

-- Add automated cleanup function for old log data
CREATE OR REPLACE FUNCTION public.cleanup_old_audit_data()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
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
        correlation_id, service_name, log_level, message
    ) VALUES (
        gen_random_uuid()::text, 'database_cleanup', 'info', 
        'Automated cleanup completed for audit tables'
    );
END;
$$;

-- Create database performance monitoring function
CREATE OR REPLACE FUNCTION public.get_database_performance_stats()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
DECLARE
    result jsonb;
BEGIN
    SELECT jsonb_build_object(
        'table_sizes', (
            SELECT jsonb_object_agg(
                schemaname || '.' || tablename,
                pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename))
            )
            FROM pg_tables 
            WHERE schemaname = 'public'
            ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
            LIMIT 20
        ),
        'index_usage', (
            SELECT jsonb_object_agg(
                indexrelname,
                jsonb_build_object(
                    'size', pg_size_pretty(pg_relation_size(indexrelid)),
                    'scans', idx_scan,
                    'tuples_read', idx_tup_read,
                    'tuples_fetched', idx_tup_fetch
                )
            )
            FROM pg_stat_user_indexes
            WHERE schemaname = 'public'
            ORDER BY idx_scan DESC
            LIMIT 20
        ),
        'slow_queries_potential', (
            SELECT COUNT(*)
            FROM pg_stat_user_tables
            WHERE schemaname = 'public' 
            AND seq_scan > idx_scan
            AND n_tup_ins + n_tup_upd + n_tup_del > 1000
        )
    ) INTO result;
    
    RETURN result;
END;
$$;