-- Fix remaining database functions with proper search_path settings

-- Update functions that are missing search_path settings
CREATE OR REPLACE FUNCTION public.is_emergency_admin()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public', 'pg_catalog'
AS $$
  SELECT true;
$$;

CREATE OR REPLACE FUNCTION public.generate_fund_code()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public', 'pg_catalog'
AS $$
DECLARE
    code TEXT;
    exists BOOLEAN;
BEGIN
    LOOP
        -- Generate a 6-character code using numbers and uppercase letters
        code := upper(substring(replace(encode(gen_random_bytes(4), 'base64'), '/', '0'), 1, 6));
        
        -- Check if code already exists
        SELECT EXISTS(SELECT 1 FROM public.funds WHERE fund_code = code) INTO exists;
        
        IF NOT exists THEN
            RETURN code;
        END IF;
    END LOOP;
END;
$$;

CREATE OR REPLACE FUNCTION public.generate_gift_card_code()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public', 'pg_catalog'
AS $$
DECLARE
  code TEXT;
  exists BOOLEAN;
BEGIN
  LOOP
    -- Generate a random 12-character code using base64 encoding and clean it up
    code := upper(translate(substring(encode(gen_random_bytes(9), 'base64'), 1, 12), '/+', 'XZ'));
    
    -- Check if code already exists
    SELECT EXISTS(SELECT 1 FROM public.gift_cards WHERE gift_cards.code = code) INTO exists;
    
    IF NOT exists THEN
      RETURN code;
    END IF;
  END LOOP;
END;
$$;

CREATE OR REPLACE FUNCTION public.generate_booking_reference()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public', 'pg_catalog'
AS $$
BEGIN
  RETURN 'BK' || UPPER(SUBSTRING(gen_random_uuid()::text FROM 1 FOR 8));
END;
$$;