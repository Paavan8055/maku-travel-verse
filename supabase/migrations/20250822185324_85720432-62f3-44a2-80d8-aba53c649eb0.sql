-- Fix critical issues for payment system - only missing parts

-- Improve payments table to support better tracking
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS payment_method_id TEXT;
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS failure_reason TEXT;

-- Add indexes for performance if they don't exist
CREATE INDEX IF NOT EXISTS idx_webhook_events_stripe_id ON public.webhook_events(stripe_event_id);
CREATE INDEX IF NOT EXISTS idx_payments_stripe_id ON public.payments(stripe_payment_intent_id);
CREATE INDEX IF NOT EXISTS idx_payments_booking_id ON public.payments(booking_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON public.bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_created_at ON public.bookings(created_at);

-- Add constraint to ensure valid booking statuses
ALTER TABLE public.bookings DROP CONSTRAINT IF EXISTS bookings_status_check;
ALTER TABLE public.bookings ADD CONSTRAINT bookings_status_check 
  CHECK (status IN ('pending', 'confirmed', 'cancelled', 'failed', 'processing'));