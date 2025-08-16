-- Fix generate_gift_card_code function to use proper schema reference
CREATE OR REPLACE FUNCTION public.generate_gift_card_code()
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  code TEXT;
  exists BOOLEAN;
BEGIN
  LOOP
    -- Generate a random 12-character code using extensions schema
    code := upper(substring(encode(extensions.gen_random_bytes(9), 'base32'), 1, 12));
    
    -- Check if code already exists
    SELECT EXISTS(SELECT 1 FROM public.gift_cards WHERE gift_cards.code = code) INTO exists;
    
    IF NOT exists THEN
      RETURN code;
    END IF;
  END LOOP;
END;
$function$