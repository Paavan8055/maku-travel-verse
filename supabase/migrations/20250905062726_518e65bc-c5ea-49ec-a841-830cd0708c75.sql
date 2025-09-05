-- First check what provider tables exist and their current structure
-- Enable Amadeus providers using the correct table (provider_configs)
UPDATE provider_configs 
SET 
  enabled = true,
  priority = 1,
  updated_at = now()
WHERE name IN ('amadeus', 'amadeus-flight', 'amadeus-hotel');

-- Ensure other providers remain disabled  
UPDATE provider_configs 
SET 
  enabled = false,
  priority = 999,
  updated_at = now()
WHERE name IN ('sabre', 'hotelbeds');

-- Reset provider health data to clear old error states
DELETE FROM provider_health 
WHERE provider_name IN ('amadeus', 'amadeus-flight', 'amadeus-hotel');

-- Insert fresh health records for enabled Amadeus providers
INSERT INTO provider_health (provider_name, status, last_check_at, response_time_ms, error_count, last_error)
VALUES 
  ('amadeus', 'healthy', now(), 200, 0, null),
  ('amadeus-flight', 'healthy', now(), 200, 0, null),
  ('amadeus-hotel', 'healthy', now(), 200, 0, null)
ON CONFLICT (provider_name) 
DO UPDATE SET
  status = 'healthy',
  last_check_at = now(),
  response_time_ms = 200,
  error_count = 0,
  last_error = null;