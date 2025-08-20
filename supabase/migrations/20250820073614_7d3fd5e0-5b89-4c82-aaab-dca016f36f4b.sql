-- Fix critical security vulnerabilities
-- 1. Enable RLS on public tables that don't have it enabled
ALTER TABLE public.cities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hotel_offers_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transfers_offers_cache ENABLE ROW LEVEL SECURITY;

-- 2. Create RLS policies for reference data tables
-- Cities table - public read, admin write
CREATE POLICY "Anyone can view cities" ON public.cities
  FOR SELECT USING (true);

CREATE POLICY "Only admins can modify cities" ON public.cities
  FOR ALL USING (is_secure_admin(auth.uid()));

-- Hotel offers cache - authenticated users only
CREATE POLICY "Authenticated users can view hotel offers cache" ON public.hotel_offers_cache
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- Transfers offers cache - authenticated users only  
CREATE POLICY "Authenticated users can view transfers cache" ON public.transfers_offers_cache
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- 3. Fix database functions to have secure search_path
-- Update functions that are missing SET search_path
CREATE OR REPLACE FUNCTION public.save_flight_search(p_search_key text, p_origin text, p_destination text, p_departure date, p_return date, p_adults integer, p_children integer, p_infants integer, p_cabin text, p_currency text, p_offers jsonb, p_ttl timestamp with time zone)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare v_id uuid;
begin
  insert into public.flight_offers_cache(
    search_key, origin, destination, departure_date, return_date,
    adults, children, infants, cabin, currency, offers, ttl_expires_at
  ) values (
    p_search_key, p_origin, p_destination, p_departure, p_return,
    p_adults, p_children, p_infants, p_cabin, p_currency, p_offers, p_ttl
  ) returning id into v_id;

  insert into public.search_audit(product, params, result_count, user_id)
  values ('flight', jsonb_build_object(
    'origin',p_origin,'destination',p_destination,'departure',p_departure,'return',p_return
  ), coalesce(jsonb_array_length(p_offers),0), auth.uid());

  return v_id;
end $function$;

CREATE OR REPLACE FUNCTION public.save_hotel_search(p_search_key text, p_city_iata text, p_hotel_id text, p_checkin date, p_checkout date, p_adults integer, p_children integer, p_rooms integer, p_currency text, p_offers jsonb, p_sentiments jsonb, p_ttl timestamp with time zone)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare v_id uuid;
begin
  insert into public.hotel_offers_cache(
    search_key, city_iata, hotel_id, checkin, checkout, adults, children, rooms, currency,
    offers, sentiments, ttl_expires_at
  ) values (
    p_search_key, p_city_iata, p_hotel_id, p_checkin, p_checkout, p_adults, p_children, p_rooms,
    p_currency, p_offers, p_sentiments, p_ttl
  ) returning id into v_id;

  insert into public.search_audit(product, params, result_count, user_id)
  values ('hotel', jsonb_build_object(
    'city_iata',p_city_iata,'hotel_id',p_hotel_id,'checkin',p_checkin,'checkout',p_checkout
  ), coalesce(jsonb_array_length(p_offers),0), auth.uid());

  return v_id;
end $function$;

CREATE OR REPLACE FUNCTION public.save_activity_search(p_search_key text, p_city_iata text, p_bbox jsonb, p_from date, p_to date, p_offers jsonb, p_ttl timestamp with time zone)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare v_id uuid;
begin
  insert into public.activities_offers_cache(
    search_key, city_iata, bbox, date_from, date_to, offers, ttl_expires_at
  ) values (
    p_search_key, p_city_iata, p_bbox, p_from, p_to, p_offers, p_ttl
  ) returning id into v_id;

  insert into public.search_audit(product, params, result_count, user_id)
  values ('activity', jsonb_build_object(
    'city_iata',p_city_iata,'bbox',p_bbox,'date_from',p_from,'date_to',p_to
  ), coalesce(jsonb_array_length(p_offers),0), auth.uid());

  return v_id;
end $function$;