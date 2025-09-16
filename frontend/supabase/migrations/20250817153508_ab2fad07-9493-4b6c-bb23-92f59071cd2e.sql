-- ========== FINAL MIGRATION - ADD CONSTRAINTS AND POLICIES ==========

-- Add foreign key constraints
alter table public.hotels_orders 
add constraint hotels_orders_profile_id_fkey 
foreign key (profile_id) references public.profiles(id) on delete set null;

alter table public.user_preferences 
add constraint user_preferences_profile_id_fkey 
foreign key (profile_id) references public.profiles(id) on delete cascade;

-- Add RLS policies for hotels_orders
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

-- Add RLS policies for user_preferences
create policy "Users can manage their own preferences"
on public.user_preferences
for all
using (auth.uid() = (select user_id from public.profiles where id = profile_id))
with check (auth.uid() = (select user_id from public.profiles where id = profile_id));

create policy "Service role can manage all preferences"
on public.user_preferences
for all
using (auth.role() = 'service_role');

-- Create default preferences for existing users
insert into public.user_preferences (profile_id, currency, language)
select id, 'AUD', 'en'
from public.profiles
where id not in (select profile_id from public.user_preferences where profile_id is not null);

comment on schema public is 'Travel booking system with comprehensive hotel, flight, and activity management';