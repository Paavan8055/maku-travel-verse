-- Clean up all duplicate provider health and quota records and enable Amadeus providers

-- Delete all existing provider_health records to start fresh
DELETE FROM provider_health;

-- Delete all existing provider_quotas records to start fresh  
DELETE FROM provider_quotas;

-- Enable Amadeus providers with proper configuration
UPDATE provider_configs 
SET enabled = true, priority = 3, health_score = 100, circuit_breaker_state = 'closed'
WHERE id IN ('amadeus-flight', 'amadeus-hotel', 'amadeus-activity');

-- Insert fresh provider_quotas for all enabled providers
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

-- Insert fresh provider_health records for all enabled providers
INSERT INTO provider_health (provider, status, error_count, response_time_ms, last_checked, failure_count)
SELECT 
  pc.id,
  'healthy',
  0,
  100,
  NOW(),
  0
FROM provider_configs pc
WHERE pc.enabled = true;