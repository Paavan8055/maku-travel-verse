-- ========== MINIMAL WORKING HOTEL SCHEMA ==========
-- Create tables without RLS first, then add policies

-- Core reference tables (no dependencies)
create table if not exists public.cities (
  iata_code text primary key,
  name text not null,
  country_code text,
  latitude numeric,
  longitude numeric,
  raw jsonb,
  updated_at timestamptz default now()
);

create table if not exists public.hotels (
  hotel_id text primary key,
  name text not null,
  city_iata text,
  latitude numeric,
  longitude numeric,
  address jsonb,
  contact jsonb,
  amenities text[],
  raw jsonb,
  updated_at timestamptz default now()
);

-- Cache table (public access)
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

-- Main orders table
create table if not exists public.hotels_orders (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid,
  amadeus_booking_id text unique,
  hotel_id text,
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

-- User preferences table
create table if not exists public.user_preferences (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid,
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

-- Sample data
insert into public.cities (iata_code, name, country_code, latitude, longitude) values
('SYD', 'Sydney', 'AU', -33.8688, 151.2093),
('MEL', 'Melbourne', 'AU', -37.8136, 144.9631),
('BNE', 'Brisbane', 'AU', -27.4705, 153.0260),
('SIN', 'Singapore', 'SG', 1.3521, 103.8198)
on conflict (iata_code) do nothing;

insert into public.hotels (hotel_id, name, city_iata, latitude, longitude, address) values
('SYDAPCOR', 'Park Hotel Sydney', 'SYD', -33.8688, 151.2093, '{"street": "Castlereagh Street", "city": "Sydney", "country": "AU"}'),
('SYDAHYAT', 'Park Hyatt Sydney', 'SYD', -33.8566, 151.2180, '{"street": "7 Hickson Road", "city": "Sydney", "country": "AU"}')
on conflict (hotel_id) do nothing;

-- Indexes
create index if not exists idx_hotel_offers_cache_key on public.hotel_offers_cache(search_key);
create index if not exists idx_hotels_orders_profile on public.hotels_orders(profile_id);

-- Enable/disable RLS
alter table public.cities disable row level security;
alter table public.hotels disable row level security; 
alter table public.hotel_offers_cache disable row level security;
alter table public.hotels_orders enable row level security;
alter table public.user_preferences enable row level security;