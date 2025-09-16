-- ========== EXTENSIONS ==========
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- ========== CORE: USERS / PROFILES / PREFS ==========
create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid unique,
  email text unique,
  full_name text,
  phone text,
  country_code text,
  currency text default 'AUD',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.user_preferences (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references public.profiles(id) on delete cascade,
  preferred_airlines text[],
  seat_class text default 'ECONOMY',
  room_type text default 'standard',
  meal_preferences text[],
  language text default 'en',
  currency text default 'AUD',
  meta jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ========== PAYMENTS (shared) ==========
create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references public.profiles(id) on delete set null,
  order_type text check (order_type in ('flight','hotel','transfer','activity')),
  order_id uuid,
  provider text,
  provider_payment_id text,
  amount numeric(12,2),
  currency text default 'AUD',
  status text check (status in ('pending','succeeded','failed','refunded','partial_refund')),
  receipt_url text,
  meta jsonb,
  created_at timestamptz default now()
);

-- ========== REFERENCES (airlines, airports, cities, hotels) ==========
create table if not exists public.airlines (
  iata_code text primary key,
  icao_code text,
  business_name text,
  common_name text,
  country_code text,
  raw jsonb,
  updated_at timestamptz default now()
);

create table if not exists public.airports (
  iata_code text primary key,
  icao_code text,
  name text,
  city_code text,
  country_code text,
  latitude numeric,
  longitude numeric,
  time_zone text,
  raw jsonb,
  updated_at timestamptz default now()
);

create table if not exists public.cities (
  iata_code text primary key,
  name text,
  country_code text,
  latitude numeric,
  longitude numeric,
  raw jsonb,
  updated_at timestamptz default now()
);

create table if not exists public.hotels (
  hotel_id text primary key,
  name text,
  city_iata text references public.cities(iata_code),
  latitude numeric,
  longitude numeric,
  address jsonb,
  contact jsonb,
  amenities text[],
  raw jsonb,
  updated_at timestamptz default now()
);

-- ========== FLIGHTS ==========
create table if not exists public.flight_offers_cache (
  id uuid primary key default gen_random_uuid(),
  search_key text,
  origin text,
  destination text,
  departure_date date,
  return_date date,
  adults int,
  children int,
  infants int,
  cabin text,
  currency text,
  offers jsonb,
  created_at timestamptz default now(),
  ttl_expires_at timestamptz
);

create table if not exists public.flight_passengers (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references public.profiles(id) on delete set null,
  type text check (type in ('ADULT','CHILD','HELD_INFANT','SEATED_INFANT')),
  first_name text,
  last_name text,
  date_of_birth date,
  gender text,
  document jsonb,
  loyalty jsonb,
  created_at timestamptz default now()
);

create table if not exists public.flights_orders (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references public.profiles(id) on delete set null,
  amadeus_order_id text unique,
  offer_source text,
  offer_json jsonb,
  passengers jsonb,
  seatmaps jsonb,
  status text check (status in ('created','ticketed','cancelled','failed')) default 'created',
  pnr text,
  ticket_numbers text[],
  price_total numeric(12,2),
  price_currency text,
  checkin_links jsonb,
  analytics jsonb,
  meta jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.flight_order_events (
  id uuid primary key default gen_random_uuid(),
  flights_order_id uuid references public.flights_orders(id) on delete cascade,
  event_type text,
  payload jsonb,
  created_at timestamptz default now()
);

-- ========== HOTELS ==========
create table if not exists public.hotel_offers_cache (
  id uuid primary key default gen_random_uuid(),
  search_key text,
  city_iata text references public.cities(iata_code),
  hotel_id text references public.hotels(hotel_id),
  checkin date,
  checkout date,
  adults int,
  children int,
  rooms int,
  currency text,
  offers jsonb,
  sentiments jsonb,
  created_at timestamptz default now(),
  ttl_expires_at timestamptz
);

create table if not exists public.hotels_orders (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references public.profiles(id) on delete set null,
  amadeus_booking_id text unique,
  hotel_id text references public.hotels(hotel_id),
  offer_json jsonb,
  guests jsonb,
  status text check (status in ('reserved','confirmed','cancelled','failed')) default 'reserved',
  confirmation_code text,
  checkin date,
  checkout date,
  rooms int,
  total_price numeric(12,2),
  currency text,
  meta jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ========== TRANSFERS ==========
create table if not exists public.transfers_offers_cache (
  id uuid primary key default gen_random_uuid(),
  search_key text,
  origin jsonb,
  destination jsonb,
  pickup_at timestamptz,
  passengers int,
  luggage jsonb,
  offers jsonb,
  created_at timestamptz default now(),
  ttl_expires_at timestamptz
);

create table if not exists public.transfers_orders (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references public.profiles(id) on delete set null,
  amadeus_transfer_order_id text unique,
  offer_json jsonb,
  passengers jsonb,
  pickup_at timestamptz,
  status text check (status in ('created','confirmed','cancelled','failed')) default 'created',
  cancellation_payload jsonb,
  total_price numeric(12,2),
  currency text,
  meta jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ========== ACTIVITIES ==========
create table if not exists public.activities_offers_cache (
  id uuid primary key default gen_random_uuid(),
  search_key text,
  city_iata text references public.cities(iata_code),
  bbox jsonb,
  date_from date,
  date_to date,
  offers jsonb,
  created_at timestamptz default now(),
  ttl_expires_at timestamptz
);

create table if not exists public.activities_orders (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references public.profiles(id) on delete set null,
  partner_booking_id text,
  activity_id text,
  offer_json jsonb,
  participants jsonb,
  scheduled_at timestamptz,
  status text check (status in ('created','confirmed','cancelled','failed')) default 'created',
  total_price numeric(12,2),
  currency text,
  meta jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ========== MARKET ANALYTICS ==========
create table if not exists public.market_analytics (
  id uuid primary key default gen_random_uuid(),
  metric text check (metric in ('traveled','booked','busiest_period','itinerary_price_metrics','on_time_performance','delay_prediction','trip_purpose')),
  scope jsonb,
  data jsonb,
  created_at timestamptz default now()
);

-- ========== UTILITY: SEARCH LOGS ==========
create table if not exists public.search_audit (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references public.profiles(id) on delete set null,
  product text check (product in ('flight','hotel','transfer','activity')),
  params jsonb,
  result_count int,
  created_at timestamptz default now()
);

-- ========== CANCELLATION REQUESTS ==========
create table if not exists public.cancellation_requests (
  id uuid primary key default gen_random_uuid(),
  order_type text check (order_type in ('flight','hotel','transfer','activity')),
  order_id uuid not null,
  profile_id uuid references public.profiles(id) on delete set null,
  reason text,
  status text check (status in ('requested','in_progress','resolved','rejected')) default 'requested',
  provider_payload jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ========== INDEXES ==========
create index if not exists idx_profiles_email on public.profiles(email);
create index if not exists idx_flight_offers_cache_key on public.flight_offers_cache(search_key);
create index if not exists idx_hotel_offers_cache_key on public.hotel_offers_cache(search_key);
create index if not exists idx_transfers_offers_cache_key on public.transfers_offers_cache(search_key);
create index if not exists idx_activities_offers_cache_key on public.activities_offers_cache(search_key);
create index if not exists idx_flights_orders_profile on public.flights_orders(profile_id);
create index if not exists idx_hotels_orders_profile on public.hotels_orders(profile_id);
create index if not exists idx_transfers_orders_profile on public.transfers_orders(profile_id);
create index if not exists idx_activities_orders_profile on public.activities_orders(profile_id);
create index if not exists idx_payments_order on public.payments(order_type, order_id);
create index if not exists idx_market_analytics_metric on public.market_analytics(metric);
create index if not exists idx_cancel_req_order on public.cancellation_requests(order_type, order_id);

-- ========== RLS ==========
alter table public.profiles enable row level security;
alter table public.user_preferences enable row level security;
alter table public.payments enable row level security;
alter table public.flights_orders enable row level security;
alter table public.hotels_orders enable row level security;
alter table public.transfers_orders enable row level security;
alter table public.activities_orders enable row level security;
-- Caches + analytics can be public-readable if you want fast SSR
alter table public.flight_offers_cache disable row level security;
alter table public.hotel_offers_cache disable row level security;
alter table public.transfers_offers_cache disable row level security;
alter table public.activities_offers_cache disable row level security;
alter table public.market_analytics disable row level security;

-- Basic owner read policies (adjust inserts/updates per server action model)
create policy if not exists "Profiles: user can read/update own" on public.profiles
using (auth.uid()::uuid = auth_user_id) with check (auth.uid()::uuid = auth_user_id);

create policy if not exists "Flight orders: owner read" on public.flights_orders
for select using (profile_id in (select id from public.profiles where auth_user_id = auth.uid()::uuid));
create policy if not exists "Hotel orders: owner read" on public.hotels_orders
for select using (profile_id in (select id from public.profiles where auth_user_id = auth.uid()::uuid));
create policy if not exists "Transfers orders: owner read" on public.transfers_orders
for select using (profile_id in (select id from public.profiles where auth_user_id = auth.uid()::uuid));
create policy if not exists "Activities orders: owner read" on public.activities_orders
for select using (profile_id in (select id from public.profiles where auth_user_id = auth.uid()::uuid));

-- ========== RPC HELPERS (search caches + orders + analytics) ==========
create or replace function public.save_flight_search(
  p_search_key text,
  p_origin text, p_destination text,
  p_departure date, p_return date,
  p_adults int, p_children int, p_infants int,
  p_cabin text, p_currency text,
  p_offers jsonb, p_ttl timestamptz
) returns uuid language plpgsql as $$
declare v_id uuid; begin
  insert into public.flight_offers_cache(
    search_key, origin, destination, departure_date, return_date,
    adults, children, infants, cabin, currency, offers, ttl_expires_at
  ) values (
    p_search_key, p_origin, p_destination, p_departure, p_return,
    p_adults, p_children, p_infants, p_cabin, p_currency, p_offers, p_ttl
  ) returning id into v_id;
  insert into public.search_audit(product, params, result_count)
  values ('flight', jsonb_build_object(
    'origin',p_origin,'destination',p_destination,'departure',p_departure,'return',p_return
  ), coalesce(jsonb_array_length(p_offers),0));
  return v_id; end $$;

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
) returns uuid language sql as $$
  insert into public.flights_orders(
    profile_id, amadeus_order_id, offer_source, offer_json, passengers, seatmaps,
    status, pnr, ticket_numbers, price_total, price_currency, checkin_links, analytics, meta
  ) values (
    p_profile_id, p_amadeus_order_id, p_offer_source, p_offer_json, p_passengers, p_seatmaps,
    coalesce(p_status,'created'), p_pnr, p_ticket_numbers, p_price_total, p_price_currency, p_checkin_links, p_analytics, p_meta
  ) returning id; $$;

create or replace function public.save_hotel_search(
  p_search_key text, p_city_iata text, p_hotel_id text,
  p_checkin date, p_checkout date, p_adults int, p_children int, p_rooms int,
  p_currency text, p_offers jsonb, p_sentiments jsonb, p_ttl timestamptz
) returns uuid language sql as $$
  insert into public.hotel_offers_cache(
    search_key, city_iata, hotel_id, checkin, checkout, adults, children, rooms, currency,
    offers, sentiments, ttl_expires_at
  ) values (
    p_search_key, p_city_iata, p_hotel_id, p_checkin, p_checkout, p_adults, p_children, p_rooms,
    p_currency, p_offers, p_sentiments, p_ttl
  ) returning id; $$;

create or replace function public.create_hotel_order(
  p_profile_id uuid, p_amadeus_booking_id text, p_hotel_id text,
  p_offer_json jsonb, p_guests jsonb, p_status text,
  p_confirmation_code text, p_checkin date, p_checkout date,
  p_rooms int, p_total_price numeric, p_currency text, p_meta jsonb
) returns uuid language sql as $$
  insert into public.hotels_orders(
    profile_id, amadeus_booking_id, hotel_id, offer_json, guests, status, confirmation_code,
    checkin, checkout, rooms, total_price, currency, meta
  ) values (
    p_profile_id, p_amadeus_booking_id, p_hotel_id, p_offer_json, p_guests, coalesce(p_status,'reserved'),
    p_confirmation_code, p_checkin, p_checkout, p_rooms, p_total_price, p_currency, p_meta
  ) returning id; $$;

create or replace function public.save_transfer_search(
  p_search_key text, p_origin jsonb, p_destination jsonb, p_pickup timestamptz,
  p_passengers int, p_luggage jsonb, p_offers jsonb, p_ttl timestamptz
) returns uuid language sql as $$
  insert into public.transfers_offers_cache(
    search_key, origin, destination, pickup_at, passengers, luggage, offers, ttl_expires_at
  ) values (
    p_search_key, p_origin, p_destination, p_pickup, p_passengers, p_luggage, p_offers, p_ttl
  ) returning id; $$;

create or replace function public.create_transfer_order(
  p_profile_id uuid, p_amadeus_transfer_order_id text, p_offer_json jsonb,
  p_passengers jsonb, p_pickup timestamptz, p_status text,
  p_total_price numeric, p_currency text, p_meta jsonb
) returns uuid language sql as $$
  insert into public.transfers_orders(
    profile_id, amadeus_transfer_order_id, offer_json, passengers, pickup_at,
    status, total_price, currency, meta
  ) values (
    p_profile_id, p_amadeus_transfer_order_id, p_offer_json, p_passengers, p_pickup,
    coalesce(p_status,'created'), p_total_price, p_currency, p_meta
  ) returning id; $$;

create or replace function public.save_activity_search(
  p_search_key text, p_city_iata text, p_bbox jsonb, p_from date, p_to date, p_offers jsonb, p_ttl timestamptz
) returns uuid language sql as $$
  insert into public.activities_offers_cache(
    search_key, city_iata, bbox, date_from, date_to, offers, ttl_expires_at
  ) values (
    p_search_key, p_city_iata, p_bbox, p_from, p_to, p_offers, p_ttl
  ) returning id; $$;

create or replace function public.create_activity_order(
  p_profile_id uuid, p_partner_booking_id text, p_activity_id text,
  p_offer_json jsonb, p_participants jsonb, p_scheduled timestamptz,
  p_status text, p_total_price numeric, p_currency text, p_meta jsonb
) returns uuid language sql as $$
  insert into public.activities_orders(
    profile_id, partner_booking_id, activity_id, offer_json, participants, scheduled_at,
    status, total_price, currency, meta
  ) values (
    p_profile_id, p_partner_booking_id, p_activity_id, p_offer_json, p_participants, p_scheduled,
    coalesce(p_status,'created'), p_total_price, p_currency, p_meta
  ) returning id; $$;

create or replace function public.upsert_market_analytics(
  p_metric text, p_scope jsonb, p_data jsonb
) returns uuid language sql as $$
  insert into public.market_analytics(metric, scope, data)
  values (p_metric, p_scope, p_data)
  returning id; $$;

-- ========== NIGHTLY REFRESH RPCs ==========
create or replace function public.get_recent_airline_codes(p_days int default 30)
returns text[] language sql stable as $$
select coalesce(array_agg(distinct seg->>'carrierCode'), '{}')::text[]
from public.flights_orders fo
cross join lateral jsonb_array_elements(fo.offer_json->'flightOffers') f
cross join lateral jsonb_array_elements(f->'itineraries') it
cross join lateral jsonb_array_elements(it->'segments') seg
where fo.created_at > now() - (p_days || ' days')::interval; $$;

create or replace function public.get_recent_airport_codes(p_days int default 30)
returns text[] language sql stable as $$
with o as (
  select seg->'departure'->>'iataCode' as a1, seg->'arrival'->>'iataCode' as a2
  from public.flights_orders fo
  cross join lateral jsonb_array_elements(fo.offer_json->'flightOffers') f
  cross join lateral jsonb_array_elements(f->'itineraries') it
  cross join lateral jsonb_array_elements(it->'segments') seg
  where fo.created_at > now() - (p_days || ' days')::interval
), c as (
  select origin as a1, destination as a2 from public.flight_offers_cache
  where created_at > now() - (p_days || ' days')::interval
)
select coalesce(array_agg(distinct code), '{}')::text[] from (
  select a1 as code from o union select a2 from o
  union select a1 from c union select a2 from c
) u where code is not null; $$;

create or replace function public.get_recent_city_codes(p_days int default 30)
returns text[] language sql stable as $$
with s as (
  select city_iata from public.hotel_offers_cache
  where created_at > now() - (p_days || ' days')::interval and city_iata is not null
), h as (
  select h.city_iata from public.hotels_orders ho
  join public.hotels h on h.hotel_id = ho.hotel_id
  where ho.created_at > now() - (p_days || ' days')::interval
)
select coalesce(array_agg(distinct city_iata), '{}')::text[] from (select * from s union select * from h) x; $$;

create or replace function public.get_recent_hotel_ids(p_days int default 30)
returns text[] language sql stable as $$
with s as (
  select hotel_id from public.hotel_offers_cache
  where created_at > now() - (p_days || ' days')::interval and hotel_id is not null
), h as (
  select hotel_id from public.hotels_orders
  where created_at > now() - (p_days || ' days')::interval and hotel_id is not null
)
select coalesce(array_agg(distinct hotel_id), '{}')::text[] from (select * from s union select * from h) x; $$;