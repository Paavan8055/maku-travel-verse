-- Add stripe_session_id column to payments table
ALTER TABLE public.payments 
ADD COLUMN IF NOT EXISTS stripe_session_id TEXT;