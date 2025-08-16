-- PHASE 3: Add AI training anonymization function
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
    _email_hash TEXT;
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
        -- Hash email for analytics while preserving uniqueness
        _email_hash := substring(encode(digest((_anonymized_data->'customerInfo'->>'email'), 'sha256'), 'hex'), 1, 16);
        
        _anonymized_data := jsonb_set(
            _anonymized_data,
            '{customerInfo,email}',
            to_jsonb('hashed_' || _email_hash)
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
        'platform', 'web',
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

-- Create trigger to automatically anonymize guest bookings
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

-- Create cleanup functions
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