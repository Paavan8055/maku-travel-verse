-- Create travel funds table
CREATE TABLE public.travel_funds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  target_amount NUMERIC NOT NULL DEFAULT 0,
  current_amount NUMERIC NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'AUD',
  fund_type TEXT NOT NULL DEFAULT 'group', -- 'solo', 'group', 'family'
  deadline DATE,
  destination TEXT,
  fund_code TEXT UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(6), 'base64'),
  status TEXT NOT NULL DEFAULT 'active', -- 'active', 'completed', 'cancelled'
  is_public BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create fund members table
CREATE TABLE public.fund_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fund_id UUID NOT NULL REFERENCES public.travel_funds(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  role TEXT NOT NULL DEFAULT 'member', -- 'creator', 'admin', 'member'
  status TEXT NOT NULL DEFAULT 'active', -- 'active', 'invited', 'removed'
  total_contributed NUMERIC NOT NULL DEFAULT 0,
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  invited_by UUID REFERENCES auth.users(id),
  UNIQUE(fund_id, user_id),
  UNIQUE(fund_id, email)
);

-- Create fund transactions table
CREATE TABLE public.fund_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fund_id UUID NOT NULL REFERENCES public.travel_funds(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  amount NUMERIC NOT NULL,
  transaction_type TEXT NOT NULL, -- 'deposit', 'withdrawal', 'adjustment'
  description TEXT,
  stripe_payment_intent_id TEXT,
  status TEXT NOT NULL DEFAULT 'completed', -- 'pending', 'completed', 'failed'
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create fund milestones table
CREATE TABLE public.fund_milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fund_id UUID NOT NULL REFERENCES public.travel_funds(id) ON DELETE CASCADE,
  milestone_type TEXT NOT NULL, -- 'percentage', 'amount', 'member_count'
  target_value NUMERIC NOT NULL,
  current_value NUMERIC NOT NULL DEFAULT 0,
  is_achieved BOOLEAN NOT NULL DEFAULT false,
  achieved_at TIMESTAMP WITH TIME ZONE,
  reward_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.travel_funds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fund_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fund_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fund_milestones ENABLE ROW LEVEL SECURITY;

-- RLS Policies for travel_funds
CREATE POLICY "Users can view funds they're members of" ON public.travel_funds
  FOR SELECT USING (
    id IN (
      SELECT fund_id FROM public.fund_members 
      WHERE user_id = auth.uid() AND status = 'active'
    ) OR user_id = auth.uid()
  );

CREATE POLICY "Users can create their own funds" ON public.travel_funds
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Fund creators can update their funds" ON public.travel_funds
  FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for fund_members
CREATE POLICY "Members can view fund membership" ON public.fund_members
  FOR SELECT USING (
    fund_id IN (
      SELECT fund_id FROM public.fund_members 
      WHERE user_id = auth.uid() AND status = 'active'
    ) OR user_id = auth.uid()
  );

CREATE POLICY "Fund creators can manage members" ON public.fund_members
  FOR ALL USING (
    fund_id IN (
      SELECT id FROM public.travel_funds WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can join funds via invitation" ON public.fund_members
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS Policies for fund_transactions  
CREATE POLICY "Members can view fund transactions" ON public.fund_transactions
  FOR SELECT USING (
    fund_id IN (
      SELECT fund_id FROM public.fund_members 
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

CREATE POLICY "Members can create transactions" ON public.fund_transactions
  FOR INSERT WITH CHECK (
    fund_id IN (
      SELECT fund_id FROM public.fund_members 
      WHERE user_id = auth.uid() AND status = 'active'
    ) AND user_id = auth.uid()
  );

-- RLS Policies for fund_milestones
CREATE POLICY "Members can view fund milestones" ON public.fund_milestones
  FOR SELECT USING (
    fund_id IN (
      SELECT fund_id FROM public.fund_members 
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

CREATE POLICY "Fund creators can manage milestones" ON public.fund_milestones
  FOR ALL USING (
    fund_id IN (
      SELECT id FROM public.travel_funds WHERE user_id = auth.uid()
    )
  );

-- Triggers for updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_travel_funds_updated_at
  BEFORE UPDATE ON public.travel_funds
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Function to update fund totals
CREATE OR REPLACE FUNCTION public.update_fund_totals()
RETURNS TRIGGER AS $$
BEGIN
  -- Update current_amount in travel_funds
  UPDATE public.travel_funds 
  SET current_amount = (
    SELECT COALESCE(SUM(amount), 0) 
    FROM public.fund_transactions 
    WHERE fund_id = COALESCE(NEW.fund_id, OLD.fund_id)
    AND status = 'completed'
    AND transaction_type = 'deposit'
  )
  WHERE id = COALESCE(NEW.fund_id, OLD.fund_id);
  
  -- Update member contribution totals
  IF NEW.user_id IS NOT NULL THEN
    UPDATE public.fund_members 
    SET total_contributed = (
      SELECT COALESCE(SUM(amount), 0) 
      FROM public.fund_transactions 
      WHERE fund_id = NEW.fund_id 
      AND user_id = NEW.user_id
      AND status = 'completed'
      AND transaction_type = 'deposit'
    )
    WHERE fund_id = NEW.fund_id AND user_id = NEW.user_id;
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER update_fund_totals_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.fund_transactions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_fund_totals();

-- Function to auto-add creator as member
CREATE OR REPLACE FUNCTION public.add_fund_creator_as_member()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.fund_members (fund_id, user_id, role)
  VALUES (NEW.id, NEW.user_id, 'creator');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER add_fund_creator_trigger
  AFTER INSERT ON public.travel_funds
  FOR EACH ROW
  EXECUTE FUNCTION public.add_fund_creator_as_member();