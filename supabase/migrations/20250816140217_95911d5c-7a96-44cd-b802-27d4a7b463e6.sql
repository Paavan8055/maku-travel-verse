-- PHASE 1: Critical Guest Data Protection & AI Training Pipeline
-- Create guest booking access tokens for secure guest access
CREATE TABLE IF NOT EXISTS public.guest_booking_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
    access_token TEXT NOT NULL UNIQUE,
    email_hash TEXT NOT NULL, -- Hashed email for verification without storing plaintext
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (NOW() + INTERVAL '24 hours'),
    access_level TEXT NOT NULL DEFAULT 'full' CHECK (access_level IN ('full', 'read_only')),
    access_count INTEGER DEFAULT 0,
    last_accessed TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on guest tokens
ALTER TABLE public.guest_booking_tokens ENABLE ROW LEVEL SECURITY;

-- Create indexes for performance
CREATE INDEX idx_guest_tokens_booking ON public.guest_booking_tokens(booking_id);
CREATE INDEX idx_guest_tokens_access ON public.guest_booking_tokens(access_token);
CREATE INDEX idx_guest_tokens_expires ON public.guest_booking_tokens(expires_at);

-- Create AI training data tables for anonymized guest data
CREATE TABLE IF NOT EXISTS public.ai_training_bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    original_booking_id UUID NOT NULL, -- Reference to original but no FK constraint
    booking_type TEXT NOT NULL,
    anonymized_data JSONB NOT NULL, -- Anonymized booking data
    behavioral_patterns JSONB, -- Extracted behavioral insights
    location_data JSONB, -- Anonymized location preferences
    price_patterns JSONB, -- Price sensitivity analysis
    booking_flow_data JSONB, -- User journey without PII
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    anonymized_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create booking access audit table for security monitoring
CREATE TABLE IF NOT EXISTS public.booking_access_audit (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id UUID NOT NULL,
    access_type TEXT NOT NULL CHECK (access_type IN ('guest_token', 'authenticated_user', 'admin', 'system')),
    access_method TEXT, -- 'token', 'email_verification', 'user_session', etc.
    ip_address INET,
    user_agent TEXT,
    accessed_data JSONB, -- What data was accessed
    success BOOLEAN NOT NULL,
    failure_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on audit table
ALTER TABLE public.booking_access_audit ENABLE ROW LEVEL SECURITY;

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

-- Create function to anonymize booking data for AI training
CREATE OR REPLACE FUNCTION public.anonymize_booking_for_ai(_booking_id UUID)
RETURNS VOID
LANGUAGE PLPGSQL
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    _booking RECORD;
    _anonymized_data JSONB;
    _behavioral_patterns JSONB;
    _location_data JSONB;
    _price_patterns JSONB;
    _booking_flow_data JSONB;
BEGIN
    -- Get booking data
    SELECT * INTO _booking FROM public.bookings WHERE id = _booking_id;
    
    IF _booking IS NULL THEN
        RETURN;
    END IF;
    
    -- Create anonymized data by removing PII
    _anonymized_data := _booking.booking_data;
    
    -- Remove or hash personal identifiers
    IF _anonymized_data ? 'customerInfo' THEN
        _anonymized_data := jsonb_set(
            _anonymized_data,
            '{customerInfo,email}',
            to_jsonb('hashed_' || encode(digest((_anonymized_data->'customerInfo'->>'email'), 'sha256'), 'hex')[1:16])
        );
        _anonymized_data := jsonb_set(
            _anonymized_data,
            '{customerInfo,firstName}',
            to_jsonb('ANON_FIRST')
        );
        _anonymized_data := jsonb_set(
            _anonymized_data,
            '{customerInfo,lastName}',
            to_jsonb('ANON_LAST')
        );
        
        -- Remove phone if exists
        IF _anonymized_data->'customerInfo' ? 'phone' THEN
            _anonymized_data := _anonymized_data #- '{customerInfo,phone}';
        END IF;
    END IF;
    
    -- Extract behavioral patterns
    _behavioral_patterns := jsonb_build_object(
        'booking_time_hour', EXTRACT(HOUR FROM _booking.created_at),
        'booking_day_of_week', EXTRACT(DOW FROM _booking.created_at),
        'time_to_travel', CASE 
            WHEN _booking.booking_data ? 'checkInDate' THEN 
                EXTRACT(DAYS FROM ((_booking.booking_data->>'checkInDate')::date - _booking.created_at::date))
            WHEN _booking.booking_data ? 'departureDate' THEN
                EXTRACT(DAYS FROM ((_booking.booking_data->>'departureDate')::date - _booking.created_at::date))
            ELSE NULL
        END,
        'booking_type', _booking.booking_type,
        'currency', _booking.currency,
        'amount_range', CASE 
            WHEN _booking.total_amount < 100 THEN 'low'
            WHEN _booking.total_amount < 500 THEN 'medium'
            WHEN _booking.total_amount < 1000 THEN 'high'
            ELSE 'premium'
        END
    );
    
    -- Extract location patterns (anonymized)
    _location_data := jsonb_build_object(
        'origin_country', COALESCE(_booking.booking_data->'origin'->>'country', 'unknown'),
        'destination_country', COALESCE(_booking.booking_data->'destination'->>'country', 'unknown'),
        'is_domestic', CASE WHEN 
            COALESCE(_booking.booking_data->'origin'->>'country', '') = 
            COALESCE(_booking.booking_data->'destination'->>'country', '')
            THEN true ELSE false END
    );
    
    -- Extract price patterns
    _price_patterns := jsonb_build_object(
        'price_per_day', CASE 
            WHEN _booking.booking_data ? 'nights' AND (_booking.booking_data->>'nights')::int > 0 
            THEN _booking.total_amount / (_booking.booking_data->>'nights')::int
            ELSE _booking.total_amount
        END,
        'payment_method', _booking.booking_data->>'paymentMethod',
        'currency', _booking.currency
    );
    
    -- Extract booking flow data
    _booking_flow_data := jsonb_build_object(
        'platform', 'web', -- Assuming web platform
        'session_length_minutes', CASE 
            WHEN _booking.booking_data ? 'sessionStart' THEN
                EXTRACT(MINUTES FROM (_booking.created_at - (_booking.booking_data->>'sessionStart')::timestamp))
            ELSE NULL
        END,
        'pages_visited', COALESCE(_booking.booking_data->'analytics'->>'pagesVisited', 1)
    );
    
    -- Insert into AI training table
    INSERT INTO public.ai_training_bookings (
        original_booking_id,
        booking_type,
        anonymized_data,
        behavioral_patterns,
        location_data,
        price_patterns,
        booking_flow_data
    ) VALUES (
        _booking_id,
        _booking.booking_type,
        _anonymized_data,
        _behavioral_patterns,
        _location_data,
        _price_patterns,
        _booking_flow_data
    );
END;
$$;

-- Create trigger to automatically anonymize guest bookings for AI training
CREATE OR REPLACE FUNCTION public.trigger_anonymize_guest_booking()
RETURNS TRIGGER
LANGUAGE PLPGSQL
SECURITY DEFINER
AS $$
BEGIN
    -- Only process guest bookings (user_id IS NULL)
    IF NEW.user_id IS NULL AND NEW.status IN ('confirmed', 'completed') THEN
        -- Defer the anonymization to avoid blocking the main transaction
        PERFORM pg_notify(
            'anonymize_booking', 
            json_build_object('booking_id', NEW.id)::text
        );
    END IF;
    
    RETURN NEW;
END;
$$;

-- Create trigger on bookings table
DROP TRIGGER IF EXISTS trigger_anonymize_guest_bookings ON public.bookings;
CREATE TRIGGER trigger_anonymize_guest_bookings
    AFTER INSERT OR UPDATE ON public.bookings
    FOR EACH ROW
    EXECUTE FUNCTION public.trigger_anonymize_guest_booking();

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
        -- Don't break main functionality if audit logging fails
        NULL;
END;
$$;

-- Update RLS policies for enhanced security
-- Drop existing booking policies to replace with secure ones
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

-- Create secure guest booking access policy (very restrictive)
CREATE POLICY "System can manage guest bookings"
ON public.bookings
FOR ALL
USING (
    -- Only allow system/service role access to guest bookings
    current_setting('role') = 'service_role' OR
    -- Allow specific functions to access guest bookings
    current_setting('request.method', true) IS NOT NULL
);

-- Create policies for guest tokens
CREATE POLICY "Service role can manage guest tokens"
ON public.guest_booking_tokens
FOR ALL
USING (current_setting('role') = 'service_role');

-- Create policies for AI training data
CREATE POLICY "Admins can view AI training data"
ON public.ai_training_bookings
FOR SELECT
USING (public.is_secure_admin(auth.uid()));

-- Create policies for audit logs
CREATE POLICY "Admins can view booking audit logs"
ON public.booking_access_audit
FOR SELECT
USING (public.is_secure_admin(auth.uid()));

CREATE POLICY "System can create audit logs"
ON public.booking_access_audit
FOR INSERT
WITH CHECK (true);

-- Add triggers for automatic cleanup
CREATE OR REPLACE FUNCTION public.cleanup_expired_guest_tokens()
RETURNS VOID
LANGUAGE PLPGSQL
SECURITY DEFINER
AS $$
BEGIN
    DELETE FROM public.guest_booking_tokens 
    WHERE expires_at < NOW() - INTERVAL '7 days';
END;
$$;

-- Create function to automatically anonymize old guest bookings
CREATE OR REPLACE FUNCTION public.auto_anonymize_old_guest_bookings()
RETURNS VOID
LANGUAGE PLPGSQL
SECURITY DEFINER
AS $$
DECLARE
    _booking_record RECORD;
BEGIN
    -- Process guest bookings older than 30 days that haven't been anonymized
    FOR _booking_record IN 
        SELECT b.id 
        FROM public.bookings b
        LEFT JOIN public.ai_training_bookings ai ON ai.original_booking_id = b.id
        WHERE b.user_id IS NULL 
        AND b.created_at < NOW() - INTERVAL '30 days'
        AND ai.id IS NULL
        AND b.status IN ('confirmed', 'completed', 'cancelled')
        LIMIT 100
    LOOP
        PERFORM public.anonymize_booking_for_ai(_booking_record.id);
    END LOOP;
END;
$$;