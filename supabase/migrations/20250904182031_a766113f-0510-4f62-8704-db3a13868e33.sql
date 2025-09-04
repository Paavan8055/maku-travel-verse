-- Add missing Amadeus providers to provider_configs table
INSERT INTO public.provider_configs (id, name, type, enabled, priority, base_url, circuit_breaker, health_score, response_time)
VALUES 
  ('amadeus-flight', 'Amadeus Flight', 'flight', true, 1, 'amadeus-flight-search', '{}'::jsonb, 100, 0),
  ('amadeus-hotel', 'Amadeus Hotel', 'hotel', true, 2, 'amadeus-hotel-search', '{}'::jsonb, 100, 0)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  enabled = EXCLUDED.enabled,
  priority = EXCLUDED.priority,
  base_url = EXCLUDED.base_url,
  updated_at = now();

-- Initialize provider health records for all active providers
INSERT INTO public.provider_health (provider_id, status, response_time_ms, error_count, last_checked)
SELECT 
  pc.id,
  'unknown'::text,
  0,
  0,
  now()
FROM public.provider_configs pc
WHERE pc.enabled = true
ON CONFLICT (provider_id) DO UPDATE SET
  last_checked = now();

-- Initialize provider quotas for quota management
INSERT INTO public.provider_quotas (provider_id, daily_limit, current_usage, status, percentage_used)
SELECT 
  pc.id,
  10000, -- Default daily limit
  0,
  'healthy'::text,
  0.0
FROM public.provider_configs pc
WHERE pc.enabled = true
ON CONFLICT (provider_id) DO UPDATE SET
  updated_at = now();