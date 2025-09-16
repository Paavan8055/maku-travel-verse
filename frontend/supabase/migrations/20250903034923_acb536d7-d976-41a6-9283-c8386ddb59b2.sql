-- Emergency authentication fix for cleanup functions
-- Fix RLS policies to allow service role to manage bookings and cleanup

-- Allow service role to manage booking status updates
DROP POLICY IF EXISTS "Service role can manage all bookings" ON public.bookings;

CREATE POLICY "Service role can manage all bookings"
ON public.bookings
FOR ALL
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

-- Allow service role to insert cleanup audit
DROP POLICY IF EXISTS "Service role can insert cleanup audit" ON public.cleanup_audit;

CREATE POLICY "Service role can manage cleanup audit"
ON public.cleanup_audit
FOR ALL
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

-- Allow service role to manage payments
DROP POLICY IF EXISTS "Service role can manage payments" ON public.payments;

CREATE POLICY "Service role can manage payments"
ON public.payments
FOR ALL
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

-- Create critical alerts policy for service role
DROP POLICY IF EXISTS "Service role can create critical alerts" ON public.critical_alerts;

CREATE POLICY "Service role can manage critical alerts"
ON public.critical_alerts
FOR ALL
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');