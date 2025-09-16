-- Fix provider configurations to enable Amadeus providers
UPDATE provider_configs 
SET enabled = true 
WHERE id LIKE 'amadeus%' AND enabled = false;

-- Insert missing Amadeus providers if they don't exist
INSERT INTO provider_configs (id, name, type, enabled, priority, base_url, circuit_breaker_state, health_score, response_time)
VALUES 
  ('amadeus-hotel', 'amadeus', 'hotel', true, 1, 'https://api.amadeus.com', 'closed', 100, 0),
  ('amadeus-activity', 'amadeus', 'activity', true, 1, 'https://api.amadeus.com', 'closed', 100, 0),
  ('amadeus-flight', 'amadeus', 'flight', true, 1, 'https://api.amadeus.com', 'closed', 100, 0)
ON CONFLICT (id) DO UPDATE SET
  enabled = true,
  priority = 1,
  base_url = EXCLUDED.base_url;