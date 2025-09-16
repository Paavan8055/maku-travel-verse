-- Fix Security - Restrict local_insights table access (check what column exists)
DROP POLICY IF EXISTS "Anyone can view approved local insights" ON public.local_insights;

-- Create a more restrictive policy for authenticated users only
CREATE POLICY "Authenticated users can view local insights"
ON public.local_insights
FOR SELECT
TO authenticated
USING (true);