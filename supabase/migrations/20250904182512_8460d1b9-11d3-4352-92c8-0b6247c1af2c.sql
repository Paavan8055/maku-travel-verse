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

-- Initialize provider health records for all active providers (using 'provider' column)
INSERT INTO public.provider_health (provider, status, response_time_ms, error_count, last_checked)
SELECT 
  pc.id,
  'unknown'::text,
  0,
  0,
  now()
FROM public.provider_configs pc
WHERE pc.enabled = true
ON CONFLICT (provider) DO UPDATE SET
  last_checked = now();

-- Initialize provider quotas for quota management
INSERT INTO public.provider_quotas (provider_id, provider_name, service_type, quota_used, quota_limit, percentage_used, status, last_checked)
SELECT 
  pc.id,
  pc.name,
  pc.type,
  0,
  10000,
  0.0,
  'healthy'::text,
  now()
FROM public.provider_configs pc
WHERE pc.enabled = true
ON CONFLICT (provider_id) DO UPDATE SET
  updated_at = now();