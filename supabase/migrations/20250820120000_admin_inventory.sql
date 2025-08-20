create table if not exists public.custom_hotels (
  id uuid primary key default gen_random_uuid(),
  partner_id uuid references public.partner_profiles(id) on delete cascade,
  property_code text not null,
  name text not null,
  address text,
  city text,
  country text,
  latitude numeric,
  longitude numeric,
  room_types jsonb,
  inventory integer,
  base_price_cents integer not null default 0,
  currency text not null default 'AUD',
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.custom_flights (
  id uuid primary key default gen_random_uuid(),
  partner_id uuid references public.partner_profiles(id) on delete cascade,
  airline_iata text not null,
  airline_arc text,
  flight_number text not null,
  origin_iata text not null,
  destination_iata text not null,
  departure_time time,
  arrival_time time,
  fare_class text,
  seat_inventory jsonb,
  price_cents integer not null default 0,
  currency text not null default 'AUD',
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.custom_activities (
  id uuid primary key default gen_random_uuid(),
  partner_id uuid references public.partner_profiles(id) on delete cascade,
  activity_code text not null,
  name text not null,
  location text,
  category text,
  duration_minutes integer,
  capacity integer,
  price_cents integer not null default 0,
  currency text not null default 'AUD',
  description text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists custom_hotels_partner_prop_idx on public.custom_hotels(partner_id, property_code);
create index if not exists custom_flights_partner_flight_idx on public.custom_flights(partner_id, flight_number);
create index if not exists custom_activities_partner_code_idx on public.custom_activities(partner_id, activity_code);

alter table public.custom_hotels enable row level security;
alter table public.custom_flights enable row level security;
alter table public.custom_activities enable row level security;

create policy "Allow all read custom hotels" on public.custom_hotels for select using (true);
create policy "Allow all read custom flights" on public.custom_flights for select using (true);
create policy "Allow all read custom activities" on public.custom_activities for select using (true);

create policy "Admin or partner modify custom hotels" on public.custom_hotels for insert with check (auth.role() = 'authenticated');
create policy "Admin or partner modify custom flights" on public.custom_flights for insert with check (auth.role() = 'authenticated');
create policy "Admin or partner modify custom activities" on public.custom_activities for insert with check (auth.role() = 'authenticated');
create policy "Admin or partner modify custom hotels" on public.custom_hotels for update using (auth.role() = 'authenticated');
create policy "Admin or partner modify custom flights" on public.custom_flights for update using (auth.role() = 'authenticated');
create policy "Admin or partner modify custom activities" on public.custom_activities for update using (auth.role() = 'authenticated');
create policy "Admin or partner modify custom hotels" on public.custom_hotels for delete using (auth.role() = 'authenticated');
create policy "Admin or partner modify custom flights" on public.custom_flights for delete using (auth.role() = 'authenticated');
create policy "Admin or partner modify custom activities" on public.custom_activities for delete using (auth.role() = 'authenticated');
