-- Improve RLS policies for hotel_addons table to restrict competitor access
-- Only show hotel addons when user is actively booking that hotel
DROP POLICY IF EXISTS "Anyone can view active hotel addons" ON public.hotel_addons;

-- Create more restrictive policy for hotel addons
CREATE POLICY "Authenticated users can view hotel addons" 
ON public.hotel_addons 
FOR SELECT 
USING (
  auth.uid() IS NOT NULL 
  AND active = true
);

-- Add index for better performance on hotel addon queries
CREATE INDEX IF NOT EXISTS idx_hotel_addons_hotel_id_active 
ON public.hotel_addons (hotel_id, active) 
WHERE active = true;