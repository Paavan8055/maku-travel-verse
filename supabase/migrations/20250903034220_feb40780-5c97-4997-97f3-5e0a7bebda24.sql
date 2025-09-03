-- Reset provider health data to fix corruption
DELETE FROM provider_health WHERE status IS NULL OR provider IS NULL;

-- Insert default provider health records if none exist
INSERT INTO provider_health (provider, status, response_time_ms, last_checked, error_count)
SELECT * FROM (
  VALUES
    ('sabre-flight', 'healthy', 1500, NOW(), 0),
    ('amadeus-flight', 'healthy', 1200, NOW(), 0),
    ('hotelbeds-hotel', 'healthy', 1800, NOW(), 0),
    ('sabre-hotel', 'healthy', 1600, NOW(), 0),
    ('amadeus-hotel', 'healthy', 1400, NOW(), 0),
    ('hotelbeds-activity', 'healthy', 2000, NOW(), 0),
    ('sabre-activity', 'healthy', 1700, NOW(), 0),
    ('amadeus-activity', 'healthy', 1300, NOW(), 0)
) AS t(provider, status, response_time_ms, last_checked, error_count)
WHERE NOT EXISTS (
  SELECT 1 FROM provider_health ph WHERE ph.provider = t.provider
);