-- Update bookings table constraint to allow travel-fund booking type
ALTER TABLE public.bookings 
DROP CONSTRAINT IF EXISTS bookings_booking_type_check;

-- Add updated constraint that includes travel-fund
ALTER TABLE public.bookings 
ADD CONSTRAINT bookings_booking_type_check 
CHECK (booking_type = ANY (ARRAY['hotel'::text, 'flight'::text, 'package'::text, 'travel-fund'::text]));