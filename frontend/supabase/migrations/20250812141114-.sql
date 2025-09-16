-- Harden RLS for financial tables by removing permissive service policies
-- Service role bypasses RLS, so edge functions using SUPABASE_SERVICE_ROLE_KEY continue to work.

-- Ensure RLS remains enabled
ALTER TABLE public.fund_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fund_transactions ENABLE ROW LEVEL SECURITY;

-- Drop unsafe policies that allowed ALL with true condition
DROP POLICY IF EXISTS "Service can manage balances" ON public.fund_balances;
DROP POLICY IF EXISTS "Service can manage transactions" ON public.fund_transactions;

-- Keep existing user policies intact:
-- fund_balances: "Users can view own balance" USING (auth.uid() = user_id);
-- fund_transactions: 
--   "Users can view own transactions" USING (auth.uid() = user_id);
--   "Users can insert own transactions" WITH CHECK (auth.uid() = user_id);

-- Intentionally do not add UPDATE/DELETE policies for client roles; only service-role writes are permitted.
