-- Fix security warnings for function search paths

-- Update the initialization function to have proper search path
CREATE OR REPLACE FUNCTION public.initialize_user_loyalty()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.loyalty_points (user_id)
  VALUES (NEW.user_id)
  ON CONFLICT (user_id) DO NOTHING;
  
  INSERT INTO public.travel_analytics (user_id, year)
  VALUES (NEW.user_id, EXTRACT(YEAR FROM CURRENT_DATE))
  ON CONFLICT (user_id, year) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;