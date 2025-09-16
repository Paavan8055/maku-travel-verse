-- Create provider health monitoring tables

-- Provider health status tracking
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

-- Provider configurations table
CREATE TABLE IF NOT EXISTS public.provider_configs (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    enabled BOOLEAN NOT NULL DEFAULT true,
    priority INTEGER NOT NULL DEFAULT 100,
    circuit_breaker_state TEXT DEFAULT 'closed' CHECK (circuit_breaker_state IN ('closed', 'open', 'half-open')),
    config_data JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
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

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_provider_health_provider_timestamp ON public.provider_health(provider, last_checked DESC);
CREATE INDEX IF NOT EXISTS idx_provider_configs_enabled ON public.provider_configs(enabled, priority);
CREATE INDEX IF NOT EXISTS idx_provider_configs_circuit_breaker ON public.provider_configs(circuit_breaker_state);
CREATE INDEX IF NOT EXISTS idx_system_health_snapshots_timestamp ON public.system_health_snapshots(timestamp DESC);

-- Enable RLS
ALTER TABLE public.provider_health ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.provider_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_health_snapshots ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (admin only access)
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

CREATE POLICY "Admin can view provider configs"
    ON public.provider_configs FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.user_roles ur
            WHERE ur.user_id = auth.uid()
            AND ur.role = 'admin'
            AND ur.is_active = true
        )
    );

CREATE POLICY "Admin can manage provider configs"
    ON public.provider_configs FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.user_roles ur
            WHERE ur.user_id = auth.uid()
            AND ur.role = 'admin'
            AND ur.is_active = true
        )
    );

CREATE POLICY "Service role can manage provider configs"
    ON public.provider_configs FOR ALL
    TO authenticated
    USING (auth.role() = 'service_role');

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

-- Insert default provider configurations
INSERT INTO public.provider_configs (id, name, type, enabled, priority) VALUES
('amadeus-hotel', 'Amadeus Hotels', 'hotel', true, 100),
('amadeus-flight', 'Amadeus Flights', 'flight', true, 100),
('amadeus-activity', 'Amadeus Activities', 'activity', true, 100),
('hotelbeds-hotel', 'HotelBeds Hotels', 'hotel', true, 200),
('hotelbeds-activity', 'HotelBeds Activities', 'activity', true, 200),
('sabre-flight', 'Sabre Flights', 'flight', true, 150),
('sabre-hotel', 'Sabre Hotels', 'hotel', true, 150)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    type = EXCLUDED.type,
    updated_at = NOW();

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