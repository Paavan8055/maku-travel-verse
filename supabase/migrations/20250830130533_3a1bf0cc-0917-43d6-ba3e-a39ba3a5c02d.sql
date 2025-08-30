-- Fix database schema mismatches for provider rotation system

-- Clean up duplicate provider_health records
DELETE FROM provider_health WHERE id IN (
  SELECT id FROM (
    SELECT id, ROW_NUMBER() OVER (PARTITION BY provider ORDER BY last_checked DESC) as rn
    FROM provider_health
  ) t WHERE rn > 1
);

-- Delete existing quota records to recreate them properly
DELETE FROM provider_quotas;

-- Create quota records for all enabled providers
INSERT INTO provider_quotas (provider_id, provider_name, service_type, quota_used, quota_limit, percentage_used, status, reset_time)
SELECT 
  pc.id,
  pc.name,
  pc.type,
  0,
  10000,
  0,
  'healthy',
  NOW()
FROM provider_configs pc
WHERE pc.enabled = true;

-- Delete existing health records to recreate them properly
DELETE FROM provider_health;

-- Create healthy provider_health records for enabled providers
INSERT INTO provider_health (provider, status, error_count, response_time_ms, last_checked)
SELECT 
  pc.id,
  'healthy',
  0,
  100,
  NOW()
FROM provider_configs pc
WHERE pc.enabled = true;

-- Reset all circuit breakers to closed state
UPDATE provider_configs 
SET circuit_breaker_state = jsonb_build_object(
  'state', 'closed',
  'failure_count', 0,
  'last_failure', null,
  'next_attempt', null
)
WHERE enabled = true;