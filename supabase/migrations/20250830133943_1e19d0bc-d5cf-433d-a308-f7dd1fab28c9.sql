-- Simple fix: Enable Amadeus providers and set basic health records

-- Enable Amadeus providers with proper priorities
UPDATE provider_configs 
SET enabled = true, priority = 1
WHERE id = 'amadeus-flight';

UPDATE provider_configs 
SET enabled = true, priority = 2  
WHERE id = 'amadeus-hotel';

UPDATE provider_configs 
SET enabled = true, priority = 2
WHERE id = 'amadeus-activity';

-- Insert fresh provider_health records for Amadeus providers if they don't exist
INSERT INTO provider_health (provider, status, error_count, response_time_ms, last_checked, failure_count)
SELECT 'amadeus-flight', 'healthy', 0, 100, NOW(), 0
WHERE NOT EXISTS (SELECT 1 FROM provider_health WHERE provider = 'amadeus-flight');

INSERT INTO provider_health (provider, status, error_count, response_time_ms, last_checked, failure_count)
SELECT 'amadeus-hotel', 'healthy', 0, 100, NOW(), 0
WHERE NOT EXISTS (SELECT 1 FROM provider_health WHERE provider = 'amadeus-hotel');

INSERT INTO provider_health (provider, status, error_count, response_time_ms, last_checked, failure_count)
SELECT 'amadeus-activity', 'healthy', 0, 100, NOW(), 0
WHERE NOT EXISTS (SELECT 1 FROM provider_health WHERE provider = 'amadeus-activity');

-- Insert fresh provider_quotas records for Amadeus providers if they don't exist
INSERT INTO provider_quotas (provider_id, provider_name, service_type, quota_used, quota_limit, percentage_used, status, reset_time)
SELECT 'amadeus-flight', 'amadeus-flight', 'flight', 0, 10000, 0, 'healthy', NOW()
WHERE NOT EXISTS (SELECT 1 FROM provider_quotas WHERE provider_id = 'amadeus-flight');

INSERT INTO provider_quotas (provider_id, provider_name, service_type, quota_used, quota_limit, percentage_used, status, reset_time)
SELECT 'amadeus-hotel', 'amadeus-hotel', 'hotel', 0, 10000, 0, 'healthy', NOW()
WHERE NOT EXISTS (SELECT 1 FROM provider_quotas WHERE provider_id = 'amadeus-hotel');

INSERT INTO provider_quotas (provider_id, provider_name, service_type, quota_used, quota_limit, percentage_used, status, reset_time)
SELECT 'amadeus-activity', 'amadeus-activity', 'activity', 0, 10000, 0, 'healthy', NOW()
WHERE NOT EXISTS (SELECT 1 FROM provider_quotas WHERE provider_id = 'amadeus-activity');