-- Create gift_cards table for storing gift card information
CREATE TABLE public.gift_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  amount NUMERIC NOT NULL CHECK (amount > 0),
  original_amount NUMERIC NOT NULL CHECK (original_amount > 0),
  currency TEXT NOT NULL DEFAULT 'AUD',
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'redeemed', 'expired', 'cancelled')),
  sender_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  sender_name TEXT NOT NULL,
  sender_email TEXT NOT NULL,
  recipient_name TEXT NOT NULL,
  recipient_email TEXT NOT NULL,
  personal_message TEXT,
  design_template TEXT DEFAULT 'default',
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (NOW() + INTERVAL '1 year'),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  redeemed_at TIMESTAMP WITH TIME ZONE,
  redeemed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Create gift_card_redemptions table for tracking partial redemptions
CREATE TABLE public.gift_card_redemptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gift_card_id UUID NOT NULL REFERENCES public.gift_cards(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  amount_redeemed NUMERIC NOT NULL CHECK (amount_redeemed > 0),
  booking_id UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.gift_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gift_card_redemptions ENABLE ROW LEVEL SECURITY;

-- Create policies for gift_cards table
CREATE POLICY "Users can view gift cards they sent" ON public.gift_cards
  FOR SELECT USING (sender_id = auth.uid());

CREATE POLICY "Users can view gift cards by code" ON public.gift_cards
  FOR SELECT USING (true);

CREATE POLICY "Users can create gift cards" ON public.gift_cards
  FOR INSERT WITH CHECK (sender_id = auth.uid() OR sender_id IS NULL);

CREATE POLICY "Service role can manage gift cards" ON public.gift_cards
  FOR ALL USING (current_setting('role') = 'service_role');

-- Create policies for gift_card_redemptions table
CREATE POLICY "Users can view their redemptions" ON public.gift_card_redemptions
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can create redemptions" ON public.gift_card_redemptions
  FOR INSERT WITH CHECK (user_id = auth.uid() OR user_id IS NULL);

CREATE POLICY "Service role can manage redemptions" ON public.gift_card_redemptions
  FOR ALL USING (current_setting('role') = 'service_role');

-- Create function to generate unique gift card codes
CREATE OR REPLACE FUNCTION public.generate_gift_card_code()
RETURNS TEXT AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_gift_card_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updating updated_at
CREATE TRIGGER update_gift_cards_updated_at
  BEFORE UPDATE ON public.gift_cards
  FOR EACH ROW
  EXECUTE FUNCTION public.update_gift_card_updated_at();

-- Create function to validate and redeem gift cards
CREATE OR REPLACE FUNCTION public.redeem_gift_card(
  p_code TEXT,
  p_amount NUMERIC,
  p_user_id UUID DEFAULT NULL,
  p_booking_id UUID DEFAULT NULL
)
RETURNS JSON AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER;