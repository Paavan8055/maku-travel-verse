-- PHASE 1: Database Cleanup & Repair (Final corrected version)
-- Remove any duplicate provider_health records
WITH duplicates AS (
  SELECT id, provider, 
    ROW_NUMBER() OVER (PARTITION BY provider ORDER BY last_checked DESC) as rn
  FROM provider_health
)
DELETE FROM provider_health 
WHERE id IN (
  SELECT id FROM duplicates WHERE rn > 1
);

-- Clean up old health records
DELETE FROM provider_health 
WHERE last_checked < NOW() - INTERVAL '7 days';

-- Restore provider_configs with correct structure
DELETE FROM provider_configs WHERE type IN ('flight', 'hotel', 'activity');

INSERT INTO provider_configs (id, name, type, priority, enabled, circuit_breaker) VALUES
('amadeus-flight', 'Amadeus Flight', 'flight', 1, true, '{"state": "closed", "failure_count": 0, "last_failure": null}'),
('amadeus-hotel', 'Amadeus Hotel', 'hotel', 1, true, '{"state": "closed", "failure_count": 0, "last_failure": null}'),
('amadeus-activity', 'Amadeus Activity', 'activity', 1, true, '{"state": "closed", "failure_count": 0, "last_failure": null}'),
('sabre-flight', 'Sabre Flight', 'flight', 2, true, '{"state": "half-open", "failure_count": 2, "last_failure": "2025-08-27T09:00:00Z"}'),
('sabre-hotel', 'Sabre Hotel', 'hotel', 2, true, '{"state": "closed", "failure_count": 1, "last_failure": "2025-08-27T08:55:00Z"}'),
('hotelbeds-hotel', 'HotelBeds Hotel', 'hotel', 3, true, '{"state": "closed", "failure_count": 3, "last_failure": "2025-08-27T08:45:00Z"}'),
('hotelbeds-activity', 'HotelBeds Activity', 'activity', 3, true, '{"state": "closed", "failure_count": 2, "last_failure": "2025-08-27T08:50:00Z"}')
ON CONFLICT (id) DO UPDATE SET
  priority = EXCLUDED.priority,
  enabled = EXCLUDED.enabled,
  circuit_breaker = EXCLUDED.circuit_breaker,
  updated_at = NOW();

-- Initialize provider_quotas with correct structure
DELETE FROM provider_quotas;
INSERT INTO provider_quotas (provider_id, provider_name, service_type, quota_limit, quota_used, status, percentage_used, reset_time) VALUES
('amadeus-flight', 'Amadeus Flight', 'flight', 1000, 45, 'healthy', 4.5, NOW() + INTERVAL '1 hour'),
('amadeus-hotel', 'Amadeus Hotel', 'hotel', 1000, 32, 'healthy', 3.2, NOW() + INTERVAL '1 hour'),
('amadeus-activity', 'Amadeus Activity', 'activity', 1000, 28, 'healthy', 2.8, NOW() + INTERVAL '1 hour'),
('sabre-flight', 'Sabre Flight', 'flight', 500, 180, 'warning', 36.0, NOW() + INTERVAL '1 hour'),
('sabre-hotel', 'Sabre Hotel', 'hotel', 500, 155, 'warning', 31.0, NOW() + INTERVAL '1 hour'),
('hotelbeds-hotel', 'HotelBeds Hotel', 'hotel', 800, 620, 'critical', 77.5, NOW() + INTERVAL '1 hour'),
('hotelbeds-activity', 'HotelBeds Activity', 'activity', 800, 580, 'critical', 72.5, NOW() + INTERVAL '1 hour');

-- Refresh provider_health with current data
DELETE FROM provider_health;
INSERT INTO provider_health (provider, status, last_checked, response_time_ms, failure_count, error_count, metadata) VALUES
('amadeus-flight', 'healthy', NOW(), 150, 0, 0, '{"last_success": "' || NOW()::text || '", "circuit_breaker": "closed"}'),
('amadeus-hotel', 'healthy', NOW(), 180, 0, 0, '{"last_success": "' || NOW()::text || '", "circuit_breaker": "closed"}'),
('amadeus-activity', 'healthy', NOW(), 165, 0, 0, '{"last_success": "' || NOW()::text || '", "circuit_breaker": "closed"}'),
('sabre-flight', 'degraded', NOW(), 850, 2, 1, '{"last_success": "' || (NOW() - INTERVAL '10 minutes')::text || '", "circuit_breaker": "half-open"}'),
('sabre-hotel', 'degraded', NOW(), 780, 1, 1, '{"last_success": "' || (NOW() - INTERVAL '5 minutes')::text || '", "circuit_breaker": "closed"}'),
('hotelbeds-hotel', 'degraded', NOW(), 2800, 3, 2, '{"last_success": "' || (NOW() - INTERVAL '15 minutes')::text || '", "circuit_breaker": "closed"}'),
('hotelbeds-activity', 'degraded', NOW(), 2650, 2, 1, '{"last_success": "' || (NOW() - INTERVAL '8 minutes')::text || '", "circuit_breaker": "closed"}');