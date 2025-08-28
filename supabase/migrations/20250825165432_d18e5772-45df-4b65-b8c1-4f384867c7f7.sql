-- Create provider_quotas table for quota monitoring
CREATE TABLE IF NOT EXISTS provider_quotas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider_id TEXT NOT NULL UNIQUE,
    provider_name TEXT NOT NULL,
    service_type TEXT NOT NULL,
    quota_used INTEGER NOT NULL DEFAULT 0,
    quota_limit INTEGER NOT NULL DEFAULT 0,
    percentage_used DECIMAL(5,2) NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'healthy' CHECK (status IN ('healthy', 'warning', 'critical', 'exceeded')),
    reset_time TIMESTAMP WITH TIME ZONE,
    last_checked TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on provider_quotas
ALTER TABLE provider_quotas ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for provider_quotas (admin access only)
CREATE POLICY "Admin access only to provider quotas" 
ON provider_quotas FOR ALL 
USING (is_secure_admin(auth.uid()));

CREATE POLICY "Service role can manage provider quotas" 
ON provider_quotas FOR ALL 
WITH CHECK (auth.role() = 'service_role');

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_provider_quotas_provider_id ON provider_quotas (provider_id);
CREATE INDEX IF NOT EXISTS idx_provider_quotas_status ON provider_quotas (status);
CREATE INDEX IF NOT EXISTS idx_provider_quotas_last_checked ON provider_quotas (last_checked);

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_provider_quotas_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_provider_quotas_updated_at
    BEFORE UPDATE ON provider_quotas
    FOR EACH ROW
    EXECUTE FUNCTION update_provider_quotas_updated_at();

-- Create function to get quota-aware provider priorities
CREATE OR REPLACE FUNCTION get_quota_aware_providers(
    p_search_type TEXT,
    p_excluded_providers TEXT[] DEFAULT ARRAY[]::TEXT[]
)
RETURNS TABLE(
    provider_id TEXT,
    provider_name TEXT,
    priority INTEGER,
    quota_status TEXT,
    percentage_used DECIMAL
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        pc.id as provider_id,
        pc.name as provider_name,
        CASE 
            WHEN pq.status = 'exceeded' THEN 999
            WHEN pq.status = 'critical' THEN pc.priority + 10
            WHEN pq.status = 'warning' THEN pc.priority + 5
            ELSE pc.priority
        END as priority,
        COALESCE(pq.status, 'healthy') as quota_status,
        COALESCE(pq.percentage_used, 0) as percentage_used
    FROM provider_configs pc
    LEFT JOIN provider_quotas pq ON pc.id = pq.provider_id
    WHERE pc.type = p_search_type
    AND pc.enabled = true
    AND pc.id != ALL(p_excluded_providers)
    AND (pq.status != 'exceeded' OR pq.status IS NULL)
    ORDER BY 
        CASE 
            WHEN pq.status = 'exceeded' THEN 999
            WHEN pq.status = 'critical' THEN pc.priority + 10
            WHEN pq.status = 'warning' THEN pc.priority + 5
            ELSE pc.priority
        END ASC,
        COALESCE(pq.percentage_used, 0) ASC;
END;
$$;