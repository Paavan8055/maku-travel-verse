-- Create partner-specific enums
CREATE TYPE public.partner_type AS ENUM ('hotel', 'airline', 'car_rental', 'activity_provider', 'restaurant');
CREATE TYPE public.verification_status AS ENUM ('pending', 'verified', 'rejected', 'suspended');
CREATE TYPE public.property_status AS ENUM ('active', 'inactive', 'maintenance', 'draft');
CREATE TYPE public.integration_status AS ENUM ('connected', 'disconnected', 'error', 'pending');
CREATE TYPE public.payout_status AS ENUM ('pending', 'processing', 'completed', 'failed');

-- Core Partner Tables
CREATE TABLE public.partner_profiles (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    business_name TEXT NOT NULL,
    business_type partner_type NOT NULL,
    business_license TEXT,
    tax_id TEXT,
    verification_status verification_status DEFAULT 'pending',
    commission_rate NUMERIC(5,2) DEFAULT 15.00,
    contact_person TEXT,
    phone TEXT,
    address JSONB,
    website_url TEXT,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(user_id)
);

CREATE TABLE public.partner_properties (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    partner_id UUID NOT NULL REFERENCES public.partner_profiles(id) ON DELETE CASCADE,
    property_name TEXT NOT NULL,
    property_type partner_type NOT NULL,
    external_id TEXT,
    description TEXT,
    location JSONB NOT NULL,
    amenities JSONB DEFAULT '[]',
    photos JSONB DEFAULT '[]',
    pricing_info JSONB,
    availability_calendar JSONB DEFAULT '{}',
    status property_status DEFAULT 'draft',
    min_booking_days INTEGER DEFAULT 1,
    max_booking_days INTEGER DEFAULT 365,
    cancellation_policy JSONB,
    check_in_time TIME,
    check_out_time TIME,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE public.partner_bookings (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
    partner_id UUID NOT NULL REFERENCES public.partner_profiles(id) ON DELETE CASCADE,
    property_id UUID NOT NULL REFERENCES public.partner_properties(id) ON DELETE CASCADE,
    booking_value NUMERIC NOT NULL,
    commission_rate NUMERIC(5,2) NOT NULL,
    commission_amount NUMERIC NOT NULL,
    partner_payout_amount NUMERIC NOT NULL,
    payout_status payout_status DEFAULT 'pending',
    payout_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE public.partner_analytics (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    partner_id UUID NOT NULL REFERENCES public.partner_profiles(id) ON DELETE CASCADE,
    year INTEGER NOT NULL,
    month INTEGER NOT NULL,
    total_bookings INTEGER DEFAULT 0,
    total_revenue NUMERIC DEFAULT 0,
    total_commission NUMERIC DEFAULT 0,
    total_payout NUMERIC DEFAULT 0,
    avg_booking_value NUMERIC DEFAULT 0,
    conversion_rate NUMERIC(5,2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(partner_id, year, month)
);

CREATE TABLE public.partner_integrations (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    partner_id UUID NOT NULL REFERENCES public.partner_profiles(id) ON DELETE CASCADE,
    integration_type TEXT NOT NULL,
    api_endpoint TEXT,
    api_credentials JSONB,
    webhook_url TEXT,
    status integration_status DEFAULT 'pending',
    last_sync TIMESTAMP WITH TIME ZONE,
    sync_frequency TEXT DEFAULT 'hourly',
    error_log JSONB DEFAULT '[]',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE public.partner_notifications (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    partner_id UUID NOT NULL REFERENCES public.partner_profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT NOT NULL,
    is_read BOOLEAN DEFAULT false,
    priority TEXT DEFAULT 'normal',
    action_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE public.partner_revenue (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    partner_id UUID NOT NULL REFERENCES public.partner_profiles(id) ON DELETE CASCADE,
    booking_id UUID REFERENCES public.bookings(id),
    amount NUMERIC NOT NULL,
    commission_amount NUMERIC NOT NULL,
    transaction_type TEXT NOT NULL,
    payout_batch_id UUID,
    payout_status payout_status DEFAULT 'pending',
    payout_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE public.property_availability (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    property_id UUID NOT NULL REFERENCES public.partner_properties(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    available_units INTEGER NOT NULL DEFAULT 0,
    base_price NUMERIC,
    special_price NUMERIC,
    minimum_stay INTEGER DEFAULT 1,
    is_blocked BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(property_id, date)
);

-- Enable RLS on all tables
ALTER TABLE public.partner_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partner_properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partner_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partner_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partner_integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partner_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partner_revenue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.property_availability ENABLE ROW LEVEL SECURITY;

-- Create RLS Policies
-- Partner Profiles
CREATE POLICY "Partners can view their own profile" 
ON public.partner_profiles 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Partners can create their own profile" 
ON public.partner_profiles 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Partners can update their own profile" 
ON public.partner_profiles 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Partner Properties
CREATE POLICY "Partners can manage their own properties" 
ON public.partner_properties 
FOR ALL 
USING (EXISTS (
    SELECT 1 FROM public.partner_profiles pp 
    WHERE pp.id = partner_properties.partner_id 
    AND pp.user_id = auth.uid()
));

CREATE POLICY "Users can view active properties" 
ON public.partner_properties 
FOR SELECT 
USING (status = 'active');

-- Partner Bookings
CREATE POLICY "Partners can view their own bookings" 
ON public.partner_bookings 
FOR SELECT 
USING (EXISTS (
    SELECT 1 FROM public.partner_profiles pp 
    WHERE pp.id = partner_bookings.partner_id 
    AND pp.user_id = auth.uid()
));

-- Partner Analytics
CREATE POLICY "Partners can view their own analytics" 
ON public.partner_analytics 
FOR ALL 
USING (EXISTS (
    SELECT 1 FROM public.partner_profiles pp 
    WHERE pp.id = partner_analytics.partner_id 
    AND pp.user_id = auth.uid()
));

-- Partner Integrations
CREATE POLICY "Partners can manage their own integrations" 
ON public.partner_integrations 
FOR ALL 
USING (EXISTS (
    SELECT 1 FROM public.partner_profiles pp 
    WHERE pp.id = partner_integrations.partner_id 
    AND pp.user_id = auth.uid()
));

-- Partner Notifications
CREATE POLICY "Partners can view their own notifications" 
ON public.partner_notifications 
FOR ALL 
USING (EXISTS (
    SELECT 1 FROM public.partner_profiles pp 
    WHERE pp.id = partner_notifications.partner_id 
    AND pp.user_id = auth.uid()
));

-- Partner Revenue
CREATE POLICY "Partners can view their own revenue" 
ON public.partner_revenue 
FOR SELECT 
USING (EXISTS (
    SELECT 1 FROM public.partner_profiles pp 
    WHERE pp.id = partner_revenue.partner_id 
    AND pp.user_id = auth.uid()
));

-- Property Availability
CREATE POLICY "Partners can manage their property availability" 
ON public.property_availability 
FOR ALL 
USING (EXISTS (
    SELECT 1 FROM public.partner_properties pp 
    JOIN public.partner_profiles prf ON pp.partner_id = prf.id
    WHERE pp.id = property_availability.property_id 
    AND prf.user_id = auth.uid()
));

CREATE POLICY "Users can view property availability" 
ON public.property_availability 
FOR SELECT 
USING (EXISTS (
    SELECT 1 FROM public.partner_properties pp 
    WHERE pp.id = property_availability.property_id 
    AND pp.status = 'active'
));

-- Create Business Logic Functions
CREATE OR REPLACE FUNCTION public.get_partner_dashboard_data(p_partner_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
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
$$;

CREATE OR REPLACE FUNCTION public.create_partner_property(
    p_partner_id UUID,
    p_property_data JSONB
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
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
$$;

CREATE OR REPLACE FUNCTION public.update_partner_analytics()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
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
$$;

-- Create trigger for analytics updates
CREATE TRIGGER update_partner_analytics_trigger
    AFTER INSERT ON public.partner_bookings
    FOR EACH ROW
    EXECUTE FUNCTION public.update_partner_analytics();

-- Create trigger for updated_at timestamps
CREATE TRIGGER update_partner_profiles_updated_at
    BEFORE UPDATE ON public.partner_profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_partner_properties_updated_at
    BEFORE UPDATE ON public.partner_properties
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_partner_bookings_updated_at
    BEFORE UPDATE ON public.partner_bookings
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_partner_analytics_updated_at
    BEFORE UPDATE ON public.partner_analytics
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_partner_integrations_updated_at
    BEFORE UPDATE ON public.partner_integrations
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_property_availability_updated_at
    BEFORE UPDATE ON public.property_availability
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for performance
CREATE INDEX idx_partner_profiles_user_id ON public.partner_profiles(user_id);
CREATE INDEX idx_partner_properties_partner_id ON public.partner_properties(partner_id);
CREATE INDEX idx_partner_properties_status ON public.partner_properties(status);
CREATE INDEX idx_partner_bookings_partner_id ON public.partner_bookings(partner_id);
CREATE INDEX idx_partner_bookings_created_at ON public.partner_bookings(created_at);
CREATE INDEX idx_partner_analytics_partner_id_date ON public.partner_analytics(partner_id, year, month);
CREATE INDEX idx_partner_notifications_partner_id ON public.partner_notifications(partner_id);
CREATE INDEX idx_partner_revenue_partner_id ON public.partner_revenue(partner_id);
CREATE INDEX idx_property_availability_property_date ON public.property_availability(property_id, date);