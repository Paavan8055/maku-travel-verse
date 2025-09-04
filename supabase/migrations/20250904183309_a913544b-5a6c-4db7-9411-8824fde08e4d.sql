-- Add missing Amadeus providers to provider_configs table (simple insert, ignore if exists)
INSERT INTO public.provider_configs (id, name, type, enabled, priority, base_url, circuit_breaker, health_score, response_time)
SELECT 
  'amadeus-flight', 'Amadeus Flight', 'flight', true, 1, 'amadeus-flight-search', '{}'::jsonb, 100, 0
WHERE NOT EXISTS (SELECT 1 FROM public.provider_configs WHERE id = 'amadeus-flight');

INSERT INTO public.provider_configs (id, name, type, enabled, priority, base_url, circuit_breaker, health_score, response_time)
SELECT 
  'amadeus-hotel', 'Amadeus Hotel', 'hotel', true, 2, 'amadeus-hotel-search', '{}'::jsonb, 100, 0
WHERE NOT EXISTS (SELECT 1 FROM public.provider_configs WHERE id = 'amadeus-hotel');

-- Add provider health records for new Amadeus providers (using 'healthy' status)
INSERT INTO public.provider_health (provider, status, response_time_ms, error_count, last_checked)
SELECT 
  'amadeus-flight', 'healthy', 0, 0, now()
WHERE NOT EXISTS (SELECT 1 FROM public.provider_health WHERE provider = 'amadeus-flight');

INSERT INTO public.provider_health (provider, status, response_time_ms, error_count, last_checked)
SELECT 
  'amadeus-hotel', 'healthy', 0, 0, now()
WHERE NOT EXISTS (SELECT 1 FROM public.provider_health WHERE provider = 'amadeus-hotel');

-- Add provider quotas for new Amadeus providers  
INSERT INTO public.provider_quotas (provider_id, provider_name, service_type, quota_used, quota_limit, percentage_used, status, last_checked)
SELECT 
  'amadeus-flight', 'Amadeus Flight', 'flight', 0, 10000, 0.0, 'healthy', now()
WHERE NOT EXISTS (SELECT 1 FROM public.provider_quotas WHERE provider_id = 'amadeus-flight');

INSERT INTO public.provider_quotas (provider_id, provider_name, service_type, quota_used, quota_limit, percentage_used, status, last_checked)
SELECT 
  'amadeus-hotel', 'Amadeus Hotel', 'hotel', 0, 10000, 0.0, 'healthy', now()
WHERE NOT EXISTS (SELECT 1 FROM public.provider_quotas WHERE provider_id = 'amadeus-hotel');