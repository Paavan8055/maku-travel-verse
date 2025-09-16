-- Enhanced Travel Fund Marketing Strategy Database Schema

-- First, add missing columns to the funds table
ALTER TABLE public.funds 
ADD COLUMN IF NOT EXISTS name TEXT DEFAULT 'Travel Fund',
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS fund_code TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS fund_type TEXT DEFAULT 'personal' CHECK (fund_type IN ('personal', 'group', 'family')),
ADD COLUMN IF NOT EXISTS target_amount NUMERIC,
ADD COLUMN IF NOT EXISTS deadline TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS destination TEXT,
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Create fund participants table for tracking fund members
CREATE TABLE IF NOT EXISTS public.fund_participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    fund_id UUID NOT NULL REFERENCES public.funds(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'contributor' CHECK (role IN ('owner', 'contributor')),
    invited_by UUID REFERENCES auth.users(id),
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    invitation_accepted_at TIMESTAMPTZ,
    total_contributed NUMERIC DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(fund_id, user_id)
);

-- Create fund invitations table for tracking marketing metrics
CREATE TABLE IF NOT EXISTS public.fund_invitations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    fund_id UUID NOT NULL REFERENCES public.funds(id) ON DELETE CASCADE,
    invited_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    invited_email TEXT,
    invited_user_id UUID REFERENCES auth.users(id),
    invitation_code TEXT UNIQUE NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired')),
    expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '30 days'),
    accepted_at TIMESTAMPTZ,
    signup_completed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on new tables
ALTER TABLE public.fund_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fund_invitations ENABLE ROW LEVEL SECURITY;

-- RLS policies for fund_participants
CREATE POLICY "Users can view participants of their funds" ON public.fund_participants
FOR SELECT USING (
    fund_id IN (
        SELECT id FROM public.funds WHERE user_id = auth.uid()
        UNION
        SELECT fund_id FROM public.fund_participants WHERE user_id = auth.uid()
    )
);

CREATE POLICY "Users can join funds they're invited to" ON public.fund_participants
FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Fund owners can manage participants" ON public.fund_participants
FOR ALL USING (
    fund_id IN (SELECT id FROM public.funds WHERE user_id = auth.uid())
);

-- RLS policies for fund_invitations
CREATE POLICY "Users can view invitations for their funds" ON public.fund_invitations
FOR SELECT USING (
    invited_by = auth.uid() OR 
    invited_user_id = auth.uid() OR
    fund_id IN (SELECT id FROM public.funds WHERE user_id = auth.uid())
);

CREATE POLICY "Users can create invitations for their funds" ON public.fund_invitations
FOR INSERT WITH CHECK (
    invited_by = auth.uid() AND
    fund_id IN (SELECT id FROM public.funds WHERE user_id = auth.uid())
);

CREATE POLICY "Users can update their own invitations" ON public.fund_invitations
FOR UPDATE USING (invited_by = auth.uid() OR invited_user_id = auth.uid());

-- Function to generate unique fund codes
CREATE OR REPLACE FUNCTION public.generate_fund_code()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
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

-- Function to auto-generate fund codes for existing funds
UPDATE public.funds 
SET fund_code = public.generate_fund_code() 
WHERE fund_code IS NULL;

-- Function to automatically add fund owner as participant
CREATE OR REPLACE FUNCTION public.add_fund_owner_as_participant()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    INSERT INTO public.fund_participants (fund_id, user_id, role)
    VALUES (NEW.id, NEW.user_id, 'owner');
    RETURN NEW;
END;
$$;

-- Trigger to add fund owner as participant
CREATE TRIGGER add_fund_owner_participant
    AFTER INSERT ON public.funds
    FOR EACH ROW
    EXECUTE FUNCTION public.add_fund_owner_as_participant();

-- Add fund owners as participants for existing funds
INSERT INTO public.fund_participants (fund_id, user_id, role)
SELECT id, user_id, 'owner' 
FROM public.funds 
WHERE user_id IS NOT NULL
ON CONFLICT (fund_id, user_id) DO NOTHING;

-- Function to update fund updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_fund_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

-- Trigger for updating fund updated_at
CREATE TRIGGER update_funds_updated_at
    BEFORE UPDATE ON public.funds
    FOR EACH ROW
    EXECUTE FUNCTION public.update_fund_updated_at();