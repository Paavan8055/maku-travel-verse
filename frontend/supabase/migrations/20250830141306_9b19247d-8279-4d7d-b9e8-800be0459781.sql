-- Create initial provider configurations with existing table structure
INSERT INTO provider_configs (id, name, type, enabled, priority, circuit_breaker, health_score, response_time, base_url) VALUES
('amadeus-flight', 'Amadeus Flight', 'flight', true, 1, '{"failures": 0, "state": "closed", "last_failure": null}', 85, 150, 'https://test.api.amadeus.com'),
('sabre-flight', 'Sabre Flight', 'flight', true, 2, '{"failures": 3, "state": "open", "last_failure": "2025-08-30T13:58:12Z"}', 25, 1000, 'https://api-crt.cert.sabre.com'),
('sabre-hotel', 'Sabre Hotel', 'hotel', true, 1, '{"failures": 2, "state": "half-open", "last_failure": "2025-08-30T13:58:10Z"}', 40, 800, 'https://api-crt.cert.sabre.com'),
('amadeus-hotel', 'Amadeus Hotel', 'hotel', true, 2, '{"failures": 1, "state": "closed", "last_failure": null}', 65, 500, 'https://test.api.amadeus.com'),
('hotelbeds-hotel', 'HotelBeds Hotel', 'hotel', true, 3, '{"failures": 3, "state": "open", "last_failure": "2025-08-30T13:58:10Z"}', 20, 1200, 'https://api.test.hotelbeds.com'),
('hotelbeds-activity', 'HotelBeds Activity', 'activity', true, 1, '{"failures": 4, "state": "open", "last_failure": "2025-08-30T13:58:07Z"}', 15, 1500, 'https://api.test.hotelbeds.com'),
('amadeus-activity', 'Amadeus Activity', 'activity', true, 2, '{"failures": 5, "state": "open", "last_failure": "2025-08-30T13:58:05Z"}', 10, 2000, 'https://test.api.amadeus.com')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  type = EXCLUDED.type,
  enabled = EXCLUDED.enabled,
  priority = EXCLUDED.priority,
  circuit_breaker = EXCLUDED.circuit_breaker,
  health_score = EXCLUDED.health_score,
  response_time = EXCLUDED.response_time,
  base_url = EXCLUDED.base_url;

-- Create fresh provider health records based on recent API test results
INSERT INTO provider_health (provider, status, error_count, response_time_ms, last_checked, failure_count) VALUES
('amadeus-flight', 'healthy', 0, 150, NOW(), 0),
('sabre-flight', 'unhealthy', 5, 1000, NOW(), 3),
('sabre-hotel', 'unhealthy', 3, 800, NOW(), 2),
('amadeus-hotel', 'degraded', 2, 500, NOW(), 1),
('hotelbeds-hotel', 'unhealthy', 4, 1200, NOW(), 3),
('hotelbeds-activity', 'unhealthy', 6, 1500, NOW(), 4),
('amadeus-activity', 'unhealthy', 8, 2000, NOW(), 5)
ON CONFLICT (provider) DO UPDATE SET
  status = EXCLUDED.status,
  error_count = EXCLUDED.error_count,
  response_time_ms = EXCLUDED.response_time_ms,
  last_checked = EXCLUDED.last_checked,
  failure_count = EXCLUDED.failure_count;

-- Create provider quota records
INSERT INTO provider_quotas (provider_id, provider_name, service_type, quota_used, quota_limit, percentage_used, status, reset_time) VALUES
('amadeus-flight', 'Amadeus Flight', 'flight', 245, 10000, 2.45, 'healthy', NOW() + INTERVAL '24 hours'),
('sabre-flight', 'Sabre Flight', 'flight', 0, 5000, 0, 'healthy', NOW() + INTERVAL '24 hours'),
('sabre-hotel', 'Sabre Hotel', 'hotel', 12, 3000, 0.4, 'healthy', NOW() + INTERVAL '24 hours'),
('amadeus-hotel', 'Amadeus Hotel', 'hotel', 89, 8000, 1.11, 'healthy', NOW() + INTERVAL '24 hours'),
('hotelbeds-hotel', 'HotelBeds Hotel', 'hotel', 156, 2000, 7.8, 'healthy', NOW() + INTERVAL '24 hours'),
('hotelbeds-activity', 'HotelBeds Activity', 'activity', 34, 1000, 3.4, 'healthy', NOW() + INTERVAL '24 hours'),
('amadeus-activity', 'Amadeus Activity', 'activity', 442, 500, 88.4, 'critical', NOW() + INTERVAL '24 hours')
ON CONFLICT (provider_id) DO UPDATE SET
  provider_name = EXCLUDED.provider_name,
  service_type = EXCLUDED.service_type,
  quota_used = EXCLUDED.quota_used,
  quota_limit = EXCLUDED.quota_limit,
  percentage_used = EXCLUDED.percentage_used,
  status = EXCLUDED.status,
  reset_time = EXCLUDED.reset_time;