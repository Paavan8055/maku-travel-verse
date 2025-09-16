-- ========== FIX RLS POLICIES ==========
-- Drop and recreate policies with correct column references

-- Drop existing policies if they exist
drop policy if exists "Users can view their own hotel orders" on public.hotels_orders;
drop policy if exists "Users can manage their own preferences" on public.user_preferences;

-- Create correct policies using existing profile structure
create policy "Users can view their own hotel orders"
on public.hotels_orders
for select using (
  profile_id in (
    select id from public.profiles 
    where user_id = auth.uid()
  )
);

create policy "Users can insert their own hotel orders"
on public.hotels_orders
for insert with check (
  profile_id in (
    select id from public.profiles 
    where user_id = auth.uid()
  )
);

create policy "Users can manage their own preferences"  
on public.user_preferences
for all using (
  profile_id in (
    select id from public.profiles 
    where user_id = auth.uid()
  )
)
with check (
  profile_id in (
    select id from public.profiles 
    where user_id = auth.uid()
  )
);

-- Create default user preferences for existing users
insert into public.user_preferences (profile_id, currency, language)
select id, coalesce(currency, 'AUD'), 'en'
from public.profiles
where id not in (select profile_id from public.user_preferences where profile_id is not null);

-- Update the hotel search edge function to use the cache table
comment on table public.hotel_offers_cache is 'Cache for hotel search results to improve performance and reduce API calls';
comment on table public.hotels_orders is 'Hotel booking orders with proper structure for travel bookings';
comment on table public.user_preferences is 'User travel preferences for personalized experience';