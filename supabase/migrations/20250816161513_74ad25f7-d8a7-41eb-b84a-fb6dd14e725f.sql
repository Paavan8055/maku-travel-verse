-- Drop trigger first, then function, then recreate with proper search_path
DROP TRIGGER IF EXISTS update_gift_cards_updated_at ON public.gift_cards;
DROP FUNCTION IF EXISTS public.generate_gift_card_code();
DROP FUNCTION IF EXISTS public.update_gift_card_updated_at();
DROP FUNCTION IF EXISTS public.redeem_gift_card(TEXT, NUMERIC, UUID, UUID);

-- Create function to generate unique gift card codes with proper search_path
CREATE OR REPLACE FUNCTION public.generate_gift_card_code()
RETURNS TEXT 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  code TEXT;
  exists BOOLEAN;
BEGIN
  LOOP
    -- Generate a random 12-character code
    code := upper(substring(encode(gen_random_bytes(9), 'base32'), 1, 12));
    
    -- Check if code already exists
    SELECT EXISTS(SELECT 1 FROM public.gift_cards WHERE gift_cards.code = code) INTO exists;
    
    IF NOT exists THEN
      RETURN code;
    END IF;
  END LOOP;
END;
$$;

-- Create function to update updated_at timestamp with proper search_path
CREATE OR REPLACE FUNCTION public.update_gift_card_updated_at()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Recreate trigger for updating updated_at
CREATE TRIGGER update_gift_cards_updated_at
  BEFORE UPDATE ON public.gift_cards
  FOR EACH ROW
  EXECUTE FUNCTION public.update_gift_card_updated_at();

-- Create function to validate and redeem gift cards with proper search_path
CREATE OR REPLACE FUNCTION public.redeem_gift_card(
  p_code TEXT,
  p_amount NUMERIC,
  p_user_id UUID DEFAULT NULL,
  p_booking_id UUID DEFAULT NULL
)
RETURNS JSON 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  gift_card RECORD;
  remaining_amount NUMERIC;
  actual_redemption_amount NUMERIC;
BEGIN
  -- Get gift card details
  SELECT * INTO gift_card 
  FROM public.gift_cards 
  WHERE code = p_code AND status = 'active' AND expires_at > NOW();
  
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Invalid or expired gift card');
  END IF;
  
  -- Calculate remaining amount
  SELECT gift_card.amount - COALESCE(SUM(amount_redeemed), 0) INTO remaining_amount
  FROM public.gift_card_redemptions
  WHERE gift_card_id = gift_card.id;
  
  IF remaining_amount <= 0 THEN
    -- Update status to redeemed if fully used
    UPDATE public.gift_cards SET status = 'redeemed', redeemed_at = NOW() WHERE id = gift_card.id;
    RETURN json_build_object('success', false, 'error', 'Gift card already fully redeemed');
  END IF;
  
  -- Determine actual redemption amount
  actual_redemption_amount := LEAST(p_amount, remaining_amount);
  
  -- Create redemption record
  INSERT INTO public.gift_card_redemptions (
    gift_card_id, user_id, amount_redeemed, booking_id
  ) VALUES (
    gift_card.id, p_user_id, actual_redemption_amount, p_booking_id
  );
  
  -- Update gift card status if fully redeemed
  IF actual_redemption_amount = remaining_amount THEN
    UPDATE public.gift_cards 
    SET status = 'redeemed', redeemed_at = NOW(), redeemed_by = p_user_id
    WHERE id = gift_card.id;
  END IF;
  
  -- Add to user's fund balance if user is provided
  IF p_user_id IS NOT NULL THEN
    INSERT INTO public.fund_transactions (user_id, type, amount, status)
    VALUES (p_user_id, 'gift_card_redemption', actual_redemption_amount, 'completed');
  END IF;
  
  RETURN json_build_object(
    'success', true, 
    'redeemed_amount', actual_redemption_amount,
    'remaining_balance', remaining_amount - actual_redemption_amount,
    'gift_card_id', gift_card.id
  );
END;
$$;