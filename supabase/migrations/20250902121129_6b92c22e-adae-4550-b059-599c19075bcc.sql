-- Payment Timeout Optimization Migration (Part 2 - Accessible Operations Only)
-- Create indexes and monitoring functions for payment timeout management

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
    'Payment timeout monitoring deployed: performance indexes and metrics function',
    json_build_object(
        'migration', 'payment_timeout_monitoring',
        'features', ARRAY['timeout_monitoring', 'performance_indexes'],
        'timestamp', NOW()
    )
);