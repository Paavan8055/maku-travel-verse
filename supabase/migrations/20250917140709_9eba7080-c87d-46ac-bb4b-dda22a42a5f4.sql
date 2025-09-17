-- Reset Amadeus provider quota status and re-enable providers
-- This migration resets the quota tracking for Amadeus providers after API key refresh

-- Reset provider quotas for all Amadeus providers
UPDATE public.provider_quotas 
SET 
  status = 'healthy',
  percentage_used = 0,
  quota_used = 0,
  is_actual_quota_limit = false,
  last_checked = NOW(),
  updated_at = NOW()
WHERE provider_id IN ('amadeus', 'amadeus-flight', 'amadeus-hotel');

-- Re-enable Amadeus providers in provider configs  
UPDATE public.provider_configs 
SET 
  enabled = true,
  priority = CASE 
    WHEN id = 'amadeus-flight' THEN 2
    WHEN id = 'amadeus-hotel' THEN 3
    ELSE priority
  END,
  health_score = 100,
  response_time = 1500,
  circuit_breaker_state = 'closed',
  updated_at = NOW()
WHERE id IN ('amadeus-flight', 'amadeus-hotel');