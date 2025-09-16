-- Create fund_balances table
CREATE TABLE public.fund_balances (
  user_id UUID PRIMARY KEY REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  balance NUMERIC NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'AUD',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create fund_transactions table  
CREATE TABLE public.fund_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('top-up', 'withdrawal')),
  amount NUMERIC NOT NULL CHECK (amount > 0),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed')),
  stripe_session_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.fund_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fund_transactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for fund_balances
CREATE POLICY "Users can view own balance" 
ON public.fund_balances FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Service can manage balances" 
ON public.fund_balances FOR ALL 
USING (true);

-- RLS Policies for fund_transactions
CREATE POLICY "Users can view own transactions" 
ON public.fund_transactions FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own transactions" 
ON public.fund_transactions FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Service can manage transactions" 
ON public.fund_transactions FOR ALL 
USING (true);

-- Function to update balance on transaction
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for balance updates
CREATE TRIGGER trg_update_fund_balance
  AFTER INSERT OR UPDATE ON public.fund_transactions
  FOR EACH ROW 
  EXECUTE FUNCTION public.update_fund_balance();

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
$$ LANGUAGE plpgsql SECURITY DEFINER;

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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add some profile stats columns if they don't exist
DO $$ 
BEGIN
  BEGIN
    ALTER TABLE public.profiles ADD COLUMN trips_booked INTEGER DEFAULT 0;
  EXCEPTION
    WHEN duplicate_column THEN NULL;
  END;
  
  BEGIN
    ALTER TABLE public.profiles ADD COLUMN total_distance NUMERIC DEFAULT 0;
  EXCEPTION
    WHEN duplicate_column THEN NULL;
  END;
  
  BEGIN
    ALTER TABLE public.profiles ADD COLUMN points INTEGER DEFAULT 0;
  EXCEPTION
    WHEN duplicate_column THEN NULL;
  END;
END $$;