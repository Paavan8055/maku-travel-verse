-- Phase 4: Database Schema Fixes (Avoiding Duplicates)

-- Add missing metadata column to critical_alerts table if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'critical_alerts' AND column_name = 'metadata') THEN
        ALTER TABLE public.critical_alerts ADD COLUMN metadata jsonb DEFAULT '{}';
    END IF;
END $$;

-- Create performance_metrics table if it doesn't exist
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

-- Enable RLS on performance_metrics if not already enabled
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'performance_metrics') THEN
        ALTER TABLE public.performance_metrics ENABLE ROW LEVEL SECURITY;
        
        CREATE POLICY "Service role can manage performance metrics" 
        ON public.performance_metrics 
        FOR ALL 
        USING (auth.role() = 'service_role');

        CREATE POLICY "Admins can view performance metrics" 
        ON public.performance_metrics 
        FOR SELECT 
        USING (is_secure_admin(auth.uid()));
    END IF;
END $$;

-- Create test_results table if it doesn't exist
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

-- Enable RLS on test_results if not already enabled
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'test_results') THEN
        ALTER TABLE public.test_results ENABLE ROW LEVEL SECURITY;
        
        CREATE POLICY "Service role can manage test results" 
        ON public.test_results 
        FOR ALL 
        USING (auth.role() = 'service_role');

        CREATE POLICY "Admins can view test results" 
        ON public.test_results 
        FOR SELECT 
        USING (is_secure_admin(auth.uid()));
    END IF;
END $$;

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