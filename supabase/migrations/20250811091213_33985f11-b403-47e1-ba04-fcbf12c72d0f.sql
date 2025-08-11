-- Fix get_user_bookings: remove reference to non-existent b.guest_count and derive from booking_data
CREATE OR REPLACE FUNCTION public.get_user_bookings()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
    v_result JSON;
BEGIN
    SELECT json_agg(
        json_build_object(
            'id', b.id,
            'booking_reference', b.booking_reference,
            'status', b.status,
            'check_in_date', COALESCE((b.booking_data->>'checkInDate'), (b.booking_data->>'check_in_date')),
            'check_out_date', COALESCE((b.booking_data->>'checkOutDate'), (b.booking_data->>'check_out_date')),
            'guest_count', COALESCE((b.booking_data->>'guestCount')::integer, 1),
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
$function$;