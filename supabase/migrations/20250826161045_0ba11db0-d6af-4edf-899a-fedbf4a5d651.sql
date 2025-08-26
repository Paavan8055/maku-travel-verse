-- Phase 1: Reset all fake quota data and restore provider priorities

-- Clear all fake quota data
DELETE FROM provider_quotas;

-- Reset provider priorities to normal levels
UPDATE provider_configs SET 
  priority = CASE 
    WHEN id = 'sabre-flight' THEN 100
    WHEN id = 'amadeus-flight' THEN 200
    WHEN id = 'sabre-hotel' THEN 150
    WHEN id = 'hotelbeds-hotel' THEN 250
    WHEN id = 'amadeus-hotel' THEN 300
    WHEN id = 'hotelbeds-activity' THEN 350
    WHEN id = 'amadeus-activity' THEN 400
    ELSE priority
  END,
  enabled = true,
  updated_at = now()
WHERE id IN ('sabre-flight', 'amadeus-flight', 'sabre-hotel', 'hotelbeds-hotel', 'amadeus-hotel', 'hotelbeds-activity', 'amadeus-activity');

-- Add proper quota tracking columns if they don't exist
ALTER TABLE provider_quotas ADD COLUMN IF NOT EXISTS error_type text;
ALTER TABLE provider_quotas ADD COLUMN IF NOT EXISTS is_actual_quota_limit boolean DEFAULT false;