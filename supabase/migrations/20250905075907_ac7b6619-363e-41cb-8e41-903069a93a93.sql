-- Critical Fix: Properly enable Amadeus Flight Provider
UPDATE public.provider_configs 
SET 
  enabled = true,
  priority = 1,
  health_score = 95,
  updated_at = NOW()
WHERE id = 'amadeus-flight' AND type = 'flight';

-- Verify the update worked
SELECT id, name, type, enabled, priority, health_score 
FROM public.provider_configs 
WHERE id = 'amadeus-flight';