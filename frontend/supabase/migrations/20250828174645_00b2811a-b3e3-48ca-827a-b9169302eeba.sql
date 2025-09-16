-- Phase 1: Fix Provider Configurations - Re-enable Amadeus providers
UPDATE provider_configs 
SET enabled = true, priority = 2 
WHERE id = 'amadeus-flight';

UPDATE provider_configs 
SET enabled = true, priority = 3 
WHERE id = 'amadeus-hotel';

UPDATE provider_configs 
SET enabled = true, priority = 3 
WHERE id = 'amadeus-activity';

-- Update circuit breaker states to closed for all providers
UPDATE provider_configs 
SET circuit_breaker = jsonb_set(
  COALESCE(circuit_breaker, '{}'), 
  '{state}', 
  '"closed"'
);

-- Reset failure counts
UPDATE provider_configs 
SET circuit_breaker = jsonb_set(
  COALESCE(circuit_breaker, '{}'), 
  '{failure_count}', 
  '0'
);

-- Clear last failure timestamps
UPDATE provider_configs 
SET circuit_breaker = jsonb_set(
  COALESCE(circuit_breaker, '{}'), 
  '{last_failure}', 
  'null'
);