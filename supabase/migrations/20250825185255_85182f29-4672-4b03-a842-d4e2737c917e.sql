-- Create missing tables and columns for unified health monitoring

-- Provider health status tracking (create if not exists)
CREATE TABLE IF NOT EXISTS public.provider_health (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('healthy', 'degraded', 'outage')),
    response_time_ms INTEGER,
    error_message TEXT,
    last_checked TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    failure_count INTEGER DEFAULT 0,
    circuit_breaker_opened_at TIMESTAMP WITH TIME ZONE,
    last_reset_at TIMESTAMP WITH TIME ZONE,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- System health snapshots for historical tracking
CREATE TABLE IF NOT EXISTS public.system_health_snapshots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    overall_status TEXT NOT NULL CHECK (overall_status IN ('healthy', 'degraded', 'critical')),
    total_providers INTEGER NOT NULL DEFAULT 0,
    healthy_providers INTEGER NOT NULL DEFAULT 0,
    degraded_providers INTEGER NOT NULL DEFAULT 0,
    outage_providers INTEGER NOT NULL DEFAULT 0,
    critical_quota_providers TEXT[] DEFAULT '{}',
    circuit_breakers_open TEXT[] DEFAULT '{}',
    recommendations TEXT[] DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Add circuit breaker column to provider_configs if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'provider_configs' 
        AND column_name = 'circuit_breaker_state'
    ) THEN
        ALTER TABLE public.provider_configs 
        ADD COLUMN circuit_breaker_state TEXT DEFAULT 'closed' 
        CHECK (circuit_breaker_state IN ('closed', 'open', 'half-open'));
    END IF;
END $$;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_provider_health_provider_timestamp ON public.provider_health(provider, last_checked DESC);
CREATE INDEX IF NOT EXISTS idx_system_health_snapshots_timestamp ON public.system_health_snapshots(timestamp DESC);

-- Enable RLS on new tables only
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'provider_health' 
        AND policyname = 'Admin can view provider health'
    ) THEN
        ALTER TABLE public.provider_health ENABLE ROW LEVEL SECURITY;
        
        CREATE POLICY "Admin can view provider health"
            ON public.provider_health FOR SELECT
            TO authenticated
            USING (
                EXISTS (
                    SELECT 1 FROM public.user_roles ur
                    WHERE ur.user_id = auth.uid()
                    AND ur.role = 'admin'
                    AND ur.is_active = true
                )
            );

        CREATE POLICY "Service role can manage provider health"
            ON public.provider_health FOR ALL
            TO authenticated
            USING (auth.role() = 'service_role');
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'system_health_snapshots' 
        AND policyname = 'Admin can view system health snapshots'
    ) THEN
        ALTER TABLE public.system_health_snapshots ENABLE ROW LEVEL SECURITY;
        
        CREATE POLICY "Admin can view system health snapshots"
            ON public.system_health_snapshots FOR SELECT
            TO authenticated
            USING (
                EXISTS (
                    SELECT 1 FROM public.user_roles ur
                    WHERE ur.user_id = auth.uid()
                    AND ur.role = 'admin'
                    AND ur.is_active = true
                )
            );

        CREATE POLICY "Service role can manage system health snapshots"
            ON public.system_health_snapshots FOR ALL
            TO authenticated
            USING (auth.role() = 'service_role');
    END IF;
END $$;

-- Function to clean up old health data (keep last 7 days)
CREATE OR REPLACE FUNCTION public.cleanup_old_health_data()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    DELETE FROM public.provider_health
    WHERE last_checked < NOW() - INTERVAL '7 days';
    
    DELETE FROM public.system_health_snapshots
    WHERE timestamp < NOW() - INTERVAL '30 days';
END;
$$;