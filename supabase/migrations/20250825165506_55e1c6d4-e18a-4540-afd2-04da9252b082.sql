-- Fix function search path security warning
-- Update the get_quota_aware_providers function to have a fixed search_path

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
SET search_path = 'public'
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
    FROM public.provider_configs pc
    LEFT JOIN public.provider_quotas pq ON pc.id = pq.provider_id
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