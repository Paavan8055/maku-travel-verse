-- Fix security warnings by setting search_path for existing functions
CREATE OR REPLACE FUNCTION public.get_cleanup_stats()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    v_result JSON;
BEGIN
    SELECT json_build_object(
        'total_cleanups_24h', (
            SELECT COUNT(*) 
            FROM cleanup_audit 
            WHERE created_at > NOW() - INTERVAL '24 hours'
        ),
        'bookings_cleaned_24h', (
            SELECT COALESCE(SUM(bookings_expired), 0) 
            FROM cleanup_audit 
            WHERE created_at > NOW() - INTERVAL '24 hours'
        ),
        'current_pending', (
            SELECT COUNT(*) 
            FROM bookings 
            WHERE status = 'pending' 
            AND created_at < NOW() - INTERVAL '60 minutes'
        ),
        'last_cleanup', (
            SELECT created_at 
            FROM cleanup_audit 
            ORDER BY created_at DESC 
            LIMIT 1
        )
    ) INTO v_result;
    
    RETURN v_result;
END;
$$;

-- Create monitoring function for cleanup system
CREATE OR REPLACE FUNCTION public.get_cleanup_monitoring()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    v_result JSON;
BEGIN
    SELECT json_build_object(
        'system_health', json_build_object(
            'cron_jobs_active', (
                SELECT COUNT(*) FROM cron.job WHERE active = true AND jobname = 'auto-cleanup-stuck-bookings'
            ),
            'pending_bookings_1h', (
                SELECT COUNT(*) FROM bookings 
                WHERE status = 'pending' AND created_at < NOW() - INTERVAL '1 hour'
            ),
            'pending_bookings_24h', (
                SELECT COUNT(*) FROM bookings 
                WHERE status = 'pending' AND created_at < NOW() - INTERVAL '24 hours'
            )
        ),
        'cleanup_performance', json_build_object(
            'avg_execution_time_ms', (
                SELECT AVG(execution_time_ms) FROM cleanup_audit 
                WHERE created_at > NOW() - INTERVAL '24 hours'
            ),
            'success_rate', (
                SELECT 
                    CASE 
                        WHEN COUNT(*) > 0 THEN 
                            ROUND((COUNT(*) - SUM(errors_encountered)) * 100.0 / COUNT(*), 2)
                        ELSE 100 
                    END
                FROM cleanup_audit 
                WHERE created_at > NOW() - INTERVAL '24 hours'
            ),
            'last_error', (
                SELECT details FROM cleanup_audit 
                WHERE errors_encountered > 0 
                ORDER BY created_at DESC 
                LIMIT 1
            )
        )
    ) INTO v_result;
    
    RETURN v_result;
END;
$$;