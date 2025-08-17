-- ========== ADD RLS POLICIES TO FIX SECURITY WARNINGS ==========

-- Add basic RLS policies for the hotels_orders table
create policy "Users can view their own hotel orders"
on public.hotels_orders
for select 
using (
  profile_id in (
    select id from public.profiles 
    where user_id = auth.uid()
  )
);

create policy "Users can insert their own hotel orders"
on public.hotels_orders
for insert 
with check (
  profile_id in (
    select id from public.profiles 
    where user_id = auth.uid()
  )
);

create policy "Service role can manage all hotel orders"
on public.hotels_orders
for all
using (auth.role() = 'service_role');

-- Add RLS policies for user_preferences table
create policy "Users can manage their own preferences"
on public.user_preferences
for all
using (
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

create policy "Service role can manage all preferences"
on public.user_preferences
for all
using (auth.role() = 'service_role');

-- Create initial user preferences for existing users
insert into public.user_preferences (profile_id, currency, language)
select id, coalesce(currency, 'AUD'), 'en'
from public.profiles
where id not in (select profile_id from public.user_preferences where profile_id is not null);