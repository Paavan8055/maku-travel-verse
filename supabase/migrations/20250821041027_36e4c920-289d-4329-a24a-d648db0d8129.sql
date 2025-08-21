-- Fix security issues identified by the scanner

-- 1. Add proper RLS policies for gift_cards table to prevent unauthorized access
DROP POLICY IF EXISTS "Users can view gift cards by code" ON public.gift_cards;
DROP POLICY IF EXISTS "Users can view gift cards they sent" ON public.gift_cards;
DROP POLICY IF EXISTS "Users can create gift cards" ON public.gift_cards;

-- More secure gift card policies
CREATE POLICY "Users can create gift cards for themselves" ON public.gift_cards
FOR INSERT 
WITH CHECK (sender_id = auth.uid());

CREATE POLICY "Users can view gift cards they sent" ON public.gift_cards
FOR SELECT 
USING (sender_id = auth.uid());

CREATE POLICY "Users can view gift cards they received" ON public.gift_cards
FOR SELECT 
USING (recipient_email = (SELECT email FROM auth.users WHERE id = auth.uid()));

CREATE POLICY "Service role can validate gift cards" ON public.gift_cards
FOR SELECT 
USING (auth.role() = 'service_role');

-- 2. Fix booking_access_audit policy to be more restrictive
DROP POLICY IF EXISTS "System can create audit logs" ON public.booking_access_audit;
DROP POLICY IF EXISTS "Authenticated users can create audit logs" ON public.booking_access_audit;

CREATE POLICY "Service role can create audit logs" ON public.booking_access_audit
FOR INSERT 
WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Authenticated users can create their own audit logs" ON public.booking_access_audit
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL AND EXISTS (
  SELECT 1 FROM public.bookings 
  WHERE id = booking_access_audit.booking_id 
  AND user_id = auth.uid()
));

-- 3. Restrict AI training data to service role only
DROP POLICY IF EXISTS "System can insert AI training data" ON public.ai_training_bookings;

CREATE POLICY "Only service role can insert AI training data" ON public.ai_training_bookings
FOR INSERT 
WITH CHECK (auth.role() = 'service_role' AND anonymized_data IS NOT NULL);

-- 4. Fix database functions to have proper search_path security
ALTER FUNCTION public.update_updated_at_column() SECURITY DEFINER SET search_path TO 'public';
ALTER FUNCTION public.create_flight_order(uuid, text, text, jsonb, jsonb, jsonb, text, text, text[], numeric, text, jsonb, jsonb, jsonb) SECURITY DEFINER SET search_path TO 'public';
ALTER FUNCTION public.create_hotel_order(uuid, text, text, jsonb, jsonb, text, text, date, date, integer, numeric, text, jsonb) SECURITY DEFINER SET search_path TO 'public';
ALTER FUNCTION public.create_activity_order(uuid, text, text, jsonb, jsonb, timestamp with time zone, text, numeric, text, jsonb) SECURITY DEFINER SET search_path TO 'public';
ALTER FUNCTION public.create_transfer_order(uuid, text, jsonb, jsonb, timestamp with time zone, text, numeric, text, jsonb) SECURITY DEFINER SET search_path TO 'public';
ALTER FUNCTION public.generate_booking_reference() SECURITY DEFINER SET search_path TO 'public';