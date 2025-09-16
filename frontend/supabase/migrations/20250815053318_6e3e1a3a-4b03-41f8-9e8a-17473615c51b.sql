-- Check if we need to disable email confirmations in auth settings
-- This query will help us understand the current auth configuration
SELECT 
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM auth.config 
      WHERE parameter = 'ENABLE_SIGNUP' AND value = 'true'
    ) THEN 'Signup enabled'
    ELSE 'Signup settings not found'
  END as signup_status;