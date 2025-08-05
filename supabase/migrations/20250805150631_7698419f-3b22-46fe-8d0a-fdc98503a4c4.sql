-- Fix search path security warnings
DROP FUNCTION IF EXISTS public.cancel_booking(UUID);
DROP FUNCTION IF EXISTS public.get_user_bookings();

-- Recreate functions with secure search path
CREATE OR REPLACE FUNCTION public.cancel_booking(p_booking_id UUID)
RETURNS JSON AS $$
DECLARE
    v_booking RECORD;
    v_payment RECORD;
    v_result JSON;
BEGIN
    -- Check if booking exists and belongs to user
    SELECT * INTO v_booking 
    FROM public.bookings 
    WHERE id = p_booking_id AND user_id = auth.uid();
    
    IF NOT FOUND THEN
        RETURN json_build_object('success', false, 'message', 'Booking not found');
    END IF;
    
    -- Check if booking can be cancelled
    IF v_booking.status = 'cancelled' THEN
        RETURN json_build_object('success', false, 'message', 'Booking already cancelled');
    END IF;
    
    -- Update booking status
    UPDATE public.bookings 
    SET status = 'cancelled', updated_at = NOW() 
    WHERE id = p_booking_id;
    
    -- Update payment status to refunded if payment was successful
    UPDATE public.payments 
    SET status = 'refunded', updated_at = NOW() 
    WHERE booking_id = p_booking_id AND status = 'succeeded';
    
    RETURN json_build_object('success', true, 'message', 'Booking cancelled successfully');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

CREATE OR REPLACE FUNCTION public.get_user_bookings()
RETURNS JSON AS $$
DECLARE
    v_result JSON;
BEGIN
    SELECT json_agg(
        json_build_object(
            'id', b.id,
            'booking_reference', b.booking_reference,
            'status', b.status,
            'check_in_date', b.check_in_date,
            'check_out_date', b.check_out_date,
            'guest_count', b.guest_count,
            'total_amount', b.total_amount,
            'currency', b.currency,
            'booking_data', b.booking_data,
            'created_at', b.created_at,
            'updated_at', b.updated_at,
            'items', (
                SELECT json_agg(
                    json_build_object(
                        'id', bi.id,
                        'item_type', bi.item_type,
                        'item_details', bi.item_details,
                        'quantity', bi.quantity,
                        'unit_price', bi.unit_price,
                        'total_price', bi.total_price
                    )
                )
                FROM public.booking_items bi
                WHERE bi.booking_id = b.id
            ),
            'latest_payment', (
                SELECT json_build_object(
                    'id', p.id,
                    'stripe_payment_intent_id', p.stripe_payment_intent_id,
                    'amount', p.amount,
                    'currency', p.currency,
                    'status', p.status,
                    'created_at', p.created_at
                )
                FROM public.payments p
                WHERE p.booking_id = b.id
                ORDER BY p.created_at DESC
                LIMIT 1
            )
        )
        ORDER BY b.created_at DESC
    ) INTO v_result
    FROM public.bookings b
    WHERE b.user_id = auth.uid();
    
    RETURN COALESCE(v_result, '[]'::json);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';