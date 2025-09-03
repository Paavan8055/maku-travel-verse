--
-- Minimal schema for the Maku Supabase Action
--

-- Drop existing tables if they exist
drop table if exists funds cascade;
drop table if exists itineraries cascade;

-- Helper function to automatically set the updated_at column
create or replace function update_updated_at()
returns trigger as $$
begin
    new.updated_at = timezone('utc', now());
    return new;
end;
$$ language plpgsql;

-- A table to store traveller balances.  Each user_id should be unique.
create table if not exists funds (
    id uuid default gen_random_uuid() primary key,
    user_id text not null,
    balance numeric default 0,
    created_at timestamptz not null default timezone('utc', now()),
    updated_at timestamptz not null default timezone('utc', now())
);

create unique index if not exists funds_user_id_idx on funds (user_id);
create trigger funds_update_timestamp
    before update on funds
    for each row
    execute procedure update_updated_at();

-- A table to store itineraries for each user.  Each row
-- corresponds to a booking or trip.  You can extend this schema
-- with additional fields (e.g. destination, dates, status) as needed.
create table if not exists itineraries (
    id uuid default gen_random_uuid() primary key,
    user_id text not null,
    data jsonb not null default '{}',
    created_at timestamptz not null default timezone('utc', now()),
    updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists itineraries_user_id_idx on itineraries (user_id);
create trigger itineraries_update_timestamp
    before update on itineraries
    for each row
    execute procedure update_updated_at();

-- Grant read/write access to the service role.
alter table funds enable row level security;
alter table itineraries enable row level security;

-- Policies restrict access to authenticated user rows or service role
create policy "Allow user or service role access" on funds
    for all
    using (auth.uid() = user_id or auth.role() = 'service_role')
    with check (auth.uid() = user_id or auth.role() = 'service_role');

create policy "Allow user or service role access" on itineraries
    for all
    using (auth.uid() = user_id or auth.role() = 'service_role')
    with check (auth.uid() = user_id or auth.role() = 'service_role');
