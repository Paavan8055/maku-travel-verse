-- PHASE 1: PROVIDER CONFIGURATION CLEANUP
-- Clean up orphaned provider health records to fix 349 vs 7 discrepancy

-- Remove invalid provider health records
DELETE FROM provider_health 
WHERE provider_id NOT IN (
  'amadeus', 'sabre-hotel', 'sabre-flight', 'hotelbeds-hotel', 
  'hotelbeds-activity', 'stripe', 'supabase'
);

-- Reset provider quotas to clean state
DELETE FROM provider_quotas 
WHERE provider_id NOT IN (
  'amadeus', 'sabre', 'hotelbeds'
);

-- Clean up provider configs to only valid providers
DELETE FROM provider_configs 
WHERE id NOT IN (
  'amadeus', 'sabre-hotel', 'sabre-flight', 'hotelbeds-hotel', 
  'hotelbeds-activity'
);

-- Ensure core provider configs exist
INSERT INTO provider_configs (id, name, type, priority, enabled, base_url, timeout_ms, retry_count) VALUES
('amadeus', 'Amadeus', 'flight', 1, true, 'https://api.amadeus.com', 30000, 3),
('sabre-flight', 'Sabre Flight', 'flight', 2, true, 'https://api.sabre.com', 30000, 3),
('sabre-hotel', 'Sabre Hotel', 'hotel', 2, true, 'https://api.sabre.com', 30000, 3),
('hotelbeds-hotel', 'HotelBeds Hotel', 'hotel', 1, true, 'https://api.hotelbeds.com', 30000, 3),
('hotelbeds-activity', 'HotelBeds Activity', 'activity', 1, true, 'https://api.hotelbeds.com', 30000, 3)
ON CONFLICT (id) DO UPDATE SET
  enabled = EXCLUDED.enabled,
  priority = EXCLUDED.priority,
  timeout_ms = EXCLUDED.timeout_ms,
  retry_count = EXCLUDED.retry_count;

-- Initialize provider quotas
INSERT INTO provider_quotas (provider_id, service, quota_limit, quota_used, status) VALUES
('amadeus', 'api_calls', 1000, 0, 'healthy'),
('sabre', 'api_calls', 5000, 0, 'healthy'),
('hotelbeds', 'api_calls', 10000, 0, 'healthy')
ON CONFLICT (provider_id, service) DO UPDATE SET
  status = 'healthy',
  quota_used = 0;