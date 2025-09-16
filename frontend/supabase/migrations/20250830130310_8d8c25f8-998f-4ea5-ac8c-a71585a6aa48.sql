-- Fix database schema mismatches for provider rotation system

-- Clean up duplicate provider_health records (keep most recent per provider)
DELETE FROM provider_health WHERE id IN (
  SELECT id FROM (
    SELECT id, ROW_NUMBER() OVER (PARTITION BY provider ORDER BY last_checked DESC) as rn
    FROM provider_health
  ) t WHERE rn > 1
);

-- Create or update quota records for all enabled providers using UPSERT pattern
DO $$
DECLARE
  provider_rec RECORD;
BEGIN
  FOR provider_rec IN 
    SELECT id, name, type FROM provider_configs WHERE enabled = true
  LOOP
    INSERT INTO provider_quotas (provider_id, provider_name, service_type, quota_used, quota_limit, percentage_used, status, reset_time)
    VALUES (
      provider_rec.id,
      provider_rec.name,
      provider_rec.type,
      0,
      10000,
      0,
      'healthy',
      NOW()
    );
  EXCEPTION WHEN unique_violation THEN
    UPDATE provider_quotas SET
      status = 'healthy',
      percentage_used = 0,
      quota_used = 0,
      updated_at = NOW()
    WHERE provider_id = provider_rec.id;
  END LOOP;
END $$;

-- Create or update healthy provider_health records for enabled providers
DO $$
DECLARE
  provider_rec RECORD;
BEGIN
  FOR provider_rec IN 
    SELECT id FROM provider_configs WHERE enabled = true
  LOOP
    INSERT INTO provider_health (provider, status, error_count, response_time_ms, last_checked)
    VALUES (
      provider_rec.id,
      'healthy',
      0,
      100,
      NOW()
    );
  EXCEPTION WHEN unique_violation THEN
    UPDATE provider_health SET
      status = 'healthy',
      error_count = 0,
      response_time_ms = 100,
      last_checked = NOW()
    WHERE provider = provider_rec.id;
  END LOOP;
END $$;

-- Reset all circuit breakers to closed state
UPDATE provider_configs 
SET circuit_breaker_state = jsonb_build_object(
  'state', 'closed',
  'failure_count', 0,
  'last_failure', null,
  'next_attempt', null
)
WHERE enabled = true;