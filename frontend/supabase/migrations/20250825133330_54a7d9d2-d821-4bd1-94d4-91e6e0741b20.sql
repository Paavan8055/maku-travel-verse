-- Fix remaining Supabase security warnings

-- 1. Set more secure OTP expiry (currently too long)
UPDATE auth.config 
SET value = '300' -- 5 minutes instead of default
WHERE parameter = 'otp_expiry';

-- Also update SMS OTP expiry if it exists
UPDATE auth.config 
SET value = '300' -- 5 minutes
WHERE parameter = 'sms_otp_exp';

-- 2. Enable leaked password protection
UPDATE auth.config 
SET value = 'true'
WHERE parameter = 'enable_leaked_password_protection';

-- Insert if doesn't exist
INSERT INTO auth.config (parameter, value)
VALUES ('enable_leaked_password_protection', 'true')
ON CONFLICT (parameter) DO UPDATE SET value = 'true';