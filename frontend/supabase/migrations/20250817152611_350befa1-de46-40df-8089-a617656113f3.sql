-- ========== FIX MIGRATION - HANDLE ORPHANED DATA ==========

-- First, let's clean up any orphaned bookings that don't have valid user references
delete from public.bookings 
where user_id is not null 
and user_id not in (select user_id from public.profiles where user_id is not null);

-- Now migrate the existing booking data with proper null handling
insert into public.flights_orders (
  profile_id, 
  offer_json, 
  status, 
  price_total, 
  price_currency, 
  created_at, 
  updated_at,
  meta
)
select 
  p.id as profile_id,  -- Use profile.id instead of booking.user_id
  b.booking_data as offer_json,
  case 
    when b.status = 'confirmed' then 'ticketed'
    when b.status = 'cancelled' then 'cancelled'
    else 'created'
  end as status,
  b.total_amount as price_total,
  b.currency as price_currency,
  b.created_at,
  b.updated_at,
  jsonb_build_object(
    'migrated_from_booking_id', b.id, 
    'original_booking_reference', b.booking_reference,
    'original_user_id', b.user_id
  )
from public.bookings b
left join public.profiles p on p.user_id = b.user_id
where b.booking_type = 'flight'
and (b.user_id is null or p.id is not null);  -- Only migrate if profile exists or is guest booking

insert into public.hotels_orders (
  profile_id, 
  offer_json, 
  status, 
  total_price, 
  currency, 
  checkin, 
  checkout, 
  rooms, 
  created_at, 
  updated_at,
  meta
)
select 
  p.id as profile_id,  -- Use profile.id instead of booking.user_id
  b.booking_data as offer_json,
  case 
    when b.status = 'confirmed' then 'confirmed'
    when b.status = 'cancelled' then 'cancelled'
    else 'reserved'
  end as status,
  b.total_amount as total_price,
  b.currency,
  coalesce((b.booking_data->>'checkInDate')::date, (b.booking_data->>'check_in_date')::date) as checkin,
  coalesce((b.booking_data->>'checkOutDate')::date, (b.booking_data->>'check_out_date')::date) as checkout,
  coalesce((b.booking_data->>'rooms')::int, 1) as rooms,
  b.created_at,
  b.updated_at,
  jsonb_build_object(
    'migrated_from_booking_id', b.id, 
    'original_booking_reference', b.booking_reference,
    'original_user_id', b.user_id
  )
from public.bookings b
left join public.profiles p on p.user_id = b.user_id
where b.booking_type = 'hotel'
and (b.user_id is null or p.id is not null);  -- Only migrate if profile exists or is guest booking

-- Update payment links with correct profile references
update public.payments 
set 
  order_type = 'flight',
  order_id = fo.id,
  profile_id = fo.profile_id
from public.flights_orders fo
where (fo.meta->>'migrated_from_booking_id')::uuid = public.payments.booking_id;

update public.payments 
set 
  order_type = 'hotel',
  order_id = ho.id,
  profile_id = ho.profile_id
from public.hotels_orders ho
where (ho.meta->>'migrated_from_booking_id')::uuid = public.payments.booking_id;

-- Create default preferences for existing users
insert into public.user_preferences (profile_id, currency, language)
select id, coalesce(currency, 'AUD'), 'en'
from public.profiles
where id not in (select profile_id from public.user_preferences where profile_id is not null);

-- Add some sample hotel data for testing
insert into public.hotels (hotel_id, name, city_iata, latitude, longitude, address) values
('SYDAPCOR', 'Park Hotel Sydney', 'SYD', -33.8688, 151.2093, '{"street": "Castlereagh Street", "city": "Sydney", "state": "NSW", "country": "AU"}'),
('SYDAHYAT', 'Park Hyatt Sydney', 'SYD', -33.8566, 151.2180, '{"street": "7 Hickson Road", "city": "Sydney", "state": "NSW", "country": "AU"}'),
('MELACROW', 'Crown Melbourne', 'MEL', -37.8255, 144.9580, '{"street": "8 Whiteman Street", "city": "Melbourne", "state": "VIC", "country": "AU"}'),
('SINMARINA', 'Marina Bay Sands', 'SIN', 1.2834, 103.8607, '{"street": "10 Bayfront Avenue", "city": "Singapore", "country": "SG"}')
on conflict (hotel_id) do nothing;