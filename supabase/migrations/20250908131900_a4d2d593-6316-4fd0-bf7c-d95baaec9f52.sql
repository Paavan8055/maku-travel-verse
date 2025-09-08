-- Drop and recreate functions with proper search_path

-- Drop existing functions that need to be updated
DROP FUNCTION IF EXISTS public.emergency_cleanup_payments();
DROP FUNCTION IF EXISTS public.generate_invoice_number();
DROP FUNCTION IF EXISTS public.get_cleanup_monitoring();
DROP FUNCTION IF EXISTS public.get_cleanup_stats();

-- Recreate with proper signatures and search_path
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
        
        -- Check if already exists
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