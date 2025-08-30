-- Fix database schema mismatches for provider rotation system

-- Clean up duplicate provider_health records (keep most recent per provider)
DELETE FROM provider_health WHERE id IN (
  SELECT id FROM (
    SELECT id, ROW_NUMBER() OVER (PARTITION BY provider ORDER BY last_checked DESC) as rn
    FROM provider_health
  ) t WHERE rn > 1
);

-- Create default quota records for all enabled providers using correct column names
INSERT INTO provider_quotas (provider_id, provider_name, service_type, quota_used, quota_limit, percentage_used, status, reset_time)
SELECT 
  pc.id,
  pc.name,
  pc.type,
  0 as quota_used,
  10000 as quota_limit,
  0 as percentage_used,
  'healthy' as status,
  NOW() as reset_time
FROM provider_configs pc
WHERE pc.enabled = true
ON CONFLICT (provider_id) DO UPDATE SET
  status = 'healthy',
  percentage_used = 0,
  quota_used = 0,
  updated_at = NOW();

-- Create healthy provider_health records for enabled providers
INSERT INTO provider_health (provider, status, error_count, response_time_ms, last_checked)
SELECT 
  pc.id,
  'healthy' as status,
  0 as error_count,
  100 as response_time_ms,
  NOW() as last_checked
FROM provider_configs pc
WHERE pc.enabled = true
ON CONFLICT (provider) DO UPDATE SET
  status = 'healthy',
  error_count = 0,
  response_time_ms = 100,
  last_checked = NOW();

-- Reset all circuit breakers to closed state
UPDATE provider_configs 
SET circuit_breaker_state = jsonb_build_object(
  'state', 'closed',
  'failure_count', 0,
  'last_failure', null,
  'next_attempt', null
)
WHERE enabled = true;