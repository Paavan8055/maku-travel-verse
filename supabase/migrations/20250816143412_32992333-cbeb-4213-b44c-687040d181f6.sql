-- Implement missing RLS policies for security fixes

-- Enable RLS on partner_onboarding_payments table
ALTER TABLE public.partner_onboarding_payments ENABLE ROW LEVEL SECURITY;

-- Create policy for partner_onboarding_payments - partners can only see their own data
CREATE POLICY "Partners can view their own payment data" 
ON public.partner_onboarding_payments 
FOR SELECT 
USING (partner_id = auth.uid());

CREATE POLICY "Partners can insert their own payment data" 
ON public.partner_onboarding_payments 
FOR INSERT 
WITH CHECK (partner_id = auth.uid());

CREATE POLICY "Partners can update their own payment data" 
ON public.partner_onboarding_payments 
FOR UPDATE 
USING (partner_id = auth.uid());

-- Enable RLS on guest_booking_tokens table
ALTER TABLE public.guest_booking_tokens ENABLE ROW LEVEL SECURITY;

-- Create policy for guest_booking_tokens - only system can manage tokens
CREATE POLICY "Service role can manage guest tokens" 
ON public.guest_booking_tokens 
FOR ALL 
USING (auth.role() = 'service_role');

-- Allow token verification for guests with proper email verification
CREATE POLICY "Guests can verify tokens with email match" 
ON public.guest_booking_tokens 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.bookings b 
    WHERE b.id = booking_id 
    AND b.guest_email = guest_email_hash
  )
);

-- Enable RLS on booking_access_audit table
ALTER TABLE public.booking_access_audit ENABLE ROW LEVEL SECURITY;

-- Create policy for booking_access_audit - only authenticated users and system can create audit logs
CREATE POLICY "Authenticated users can create audit logs" 
ON public.booking_access_audit 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL OR auth.role() = 'service_role');

-- Admin and service role can view all audit logs
CREATE POLICY "Admin can view all audit logs" 
ON public.booking_access_audit 
FOR SELECT 
USING (
  auth.role() = 'service_role' OR 
  EXISTS (
    SELECT 1 FROM public.profiles p 
    WHERE p.user_id = auth.uid() 
    AND p.role = 'admin'
  )
);

-- Users can view audit logs for their own bookings
CREATE POLICY "Users can view audit logs for own bookings" 
ON public.booking_access_audit 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.bookings b 
    WHERE b.id = booking_id 
    AND b.user_id = auth.uid()
  )
);

-- Enable RLS on ai_training_bookings table
ALTER TABLE public.ai_training_bookings ENABLE ROW LEVEL SECURITY;

-- Create policy for ai_training_bookings - only system and admin can manage AI training data
CREATE POLICY "Service role can manage AI training data" 
ON public.ai_training_bookings 
FOR ALL 
USING (auth.role() = 'service_role');

CREATE POLICY "Admin can view AI training data" 
ON public.ai_training_bookings 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p 
    WHERE p.user_id = auth.uid() 
    AND p.role = 'admin'
  )
);

-- Secure AI training data insertion - only allow through proper anonymization process
CREATE POLICY "Restrict AI training data insertion" 
ON public.ai_training_bookings 
FOR INSERT 
WITH CHECK (
  auth.role() = 'service_role' AND
  -- Ensure data is properly anonymized by checking required fields are present
  anonymized_data IS NOT NULL AND
  original_booking_id IS NOT NULL AND
  anonymization_timestamp IS NOT NULL
);