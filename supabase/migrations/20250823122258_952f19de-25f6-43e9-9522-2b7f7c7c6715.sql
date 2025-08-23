-- Phase 1: Critical Security Fixes - Add missing RLS policies and fix database functions

-- Fix database functions to include proper search_path security
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.create_flight_order(p_profile_id uuid, p_amadeus_order_id text, p_offer_source text, p_offer_json jsonb, p_passengers jsonb, p_seatmaps jsonb, p_status text, p_pnr text, p_ticket_numbers text[], p_price_total numeric, p_price_currency text, p_checkin_links jsonb, p_analytics jsonb, p_meta jsonb)
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  insert into public.flights_orders(
    profile_id, amadeus_order_id, offer_source, offer_json, passengers, seatmaps,
    status, pnr, ticket_numbers, price_total, price_currency, checkin_links, analytics, meta
  ) values (
    p_profile_id, p_amadeus_order_id, p_offer_source, p_offer_json, p_passengers, p_seatmaps,
    coalesce(p_status,'created'), p_pnr, p_ticket_numbers, p_price_total, p_price_currency, p_checkin_links, p_analytics, p_meta
  ) returning id;
$function$;

CREATE OR REPLACE FUNCTION public.create_hotel_order(p_profile_id uuid, p_amadeus_booking_id text, p_hotel_id text, p_offer_json jsonb, p_guests jsonb, p_status text, p_confirmation_code text, p_checkin date, p_checkout date, p_rooms integer, p_total_price numeric, p_currency text, p_meta jsonb)
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  insert into public.hotels_orders(
    profile_id, amadeus_booking_id, hotel_id, offer_json, guests, status, confirmation_code,
    checkin, checkout, rooms, total_price, currency, meta
  ) values (
    p_profile_id, p_amadeus_booking_id, p_hotel_id, p_offer_json, p_guests, coalesce(p_status,'reserved'),
    p_confirmation_code, p_checkin, p_checkout, p_rooms, p_total_price, p_currency, p_meta
  ) returning id;
$function$;

CREATE OR REPLACE FUNCTION public.create_activity_order(p_profile_id uuid, p_partner_booking_id text, p_activity_id text, p_offer_json jsonb, p_participants jsonb, p_scheduled timestamp with time zone, p_status text, p_total_price numeric, p_currency text, p_meta jsonb)
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  insert into public.activities_orders(
    profile_id, partner_booking_id, activity_id, offer_json, participants, scheduled_at,
    status, total_price, currency, meta
  ) values (
    p_profile_id, p_partner_booking_id, p_activity_id, p_offer_json, p_participants, p_scheduled,
    coalesce(p_status,'created'), p_total_price, p_currency, p_meta
  ) returning id;
$function$;

-- Add missing RLS policies for cache tables
CREATE POLICY "Service role can insert into activities cache" 
ON public.activities_offers_cache 
FOR INSERT 
WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Service role can insert into flight cache" 
ON public.flight_offers_cache 
FOR INSERT 
WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Service role can insert into hotel cache" 
ON public.hotel_offers_cache 
FOR INSERT 
WITH CHECK (auth.role() = 'service_role');

-- Ensure proper cleanup policies
CREATE POLICY "Service role can delete expired cache entries" 
ON public.activities_offers_cache 
FOR DELETE 
USING (auth.role() = 'service_role' AND ttl_expires_at < NOW());

CREATE POLICY "Service role can delete expired flight cache" 
ON public.flight_offers_cache 
FOR DELETE 
USING (auth.role() = 'service_role' AND ttl_expires_at < NOW());

CREATE POLICY "Service role can delete expired hotel cache" 
ON public.hotel_offers_cache 
FOR DELETE 
USING (auth.role() = 'service_role' AND ttl_expires_at < NOW());