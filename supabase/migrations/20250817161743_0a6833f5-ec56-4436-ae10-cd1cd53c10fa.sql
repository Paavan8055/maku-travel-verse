-- ========== UPDATE EXISTING PROFILES TABLE ==========
-- Add missing columns to existing profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS full_name text,
ADD COLUMN IF NOT EXISTS phone text,
ADD COLUMN IF NOT EXISTS country_code text,
ADD COLUMN IF NOT EXISTS currency text DEFAULT 'AUD';

-- Update the user_preferences table to match existing schema
DROP TABLE IF EXISTS public.user_preferences CASCADE;
CREATE TABLE public.user_preferences (
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
CREATE TABLE IF NOT EXISTS public.payments (
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

-- ========== REFERENCE TABLES ==========
CREATE TABLE IF NOT EXISTS public.airlines (
  iata_code text primary key,
  icao_code text,
  business_name text,
  common_name text,
  country_code text,
  raw jsonb,
  updated_at timestamptz default now()
);

CREATE TABLE IF NOT EXISTS public.airports (
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

-- Update existing cities table if needed
ALTER TABLE public.cities 
ADD COLUMN IF NOT EXISTS latitude numeric,
ADD COLUMN IF NOT EXISTS longitude numeric,
ADD COLUMN IF NOT EXISTS raw jsonb;

-- Update existing hotels table if needed  
ALTER TABLE public.hotels 
ADD COLUMN IF NOT EXISTS latitude numeric,
ADD COLUMN IF NOT EXISTS longitude numeric,
ADD COLUMN IF NOT EXISTS address jsonb,
ADD COLUMN IF NOT EXISTS contact jsonb,
ADD COLUMN IF NOT EXISTS amenities text[],
ADD COLUMN IF NOT EXISTS raw jsonb;

-- ========== FLIGHT PASSENGERS ==========
CREATE TABLE IF NOT EXISTS public.flight_passengers (
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

-- ========== FLIGHT ORDER EVENTS ==========
CREATE TABLE IF NOT EXISTS public.flight_order_events (
  id uuid primary key default gen_random_uuid(),
  flights_order_id uuid references public.flights_orders(id) on delete cascade,
  event_type text,
  payload jsonb,
  created_at timestamptz default now()
);

-- ========== CANCELLATION REQUESTS ==========
CREATE TABLE IF NOT EXISTS public.cancellation_requests (
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
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_flight_passengers_profile ON public.flight_passengers(profile_id);
CREATE INDEX IF NOT EXISTS idx_flight_order_events_order ON public.flight_order_events(flights_order_id);
CREATE INDEX IF NOT EXISTS idx_cancel_req_order ON public.cancellation_requests(order_type, order_id);

-- ========== RLS POLICIES ==========
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.flight_passengers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.flight_order_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cancellation_requests ENABLE ROW LEVEL SECURITY;

-- Profiles policy (using existing column name user_id)
DROP POLICY IF EXISTS "profiles_user_can_read_update_own" ON public.profiles;
CREATE POLICY "profiles_user_can_read_update_own" ON public.profiles
FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Order policies (using existing column name user_id in profiles)
DROP POLICY IF EXISTS "flight_orders_owner_read" ON public.flights_orders;
CREATE POLICY "flight_orders_owner_read" ON public.flights_orders
FOR SELECT USING (profile_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "hotel_orders_owner_read" ON public.hotels_orders;
CREATE POLICY "hotel_orders_owner_read" ON public.hotels_orders
FOR SELECT USING (profile_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "transfers_orders_owner_read" ON public.transfers_orders;
CREATE POLICY "transfers_orders_owner_read" ON public.transfers_orders
FOR SELECT USING (profile_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "activities_orders_owner_read" ON public.activities_orders;
CREATE POLICY "activities_orders_owner_read" ON public.activities_orders
FOR SELECT USING (profile_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()));

-- User preferences policy
CREATE POLICY "user_preferences_owner" ON public.user_preferences
FOR ALL USING (profile_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()))
WITH CHECK (profile_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()));

-- Payments policy
CREATE POLICY "payments_owner" ON public.payments
FOR ALL USING (profile_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()))
WITH CHECK (profile_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()));

-- Flight passengers policy
CREATE POLICY "flight_passengers_owner" ON public.flight_passengers
FOR ALL USING (profile_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()))
WITH CHECK (profile_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()));

-- Cancellation requests policy
CREATE POLICY "cancellation_requests_owner" ON public.cancellation_requests
FOR ALL USING (profile_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()))
WITH CHECK (profile_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()));