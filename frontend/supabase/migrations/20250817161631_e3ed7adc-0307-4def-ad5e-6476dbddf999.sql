-- ========== ADD MISSING COLUMNS TO EXISTING TABLES ==========
-- Add missing columns to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS full_name text,
ADD COLUMN IF NOT EXISTS phone text,
ADD COLUMN IF NOT EXISTS country_code text,
ADD COLUMN IF NOT EXISTS currency text DEFAULT 'AUD';

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

create table if not exists public.flight_order_events (
  id uuid primary key default gen_random_uuid(),
  flights_order_id uuid references public.flights_orders(id) on delete cascade,
  event_type text,
  payload jsonb,
  created_at timestamptz default now()
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

-- ========== ADDITIONAL INDEXES ==========
create index if not exists idx_transfers_offers_cache_key on public.transfers_offers_cache(search_key);
create index if not exists idx_transfers_orders_profile on public.transfers_orders(profile_id);
create index if not exists idx_cancel_req_order on public.cancellation_requests(order_type, order_id);

-- ========== RLS FOR NEW TABLES ==========
alter table public.transfers_orders enable row level security;
alter table public.transfers_offers_cache disable row level security;

create policy "transfers_orders_owner_read" on public.transfers_orders
for select using (profile_id in (select id from public.profiles where user_id = auth.uid()));

-- ========== TRANSFER RPC HELPERS ==========
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