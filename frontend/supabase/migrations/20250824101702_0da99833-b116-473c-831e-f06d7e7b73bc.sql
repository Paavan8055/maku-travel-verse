-- Fix remaining security warnings

-- Fix transfer pricing cache access - remove anonymous access
DROP POLICY IF EXISTS "Service role can manage transfers pricing cache" ON public.transfers_pricing_cache;
CREATE POLICY "Service role can manage transfers pricing cache" ON public.transfers_pricing_cache
  FOR ALL
  USING (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Anyone can view transfers pricing cache" ON public.transfers_pricing_cache;
CREATE POLICY "Authenticated users can view transfers pricing cache" ON public.transfers_pricing_cache
  FOR SELECT
  USING (auth.uid() IS NOT NULL);