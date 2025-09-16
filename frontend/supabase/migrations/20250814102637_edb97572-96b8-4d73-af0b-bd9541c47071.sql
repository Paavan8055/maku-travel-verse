-- Add partner_property_id to bookings table
ALTER TABLE public.bookings 
ADD COLUMN partner_property_id uuid REFERENCES public.partner_properties(id);

-- Create indexes for performance
CREATE INDEX idx_bookings_partner_property_id ON public.bookings(partner_property_id);
CREATE INDEX idx_partner_properties_status ON public.partner_properties(status);
CREATE INDEX idx_partner_properties_property_type ON public.partner_properties(property_type);

-- Create function to automatically calculate and record commission when partner booking is made
CREATE OR REPLACE FUNCTION public.handle_partner_booking()
RETURNS TRIGGER AS $$
DECLARE
    v_partner_id uuid;
    v_commission_rate numeric;
    v_commission_amount numeric;
BEGIN
    -- Only process if this is a partner property booking
    IF NEW.partner_property_id IS NOT NULL THEN
        -- Get partner info and commission rate
        SELECT pp.partner_id, pf.commission_rate
        INTO v_partner_id, v_commission_rate
        FROM public.partner_properties pp
        JOIN public.partner_profiles pf ON pp.partner_id = pf.id
        WHERE pp.id = NEW.partner_property_id;
        
        -- Calculate commission amount (default 15% if not set)
        v_commission_rate := COALESCE(v_commission_rate, 15.00);
        v_commission_amount := (NEW.total_amount * v_commission_rate / 100.0);
        
        -- Insert partner booking record for commission tracking
        INSERT INTO public.partner_bookings (
            booking_id,
            partner_id,
            property_id,
            booking_value,
            commission_rate,
            commission_amount,
            partner_payout_amount
        ) VALUES (
            NEW.id,
            v_partner_id,
            NEW.partner_property_id,
            NEW.total_amount,
            v_commission_rate,
            v_commission_amount,
            NEW.total_amount - v_commission_amount
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for partner booking commission calculation
CREATE TRIGGER trigger_handle_partner_booking
    AFTER INSERT ON public.bookings
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_partner_booking();

-- Update existing functions to return clean data for new partners
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
            SELECT COALESCE(json_agg(
                json_build_object(
                    'id', pb.id,
                    'booking_value', pb.booking_value,
                    'commission_amount', pb.commission_amount,
                    'created_at', pb.created_at,
                    'property_name', pp.property_name
                )
                ORDER BY pb.created_at DESC
            ), '[]'::json)
            FROM public.partner_bookings pb
            JOIN public.partner_properties pp ON pb.property_id = pp.id
            WHERE pb.partner_id = p_partner_id
            LIMIT 10
        ),
        'monthly_analytics', (
            SELECT COALESCE(json_agg(
                json_build_object(
                    'month', pa.month,
                    'year', pa.year,
                    'total_bookings', pa.total_bookings,
                    'total_revenue', pa.total_revenue,
                    'total_commission', pa.total_commission
                )
                ORDER BY pa.year DESC, pa.month DESC
            ), '[]'::json)
            FROM public.partner_analytics pa
            WHERE pa.partner_id = p_partner_id
            LIMIT 12
        )
    ) INTO v_result;
    
    RETURN v_result;
END;
$function$