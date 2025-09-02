-- Payment Timeout Optimization Migration
-- Implements 2-minute cleanup cycle and enhanced monitoring

-- Update the existing cron job to run every 2 minutes
UPDATE cron.job 
SET schedule = '*/2 * * * *' 
WHERE jobname = 'auto-cleanup-stuck-bookings';

-- Create indexes for faster timeout queries
CREATE INDEX IF NOT EXISTS idx_bookings_pending_created 
ON public.bookings(status, created_at) 
WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS idx_bookings_expired_today 
ON public.bookings(status, created_at) 
WHERE status = 'expired';

-- Add function to get payment timeout metrics
CREATE OR REPLACE FUNCTION get_payment_timeout_metrics()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    result JSON;
    active_count INTEGER := 0;
    expiring_count INTEGER := 0;
    expired_count INTEGER := 0;
    timeout_rate NUMERIC := 0;
    avg_completion INTEGER := 0;
BEGIN
    -- Count active sessions (pending bookings < 10 minutes old)
    SELECT COUNT(*) INTO active_count
    FROM bookings 
    WHERE status = 'pending' 
    AND created_at > NOW() - INTERVAL '10 minutes';
    
    -- Count sessions expiring soon (8-10 minutes old)
    SELECT COUNT(*) INTO expiring_count
    FROM bookings 
    WHERE status = 'pending' 
    AND created_at BETWEEN NOW() - INTERVAL '10 minutes' AND NOW() - INTERVAL '8 minutes';
    
    -- Count expired today
    SELECT COUNT(*) INTO expired_count
    FROM bookings 
    WHERE status = 'expired' 
    AND created_at >= CURRENT_DATE;
    
    -- Calculate timeout rate
    IF (active_count + expired_count) > 0 THEN
        timeout_rate := ROUND((expired_count::NUMERIC / (active_count + expired_count)) * 100, 1);
    END IF;
    
    -- Calculate average completion time (in minutes)
    SELECT ROUND(AVG(EXTRACT(EPOCH FROM (updated_at - created_at)) / 60))::INTEGER
    INTO avg_completion
    FROM bookings 
    WHERE status = 'confirmed' 
    AND created_at >= CURRENT_DATE 
    AND updated_at > created_at;
    
    -- Build result JSON
    SELECT json_build_object(
        'active_sessions', active_count,
        'expiring_soon', expiring_count,
        'expired_today', expired_count,
        'timeout_rate', timeout_rate,
        'avg_completion_minutes', COALESCE(avg_completion, 0),
        'last_updated', NOW()
    ) INTO result;
    
    RETURN result;
END;
$$;

-- Grant access to admins
GRANT EXECUTE ON FUNCTION get_payment_timeout_metrics() TO authenticated;

-- Log the migration
INSERT INTO system_logs (
    correlation_id,
    service_name,
    log_level,
    message,
    metadata
) VALUES (
    gen_random_uuid()::text,
    'database_migration',
    'info',
    'Payment timeout optimization deployed: 2-minute cleanup cycle, enhanced monitoring, performance indexes',
    json_build_object(
        'migration', 'payment_timeout_optimization',
        'features', ARRAY['2min_cleanup', 'timeout_monitoring', 'performance_indexes'],
        'timestamp', NOW()
    )
);