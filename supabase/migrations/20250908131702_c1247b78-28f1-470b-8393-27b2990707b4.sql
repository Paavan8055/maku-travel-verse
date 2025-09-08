-- Final fix for remaining functions with search path issues

-- Update remaining functions that likely need search_path
CREATE OR REPLACE FUNCTION public.emergency_cleanup_payments()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public', 'pg_catalog'
AS $$
BEGIN
    -- Clean up orphaned payments older than 24 hours
    DELETE FROM public.payments 
    WHERE booking_id NOT IN (SELECT id FROM public.bookings)
    AND created_at < NOW() - INTERVAL '24 hours';
    
    -- Clean up failed payments older than 7 days
    DELETE FROM public.payments
    WHERE status IN ('failed', 'cancelled')
    AND created_at < NOW() - INTERVAL '7 days';
END;
$$;

CREATE OR REPLACE FUNCTION public.generate_invoice_number()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public', 'pg_catalog'
AS $$
DECLARE
    invoice_number text;
    exists boolean;
BEGIN
    LOOP
        -- Generate invoice number: INV-YYYY-NNNNNN
        invoice_number := 'INV-' || 
                         EXTRACT(YEAR FROM CURRENT_DATE)::text || 
                         '-' || 
                         LPAD(floor(random() * 1000000)::text, 6, '0');
        
        -- Check if already exists (assuming we have an invoices table)
        SELECT EXISTS(
            SELECT 1 FROM public.bookings 
            WHERE booking_data->>'invoice_number' = invoice_number
        ) INTO exists;
        
        IF NOT exists THEN
            RETURN invoice_number;
        END IF;
    END LOOP;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_cleanup_monitoring()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public', 'pg_catalog'
AS $$
DECLARE
    result json;
BEGIN
    -- Only admins can access cleanup monitoring
    IF NOT is_secure_admin(auth.uid()) THEN
        RETURN json_build_object('error', 'Access denied');
    END IF;
    
    SELECT json_build_object(
        'guest_bookings_to_cleanup', (
            SELECT COUNT(*) FROM public.bookings 
            WHERE user_id IS NULL 
            AND created_at < NOW() - INTERVAL '90 days'
            AND status IN ('cancelled', 'completed')
        ),
        'expired_tokens', (
            SELECT COUNT(*) FROM public.guest_booking_tokens 
            WHERE expires_at < NOW() - INTERVAL '7 days'
        ),
        'old_logs', (
            SELECT COUNT(*) FROM public.system_logs 
            WHERE created_at < NOW() - INTERVAL '90 days'
        ),
        'last_cleanup', NOW()
    ) INTO result;
    
    RETURN result;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_cleanup_stats()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public', 'pg_catalog'
AS $$
DECLARE
    result json;
BEGIN
    -- Only admins can access cleanup stats
    IF NOT is_secure_admin(auth.uid()) THEN
        RETURN json_build_object('error', 'Access denied');
    END IF;
    
    SELECT json_build_object(
        'total_bookings', (SELECT COUNT(*) FROM public.bookings),
        'guest_bookings', (SELECT COUNT(*) FROM public.bookings WHERE user_id IS NULL),
        'old_guest_bookings', (
            SELECT COUNT(*) FROM public.bookings 
            WHERE user_id IS NULL 
            AND created_at < NOW() - INTERVAL '90 days'
        ),
        'active_tokens', (
            SELECT COUNT(*) FROM public.guest_booking_tokens 
            WHERE expires_at > NOW()
        ),
        'expired_tokens', (
            SELECT COUNT(*) FROM public.guest_booking_tokens 
            WHERE expires_at < NOW()
        )
    ) INTO result;
    
    RETURN result;
END;
$$;