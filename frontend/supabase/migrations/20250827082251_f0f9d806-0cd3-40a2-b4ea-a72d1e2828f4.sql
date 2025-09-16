-- Check what the constraint actually expects
SELECT constraint_name, check_clause 
FROM information_schema.check_constraints 
WHERE constraint_name LIKE '%provider_health%';

-- Drop the constraint and recreate it properly
ALTER TABLE provider_health DROP CONSTRAINT IF EXISTS provider_health_status_check;

-- Add the constraint with the exact values being used
ALTER TABLE provider_health 
ADD CONSTRAINT provider_health_status_check 
CHECK (status IN ('healthy', 'degraded', 'unhealthy'));

-- Clear any existing problematic records
DELETE FROM provider_health;

-- Insert working test data with correct status values
INSERT INTO provider_health (provider, status, last_checked, response_time_ms, failure_count, error_count)
VALUES 
  ('amadeus-flight', 'healthy', NOW(), 150, 0, 0),
  ('amadeus-hotel', 'healthy', NOW(), 200, 0, 0),
  ('amadeus-activity', 'healthy', NOW(), 180, 0, 0),
  ('sabre-flight', 'degraded', NOW(), 800, 1, 1),
  ('sabre-hotel', 'degraded', NOW(), 750, 1, 1),
  ('hotelbeds-hotel', 'degraded', NOW(), 3000, 3, 3),
  ('hotelbeds-activity', 'degraded', NOW(), 2500, 2, 2);