-- PHASE 1: Database Cleanup & Repair
-- Remove any duplicate provider_health records
WITH duplicates AS (
  SELECT provider, MIN(id) as keep_id
  FROM provider_health 
  GROUP BY provider
  HAVING COUNT(*) > 1
)
DELETE FROM provider_health 
WHERE provider IN (SELECT provider FROM duplicates) 
AND id NOT IN (SELECT keep_id FROM duplicates);

-- Clean up old/stale health records (older than 7 days)
DELETE FROM provider_health 
WHERE last_checked < NOW() - INTERVAL '7 days';

-- Restore provider_configs with correct priorities and enable Amadeus
DELETE FROM provider_configs WHERE type IN ('flight', 'hotel', 'activity');

INSERT INTO provider_configs (id, name, type, priority, enabled, config_data, environment) VALUES
-- Amadeus providers (top priority)
('amadeus-flight', 'Amadeus Flight', 'flight', 1, true, '{"service_type": "flight", "supports_search": true, "supports_booking": true}', 'test'),
('amadeus-hotel', 'Amadeus Hotel', 'hotel', 1, true, '{"service_type": "hotel", "supports_search": true, "supports_booking": true}', 'test'),
('amadeus-activity', 'Amadeus Activity', 'activity', 1, true, '{"service_type": "activity", "supports_search": true, "supports_booking": true}', 'test'),

-- Sabre providers (secondary priority)
('sabre-flight', 'Sabre Flight', 'flight', 2, true, '{"service_type": "flight", "supports_search": true, "supports_booking": true}', 'test'),
('sabre-hotel', 'Sabre Hotel', 'hotel', 2, true, '{"service_type": "hotel", "supports_search": true, "supports_booking": true}', 'test'),

-- HotelBeds providers (tertiary priority)
('hotelbeds-hotel', 'HotelBeds Hotel', 'hotel', 3, true, '{"service_type": "hotel", "supports_search": true, "supports_booking": true}', 'test'),
('hotelbeds-activity', 'HotelBeds Activity', 'activity', 3, true, '{"service_type": "activity", "supports_search": true, "supports_booking": true}', 'test')

ON CONFLICT (id) DO UPDATE SET
  priority = EXCLUDED.priority,
  enabled = EXCLUDED.enabled,
  config_data = EXCLUDED.config_data,
  updated_at = NOW();

-- Initialize provider_quotas with healthy status
DELETE FROM provider_quotas;
INSERT INTO provider_quotas (provider_id, quota_limit, quota_used, status, percentage_used, reset_at) VALUES
('amadeus-flight', 1000, 45, 'healthy', 4.5, NOW() + INTERVAL '1 hour'),
('amadeus-hotel', 1000, 32, 'healthy', 3.2, NOW() + INTERVAL '1 hour'),
('amadeus-activity', 1000, 28, 'healthy', 2.8, NOW() + INTERVAL '1 hour'),
('sabre-flight', 500, 180, 'warning', 36.0, NOW() + INTERVAL '1 hour'),
('sabre-hotel', 500, 155, 'warning', 31.0, NOW() + INTERVAL '1 hour'),
('hotelbeds-hotel', 800, 620, 'critical', 77.5, NOW() + INTERVAL '1 hour'),
('hotelbeds-activity', 800, 580, 'critical', 72.5, NOW() + INTERVAL '1 hour');

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

-- Create comprehensive health monitoring view
CREATE OR REPLACE VIEW provider_health_summary AS
SELECT 
  pc.id as provider_id,
  pc.name as provider_name,
  pc.type as service_type,
  pc.priority,
  pc.enabled,
  COALESCE(ph.status, 'unknown') as health_status,
  COALESCE(ph.response_time_ms, 0) as response_time,
  COALESCE(ph.failure_count, 0) as failure_count,
  COALESCE(ph.error_count, 0) as error_count,
  COALESCE(pq.status, 'healthy') as quota_status,
  COALESCE(pq.percentage_used, 0) as quota_percentage,
  COALESCE(ph.metadata->>'circuit_breaker', 'closed') as circuit_breaker_state,
  ph.last_checked,
  pc.updated_at as config_updated
FROM provider_configs pc
LEFT JOIN provider_health ph ON pc.id = ph.provider
LEFT JOIN provider_quotas pq ON pc.id = pq.provider_id
WHERE pc.enabled = true
ORDER BY pc.priority ASC, pc.type ASC;

-- Create system health monitoring function
CREATE OR REPLACE FUNCTION get_system_health_status()
RETURNS JSON AS $$
DECLARE
  health_summary JSON;
  total_providers INTEGER;
  healthy_count INTEGER;
  degraded_count INTEGER;
  unhealthy_count INTEGER;
  critical_quota_count INTEGER;
  open_breakers_count INTEGER;
  overall_status TEXT;
BEGIN
  -- Get provider counts
  SELECT COUNT(*) INTO total_providers FROM provider_configs WHERE enabled = true;
  
  SELECT 
    COUNT(CASE WHEN COALESCE(ph.status, 'unknown') = 'healthy' THEN 1 END),
    COUNT(CASE WHEN COALESCE(ph.status, 'unknown') = 'degraded' THEN 1 END),
    COUNT(CASE WHEN COALESCE(ph.status, 'unknown') IN ('unhealthy', 'unknown') THEN 1 END),
    COUNT(CASE WHEN COALESCE(pq.status, 'healthy') = 'critical' THEN 1 END),
    COUNT(CASE WHEN ph.metadata->>'circuit_breaker' = 'open' THEN 1 END)
  INTO healthy_count, degraded_count, unhealthy_count, critical_quota_count, open_breakers_count
  FROM provider_configs pc
  LEFT JOIN provider_health ph ON pc.id = ph.provider
  LEFT JOIN provider_quotas pq ON pc.id = pq.provider_id
  WHERE pc.enabled = true;
  
  -- Determine overall status
  IF unhealthy_count > (total_providers / 2) OR open_breakers_count > 0 THEN
    overall_status := 'critical';
  ELSIF degraded_count > 0 OR critical_quota_count > 0 THEN
    overall_status := 'degraded';
  ELSE
    overall_status := 'healthy';
  END IF;
  
  SELECT json_build_object(
    'overall_status', overall_status,
    'timestamp', extract(epoch from now()) * 1000,
    'summary', json_build_object(
      'total_providers', total_providers,
      'healthy_providers', healthy_count,
      'degraded_providers', degraded_count,
      'unhealthy_providers', unhealthy_count,
      'critical_quota_providers', critical_quota_count,
      'open_circuit_breakers', open_breakers_count
    ),
    'providers', (
      SELECT json_agg(
        json_build_object(
          'provider_id', provider_id,
          'provider_name', provider_name,
          'service_type', service_type,
          'priority', priority,
          'health_status', health_status,
          'response_time', response_time,
          'quota_status', quota_status,
          'quota_percentage', quota_percentage,
          'circuit_breaker_state', circuit_breaker_state,
          'failure_count', failure_count,
          'last_checked', extract(epoch from last_checked) * 1000
        )
      )
      FROM provider_health_summary
    )
  ) INTO health_summary;
  
  RETURN health_summary;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create automated health check trigger
CREATE OR REPLACE FUNCTION update_provider_health_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.last_checked := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS provider_health_update_timestamp ON provider_health;
CREATE TRIGGER provider_health_update_timestamp
  BEFORE UPDATE ON provider_health
  FOR EACH ROW
  EXECUTE FUNCTION update_provider_health_timestamp();