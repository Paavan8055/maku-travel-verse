-- Create RPC function to increment processing attempts
CREATE OR REPLACE FUNCTION increment_processing_attempts(event_id text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.webhook_events 
  SET processing_attempts = processing_attempts + 1
  WHERE stripe_event_id = event_id;
END;
$$;

-- Fix function search paths for security compliance
ALTER FUNCTION public.validate_booking_payment_integrity(uuid) SET search_path = public;
ALTER FUNCTION public.enforce_otp_expiry() SET search_path = public;
ALTER FUNCTION public.cleanup_old_health_logs() SET search_path = public;