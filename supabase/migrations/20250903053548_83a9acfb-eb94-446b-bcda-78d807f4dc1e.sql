-- Phase 4: Database Schema Fixes and Performance Optimization

-- Add missing metadata column to critical_alerts table
ALTER TABLE public.critical_alerts 
ADD COLUMN IF NOT EXISTS metadata jsonb DEFAULT '{}';

-- Create performance_metrics table for tracking system performance
CREATE TABLE IF NOT EXISTS public.performance_metrics (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    component_name text NOT NULL,
    metric_type text NOT NULL,
    metric_value numeric NOT NULL,
    unit text DEFAULT 'ms',
    threshold_value numeric,
    status text DEFAULT 'normal',
    user_id uuid,
    session_id text,
    created_at timestamp with time zone DEFAULT now(),
    metadata jsonb DEFAULT '{}'
);

-- Enable RLS on performance_metrics
ALTER TABLE public.performance_metrics ENABLE ROW LEVEL SECURITY;

-- RLS policies for performance_metrics
CREATE POLICY "Service role can manage performance metrics" 
ON public.performance_metrics 
FOR ALL 
USING (auth.role() = 'service_role');

CREATE POLICY "Admins can view performance metrics" 
ON public.performance_metrics 
FOR SELECT 
USING (is_secure_admin(auth.uid()));

-- Create test_results table for comprehensive testing
CREATE TABLE IF NOT EXISTS public.test_results (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    test_suite text NOT NULL,
    test_name text NOT NULL,
    test_type text NOT NULL DEFAULT 'unit',
    status text NOT NULL DEFAULT 'pending',
    execution_time_ms integer,
    result_data jsonb DEFAULT '{}',
    error_message text,
    created_at timestamp with time zone DEFAULT now(),
    executed_by uuid
);

-- Enable RLS on test_results
ALTER TABLE public.test_results ENABLE ROW LEVEL SECURITY;

-- RLS policies for test_results
CREATE POLICY "Service role can manage test results" 
ON public.test_results 
FOR ALL 
USING (auth.role() = 'service_role');

CREATE POLICY "Admins can view test results" 
ON public.test_results 
FOR SELECT 
USING (is_secure_admin(auth.uid()));

-- Add performance indices for frequently queried tables
CREATE INDEX IF NOT EXISTS idx_critical_alerts_created_at ON public.critical_alerts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_critical_alerts_alert_type ON public.critical_alerts(alert_type);
CREATE INDEX IF NOT EXISTS idx_critical_alerts_severity ON public.critical_alerts(severity);
CREATE INDEX IF NOT EXISTS idx_critical_alerts_resolved ON public.critical_alerts(resolved);

CREATE INDEX IF NOT EXISTS idx_system_logs_created_at ON public.system_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_system_logs_service_name ON public.system_logs(service_name);
CREATE INDEX IF NOT EXISTS idx_system_logs_log_level ON public.system_logs(log_level);

CREATE INDEX IF NOT EXISTS idx_performance_metrics_created_at ON public.performance_metrics(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_performance_metrics_component ON public.performance_metrics(component_name);
CREATE INDEX IF NOT EXISTS idx_performance_metrics_type ON public.performance_metrics(metric_type);

CREATE INDEX IF NOT EXISTS idx_provider_health_provider_name ON public.provider_health(provider_name);
CREATE INDEX IF NOT EXISTS idx_provider_health_last_checked ON public.provider_health(last_checked DESC);

-- Create function to automatically update performance alerts
CREATE OR REPLACE FUNCTION public.create_performance_alert()
RETURNS trigger AS $$
BEGIN
    -- If performance metric exceeds threshold, create alert
    IF NEW.threshold_value IS NOT NULL AND NEW.metric_value > NEW.threshold_value THEN
        INSERT INTO public.critical_alerts (
            alert_type,
            severity,
            message,
            metadata
        ) VALUES (
            'performance_threshold_exceeded',
            CASE 
                WHEN NEW.metric_value > (NEW.threshold_value * 2) THEN 'critical'
                WHEN NEW.metric_value > (NEW.threshold_value * 1.5) THEN 'high'
                ELSE 'medium'
            END,
            'Performance metric ' || NEW.metric_type || ' for ' || NEW.component_name || ' exceeded threshold: ' || NEW.metric_value || NEW.unit,
            jsonb_build_object(
                'component_name', NEW.component_name,
                'metric_type', NEW.metric_type,
                'actual_value', NEW.metric_value,
                'threshold_value', NEW.threshold_value,
                'unit', NEW.unit
            )
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for performance alerts
DROP TRIGGER IF EXISTS trigger_performance_alert ON public.performance_metrics;
CREATE TRIGGER trigger_performance_alert
    AFTER INSERT ON public.performance_metrics
    FOR EACH ROW
    EXECUTE FUNCTION public.create_performance_alert();

-- Create function to cleanup old performance metrics
CREATE OR REPLACE FUNCTION public.cleanup_old_performance_metrics()
RETURNS void AS $$
BEGIN
    -- Keep only last 7 days of performance metrics
    DELETE FROM public.performance_metrics 
    WHERE created_at < NOW() - INTERVAL '7 days';
    
    -- Keep only last 30 days of test results
    DELETE FROM public.test_results 
    WHERE created_at < NOW() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;