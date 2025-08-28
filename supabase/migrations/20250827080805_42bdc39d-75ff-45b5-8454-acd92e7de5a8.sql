-- Clean up duplicate provider health records first
-- Delete duplicates keeping only the latest one
DELETE FROM provider_health 
WHERE id NOT IN (
    SELECT DISTINCT ON (provider) id 
    FROM provider_health 
    ORDER BY provider, created_at DESC
);

-- Now add the unique constraint
ALTER TABLE provider_health ADD CONSTRAINT provider_health_provider_unique UNIQUE (provider);

-- Insert fresh health records 
INSERT INTO provider_health (provider, status, last_checked, response_time_ms, failure_count, error_count)
VALUES 
  ('amadeus-flight', 'healthy', NOW(), 150, 0, 0),
  ('amadeus-hotel', 'healthy', NOW(), 200, 0, 0),
  ('amadeus-activity', 'healthy', NOW(), 180, 0, 0),
  ('sabre-flight', 'degraded', NOW(), 800, 1, 1),
  ('sabre-hotel', 'degraded', NOW(), 750, 1, 1),
  ('hotelbeds-hotel', 'unhealthy', NOW(), 5000, 3, 3),
  ('hotelbeds-activity', 'unhealthy', NOW(), 4500, 2, 2)
ON CONFLICT (provider) DO UPDATE SET
  status = EXCLUDED.status,
  last_checked = EXCLUDED.last_checked,
  response_time_ms = EXCLUDED.response_time_ms,
  failure_count = EXCLUDED.failure_count,
  error_count = EXCLUDED.error_count;