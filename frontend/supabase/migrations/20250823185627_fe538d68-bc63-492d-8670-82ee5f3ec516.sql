-- Fix RLS policies for tables missing them

-- Add RLS policy for booking_addons table
CREATE POLICY "Users can view their booking addons" ON public.booking_addons
FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.bookings
  WHERE bookings.id = booking_addons.booking_id
  AND bookings.user_id = auth.uid()
));

CREATE POLICY "Users can insert booking addons for their bookings" ON public.booking_addons
FOR INSERT
WITH CHECK (EXISTS (
  SELECT 1 FROM public.bookings
  WHERE bookings.id = booking_addons.booking_id
  AND bookings.user_id = auth.uid()
));

-- Secure function search paths
ALTER FUNCTION public.get_user_bookings() SET search_path TO 'public';
ALTER FUNCTION public.cancel_booking(uuid) SET search_path TO 'public';
ALTER FUNCTION public.generate_booking_reference() SET search_path TO 'public';
ALTER FUNCTION public.generate_gift_card_code() SET search_path TO 'public';

-- Restrict public access to sensitive location data
DROP POLICY IF EXISTS "Anyone can view cities" ON public.cities;
CREATE POLICY "Authenticated users can view cities" ON public.cities
FOR SELECT
USING (auth.uid() IS NOT NULL);

-- Update transfer pricing to require authentication
ALTER TABLE public.transfers_offers_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view transfer offers" ON public.transfers_offers_cache
FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Service role can manage transfer offers cache" ON public.transfers_offers_cache
FOR ALL
USING (auth.role() = 'service_role'::text);