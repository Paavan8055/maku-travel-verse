-- PHASE 1: PROVIDER CONFIGURATION CLEANUP (CORRECTED)
-- Clean up orphaned provider health records to fix 349 vs 7 discrepancy

-- Remove invalid provider health records (using correct column name)
DELETE FROM provider_health 
WHERE provider NOT IN (
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

-- Create missing test_results table for comprehensive testing
CREATE TABLE IF NOT EXISTS test_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  test_name TEXT NOT NULL,
  test_category TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('passed', 'failed', 'skipped')),
  execution_time_ms INTEGER,
  error_message TEXT,
  test_data JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  environment TEXT DEFAULT 'test'
);

-- Enable RLS for test_results
ALTER TABLE test_results ENABLE ROW LEVEL SECURITY;

-- Allow admins to manage test results
CREATE POLICY "Admins can manage test results" ON test_results
FOR ALL USING (is_secure_admin(auth.uid()));

-- Allow service role to insert test results
CREATE POLICY "Service role can insert test results" ON test_results
FOR INSERT WITH CHECK (auth.role() = 'service_role');

-- Clear any failed cleanup entries to reset automation
DELETE FROM cleanup_audit WHERE errors_encountered > 0 AND created_at > NOW() - INTERVAL '24 hours';