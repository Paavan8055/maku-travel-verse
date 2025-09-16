-- Fix correlation_tracking table schema issues and enhance for OTA business intelligence

-- First, check if columns exist and add missing ones
DO $$ 
BEGIN
    -- Add service_name column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'correlation_tracking' 
                   AND column_name = 'service_name' 
                   AND table_schema = 'public') THEN
        ALTER TABLE public.correlation_tracking ADD COLUMN service_name TEXT;
    END IF;
    
    -- Add error_message column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'correlation_tracking' 
                   AND column_name = 'error_message' 
                   AND table_schema = 'public') THEN
        ALTER TABLE public.correlation_tracking ADD COLUMN error_message TEXT;
    END IF;
    
    -- Add provider_id column for business intelligence
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'correlation_tracking' 
                   AND column_name = 'provider_id' 
                   AND table_schema = 'public') THEN
        ALTER TABLE public.correlation_tracking ADD COLUMN provider_id TEXT;
    END IF;
    
    -- Add booking_value for revenue tracking
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'correlation_tracking' 
                   AND column_name = 'booking_value' 
                   AND table_schema = 'public') THEN
        ALTER TABLE public.correlation_tracking ADD COLUMN booking_value NUMERIC DEFAULT 0;
    END IF;
    
    -- Add customer_tier for VIP tracking  
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'correlation_tracking' 
                   AND column_name = 'customer_tier' 
                   AND table_schema = 'public') THEN
        ALTER TABLE public.correlation_tracking ADD COLUMN customer_tier TEXT DEFAULT 'standard';
    END IF;
    
    -- Add session_id for customer journey tracking
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'correlation_tracking' 
                   AND column_name = 'session_id' 
                   AND table_schema = 'public') THEN
        ALTER TABLE public.correlation_tracking ADD COLUMN session_id TEXT;
    END IF;
    
    -- Add updated_at column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'correlation_tracking' 
                   AND column_name = 'updated_at' 
                   AND table_schema = 'public') THEN
        ALTER TABLE public.correlation_tracking ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;
END $$;

-- Create indexes for business intelligence queries
CREATE INDEX IF NOT EXISTS idx_correlation_tracking_service ON public.correlation_tracking(service_name);
CREATE INDEX IF NOT EXISTS idx_correlation_tracking_provider ON public.correlation_tracking(provider_id);
CREATE INDEX IF NOT EXISTS idx_correlation_tracking_status_created ON public.correlation_tracking(status, created_at);
CREATE INDEX IF NOT EXISTS idx_correlation_tracking_booking_value ON public.correlation_tracking(booking_value) WHERE booking_value > 0;
CREATE INDEX IF NOT EXISTS idx_correlation_tracking_customer_tier ON public.correlation_tracking(customer_tier);
CREATE INDEX IF NOT EXISTS idx_correlation_tracking_session ON public.correlation_tracking(session_id);

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS update_correlation_tracking_updated_at ON public.correlation_tracking;
CREATE TRIGGER update_correlation_tracking_updated_at
    BEFORE UPDATE ON public.correlation_tracking
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Add comprehensive business intelligence function for correlation data analysis
CREATE OR REPLACE FUNCTION public.get_correlation_business_metrics(
    p_hours_back INTEGER DEFAULT 24
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
    v_start_time TIMESTAMP WITH TIME ZONE;
    v_result JSONB;
    v_total_requests INTEGER := 0;
    v_successful_requests INTEGER := 0;
    v_failed_requests INTEGER := 0;
    v_revenue_at_risk NUMERIC := 0;
    v_avg_response_time NUMERIC := 0;
    v_provider_stats JSONB;
    v_customer_impact JSONB;
BEGIN
    -- Calculate time window
    v_start_time := NOW() - (p_hours_back || ' hours')::INTERVAL;
    
    -- Get basic request stats
    SELECT 
        COUNT(*),
        COUNT(*) FILTER (WHERE status = 'completed'),
        COUNT(*) FILTER (WHERE status = 'failed'),
        COALESCE(SUM(booking_value) FILTER (WHERE status = 'failed'), 0),
        COALESCE(AVG(duration_ms), 0)
    INTO v_total_requests, v_successful_requests, v_failed_requests, v_revenue_at_risk, v_avg_response_time
    FROM public.correlation_tracking
    WHERE created_at >= v_start_time;
    
    -- Get provider performance stats
    SELECT COALESCE(
        jsonb_object_agg(
            COALESCE(provider_id, service_name, 'unknown'),
            jsonb_build_object(
                'total_requests', provider_total,
                'successful_requests', provider_successful,
                'failed_requests', provider_failed,
                'success_rate', 
                CASE 
                    WHEN provider_total > 0 THEN ROUND((provider_successful::NUMERIC / provider_total::NUMERIC) * 100, 2)
                    ELSE 0 
                END,
                'avg_response_time', COALESCE(provider_avg_time, 0),
                'revenue_generated', COALESCE(provider_revenue, 0),
                'revenue_at_risk', COALESCE(provider_risk, 0)
            )
        ),
        '{}'::JSONB
    ) INTO v_provider_stats
    FROM (
        SELECT 
            COALESCE(provider_id, service_name, 'unknown') as provider_key,
            COUNT(*) as provider_total,
            COUNT(*) FILTER (WHERE status = 'completed') as provider_successful,
            COUNT(*) FILTER (WHERE status = 'failed') as provider_failed,
            AVG(duration_ms) as provider_avg_time,
            SUM(booking_value) FILTER (WHERE status = 'completed') as provider_revenue,
            SUM(booking_value) FILTER (WHERE status = 'failed') as provider_risk
        FROM public.correlation_tracking
        WHERE created_at >= v_start_time
        GROUP BY COALESCE(provider_id, service_name, 'unknown')
    ) provider_aggregates;
    
    -- Get customer impact analysis
    SELECT jsonb_build_object(
        'vip_customers_affected', COUNT(*) FILTER (WHERE customer_tier = 'vip' AND status = 'failed'),
        'premium_customers_affected', COUNT(*) FILTER (WHERE customer_tier = 'premium' AND status = 'failed'),
        'total_customers_affected', COUNT(DISTINCT user_id) FILTER (WHERE status = 'failed'),
        'high_value_bookings_failed', COUNT(*) FILTER (WHERE booking_value > 1000 AND status = 'failed'),
        'average_failed_booking_value', COALESCE(AVG(booking_value) FILTER (WHERE status = 'failed'), 0)
    ) INTO v_customer_impact
    FROM public.correlation_tracking
    WHERE created_at >= v_start_time;
    
    -- Build comprehensive result
    SELECT jsonb_build_object(
        'time_period_hours', p_hours_back,
        'analysis_timestamp', NOW(),
        'request_metrics', jsonb_build_object(
            'total_requests', v_total_requests,
            'successful_requests', v_successful_requests,
            'failed_requests', v_failed_requests,
            'success_rate', 
            CASE 
                WHEN v_total_requests > 0 THEN ROUND((v_successful_requests::NUMERIC / v_total_requests::NUMERIC) * 100, 2)
                ELSE 0 
            END,
            'average_response_time_ms', ROUND(v_avg_response_time, 0)
        ),
        'revenue_metrics', jsonb_build_object(
            'revenue_at_risk', v_revenue_at_risk,
            'potential_revenue_lost_percentage', 
            CASE 
                WHEN v_total_requests > 0 THEN ROUND((v_failed_requests::NUMERIC / v_total_requests::NUMERIC) * 100, 2)
                ELSE 0 
            END
        ),
        'provider_performance', v_provider_stats,
        'customer_impact', v_customer_impact,
        'operational_alerts', jsonb_build_array(
            CASE 
                WHEN v_revenue_at_risk > 10000 THEN 
                    jsonb_build_object('type', 'revenue_risk', 'severity', 'high', 'message', 'High revenue at risk: $' || v_revenue_at_risk)
                ELSE NULL
            END,
            CASE 
                WHEN v_total_requests > 0 AND (v_successful_requests::NUMERIC / v_total_requests::NUMERIC) < 0.85 THEN 
                    jsonb_build_object('type', 'conversion_rate', 'severity', 'medium', 'message', 'Low success rate detected')
                ELSE NULL
            END
        )
    ) INTO v_result;
    
    RETURN v_result;
END;
$$;