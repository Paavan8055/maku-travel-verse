-- First, let's check what provider configurations actually exist and update them properly
-- Enable Amadeus providers using the correct table structure
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

-- Reset provider health data using INSERT without ON CONFLICT since no unique constraint exists
DELETE FROM provider_health 
WHERE provider IN ('amadeus', 'amadeus-flight', 'amadeus-hotel');

-- Insert fresh health records for enabled Amadeus providers
INSERT INTO provider_health (provider, status, last_checked, response_time_ms, error_count, error_message)
VALUES 
  ('amadeus', 'healthy', now(), 200, 0, null),
  ('amadeus-flight', 'healthy', now(), 200, 0, null),
  ('amadeus-hotel', 'healthy', now(), 200, 0, null);