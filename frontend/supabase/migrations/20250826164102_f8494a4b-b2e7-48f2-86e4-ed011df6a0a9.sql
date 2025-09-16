-- Fix security warnings by properly updating the function with search_path

-- Drop the trigger first, then the function, then recreate both
DROP TRIGGER IF EXISTS update_api_configuration_updated_at ON public.api_configuration;
DROP FUNCTION IF EXISTS public.update_api_configuration_updated_at() CASCADE;

-- Recreate function with proper security settings
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

-- Recreate the trigger
CREATE TRIGGER update_api_configuration_updated_at
    BEFORE UPDATE ON public.api_configuration
    FOR EACH ROW
    EXECUTE FUNCTION public.update_api_configuration_updated_at();