-- Fix provider_health check constraint issue
-- First, let's see what the check constraint expects
SELECT constraint_name, check_clause 
FROM information_schema.check_constraints 
WHERE constraint_name = 'provider_health_status_check';

-- Check the current provider_health table structure
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'provider_health' 
ORDER BY ordinal_position;