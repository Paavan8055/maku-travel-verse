-- Fix provider health table by checking current structure and constraints
SELECT column_name, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'provider_health' 
ORDER BY ordinal_position;

-- Check existing constraints
SELECT constraint_name, constraint_type
FROM information_schema.table_constraints 
WHERE table_name = 'provider_health';

-- Add unique constraint on provider column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'provider_health' 
        AND constraint_type = 'UNIQUE' 
        AND constraint_name LIKE '%provider%'
    ) THEN
        ALTER TABLE provider_health ADD CONSTRAINT provider_health_provider_unique UNIQUE (provider);
    END IF;
END $$;

-- Now insert test health records with ON CONFLICT working properly
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