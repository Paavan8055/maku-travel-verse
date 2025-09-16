-- ========== COMPLETE TRAVEL BOOKING SCHEMA MIGRATION ==========
-- Create all tables first, then migrate data

-- ========== REFERENCE TABLES ==========
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

-- ========== CACHE TABLES ==========
create table if not exists public.hotel_offers_cache (
  id uuid primary key default gen_random_uuid(),
  search_key text,
  city_iata text,
  hotel_id text,
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

-- ========== ORDER TABLES ==========
create table if not exists public.hotels_orders (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references public.profiles(id) on delete set null,
  amadeus_booking_id text unique,
  hotel_id text,
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

-- ========== UPDATE PROFILES ==========
alter table public.profiles 
add column if not exists auth_user_id uuid unique,
add column if not exists phone text,
add column if not exists country_code text,
add column if not exists currency text default 'AUD',
add column if not exists full_name text;

update public.profiles set 
  auth_user_id = user_id,
  full_name = coalesce(first_name || ' ' || last_name, first_name, last_name),
  currency = 'AUD'
where auth_user_id is null;

-- ========== USER PREFERENCES ==========
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

-- ========== POPULATE REFERENCE DATA ==========
insert into public.cities (iata_code, name, country_code, latitude, longitude) values
('SYD', 'Sydney', 'AU', -33.8688, 151.2093),
('MEL', 'Melbourne', 'AU', -37.8136, 144.9631),
('BNE', 'Brisbane', 'AU', -27.4705, 153.0260),
('PER', 'Perth', 'AU', -31.9505, 115.8605),
('SIN', 'Singapore', 'SG', 1.3521, 103.8198),
('DXB', 'Dubai', 'AE', 25.2048, 55.2708),
('BKK', 'Bangkok', 'TH', 13.7563, 100.5018),
('LON', 'London', 'GB', 51.5074, -0.1278),
('NYC', 'New York', 'US', 40.7128, -74.0060),
('TYO', 'Tokyo', 'JP', 35.6762, 139.6503)
on conflict (iata_code) do nothing;

insert into public.hotels (hotel_id, name, city_iata, latitude, longitude, address) values
('SYDAPCOR', 'Park Hotel Sydney', 'SYD', -33.8688, 151.2093, '{"street": "Castlereagh Street", "city": "Sydney", "state": "NSW", "country": "AU"}'),
('SYDAHYAT', 'Park Hyatt Sydney', 'SYD', -33.8566, 151.2180, '{"street": "7 Hickson Road", "city": "Sydney", "state": "NSW", "country": "AU"}'),
('MELACROW', 'Crown Melbourne', 'MEL', -37.8255, 144.9580, '{"street": "8 Whiteman Street", "city": "Melbourne", "state": "VIC", "country": "AU"}'),
('SINMARINA', 'Marina Bay Sands', 'SIN', 1.2834, 103.8607, '{"street": "10 Bayfront Avenue", "city": "Singapore", "country": "SG"}')
on conflict (hotel_id) do nothing;

-- ========== MIGRATE HOTEL BOOKINGS ==========
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
  p.id as profile_id,
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
  jsonb_build_object(
    'migrated_from_booking_id', b.id, 
    'original_booking_reference', b.booking_reference
  )
from public.bookings b
left join public.profiles p on p.user_id = b.user_id
where b.booking_type = 'hotel'
and (b.user_id is null or p.id is not null);

-- ========== UPDATE PAYMENTS ==========
alter table public.payments 
add column if not exists order_type text,
add column if not exists order_id uuid,
add column if not exists profile_id uuid references public.profiles(id) on delete set null;

-- ========== RLS POLICIES ==========
alter table public.hotels_orders enable row level security;
alter table public.user_preferences enable row level security;
alter table public.hotel_offers_cache disable row level security;

create policy "Users can view their own hotel orders"
on public.hotels_orders
for select using (profile_id in (select id from public.profiles where auth_user_id = auth.uid()));

create policy "Users can manage their own preferences"
on public.user_preferences
for all using (profile_id in (select id from public.profiles where auth_user_id = auth.uid()));

-- ========== INDEXES ==========
create index if not exists idx_hotel_offers_cache_key on public.hotel_offers_cache(search_key);
create index if not exists idx_hotels_orders_profile on public.hotels_orders(profile_id);