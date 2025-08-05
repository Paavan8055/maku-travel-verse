-- Fix security warnings by adding secure search path to functions
CREATE OR REPLACE FUNCTION public.update_fund_balance()
RETURNS TRIGGER AS $$
BEGIN
  -- Only update balance for completed transactions
  IF NEW.status = 'completed' THEN
    -- Upsert balance record
    INSERT INTO public.fund_balances (user_id, balance)
    VALUES (
      NEW.user_id, 
      CASE WHEN NEW.type = 'top-up' THEN NEW.amount ELSE -NEW.amount END
    )
    ON CONFLICT (user_id) 
    DO UPDATE SET 
      balance = fund_balances.balance + CASE WHEN NEW.type = 'top-up' THEN NEW.amount ELSE -NEW.amount END,
      updated_at = now();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- Function to get user balance
CREATE OR REPLACE FUNCTION public.get_user_fund_balance(p_user_id UUID)
RETURNS JSON AS $$
DECLARE
  v_balance NUMERIC := 0;
  v_currency TEXT := 'AUD';
BEGIN
  SELECT balance, currency INTO v_balance, v_currency
  FROM public.fund_balances 
  WHERE user_id = p_user_id;
  
  IF NOT FOUND THEN
    -- Create initial balance record
    INSERT INTO public.fund_balances (user_id, balance, currency)
    VALUES (p_user_id, 0, 'AUD');
    v_balance := 0;
    v_currency := 'AUD';
  END IF;
  
  RETURN json_build_object(
    'balance', v_balance,
    'currency', v_currency
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- Function to get user transactions
CREATE OR REPLACE FUNCTION public.get_user_fund_transactions(p_user_id UUID, p_limit INTEGER DEFAULT 10)
RETURNS JSON AS $$
BEGIN
  RETURN (
    SELECT json_agg(
      json_build_object(
        'id', id,
        'type', type,
        'amount', amount,
        'status', status,
        'created_at', created_at
      ) ORDER BY created_at DESC
    )
    FROM (
      SELECT * FROM public.fund_transactions 
      WHERE user_id = p_user_id 
      ORDER BY created_at DESC 
      LIMIT p_limit
    ) t
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';