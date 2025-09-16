-- Enable guest checkout by allowing bookings without a user_id
ALTER TABLE public.bookings
ALTER COLUMN user_id DROP NOT NULL;

-- Note: RLS policies remain unchanged so unauthenticated users cannot read bookings.
-- Inserts/updates are performed by the Edge Function using the service role key.
