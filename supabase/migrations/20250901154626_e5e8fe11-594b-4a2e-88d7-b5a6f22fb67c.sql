-- Enhanced Travel Fund Marketing Strategy Database Schema (Simple)

-- Add missing columns to funds table
ALTER TABLE public.funds 
ADD COLUMN IF NOT EXISTS name TEXT DEFAULT 'Travel Fund',
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS fund_code TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS fund_type TEXT DEFAULT 'personal',
ADD COLUMN IF NOT EXISTS target_amount NUMERIC,
ADD COLUMN IF NOT EXISTS deadline TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS destination TEXT,
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active',
ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

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

-- Generate fund codes for existing funds
UPDATE public.funds 
SET fund_code = public.generate_fund_code() 
WHERE fund_code IS NULL;