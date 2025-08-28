-- Fix provider health constraint issue by dropping and recreating with correct constraint
-- First check the current constraint
SELECT constraint_name, check_clause 
FROM information_schema.check_constraints 
WHERE constraint_name LIKE '%provider_health%';

-- Drop the problematic constraint if it exists
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.check_constraints WHERE constraint_name = 'provider_health_status_check') THEN
        ALTER TABLE provider_health DROP CONSTRAINT provider_health_status_check;
    END IF;
END $$;

-- Add proper constraint for status values
ALTER TABLE provider_health 
ADD CONSTRAINT provider_health_status_check 
CHECK (status IN ('healthy', 'degraded', 'unhealthy'));

-- Clean up any existing invalid health records
DELETE FROM provider_health WHERE status NOT IN ('healthy', 'degraded', 'unhealthy');

-- Insert some test health records for providers
INSERT INTO provider_health (provider, status, last_checked, response_time_ms, failure_count, error_count)
VALUES 
  ('amadeus-flight', 'healthy', NOW(), 150, 0, 0),
  ('amadeus-hotel', 'healthy', NOW(), 200, 0, 0),
  ('amadeus-activity', 'healthy', NOW(), 180, 0, 0),
  ('sabre-flight', 'degraded', NOW(), 800, 1, 1),
  ('sabre-hotel', 'degraded', NOW(), 750, 1, 1),
  ('hotelbeds-hotel', 'unhealthy', NOW(), 5000, 3, 3),
  ('hotelbeds-activity', 'unhealthy', NOW(), 4500, 2, 2)
ON CONFLICT (provider) DO UPDATE SET
  status = EXCLUDED.status,
  last_checked = EXCLUDED.last_checked,
  response_time_ms = EXCLUDED.response_time_ms,
  failure_count = EXCLUDED.failure_count,
  error_count = EXCLUDED.error_count;