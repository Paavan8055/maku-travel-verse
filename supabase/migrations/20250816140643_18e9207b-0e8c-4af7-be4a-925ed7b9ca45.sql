-- PHASE 2: Add security functions and RLS policies
-- Create secure function to generate guest access tokens
CREATE OR REPLACE FUNCTION public.generate_guest_booking_token(
    _booking_id UUID,
    _email TEXT
)
RETURNS TEXT
LANGUAGE PLPGSQL
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    _token TEXT;
    _email_hash TEXT;
    _booking_exists BOOLEAN;
BEGIN
    -- Verify booking exists and is a guest booking
    SELECT EXISTS(
        SELECT 1 FROM public.bookings 
        WHERE id = _booking_id 
        AND user_id IS NULL
        AND booking_data->'customerInfo'->>'email' = _email
    ) INTO _booking_exists;
    
    IF NOT _booking_exists THEN
        RAISE EXCEPTION 'Booking not found or access denied';
    END IF;
    
    -- Generate secure token and hash email
    _token := encode(gen_random_bytes(32), 'base64url');
    _email_hash := encode(digest(_email || 'booking_salt_' || _booking_id::text, 'sha256'), 'hex');
    
    -- Insert token record
    INSERT INTO public.guest_booking_tokens (
        booking_id,
        access_token,
        email_hash,
        expires_at,
        access_level
    ) VALUES (
        _booking_id,
        _token,
        _email_hash,
        NOW() + INTERVAL '24 hours',
        'full'
    );
    
    RETURN _token;
END;
$$;

-- Create function to verify guest access
CREATE OR REPLACE FUNCTION public.verify_guest_booking_access(
    _booking_id UUID,
    _email TEXT,
    _token TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE PLPGSQL
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    _email_hash TEXT;
    _token_valid BOOLEAN := FALSE;
    _email_matches BOOLEAN := FALSE;
BEGIN
    -- Hash the provided email
    _email_hash := encode(digest(_email || 'booking_salt_' || _booking_id::text, 'sha256'), 'hex');
    
    -- Check if token is provided and valid
    IF _token IS NOT NULL THEN
        SELECT EXISTS(
            SELECT 1 FROM public.guest_booking_tokens 
            WHERE booking_id = _booking_id 
            AND access_token = _token
            AND email_hash = _email_hash
            AND expires_at > NOW()
        ) INTO _token_valid;
        
        -- Update access tracking
        IF _token_valid THEN
            UPDATE public.guest_booking_tokens 
            SET access_count = access_count + 1,
                last_accessed = NOW()
            WHERE booking_id = _booking_id AND access_token = _token;
        END IF;
    END IF;
    
    -- Check if email matches booking (fallback verification)
    SELECT EXISTS(
        SELECT 1 FROM public.bookings 
        WHERE id = _booking_id 
        AND user_id IS NULL
        AND booking_data->'customerInfo'->>'email' = _email
    ) INTO _email_matches;
    
    RETURN _token_valid OR _email_matches;
END;
$$;

-- Create audit logging function
CREATE OR REPLACE FUNCTION public.log_booking_access(
    _booking_id UUID,
    _access_type TEXT,
    _access_method TEXT DEFAULT NULL,
    _ip_address INET DEFAULT NULL,
    _user_agent TEXT DEFAULT NULL,
    _accessed_data JSONB DEFAULT NULL,
    _success BOOLEAN DEFAULT TRUE,
    _failure_reason TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE PLPGSQL
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
    INSERT INTO public.booking_access_audit (
        booking_id,
        access_type,
        access_method,
        ip_address,
        user_agent,
        accessed_data,
        success,
        failure_reason
    ) VALUES (
        _booking_id,
        _access_type,
        _access_method,
        _ip_address,
        _user_agent,
        _accessed_data,
        _success,
        _failure_reason
    );
EXCEPTION
    WHEN OTHERS THEN
        NULL;
END;
$$;

-- Create RLS policies for guest tokens
CREATE POLICY "Service role can manage guest tokens"
ON public.guest_booking_tokens
FOR ALL
USING (current_setting('role') = 'service_role');

-- Create RLS policies for AI training data
CREATE POLICY "Admins can view AI training data"
ON public.ai_training_bookings
FOR SELECT
USING (public.is_secure_admin(auth.uid()));

CREATE POLICY "System can insert AI training data"
ON public.ai_training_bookings
FOR INSERT
WITH CHECK (true);

-- Create RLS policies for audit logs
CREATE POLICY "Admins can view booking audit logs"
ON public.booking_access_audit
FOR SELECT
USING (public.is_secure_admin(auth.uid()));

CREATE POLICY "System can create audit logs"
ON public.booking_access_audit
FOR INSERT
WITH CHECK (true);

-- Update booking policies for enhanced security
-- Drop existing policies and create new secure ones
DROP POLICY IF EXISTS "Users can view their own bookings" ON public.bookings;
DROP POLICY IF EXISTS "Users can create their own bookings" ON public.bookings;
DROP POLICY IF EXISTS "Users can update their own bookings" ON public.bookings;

-- Create ultra-secure booking policies
CREATE POLICY "Authenticated users can view their own bookings"
ON public.bookings
FOR SELECT
USING (
    auth.uid() IS NOT NULL AND auth.uid() = user_id
);

CREATE POLICY "Authenticated users can create their own bookings"
ON public.bookings
FOR INSERT
WITH CHECK (
    auth.uid() IS NOT NULL AND auth.uid() = user_id
);

CREATE POLICY "Authenticated users can update their own bookings"
ON public.bookings
FOR UPDATE
USING (
    auth.uid() IS NOT NULL AND auth.uid() = user_id
);

-- Allow service role to manage all bookings (for edge functions)
CREATE POLICY "Service role can manage all bookings"
ON public.bookings
FOR ALL
USING (current_setting('role') = 'service_role');

-- Enable RLS on ai_training_bookings table
ALTER TABLE public.ai_training_bookings ENABLE ROW LEVEL SECURITY;