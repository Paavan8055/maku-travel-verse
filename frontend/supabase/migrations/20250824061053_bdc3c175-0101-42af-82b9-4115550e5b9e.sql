-- Drop existing conflicting policies first
DROP POLICY IF EXISTS "Service role can manage webhook events" ON public.webhook_events;

-- Create the new policy with a different name
CREATE POLICY "Service role full access webhook events" ON public.webhook_events
FOR ALL USING (auth.role() = 'service_role');

-- Fix missing RLS policies for existing tables that were identified as security issues
-- Cities table - require authentication for access
DROP POLICY IF EXISTS "Authenticated users can view cities" ON public.cities;
CREATE POLICY "Authenticated users can view cities" ON public.cities
FOR SELECT USING (auth.uid() IS NOT NULL);

-- Dream destinations - require authentication
DROP POLICY IF EXISTS "Authenticated users can view dream destinations" ON public.dream_destinations;
CREATE POLICY "Authenticated users can view dream destinations" ON public.dream_destinations
FOR SELECT USING (auth.uid() IS NOT NULL);

-- Airports - require authentication for sensitive location data
DROP POLICY IF EXISTS "airports_public_read" ON public.airports;
CREATE POLICY "airports_authenticated_read" ON public.airports
FOR SELECT USING (auth.uid() IS NOT NULL);

-- Airlines - require authentication
DROP POLICY IF EXISTS "airlines_public_read" ON public.airlines;
CREATE POLICY "airlines_authenticated_read" ON public.airlines
FOR SELECT USING (auth.uid() IS NOT NULL);

-- Fix OTP expiry time (reduce from default long expiry to 10 minutes)
-- This needs to be done in Supabase Auth settings, but we can create a trigger to enforce it
CREATE OR REPLACE FUNCTION enforce_otp_expiry()
RETURNS TRIGGER AS $$
BEGIN
  -- This is a placeholder - actual OTP expiry is controlled by Supabase Auth settings
  -- Admins should set OTP expiry to 10 minutes (600 seconds) in Supabase dashboard
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create function to validate booking payment integrity
CREATE OR REPLACE FUNCTION validate_booking_payment_integrity(booking_uuid UUID)
RETURNS BOOLEAN 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  booking_record RECORD;
  payment_record RECORD;
  transaction_record RECORD;
BEGIN
  -- Get booking details
  SELECT * INTO booking_record 
  FROM public.bookings 
  WHERE id = booking_uuid;
  
  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;
  
  -- Check for corresponding payment
  SELECT * INTO payment_record 
  FROM public.payments 
  WHERE booking_id = booking_uuid
  ORDER BY created_at DESC 
  LIMIT 1;
  
  -- Check for transaction integrity record
  SELECT * INTO transaction_record 
  FROM public.booking_transactions 
  WHERE booking_id = booking_uuid;
  
  -- Validate integrity rules
  IF booking_record.status = 'confirmed' THEN
    -- Must have successful payment
    IF payment_record IS NULL OR payment_record.status != 'succeeded' THEN
      RETURN FALSE;
    END IF;
    
    -- Must have transaction record
    IF transaction_record IS NULL THEN
      RETURN FALSE;
    END IF;
    
    -- Payment amount must match booking amount
    IF payment_record.amount != booking_record.total_amount * 100 THEN -- Stripe uses cents
      RETURN FALSE;
    END IF;
  END IF;
  
  RETURN TRUE;
END;
$$;

-- Add constraint to ensure booking-payment integrity
ALTER TABLE public.bookings 
ADD CONSTRAINT check_booking_payment_integrity
CHECK (
  CASE 
    WHEN status IN ('confirmed', 'completed') THEN validate_booking_payment_integrity(id)
    ELSE TRUE
  END
);