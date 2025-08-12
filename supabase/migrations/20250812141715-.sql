-- Harden RLS for payments table by removing permissive service policy
BEGIN;

-- Ensure RLS remains enabled on payments
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- Drop unsafe policy that allowed ALL with true condition
DROP POLICY IF EXISTS "Service can manage payments" ON public.payments;

-- NOTE:
-- - We intentionally do NOT add INSERT/UPDATE/DELETE policies for client roles.
--   Edge functions using SUPABASE_SERVICE_ROLE_KEY bypass RLS for legitimate service operations.
-- - Existing policy "Users can view their payments" already restricts SELECT to a user's own records
--   via the bookings ownership join, so user access remains properly scoped.

COMMIT;