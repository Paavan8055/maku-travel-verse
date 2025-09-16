-- ========== RLS POLICIES (corrected syntax) ==========

-- Basic owner read policies (adjust inserts/updates per server action model)
drop policy if exists "Profiles: user can read/update own" on public.profiles;
create policy "profiles_user_can_read_update_own" on public.profiles
using (auth.uid()::uuid = auth_user_id) with check (auth.uid()::uuid = auth_user_id);

drop policy if exists "Flight orders: owner read" on public.flights_orders;
create policy "flight_orders_owner_read" on public.flights_orders
for select using (profile_id in (select id from public.profiles where auth_user_id = auth.uid()::uuid));

drop policy if exists "Hotel orders: owner read" on public.hotels_orders;
create policy "hotel_orders_owner_read" on public.hotels_orders
for select using (profile_id in (select id from public.profiles where auth_user_id = auth.uid()::uuid));

drop policy if exists "Transfers orders: owner read" on public.transfers_orders;
create policy "transfers_orders_owner_read" on public.transfers_orders
for select using (profile_id in (select id from public.profiles where auth_user_id = auth.uid()::uuid));

drop policy if exists "Activities orders: owner read" on public.activities_orders;
create policy "activities_orders_owner_read" on public.activities_orders
for select using (profile_id in (select id from public.profiles where auth_user_id = auth.uid()::uuid));