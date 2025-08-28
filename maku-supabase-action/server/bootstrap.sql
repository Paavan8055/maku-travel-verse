--
-- Minimal schema for the Maku Supabase Action
--

-- Drop existing tables if they exist
drop table if exists funds cascade;
drop table if exists itineraries cascade;

-- A table to store traveller balances.  Each user_id should be unique.
create table if not exists funds (
    id uuid default gen_random_uuid() primary key,
    user_id text not null unique,
    balance numeric default 0
);

-- A table to store itineraries for each user.  Each row
-- corresponds to a booking or trip.  You can extend this schema
-- with additional fields (e.g. destination, dates, status) as needed.
create table if not exists itineraries (
    id uuid default gen_random_uuid() primary key,
    user_id text not null,
    data jsonb not null default '{}'
);

-- Grant read/write access to the service role.
alter table funds enable row level security;
alter table itineraries enable row level security;

-- For development purposes these policies are permissive.  In
-- production you should tighten them according to your needs.
create policy "Allow service role access" on funds for all using (true) with check (true);
create policy "Allow service role access" on itineraries for all using (true) with check (true);
