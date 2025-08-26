-- Fix security warnings from linter by adding search_path to new function

-- Drop and recreate the function with proper security settings
DROP FUNCTION IF EXISTS update_api_configuration_updated_at();

CREATE OR REPLACE FUNCTION public.update_api_configuration_updated_at()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;