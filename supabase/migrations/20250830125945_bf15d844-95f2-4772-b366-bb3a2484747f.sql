-- Fix database schema mismatches for provider rotation system

-- First, ensure provider_quotas table exists with correct structure
CREATE TABLE IF NOT EXISTS provider_quotas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  provider_id TEXT NOT NULL UNIQUE,
  current_usage INTEGER DEFAULT 0,
  quota_limit INTEGER DEFAULT 10000,
  percentage_used NUMERIC DEFAULT 0,
  status TEXT DEFAULT 'healthy' CHECK (status IN ('healthy', 'warning', 'critical', 'exceeded')),
  reset_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create the missing provider_quotas trigger
CREATE OR REPLACE FUNCTION update_provider_quotas_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger if it doesn't exist
DROP TRIGGER IF EXISTS provider_quotas_updated_at ON provider_quotas;
CREATE TRIGGER provider_quotas_updated_at
    BEFORE UPDATE ON provider_quotas
    FOR EACH ROW
    EXECUTE FUNCTION update_provider_quotas_updated_at();

-- Clean up any duplicate or corrupt provider_health records
DELETE FROM provider_health WHERE id IN (
  SELECT id FROM (
    SELECT id, ROW_NUMBER() OVER (PARTITION BY provider ORDER BY last_checked DESC) as rn
    FROM provider_health
  ) t WHERE rn > 1
);

-- Ensure provider_health has correct structure
ALTER TABLE provider_health 
  DROP COLUMN IF EXISTS avg_response_time,
  ADD COLUMN IF NOT EXISTS response_time_ms INTEGER DEFAULT 100;

-- Create default quota records for all enabled providers
INSERT INTO provider_quotas (provider_id, current_usage, quota_limit, percentage_used, status)
SELECT 
  id,
  0 as current_usage,
  10000 as quota_limit,
  0 as percentage_used,
  'healthy' as status
FROM provider_configs 
WHERE enabled = true
ON CONFLICT (provider_id) DO UPDATE SET
  status = 'healthy',
  percentage_used = 0,
  updated_at = NOW();

-- Create healthy provider_health records for enabled providers
INSERT INTO provider_health (provider, status, error_count, response_time_ms, last_checked)
SELECT 
  id,
  'healthy' as status,
  0 as error_count,
  100 as response_time_ms,
  NOW() as last_checked
FROM provider_configs 
WHERE enabled = true
ON CONFLICT (provider) DO UPDATE SET
  status = 'healthy',
  error_count = 0,
  response_time_ms = 100,
  last_checked = NOW();

-- Update circuit breaker states to closed for all providers
UPDATE provider_configs 
SET circuit_breaker_state = jsonb_build_object(
  'state', 'closed',
  'failure_count', 0,
  'last_failure', null,
  'next_attempt', null
)
WHERE enabled = true;