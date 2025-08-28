-- Create tables for unified health monitoring system

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

-- Add circuit breaker state to provider configs if not exists
ALTER TABLE public.provider_configs 
ADD COLUMN IF NOT EXISTS circuit_breaker_state TEXT DEFAULT 'closed' CHECK (circuit_breaker_state IN ('closed', 'open', 'half-open'));

-- Add failure tracking to provider health
ALTER TABLE public.provider_health 
ADD COLUMN IF NOT EXISTS failure_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS circuit_breaker_opened_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS last_reset_at TIMESTAMP WITH TIME ZONE;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_system_health_snapshots_timestamp ON public.system_health_snapshots(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_provider_health_provider_timestamp ON public.provider_health(provider, last_checked DESC);
CREATE INDEX IF NOT EXISTS idx_provider_configs_circuit_breaker ON public.provider_configs(circuit_breaker_state);

-- Enable RLS
ALTER TABLE public.system_health_snapshots ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for system health snapshots (admin only)
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

CREATE POLICY "Admin can insert system health snapshots"
    ON public.system_health_snapshots FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.user_roles ur
            WHERE ur.user_id = auth.uid()
            AND ur.role = 'admin'
            AND ur.is_active = true
        )
    );

-- Function to clean up old health snapshots (keep last 30 days)
CREATE OR REPLACE FUNCTION public.cleanup_old_health_snapshots()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    DELETE FROM public.system_health_snapshots
    WHERE timestamp < NOW() - INTERVAL '30 days';
END;
$$;

-- Function to get latest health status
CREATE OR REPLACE FUNCTION public.get_latest_health_status()
RETURNS TABLE(
    overall_status TEXT,
    healthy_providers INTEGER,
    total_providers INTEGER,
    critical_providers TEXT[],
    last_updated TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        s.overall_status,
        s.healthy_providers,
        s.total_providers,
        s.critical_quota_providers,
        s.timestamp
    FROM public.system_health_snapshots s
    ORDER BY s.timestamp DESC
    LIMIT 1;
END;
$$;