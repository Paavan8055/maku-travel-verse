-- Insert missing activity providers if they don't exist
INSERT INTO provider_configs (id, name, type, enabled, priority, circuit_breaker, health_score, response_time)
VALUES 
  ('amadeus-activity', 'Amadeus', 'activity', true, 1, '{"state": "closed", "timeout": 30000, "lastFailure": null, "failureCount": 0}', 100, 0),
  ('hotelbeds-activity', 'HotelBeds', 'activity', true, 2, '{"state": "closed", "timeout": 30000, "lastFailure": null, "failureCount": 0}', 100, 0)
ON CONFLICT (id) DO UPDATE SET
  enabled = EXCLUDED.enabled,
  circuit_breaker = EXCLUDED.circuit_breaker,
  updated_at = NOW();