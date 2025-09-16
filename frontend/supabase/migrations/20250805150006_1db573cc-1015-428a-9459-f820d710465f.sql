-- Check if enums exist, create if not
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'booking_status') THEN
        CREATE TYPE public.booking_status AS ENUM ('pending', 'confirmed', 'cancelled');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payment_status') THEN
        CREATE TYPE public.payment_status AS ENUM ('requires_payment', 'processing', 'succeeded', 'failed', 'refunded');
    END IF;
END $$;

-- Create booking_items table if not exists
CREATE TABLE IF NOT EXISTS public.booking_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  item_type TEXT NOT NULL,
  item_details JSONB NOT NULL,
  quantity INTEGER DEFAULT 1,
  unit_price DECIMAL(10,2) NOT NULL,
  total_price DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create payments table if not exists
CREATE TABLE IF NOT EXISTS public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  stripe_payment_intent_id TEXT UNIQUE,
  amount DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  status payment_status NOT NULL DEFAULT 'requires_payment',
  payment_method_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on new tables
ALTER TABLE public.booking_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for booking_items
DROP POLICY IF EXISTS "Users can view their booking items" ON public.booking_items;
CREATE POLICY "Users can view their booking items" ON public.booking_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.bookings 
      WHERE bookings.id = booking_items.booking_id 
      AND bookings.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can create booking items" ON public.booking_items;
CREATE POLICY "Users can create booking items" ON public.booking_items
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.bookings 
      WHERE bookings.id = booking_items.booking_id 
      AND bookings.user_id = auth.uid()
    )
  );

-- RLS Policies for payments
DROP POLICY IF EXISTS "Users can view their payments" ON public.payments;
CREATE POLICY "Users can view their payments" ON public.payments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.bookings 
      WHERE bookings.id = payments.booking_id 
      AND bookings.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Service can manage payments" ON public.payments;
CREATE POLICY "Service can manage payments" ON public.payments
  FOR ALL USING (true);

-- Create RPC functions
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

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
$$ LANGUAGE plpgsql SECURITY DEFINER;