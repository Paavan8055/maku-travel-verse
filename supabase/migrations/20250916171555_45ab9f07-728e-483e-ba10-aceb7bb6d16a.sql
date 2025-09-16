-- Re-enable Amadeus flight and hotel providers
UPDATE provider_configs 
SET enabled = true, priority = 2, updated_at = NOW() 
WHERE id = 'amadeus-flight';

UPDATE provider_configs 
SET enabled = true, priority = 3, updated_at = NOW() 
WHERE id = 'amadeus-hotel';

-- Reset quota status for Amadeus providers
UPDATE provider_quotas 
SET status = 'healthy', percentage_used = 0, is_actual_quota_limit = false, last_checked = NOW() 
WHERE provider_id IN ('amadeus-flight', 'amadeus-hotel');

-- Log the fix
INSERT INTO system_logs (correlation_id, service_name, log_level, level, message) 
VALUES (gen_random_uuid()::text, 'admin_fix', 'info', 'info', 'Re-enabled Amadeus providers after quota monitor false positive');