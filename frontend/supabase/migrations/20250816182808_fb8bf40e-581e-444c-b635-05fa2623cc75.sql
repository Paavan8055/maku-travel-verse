-- Fix the gift card code generation function to use valid PostgreSQL encoding
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
    -- Generate a random 12-character code using base64 encoding and clean it up
    code := upper(translate(substring(encode(extensions.gen_random_bytes(9), 'base64'), 1, 12), '/+', 'XZ'));
    
    -- Check if code already exists
    SELECT EXISTS(SELECT 1 FROM public.gift_cards WHERE gift_cards.code = code) INTO exists;
    
    IF NOT exists THEN
      RETURN code;
    END IF;
  END LOOP;
END;
$function$