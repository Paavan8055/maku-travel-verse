-- Fix the remaining functions that need proper search_path settings

-- These are likely the remaining functions causing warnings
CREATE OR REPLACE FUNCTION public.calculate_fraud_risk_score(_booking_id uuid)
RETURNS numeric
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public', 'pg_catalog'
AS $$
DECLARE
    risk_score numeric := 0;
    booking_info record;
BEGIN
    -- Get booking information
    SELECT * INTO booking_info
    FROM public.bookings 
    WHERE id = _booking_id;
    
    IF NOT FOUND THEN
        RETURN 0;
    END IF;
    
    -- Add various risk factors (simplified)
    -- Payment method risk
    IF booking_info.booking_data->>'paymentMethod' = 'cryptocurrency' THEN
        risk_score := risk_score + 30;
    END IF;
    
    -- Guest booking risk
    IF booking_info.user_id IS NULL THEN
        risk_score := risk_score + 20;
    END IF;
    
    -- High amount risk
    IF booking_info.total_amount > 5000 THEN
        risk_score := risk_score + 15;
    END IF;
    
    RETURN LEAST(risk_score, 100);
END;
$$;

CREATE OR REPLACE FUNCTION public.cancel_booking(_booking_id uuid, _reason text DEFAULT 'User cancellation')
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public', 'pg_catalog'
AS $$
DECLARE
    booking_record record;
BEGIN
    -- Get booking information
    SELECT * INTO booking_record
    FROM public.bookings 
    WHERE id = _booking_id;
    
    IF NOT FOUND THEN
        RETURN false;
    END IF;
    
    -- Check if user has permission to cancel
    IF booking_record.user_id IS NOT NULL AND auth.uid() != booking_record.user_id AND NOT is_secure_admin(auth.uid()) THEN
        RETURN false;
    END IF;
    
    -- Update booking status
    UPDATE public.bookings
    SET 
        status = 'cancelled',
        updated_at = NOW(),
        booking_data = booking_data || jsonb_build_object('cancellation_reason', _reason, 'cancelled_at', NOW())
    WHERE id = _booking_id;
    
    -- Log the cancellation
    PERFORM log_security_event('booking_cancelled', 'booking', _booking_id::text, true, NULL, jsonb_build_object('reason', _reason));
    
    RETURN true;
END;
$$;