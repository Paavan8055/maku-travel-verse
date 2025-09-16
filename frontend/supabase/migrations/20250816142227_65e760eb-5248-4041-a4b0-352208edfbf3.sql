-- Fix Function Search Path Security Issues
-- Update functions to include proper search_path protection

-- Fix trigger_anonymize_guest_booking function
CREATE OR REPLACE FUNCTION public.trigger_anonymize_guest_booking()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
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
$function$;

-- Fix cleanup_expired_guest_tokens function
CREATE OR REPLACE FUNCTION public.cleanup_expired_guest_tokens()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
BEGIN
    DELETE FROM public.guest_booking_tokens 
    WHERE expires_at < NOW() - INTERVAL '7 days';
END;
$function$;

-- Fix auto_anonymize_old_guest_bookings function
CREATE OR REPLACE FUNCTION public.auto_anonymize_old_guest_bookings()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
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
$function$;