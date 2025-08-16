-- Security hardening: Update existing database functions to include proper security settings
-- This prevents schema confusion attacks and ensures functions operate in predictable contexts

-- Update existing functions with proper security settings
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.initialize_user_loyalty()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
BEGIN
  INSERT INTO public.loyalty_points (user_id)
  VALUES (NEW.user_id)
  ON CONFLICT (user_id) DO NOTHING;
  
  INSERT INTO public.travel_analytics (user_id, year)
  VALUES (NEW.user_id, EXTRACT(YEAR FROM CURRENT_DATE))
  ON CONFLICT (user_id, year) DO NOTHING;
  
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_partner_dashboard_data(p_partner_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
    v_result JSON;
    v_current_month_bookings INTEGER;
    v_current_month_revenue NUMERIC;
    v_total_properties INTEGER;
    v_active_properties INTEGER;
BEGIN
    -- Check if user owns this partner profile
    IF NOT EXISTS (
        SELECT 1 FROM public.partner_profiles 
        WHERE id = p_partner_id AND user_id = auth.uid()
    ) THEN
        RETURN json_build_object('error', 'Unauthorized');
    END IF;
    
    -- Get current month stats
    SELECT COUNT(*), COALESCE(SUM(booking_value), 0)
    INTO v_current_month_bookings, v_current_month_revenue
    FROM public.partner_bookings pb
    WHERE pb.partner_id = p_partner_id
    AND EXTRACT(YEAR FROM pb.created_at) = EXTRACT(YEAR FROM CURRENT_DATE)
    AND EXTRACT(MONTH FROM pb.created_at) = EXTRACT(MONTH FROM CURRENT_DATE);
    
    -- Get property stats
    SELECT COUNT(*) INTO v_total_properties
    FROM public.partner_properties
    WHERE partner_id = p_partner_id;
    
    SELECT COUNT(*) INTO v_active_properties
    FROM public.partner_properties
    WHERE partner_id = p_partner_id AND status = 'active';
    
    SELECT json_build_object(
        'current_month_bookings', v_current_month_bookings,
        'current_month_revenue', v_current_month_revenue,
        'total_properties', v_total_properties,
        'active_properties', v_active_properties,
        'recent_bookings', (
            SELECT json_agg(
                json_build_object(
                    'id', pb.id,
                    'booking_value', pb.booking_value,
                    'commission_amount', pb.commission_amount,
                    'created_at', pb.created_at,
                    'property_name', pp.property_name
                )
                ORDER BY pb.created_at DESC
            )
            FROM public.partner_bookings pb
            JOIN public.partner_properties pp ON pb.property_id = pp.id
            WHERE pb.partner_id = p_partner_id
            LIMIT 10
        ),
        'monthly_analytics', (
            SELECT json_agg(
                json_build_object(
                    'month', pa.month,
                    'year', pa.year,
                    'total_bookings', pa.total_bookings,
                    'total_revenue', pa.total_revenue,
                    'total_commission', pa.total_commission
                )
                ORDER BY pa.year DESC, pa.month DESC
            )
            FROM public.partner_analytics pa
            WHERE pa.partner_id = p_partner_id
            LIMIT 12
        )
    ) INTO v_result;
    
    RETURN v_result;
END;
$function$;

CREATE OR REPLACE FUNCTION public.create_partner_property(p_partner_id uuid, p_property_data jsonb)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
    v_property_id UUID;
    v_result JSON;
BEGIN
    -- Check if user owns this partner profile
    IF NOT EXISTS (
        SELECT 1 FROM public.partner_profiles 
        WHERE id = p_partner_id AND user_id = auth.uid()
    ) THEN
        RETURN json_build_object('success', false, 'error', 'Unauthorized');
    END IF;
    
    -- Insert new property
    INSERT INTO public.partner_properties (
        partner_id,
        property_name,
        property_type,
        description,
        location,
        amenities,
        photos,
        pricing_info
    ) VALUES (
        p_partner_id,
        p_property_data->>'property_name',
        (p_property_data->>'property_type')::partner_type,
        p_property_data->>'description',
        p_property_data->'location',
        COALESCE(p_property_data->'amenities', '[]'::jsonb),
        COALESCE(p_property_data->'photos', '[]'::jsonb),
        p_property_data->'pricing_info'
    ) RETURNING id INTO v_property_id;
    
    RETURN json_build_object(
        'success', true,
        'property_id', v_property_id,
        'message', 'Property created successfully'
    );
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_partner_analytics()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
    v_year INTEGER;
    v_month INTEGER;
BEGIN
    v_year := EXTRACT(YEAR FROM NEW.created_at);
    v_month := EXTRACT(MONTH FROM NEW.created_at);
    
    -- Update or insert analytics record
    INSERT INTO public.partner_analytics (
        partner_id,
        year,
        month,
        total_bookings,
        total_revenue,
        total_commission
    ) VALUES (
        NEW.partner_id,
        v_year,
        v_month,
        1,
        NEW.booking_value,
        NEW.commission_amount
    )
    ON CONFLICT (partner_id, year, month) 
    DO UPDATE SET 
        total_bookings = partner_analytics.total_bookings + 1,
        total_revenue = partner_analytics.total_revenue + NEW.booking_value,
        total_commission = partner_analytics.total_commission + NEW.commission_amount,
        avg_booking_value = (partner_analytics.total_revenue + NEW.booking_value) / (partner_analytics.total_bookings + 1),
        updated_at = now();
    
    RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.check_bookmark_limit()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
BEGIN
  IF (SELECT COUNT(*) FROM public.user_dream_bookmarks WHERE user_id = NEW.user_id) >= 100 THEN
    RAISE EXCEPTION 'Maximum 100 dream destinations allowed per user';
  END IF;
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_user_bookings()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
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
            'check_in_date', COALESCE((b.booking_data->>'checkInDate'), (b.booking_data->>'check_in_date')),
            'check_out_date', COALESCE((b.booking_data->>'checkOutDate'), (b.booking_data->>'check_out_date')),
            'guest_count', COALESCE((b.booking_data->>'guestCount')::integer, 1),
            'total_amount', b.total_amount,
            'currency', b.currency,
            'booking_type', b.booking_type,
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
    WHERE b.user_id = v_user_id 
       OR (b.user_id IS NULL AND v_user_email IS NOT NULL AND (b.booking_data->>'customerInfo'->>'email') = v_user_email);
    
    RETURN COALESCE(v_result, '[]'::json);
END;
$function$;

CREATE OR REPLACE FUNCTION public.cancel_booking(p_booking_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
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
$function$;

CREATE OR REPLACE FUNCTION public.update_fund_balance()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
BEGIN
  -- Only update balance for completed transactions
  IF NEW.status = 'completed' THEN
    -- Upsert balance record
    INSERT INTO public.fund_balances (user_id, balance)
    VALUES (
      NEW.user_id, 
      CASE WHEN NEW.type = 'top-up' THEN NEW.amount ELSE -NEW.amount END
    )
    ON CONFLICT (user_id) 
    DO UPDATE SET 
      balance = fund_balances.balance + CASE WHEN NEW.type = 'top-up' THEN NEW.amount ELSE -NEW.amount END,
      updated_at = now();
  END IF;
  
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_user_fund_balance(p_user_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  v_balance NUMERIC := 0;
  v_currency TEXT := 'AUD';
BEGIN
  SELECT balance, currency INTO v_balance, v_currency
  FROM public.fund_balances 
  WHERE user_id = p_user_id;
  
  IF NOT FOUND THEN
    -- Create initial balance record
    INSERT INTO public.fund_balances (user_id, balance, currency)
    VALUES (p_user_id, 0, 'AUD');
    v_balance := 0;
    v_currency := 'AUD';
  END IF;
  
  RETURN json_build_object(
    'balance', v_balance,
    'currency', v_currency
  );
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_user_fund_transactions(p_user_id uuid, p_limit integer DEFAULT 10)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
BEGIN
  RETURN (
    SELECT json_agg(
      json_build_object(
        'id', id,
        'type', type,
        'amount', amount,
        'status', status,
        'created_at', created_at
      ) ORDER BY created_at DESC
    )
    FROM (
      SELECT * FROM public.fund_transactions 
      WHERE user_id = p_user_id 
      ORDER BY created_at DESC 
      LIMIT p_limit
    ) t
  );
END;
$function$;

-- Create guest data cleanup function for data retention compliance
CREATE OR REPLACE FUNCTION public.cleanup_guest_data()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
BEGIN
  -- Clean up guest bookings older than 90 days
  DELETE FROM public.bookings 
  WHERE user_id IS NULL 
    AND created_at < NOW() - INTERVAL '90 days'
    AND status IN ('cancelled', 'completed');
    
  -- Clean up orphaned booking items
  DELETE FROM public.booking_items 
  WHERE booking_id NOT IN (SELECT id FROM public.bookings);
  
  -- Clean up orphaned payments
  DELETE FROM public.payments 
  WHERE booking_id NOT IN (SELECT id FROM public.bookings);
END;
$function$;