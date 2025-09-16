-- ========== ADD MISSING RPC FUNCTIONS AND COMPLETE API LAYER ==========

-- Create search audit table if not exists
create table if not exists public.search_audit (
  id uuid not null default gen_random_uuid() primary key,
  product text not null,
  params jsonb not null,
  result_count integer default 0,
  user_id uuid references auth.users(id),
  session_id text,
  ip_address inet,
  user_agent text,
  created_at timestamptz default now()
);

-- Create market analytics table if not exists  
create table if not exists public.market_analytics (
  id uuid not null default gen_random_uuid() primary key,
  metric text not null,
  scope jsonb not null,
  data jsonb not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Enable RLS on new tables
alter table public.search_audit enable row level security;
alter table public.market_analytics enable row level security;

-- RLS policies for new tables only
create policy "Service role can manage search audit"
on public.search_audit for all using (auth.role() = 'service_role');

create policy "Users can view their own search audit"
on public.search_audit for select using (auth.uid() = user_id);

create policy "Service role can manage market analytics"
on public.market_analytics for all using (auth.role() = 'service_role');

create policy "Admins can view market analytics"
on public.market_analytics for select using (is_secure_admin(auth.uid()));

-- Update triggers for new tables
create trigger update_market_analytics_updated_at
  before update on public.market_analytics
  for each row execute function public.update_updated_at_column();

-- ========== RPC FUNCTIONS FOR API LAYER ==========

-- Flight search save RPC
create or replace function public.save_flight_search(
  p_search_key text,
  p_origin text, p_destination text,
  p_departure date, p_return date,
  p_adults int, p_children int, p_infants int,
  p_cabin text, p_currency text,
  p_offers jsonb, p_ttl timestamptz
) returns uuid language plpgsql security definer as $$
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
end $$;

-- Flight order create RPC
create or replace function public.create_flight_order(
  p_profile_id uuid,
  p_amadeus_order_id text,
  p_offer_source text,
  p_offer_json jsonb,
  p_passengers jsonb,
  p_seatmaps jsonb,
  p_status text,
  p_pnr text,
  p_ticket_numbers text[],
  p_price_total numeric,
  p_price_currency text,
  p_checkin_links jsonb,
  p_analytics jsonb,
  p_meta jsonb
) returns uuid language sql security definer as $$
  insert into public.flights_orders(
    profile_id, amadeus_order_id, offer_source, offer_json, passengers, seatmaps,
    status, pnr, ticket_numbers, price_total, price_currency, checkin_links, analytics, meta
  ) values (
    p_profile_id, p_amadeus_order_id, p_offer_source, p_offer_json, p_passengers, p_seatmaps,
    coalesce(p_status,'created'), p_pnr, p_ticket_numbers, p_price_total, p_price_currency, p_checkin_links, p_analytics, p_meta
  ) returning id;
$$;

-- Hotel search save RPC (update existing for audit consistency)
create or replace function public.save_hotel_search(
  p_search_key text, p_city_iata text, p_hotel_id text,
  p_checkin date, p_checkout date, p_adults int, p_children int, p_rooms int,
  p_currency text, p_offers jsonb, p_sentiments jsonb, p_ttl timestamptz
) returns uuid language plpgsql security definer as $$
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
end $$;

-- Hotel order create RPC
create or replace function public.create_hotel_order(
  p_profile_id uuid, p_amadeus_booking_id text, p_hotel_id text,
  p_offer_json jsonb, p_guests jsonb, p_status text,
  p_confirmation_code text, p_checkin date, p_checkout date,
  p_rooms int, p_total_price numeric, p_currency text, p_meta jsonb
) returns uuid language sql security definer as $$
  insert into public.hotels_orders(
    profile_id, amadeus_booking_id, hotel_id, offer_json, guests, status, confirmation_code,
    checkin, checkout, rooms, total_price, currency, meta
  ) values (
    p_profile_id, p_amadeus_booking_id, p_hotel_id, p_offer_json, p_guests, coalesce(p_status,'reserved'),
    p_confirmation_code, p_checkin, p_checkout, p_rooms, p_total_price, p_currency, p_meta
  ) returning id;
$$;

-- Transfer search save RPC
create or replace function public.save_transfer_search(
  p_search_key text, p_origin jsonb, p_destination jsonb, p_pickup timestamptz,
  p_passengers int, p_luggage jsonb, p_offers jsonb, p_ttl timestamptz
) returns uuid language plpgsql security definer as $$
declare v_id uuid;
begin
  insert into public.transfers_offers_cache(
    search_key, origin, destination, pickup_at, passengers, luggage, offers, ttl_expires_at
  ) values (
    p_search_key, p_origin, p_destination, p_pickup, p_passengers, p_luggage, p_offers, p_ttl
  ) returning id into v_id;

  insert into public.search_audit(product, params, result_count, user_id)
  values ('transfer', jsonb_build_object(
    'origin',p_origin,'destination',p_destination,'pickup_at',p_pickup
  ), coalesce(jsonb_array_length(p_offers),0), auth.uid());

  return v_id;
end $$;

-- Transfer order create RPC
create or replace function public.create_transfer_order(
  p_profile_id uuid, p_amadeus_transfer_order_id text, p_offer_json jsonb,
  p_passengers jsonb, p_pickup timestamptz, p_status text,
  p_total_price numeric, p_currency text, p_meta jsonb
) returns uuid language sql security definer as $$
  insert into public.transfers_orders(
    profile_id, amadeus_transfer_order_id, offer_json, passengers, pickup_at,
    status, total_price, currency, meta
  ) values (
    p_profile_id, p_amadeus_transfer_order_id, p_offer_json, p_passengers, p_pickup,
    coalesce(p_status,'created'), p_total_price, p_currency, p_meta
  ) returning id;
$$;

-- Activities search save RPC
create or replace function public.save_activity_search(
  p_search_key text, p_city_iata text, p_bbox jsonb, p_from date, p_to date, p_offers jsonb, p_ttl timestamptz
) returns uuid language plpgsql security definer as $$
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
end $$;

-- Activities order create RPC
create or replace function public.create_activity_order(
  p_profile_id uuid, p_partner_booking_id text, p_activity_id text,
  p_offer_json jsonb, p_participants jsonb, p_scheduled timestamptz,
  p_status text, p_total_price numeric, p_currency text, p_meta jsonb
) returns uuid language sql security definer as $$
  insert into public.activities_orders(
    profile_id, partner_booking_id, activity_id, offer_json, participants, scheduled_at,
    status, total_price, currency, meta
  ) values (
    p_profile_id, p_partner_booking_id, p_activity_id, p_offer_json, p_participants, p_scheduled,
    coalesce(p_status,'created'), p_total_price, p_currency, p_meta
  ) returning id;
$$;

-- Analytics upsert RPC
create or replace function public.upsert_market_analytics(
  p_metric text, p_scope jsonb, p_data jsonb
) returns uuid language sql security definer as $$
  insert into public.market_analytics(metric, scope, data)
  values (p_metric, p_scope, p_data)
  returning id;
$$;

-- Create performance indexes
create index if not exists idx_flight_offers_cache_search_key on public.flight_offers_cache(search_key);
create index if not exists idx_flight_offers_cache_ttl on public.flight_offers_cache(ttl_expires_at);
create index if not exists idx_flights_orders_profile on public.flights_orders(profile_id);
create index if not exists idx_transfers_offers_cache_search_key on public.transfers_offers_cache(search_key);
create index if not exists idx_transfers_orders_profile on public.transfers_orders(profile_id);
create index if not exists idx_activities_offers_cache_search_key on public.activities_offers_cache(search_key);
create index if not exists idx_activities_orders_profile on public.activities_orders(profile_id);
create index if not exists idx_search_audit_user on public.search_audit(user_id);
create index if not exists idx_search_audit_product on public.search_audit(product);
create index if not exists idx_market_analytics_metric on public.market_analytics(metric);