-- Disable problematic Sabre and HotelBeds providers
UPDATE public.provider_configs 
SET enabled = false, 
    priority = 999,
    health_score = 0,
    updated_at = NOW()
WHERE id IN ('sabre-flight', 'sabre-hotel', 'hotelbeds-hotel', 'hotelbeds-activity');

-- Enable and prioritize Amadeus as top provider for all services
UPDATE public.provider_configs 
SET enabled = true,
    priority = 1,
    health_score = 100,
    updated_at = NOW()
WHERE id LIKE 'amadeus%' OR id = 'amadeus';

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