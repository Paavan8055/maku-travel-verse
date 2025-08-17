-- ========== ADD MISSING POLICIES ONLY ==========

-- Drop existing policies if they exist and recreate them
drop policy if exists "Users can view their own hotel orders" on public.hotels_orders;
drop policy if exists "Users can insert their own hotel orders" on public.hotels_orders;
drop policy if exists "Service role can manage all hotel orders" on public.hotels_orders;
drop policy if exists "Users can manage their own preferences" on public.user_preferences;
drop policy if exists "Service role can manage all preferences" on public.user_preferences;

-- Create RLS policies for hotels_orders
create policy "Users can view their own hotel orders"
on public.hotels_orders
for select 
using (auth.uid() = (select user_id from public.profiles where id = profile_id));

create policy "Users can insert their own hotel orders"
on public.hotels_orders
for insert 
with check (auth.uid() = (select user_id from public.profiles where id = profile_id));

create policy "Service role can manage all hotel orders"
on public.hotels_orders
for all
using (auth.role() = 'service_role');

-- Create RLS policies for user_preferences
create policy "Users can manage their own preferences"
on public.user_preferences
for all
using (auth.uid() = (select user_id from public.profiles where id = profile_id))
with check (auth.uid() = (select user_id from public.profiles where id = profile_id));

create policy "Service role can manage all preferences"
on public.user_preferences
for all
using (auth.role() = 'service_role');