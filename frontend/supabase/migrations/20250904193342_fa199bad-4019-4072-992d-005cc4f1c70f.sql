-- Disable problematic Sabre and HotelBeds providers
UPDATE public.provider_configs 
SET enabled = false, 
    priority = 999,
    health_score = 0,
    circuit_breaker_state = 'OPEN',
    updated_at = NOW()
WHERE id IN ('sabre-flight', 'sabre-hotel', 'hotelbeds-hotel', 'hotelbeds-activity');

-- Enable and prioritize Amadeus as top provider for all services
UPDATE public.provider_configs 
SET enabled = true,
    priority = 1,
    health_score = 100,
    circuit_breaker_state = 'CLOSED',
    updated_at = NOW()
WHERE id LIKE 'amadeus%' OR id = 'amadeus';

-- Insert Amadeus providers if they don't exist
INSERT INTO public.provider_configs (id, name, type, enabled, priority, health_score, circuit_breaker_state)
VALUES 
    ('amadeus-flight', 'Amadeus Flight API', 'flight', true, 1, 100, 'CLOSED'),
    ('amadeus-hotel', 'Amadeus Hotel API', 'hotel', true, 1, 100, 'CLOSED'),
    ('amadeus-activity', 'Amadeus Activity API', 'activity', true, 1, 100, 'CLOSED')
ON CONFLICT (id) DO UPDATE SET
    enabled = EXCLUDED.enabled,
    priority = EXCLUDED.priority,
    health_score = EXCLUDED.health_score,
    circuit_breaker_state = EXCLUDED.circuit_breaker_state,
    updated_at = NOW();

-- Reset provider health for clean state
DELETE FROM public.provider_health WHERE provider_id IN ('sabre-flight', 'sabre-hotel', 'hotelbeds-hotel', 'hotelbeds-activity');

-- Add system log for provider configuration change
INSERT INTO public.system_logs (correlation_id, service_name, log_level, message, metadata)
VALUES (
    gen_random_uuid()::text,
    'provider_optimization',
    'info',
    'Provider configuration optimized: Disabled Sabre/HotelBeds, enabled Amadeus as primary',
    jsonb_build_object(
        'disabled_providers', ARRAY['sabre-flight', 'sabre-hotel', 'hotelbeds-hotel', 'hotelbeds-activity'],
        'enabled_providers', ARRAY['amadeus-flight', 'amadeus-hotel', 'amadeus-activity'],
        'optimization_type', 'lazy_loading_implementation'
    )
);