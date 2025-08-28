-- Phase 1: Fix Provider Priority Configuration (Audit Compliance)
-- Update Sabre providers to priority 1 as per audit requirements
UPDATE provider_configs SET priority = 1 WHERE id LIKE 'sabre-%';

-- Update HotelBeds providers to priority 2 
UPDATE provider_configs SET priority = 2 WHERE id LIKE 'hotelbeds-%';

-- Update Amadeus providers to priority 3 and enable them
UPDATE provider_configs SET priority = 3, enabled = true WHERE id LIKE 'amadeus-%';

-- Reset circuit breaker states for all providers
UPDATE provider_configs SET 
    circuit_breaker = jsonb_build_object(
        'state', 'closed',
        'failure_count', 0,
        'last_failure', null
    ),
    circuit_breaker_state = 'closed';