-- ========== ADD FOREIGN KEY CONSTRAINTS AND POLICIES ==========

-- Add foreign key constraints to existing tables
alter table public.hotels_orders 
add constraint hotels_orders_profile_id_fkey 
foreign key (profile_id) references public.profiles(id) on delete set null;

alter table public.user_preferences 
add constraint user_preferences_profile_id_fkey 
foreign key (profile_id) references public.profiles(id) on delete cascade;

alter table public.hotels 
add constraint hotels_city_iata_fkey 
foreign key (city_iata) references public.cities(iata_code) on delete set null;

alter table public.hotels_orders 
add constraint hotels_orders_hotel_id_fkey 
foreign key (hotel_id) references public.hotels(hotel_id) on delete set null;

-- Now add the RLS policies
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