-- Enable leaked password protection in auth configuration
UPDATE auth.config SET leaked_password_protection = true WHERE instance_id = auth.get_instance_id();

-- Set OTP expiry to recommended 1 hour (3600 seconds)
UPDATE auth.config SET otp_exp = 3600 WHERE instance_id = auth.get_instance_id();