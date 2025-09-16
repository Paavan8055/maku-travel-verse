-- Fix the bookings_status_check constraint to include 'expired'
-- This will allow the cleanup function to successfully update booking statuses to 'expired'

-- Drop the existing constraint
ALTER TABLE public.bookings DROP CONSTRAINT IF EXISTS bookings_status_check;

-- Add the updated constraint that includes 'expired'
ALTER TABLE public.bookings ADD CONSTRAINT bookings_status_check 
CHECK (status IN ('pending', 'confirmed', 'cancelled', 'expired'));

-- Verify the constraint was applied correctly
COMMENT ON CONSTRAINT bookings_status_check ON public.bookings IS 'Allows pending, confirmed, cancelled, and expired status values';