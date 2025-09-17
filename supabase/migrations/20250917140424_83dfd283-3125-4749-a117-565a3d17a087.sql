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
  health_score = 1.0,
  circuit_breaker_state = 'closed',
  updated_at = NOW()
WHERE id IN ('amadeus-flight', 'amadeus-hotel');

-- Insert quota records if they don't exist for any missing Amadeus providers
INSERT INTO public.provider_quotas (provider_id, service, quota_limit, quota_used, percentage_used, status, is_actual_quota_limit, last_checked)
SELECT 
  provider_id,
  'api_calls' as service,
  1000 as quota_limit,
  0 as quota_used,
  0 as percentage_used,
  'healthy' as status,
  false as is_actual_quota_limit,
  NOW() as last_checked
FROM (VALUES 
  ('amadeus'),
  ('amadeus-flight'), 
  ('amadeus-hotel')
) AS providers(provider_id)
WHERE NOT EXISTS (
  SELECT 1 FROM public.provider_quotas pq 
  WHERE pq.provider_id = providers.provider_id
)
ON CONFLICT (provider_id, service) DO NOTHING;