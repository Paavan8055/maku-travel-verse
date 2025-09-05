-- Enable Amadeus providers and set proper priorities
UPDATE search_providers 
SET 
  enabled = true,
  priority = 1,
  updated_at = now()
WHERE provider_name IN ('amadeus', 'amadeus-flight', 'amadeus-hotel');

-- Ensure Sabre and HotelBeds remain disabled
UPDATE search_providers 
SET 
  enabled = false,
  priority = 999,
  updated_at = now()
WHERE provider_name IN ('sabre', 'hotelbeds');

-- Reset provider health data to clear old error states
DELETE FROM provider_health_monitor 
WHERE provider_name IN ('amadeus', 'amadeus-flight', 'amadeus-hotel');

-- Insert fresh health records for enabled Amadeus providers
INSERT INTO provider_health_monitor (provider_name, health_score, last_success, circuit_breaker_state)
VALUES 
  ('amadeus', 100, now(), 'closed'),
  ('amadeus-flight', 100, now(), 'closed'),
  ('amadeus-hotel', 100, now(), 'closed');