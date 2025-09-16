-- Fix remaining function search_path security issues
-- These functions were identified as missing proper search_path protection

-- Fix calculate_days_until_trip function
DROP FUNCTION IF EXISTS public.calculate_days_until_trip(date);
CREATE OR REPLACE FUNCTION public.calculate_days_until_trip(start_date date)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF start_date <= CURRENT_DATE THEN
    RETURN 0;
  ELSE
    RETURN (start_date - CURRENT_DATE)::INTEGER;
  END IF;
END;
$$;

-- Fix update functions with proper search_path
DROP FUNCTION IF EXISTS public.update_updated_at_notifications();
CREATE OR REPLACE FUNCTION public.update_updated_at_notifications()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

DROP FUNCTION IF EXISTS public.update_updated_at_communication_preferences();
CREATE OR REPLACE FUNCTION public.update_updated_at_communication_preferences()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

DROP FUNCTION IF EXISTS public.update_updated_at_booking_updates();
CREATE OR REPLACE FUNCTION public.update_updated_at_booking_updates()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;