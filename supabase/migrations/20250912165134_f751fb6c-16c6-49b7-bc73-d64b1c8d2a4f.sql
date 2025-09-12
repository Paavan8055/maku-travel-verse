-- Phase 1: Enable and configure Amadeus providers
UPDATE provider_configs 
SET enabled = true, 
    priority = CASE 
        WHEN id = 'amadeus-flight' THEN 1
        WHEN id = 'amadeus-hotel' THEN 1  
        WHEN id = 'amadeus' THEN 1
        ELSE priority
    END,
    circuit_breaker_state = 'closed',
    circuit_breaker = jsonb_build_object(
        'failureCount', 0,
        'lastFailure', null,
        'state', 'closed',
        'timeout', 30000
    )
WHERE id IN ('amadeus', 'amadeus-flight', 'amadeus-hotel');

-- Phase 2: Fix Amadeus quota status
UPDATE provider_quotas 
SET status = 'healthy',
    percentage_used = 0,
    updated_at = NOW()
WHERE provider_id LIKE '%amadeus%' AND status = 'exceeded';

-- Phase 3: Add Travelport provider configuration
INSERT INTO provider_configs (id, name, type, enabled, priority, base_url, health_score, response_time, circuit_breaker_state, circuit_breaker)
VALUES 
('travelport-flight', 'Travelport Flight', 'flight', true, 4, 'https://api.travelport.com', 85, 800, 'closed',
 jsonb_build_object('failureCount', 0, 'lastFailure', null, 'state', 'closed', 'timeout', 30000)),
('travelport-hotel', 'Travelport Hotel', 'hotel', true, 4, 'https://api.travelport.com', 85, 800, 'closed',
 jsonb_build_object('failureCount', 0, 'lastFailure', null, 'state', 'closed', 'timeout', 30000))
ON CONFLICT (id) DO UPDATE SET
enabled = EXCLUDED.enabled,
priority = EXCLUDED.priority,
circuit_breaker_state = EXCLUDED.circuit_breaker_state,
circuit_breaker = EXCLUDED.circuit_breaker;

-- Phase 4: Optimize all provider priorities for optimal performance
UPDATE provider_configs 
SET priority = CASE 
    -- Flight providers: Amadeus (1), Duffel (2), Sabre (3), Travelport (4)
    WHEN id = 'amadeus-flight' THEN 1
    WHEN id = 'duffel-flight' THEN 2
    WHEN id = 'sabre-flight' THEN 3
    WHEN id = 'travelport-flight' THEN 4
    -- Hotel providers: Amadeus (1), HotelBeds (2), Sabre (3), Travelport (4)
    WHEN id = 'amadeus-hotel' THEN 1
    WHEN id = 'hotelbeds-hotel' THEN 2
    WHEN id = 'sabre-hotel' THEN 3
    WHEN id = 'travelport-hotel' THEN 4
    -- Activity providers: HotelBeds (1)
    WHEN id = 'hotelbeds-activity' THEN 1
    -- General providers
    WHEN id = 'amadeus' THEN 1
    ELSE priority
END,
enabled = true,
circuit_breaker_state = 'closed'
WHERE id IN ('amadeus-flight', 'duffel-flight', 'sabre-flight', 'travelport-flight',
             'amadeus-hotel', 'hotelbeds-hotel', 'sabre-hotel', 'travelport-hotel', 
             'hotelbeds-activity', 'amadeus');

-- Phase 5: Add Travelport quota tracking
INSERT INTO provider_quotas (provider_id, provider_name, service_type, quota_limit, quota_used, percentage_used, status)
VALUES 
('travelport-flight', 'Travelport Flight', 'flight', 10000, 0, 0, 'healthy'),
('travelport-hotel', 'Travelport Hotel', 'hotel', 10000, 0, 0, 'healthy')
ON CONFLICT (provider_id) DO UPDATE SET
status = EXCLUDED.status,
percentage_used = EXCLUDED.percentage_used;

-- Final verification: Ensure all circuit breakers are properly reset
UPDATE provider_configs 
SET circuit_breaker = jsonb_build_object(
    'failureCount', 0,
    'lastFailure', null,
    'state', 'closed',
    'timeout', 30000
),
circuit_breaker_state = 'closed',
updated_at = NOW()
WHERE enabled = true;