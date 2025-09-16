
-- Fix the get_user_bookings function to handle JSON operations correctly
CREATE OR REPLACE FUNCTION public.get_user_bookings()
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    v_result JSON;
    v_user_id UUID;
    v_user_email TEXT;
BEGIN
    -- Get the current user ID
    v_user_id := auth.uid();
    
    -- If no user is authenticated, return empty array
    IF v_user_id IS NULL THEN
        RETURN '[]'::json;
    END IF;
    
    -- Get user email for guest booking lookup
    SELECT email INTO v_user_email 
    FROM auth.users 
    WHERE id = v_user_id;
    
    SELECT json_agg(
        json_build_object(
            'id', b.id,
            'booking_reference', b.booking_reference,
            'status', b.status,
            'check_in_date', CASE 
                WHEN b.booking_data ? 'checkInDate' THEN b.booking_data->>'checkInDate'
                WHEN b.booking_data ? 'check_in_date' THEN b.booking_data->>'check_in_date'
                ELSE NULL
            END,
            'check_out_date', CASE 
                WHEN b.booking_data ? 'checkOutDate' THEN b.booking_data->>'checkOutDate'
                WHEN b.booking_data ? 'check_out_date' THEN b.booking_data->>'check_out_date'
                ELSE NULL
            END,
            'guest_count', CASE 
                WHEN b.booking_data ? 'guestCount' THEN (b.booking_data->>'guestCount')::integer
                ELSE 1
            END,
            'total_amount', b.total_amount,
            'currency', b.currency,
            'booking_type', b.booking_type,
            'booking_data', b.booking_data,
            'created_at', b.created_at,
            'updated_at', b.updated_at,
            'items', COALESCE(
                (SELECT json_agg(
                    json_build_object(
                        'id', bi.id,
                        'item_type', bi.item_type,
                        'item_details', bi.item_details,
                        'quantity', bi.quantity,
                        'unit_price', bi.unit_price,
                        'total_price', bi.total_price
                    )
                ) FROM booking_items bi WHERE bi.booking_id = b.id),
                '[]'::json
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
                FROM payments p 
                WHERE p.booking_id = b.id 
                ORDER BY p.created_at DESC 
                LIMIT 1
            )
        )
        ORDER BY b.created_at DESC
    ) INTO v_result
    FROM public.bookings b
    WHERE b.user_id = v_user_id 
       OR (b.user_id IS NULL AND v_user_email IS NOT NULL AND 
           b.booking_data ? 'customerInfo' AND 
           b.booking_data->'customerInfo' ? 'email' AND
           b.booking_data->'customerInfo'->>'email' = v_user_email);
    
    RETURN COALESCE(v_result, '[]'::json);
END;
$function$
