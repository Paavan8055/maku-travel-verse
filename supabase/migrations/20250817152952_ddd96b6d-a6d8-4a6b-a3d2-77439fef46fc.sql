-- ========== ESSENTIAL HOTEL SCHEMA ONLY ==========
-- Create just the core tables needed for hotel functionality

-- Cities reference table (essential for hotel location)
create table if not exists public.cities (
  iata_code text primary key,
  name text not null,
  country_code text,
  latitude numeric,
  longitude numeric,
  raw jsonb,
  updated_at timestamptz default now()
);

-- Hotels reference table
create table if not exists public.hotels (
  hotel_id text primary key,
  name text not null,
  city_iata text references public.cities(iata_code),
  latitude numeric,
  longitude numeric,
  address jsonb,
  contact jsonb,
  amenities text[],
  raw jsonb,
  updated_at timestamptz default now()
);

-- Hotel search cache (no RLS - public read access)
create table if not exists public.hotel_offers_cache (
  id uuid primary key default gen_random_uuid(),
  search_key text not null,
  city_iata text,
  hotel_id text,
  checkin date,
  checkout date,
  adults int default 1,
  children int default 0,
  rooms int default 1,
  currency text default 'AUD',
  offers jsonb not null,
  sentiments jsonb,
  created_at timestamptz default now(),
  ttl_expires_at timestamptz default (now() + interval '1 hour')
);

-- Hotel orders table
create table if not exists public.hotels_orders (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references public.profiles(id) on delete set null,
  amadeus_booking_id text unique,
  hotel_id text references public.hotels(hotel_id),
  offer_json jsonb not null,
  guests jsonb,
  status text check (status in ('reserved','confirmed','cancelled','failed')) default 'reserved',
  confirmation_code text,
  checkin date,
  checkout date,
  rooms int default 1,
  total_price numeric(12,2),
  currency text default 'AUD',
  meta jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Update existing profiles table
alter table public.profiles 
add column if not exists currency text default 'AUD',
add column if not exists country_code text,
add column if not exists phone text;

-- User preferences table  
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

-- Populate sample data
insert into public.cities (iata_code, name, country_code, latitude, longitude) values
('SYD', 'Sydney', 'AU', -33.8688, 151.2093),
('MEL', 'Melbourne', 'AU', -37.8136, 144.9631),
('BNE', 'Brisbane', 'AU', -27.4705, 153.0260),
('SIN', 'Singapore', 'SG', 1.3521, 103.8198),
('DXB', 'Dubai', 'AE', 25.2048, 55.2708),
('BKK', 'Bangkok', 'TH', 13.7563, 100.5018),
('LON', 'London', 'GB', 51.5074, -0.1278),
('NYC', 'New York', 'US', 40.7128, -74.0060),
('TYO', 'Tokyo', 'JP', 35.6762, 139.6503)
on conflict (iata_code) do nothing;

insert into public.hotels (hotel_id, name, city_iata, latitude, longitude, address) values
('SYDAPCOR', 'Park Hotel Sydney', 'SYD', -33.8688, 151.2093, '{"street": "Castlereagh Street", "city": "Sydney", "country": "AU"}'),
('SYDAHYAT', 'Park Hyatt Sydney', 'SYD', -33.8566, 151.2180, '{"street": "7 Hickson Road", "city": "Sydney", "country": "AU"}'),
('MELACROW', 'Crown Melbourne', 'MEL', -37.8255, 144.9580, '{"street": "8 Whiteman Street", "city": "Melbourne", "country": "AU"}'),
('SINMARINA', 'Marina Bay Sands', 'SIN', 1.2834, 103.8607, '{"street": "10 Bayfront Avenue", "city": "Singapore", "country": "SG"}')
on conflict (hotel_id) do nothing;

-- Indexes
create index if not exists idx_hotel_offers_cache_key on public.hotel_offers_cache(search_key);
create index if not exists idx_hotel_offers_cache_ttl on public.hotel_offers_cache(ttl_expires_at);
create index if not exists idx_hotels_orders_profile on public.hotels_orders(profile_id);

-- RLS policies
alter table public.hotels_orders enable row level security;
alter table public.user_preferences enable row level security;

-- Disable RLS on reference and cache tables
alter table public.cities disable row level security;
alter table public.hotels disable row level security;
alter table public.hotel_offers_cache disable row level security;

-- Simple RLS policies
create policy "Users can view own hotel orders"
on public.hotels_orders
for select using (auth.uid() = (select user_id from public.profiles where id = profile_id));

create policy "Users can create own hotel orders"
on public.hotels_orders
for insert with check (auth.uid() = (select user_id from public.profiles where id = profile_id));

create policy "Users can manage own preferences"
on public.user_preferences
for all using (auth.uid() = (select user_id from public.profiles where id = profile_id));