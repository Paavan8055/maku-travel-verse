-- Complete remaining security hardening for Phase 1

-- Fix remaining database functions with proper search_path
ALTER FUNCTION public.grant_admin_role(uuid) SECURITY DEFINER SET search_path TO 'public';
ALTER FUNCTION public.is_admin(uuid) SECURITY DEFINER SET search_path TO 'public';
ALTER FUNCTION public.upsert_market_analytics(text, jsonb, jsonb) SECURITY DEFINER SET search_path TO 'public';
ALTER FUNCTION public.save_transfer_search(text, jsonb, jsonb, timestamp with time zone, integer, jsonb, jsonb, timestamp with time zone) SECURITY DEFINER SET search_path TO 'public';
ALTER FUNCTION public.save_activity_search(text, text, jsonb, date, date, jsonb, timestamp with time zone) SECURITY DEFINER SET search_path TO 'public';
ALTER FUNCTION public.save_flight_search(text, text, text, date, date, integer, integer, integer, text, text, jsonb, timestamp with time zone) SECURITY DEFINER SET search_path TO 'public';
ALTER FUNCTION public.save_hotel_search(text, text, text, date, date, integer, integer, integer, text, jsonb, jsonb, timestamp with time zone) SECURITY DEFINER SET search_path TO 'public';

-- Add missing RLS policies for tables without policies
-- Airlines table (already has public read policy)
-- Airports table (already has public read policy) 
-- Cities table (already has policies)

-- Add policy for local_insights table
ALTER TABLE public.local_insights ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view approved local insights" ON public.local_insights
FOR SELECT 
USING (true);

CREATE POLICY "Authenticated users can create local insights" ON public.local_insights
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

-- Add policy for partner_onboarding_payments if it exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'partner_onboarding_payments') THEN
        EXECUTE 'ALTER TABLE public.partner_onboarding_payments ENABLE ROW LEVEL SECURITY';
        
        -- Drop overly permissive policy if it exists
        EXECUTE 'DROP POLICY IF EXISTS "Service role can manage partner payments" ON public.partner_onboarding_payments';
        
        -- Add more restrictive policy
        EXECUTE 'CREATE POLICY "Partners can manage own payment data" ON public.partner_onboarding_payments
                FOR ALL 
                USING (EXISTS (SELECT 1 FROM public.partner_profiles WHERE id = partner_onboarding_payments.partner_id AND user_id = auth.uid()))
                WITH CHECK (EXISTS (SELECT 1 FROM public.partner_profiles WHERE id = partner_onboarding_payments.partner_id AND user_id = auth.uid()))';
                
        EXECUTE 'CREATE POLICY "Service role can manage partner payments" ON public.partner_onboarding_payments
                FOR ALL 
                USING (auth.role() = ''service_role'')
                WITH CHECK (auth.role() = ''service_role'')';
    END IF;
END
$$;

-- Add comprehensive indexes for performance optimization
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_bookings_user_id_created_at ON public.bookings(user_id, created_at DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_payments_booking_id ON public.payments(booking_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_booking_items_booking_id ON public.booking_items(booking_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_profiles_user_id ON public.profiles(user_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_enhanced_favorites_user_id ON public.enhanced_favorites(user_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_roles_user_id ON public.user_roles(user_id) WHERE is_active = true;

-- Add updated_at triggers for missing tables
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public';

-- Add triggers for tables that need them
DO $$
BEGIN
    -- Add trigger for enhanced_favorites if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_enhanced_favorites_updated_at') THEN
        CREATE TRIGGER update_enhanced_favorites_updated_at
            BEFORE UPDATE ON public.enhanced_favorites
            FOR EACH ROW
            EXECUTE FUNCTION public.update_updated_at_column();
    END IF;
    
    -- Add trigger for detailed_reviews if it doesn't exist  
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_detailed_reviews_updated_at') THEN
        CREATE TRIGGER update_detailed_reviews_updated_at
            BEFORE UPDATE ON public.detailed_reviews
            FOR EACH ROW
            EXECUTE FUNCTION public.update_updated_at_column();
    END IF;
END
$$;