-- Add missing columns to bookings table for provider integration
ALTER TABLE public.bookings 
ADD COLUMN IF NOT EXISTS provider_confirmation_code TEXT,
ADD COLUMN IF NOT EXISTS provider_booking_id TEXT;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_bookings_provider_confirmation_code ON public.bookings(provider_confirmation_code);
CREATE INDEX IF NOT EXISTS idx_bookings_provider_booking_id ON public.bookings(provider_booking_id);