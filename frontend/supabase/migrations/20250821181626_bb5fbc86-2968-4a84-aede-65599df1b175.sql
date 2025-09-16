-- Remove Price Intelligence feature completely from database

-- Drop the price_predictions table and all related policies
DROP TABLE IF EXISTS public.price_predictions CASCADE;

-- Clean up any orphaned RLS policies that might reference price_predictions
-- (This will automatically remove policies when the table is dropped)