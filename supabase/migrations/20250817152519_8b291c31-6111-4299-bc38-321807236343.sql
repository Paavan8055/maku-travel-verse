-- ========== TRAVEL BOOKING SCHEMA MIGRATION ==========
-- This migration transforms the current generic booking system into a comprehensive travel platform

-- ========== EXTENSIONS ==========
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- ========== BACKUP CURRENT DATA ==========
-- Create backup tables before transformation
create table if not exists _migration_backup_bookings as select * from public.bookings;
create table if not exists _migration_backup_profiles as select * from public.profiles;
create table if not exists _migration_backup_payments as select * from public.payments;

-- ========== NEW REFERENCE TABLES ==========
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

-- ========== TRANSFORM PROFILES TABLE ==========
-- Add new columns to existing profiles table
alter table public.profiles 
add column if not exists auth_user_id uuid unique,
add column if not exists phone text,
add column if not exists country_code text,
add column if not exists currency text default 'AUD',
add column if not exists full_name text;

-- Migrate existing profile data
update public.profiles set 
  auth_user_id = user_id,
  full_name = coalesce(first_name || ' ' || last_name, first_name, last_name),
  currency = 'AUD'
where auth_user_id is null;

-- Create user preferences table
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

-- ========== NEW CACHE TABLES ==========
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

-- ========== NEW ORDER TABLES ==========
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

-- ========== MIGRATE EXISTING BOOKING DATA ==========
-- Transform existing bookings into specific order types
insert into public.flights_orders (
  profile_id, 
  offer_json, 
  status, 
  price_total, 
  price_currency, 
  created_at, 
  updated_at,
  meta
)
select 
  b.user_id as profile_id,
  b.booking_data as offer_json,
  case 
    when b.status = 'confirmed' then 'ticketed'
    when b.status = 'cancelled' then 'cancelled'
    else 'created'
  end as status,
  b.total_amount as price_total,
  b.currency as price_currency,
  b.created_at,
  b.updated_at,
  jsonb_build_object('migrated_from_booking_id', b.id, 'original_booking_reference', b.booking_reference)
from public.bookings b
where b.booking_type = 'flight';

insert into public.hotels_orders (
  profile_id, 
  offer_json, 
  status, 
  total_price, 
  currency, 
  checkin, 
  checkout, 
  rooms, 
  created_at, 
  updated_at,
  meta
)
select 
  b.user_id as profile_id,
  b.booking_data as offer_json,
  case 
    when b.status = 'confirmed' then 'confirmed'
    when b.status = 'cancelled' then 'cancelled'
    else 'reserved'
  end as status,
  b.total_amount as total_price,
  b.currency,
  coalesce((b.booking_data->>'checkInDate')::date, (b.booking_data->>'check_in_date')::date) as checkin,
  coalesce((b.booking_data->>'checkOutDate')::date, (b.booking_data->>'check_out_date')::date) as checkout,
  coalesce((b.booking_data->>'rooms')::int, 1) as rooms,
  b.created_at,
  b.updated_at,
  jsonb_build_object('migrated_from_booking_id', b.id, 'original_booking_reference', b.booking_reference)
from public.bookings b
where b.booking_type = 'hotel';

-- ========== UPDATE PAYMENTS TABLE ==========
-- Update payments to reference new order tables
alter table public.payments 
add column if not exists order_type text check (order_type in ('flight','hotel','transfer','activity')),
add column if not exists order_id uuid,
add column if not exists profile_id uuid references public.profiles(id) on delete set null;

-- Link payments to migrated flight orders
update public.payments 
set 
  order_type = 'flight',
  order_id = fo.id,
  profile_id = fo.profile_id
from public.flights_orders fo
where (fo.meta->>'migrated_from_booking_id')::uuid = public.payments.booking_id;

-- Link payments to migrated hotel orders
update public.payments 
set 
  order_type = 'hotel',
  order_id = ho.id,
  profile_id = ho.profile_id
from public.hotels_orders ho
where (ho.meta->>'migrated_from_booking_id')::uuid = public.payments.booking_id;

-- ========== ANALYTICS & AUDIT ==========
create table if not exists public.market_analytics (
  id uuid primary key default gen_random_uuid(),
  metric text check (metric in ('traveled','booked','busiest_period','itinerary_price_metrics','on_time_performance','delay_prediction','trip_purpose')),
  scope jsonb,
  data jsonb,
  created_at timestamptz default now()
);

create table if not exists public.search_audit (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references public.profiles(id) on delete set null,
  product text check (product in ('flight','hotel','transfer','activity')),
  params jsonb,
  result_count int,
  created_at timestamptz default now()
);

-- ========== INDEXES ==========
create index if not exists idx_profiles_email on public.profiles(email);
create index if not exists idx_profiles_auth_user on public.profiles(auth_user_id);
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

-- ========== RLS POLICIES ==========
alter table public.user_preferences enable row level security;
alter table public.flights_orders enable row level security;
alter table public.hotels_orders enable row level security;
alter table public.transfers_orders enable row level security;
alter table public.activities_orders enable row level security;

-- Disable RLS on cache tables for API access
alter table public.flight_offers_cache disable row level security;
alter table public.hotel_offers_cache disable row level security;
alter table public.transfers_offers_cache disable row level security;
alter table public.activities_offers_cache disable row level security;
alter table public.market_analytics disable row level security;

-- Create policies for new order tables
create policy "Users can view their own flight orders"
on public.flights_orders
for select using (profile_id in (select id from public.profiles where auth_user_id = auth.uid()));

create policy "Users can view their own hotel orders"
on public.hotels_orders
for select using (profile_id in (select id from public.profiles where auth_user_id = auth.uid()));

create policy "Users can view their own transfer orders"
on public.transfers_orders
for select using (profile_id in (select id from public.profiles where auth_user_id = auth.uid()));

create policy "Users can view their own activity orders"
on public.activities_orders
for select using (profile_id in (select id from public.profiles where auth_user_id = auth.uid()));

create policy "Users can manage their own preferences"
on public.user_preferences
for all using (profile_id in (select id from public.profiles where auth_user_id = auth.uid()));

-- ========== POPULATE REFERENCE DATA ==========
-- Insert common airline data
insert into public.airlines (iata_code, business_name, common_name, country_code) values
('QF', 'Qantas Airways Limited', 'Qantas', 'AU'),
('JQ', 'Jetstar Airways Pty Ltd', 'Jetstar', 'AU'),
('VA', 'Virgin Australia Airlines Pty Ltd', 'Virgin Australia', 'AU'),
('SQ', 'Singapore Airlines Limited', 'Singapore Airlines', 'SG'),
('EK', 'Emirates', 'Emirates', 'AE'),
('TG', 'Thai Airways International Public Company Limited', 'Thai Airways', 'TH'),
('CX', 'Cathay Pacific Airways Limited', 'Cathay Pacific', 'HK'),
('BA', 'British Airways Plc', 'British Airways', 'GB'),
('AA', 'American Airlines Inc.', 'American Airlines', 'US'),
('DL', 'Delta Air Lines Inc.', 'Delta Air Lines', 'US')
on conflict (iata_code) do nothing;

-- Insert major airports
insert into public.airports (iata_code, name, city_code, country_code, latitude, longitude) values
('SYD', 'Sydney Kingsford Smith Airport', 'SYD', 'AU', -33.9399, 151.1753),
('MEL', 'Melbourne Airport', 'MEL', 'AU', -37.6733, 144.8433),
('BNE', 'Brisbane Airport', 'BNE', 'AU', -27.3942, 153.1218),
('PER', 'Perth Airport', 'PER', 'AU', -31.9385, 115.9672),
('SIN', 'Singapore Changi Airport', 'SIN', 'SG', 1.3644, 103.9915),
('DXB', 'Dubai International Airport', 'DXB', 'AE', 25.2532, 55.3657),
('BKK', 'Suvarnabhumi Airport', 'BKK', 'TH', 13.6900, 100.7501),
('HKG', 'Hong Kong International Airport', 'HKG', 'HK', 22.3080, 113.9185),
('LHR', 'London Heathrow Airport', 'LHR', 'GB', 51.4700, -0.4543),
('LAX', 'Los Angeles International Airport', 'LAX', 'US', 33.9425, -118.4081),
('JFK', 'John F. Kennedy International Airport', 'JFK', 'US', 40.6413, -73.7781),
('NRT', 'Narita International Airport', 'NRT', 'JP', 35.7647, 140.3864)
on conflict (iata_code) do nothing;

-- Insert major cities
insert into public.cities (iata_code, name, country_code, latitude, longitude) values
('SYD', 'Sydney', 'AU', -33.8688, 151.2093),
('MEL', 'Melbourne', 'AU', -37.8136, 144.9631),
('BNE', 'Brisbane', 'AU', -27.4705, 153.0260),
('PER', 'Perth', 'AU', -31.9505, 115.8605),
('SIN', 'Singapore', 'SG', 1.3521, 103.8198),
('DXB', 'Dubai', 'AE', 25.2048, 55.2708),
('BKK', 'Bangkok', 'TH', 13.7563, 100.5018),
('HKG', 'Hong Kong', 'HK', 22.3193, 114.1694),
('LON', 'London', 'GB', 51.5074, -0.1278),
('LAX', 'Los Angeles', 'US', 34.0522, -118.2437),
('NYC', 'New York', 'US', 40.7128, -74.0060),
('TYO', 'Tokyo', 'JP', 35.6762, 139.6503)
on conflict (iata_code) do nothing;