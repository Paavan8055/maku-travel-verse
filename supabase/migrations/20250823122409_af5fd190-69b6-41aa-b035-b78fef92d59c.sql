-- Fix remaining database functions to include proper search_path security
CREATE OR REPLACE FUNCTION public.generate_gift_card_code()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  code TEXT;
  exists BOOLEAN;
BEGIN
  LOOP
    -- Generate a random 12-character code using base64 encoding and clean it up
    code := upper(translate(substring(encode(extensions.gen_random_bytes(9), 'base64'), 1, 12), '/+', 'XZ'));
    
    -- Check if code already exists
    SELECT EXISTS(SELECT 1 FROM public.gift_cards WHERE gift_cards.code = code) INTO exists;
    
    IF NOT exists THEN
      RETURN code;
    END IF;
  END LOOP;
END;
$function$;

CREATE OR REPLACE FUNCTION public.generate_booking_reference()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  RETURN 'BK' || UPPER(SUBSTRING(gen_random_uuid()::text FROM 1 FOR 8));
END;
$function$;

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
end 
$function$;

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
end 
$function$;