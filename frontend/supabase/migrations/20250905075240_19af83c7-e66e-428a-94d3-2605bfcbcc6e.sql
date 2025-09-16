-- Phase 1: Re-enable Amadeus Flight Provider
UPDATE public.provider_configs 
SET 
  enabled = true,
  priority = 1,
  health_score = 95,
  updated_at = NOW()
WHERE id = 'amadeus-flight';

-- Phase 3: Reset circuit breaker states for all providers
UPDATE public.provider_configs 
SET 
  circuit_breaker_state = 'closed',
  circuit_breaker = jsonb_build_object(
    'failureCount', 0,
    'lastFailure', null,
    'state', 'closed',
    'timeout', 30000
  ),
  updated_at = NOW();