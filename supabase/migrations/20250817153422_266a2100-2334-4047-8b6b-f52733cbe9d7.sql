-- ========== FIX TABLE STRUCTURE AND ADD POLICIES ==========

-- First, check if there are existing constraints and remove them if needed
alter table public.hotels_orders drop constraint if exists hotels_orders_profile_id_fkey;
alter table public.user_preferences drop constraint if exists user_preferences_profile_id_fkey;

-- Fix the user_preferences table to use profile_id instead of user_id
alter table public.user_preferences rename column user_id to profile_id;

-- Now add proper foreign key constraints
alter table public.hotels_orders 
add constraint hotels_orders_profile_id_fkey 
foreign key (profile_id) references public.profiles(id) on delete set null;

alter table public.user_preferences 
add constraint user_preferences_profile_id_fkey 
foreign key (profile_id) references public.profiles(id) on delete cascade;

-- Add the RLS policies (drop existing ones first if they exist)
drop policy if exists "Users can view their own hotel orders" on public.hotels_orders;
drop policy if exists "Users can insert their own hotel orders" on public.hotels_orders;
drop policy if exists "Service role can manage all hotel orders" on public.hotels_orders;
drop policy if exists "Users can manage their own preferences" on public.user_preferences;
drop policy if exists "Service role can manage all preferences" on public.user_preferences;

-- Create the policies
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

create policy "Users can manage their own preferences"
on public.user_preferences
for all
using (auth.uid() = (select user_id from public.profiles where id = profile_id))
with check (auth.uid() = (select user_id from public.profiles where id = profile_id));

create policy "Service role can manage all preferences"
on public.user_preferences
for all
using (auth.role() = 'service_role');