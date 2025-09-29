-- Create waitlist table for user sign-ups
CREATE TABLE IF NOT EXISTS public.waitlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  referral_code TEXT,
  source TEXT DEFAULT 'website',
  marketing_consent BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'invited', 'registered'))
);

-- Enable RLS
ALTER TABLE public.waitlist ENABLE ROW LEVEL SECURITY;

-- Anyone can add themselves to waitlist
CREATE POLICY "Anyone can join waitlist" 
ON public.waitlist 
FOR INSERT 
WITH CHECK (true);

-- Only service role can read waitlist (for analytics)
CREATE POLICY "Service role can read waitlist" 
ON public.waitlist 
FOR SELECT 
USING (auth.role() = 'service_role');

-- Only admins can manage waitlist status
CREATE POLICY "Admins can manage waitlist" 
ON public.waitlist 
FOR UPDATE 
USING (is_secure_admin(auth.uid()));

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_waitlist_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER waitlist_updated_at_trigger
  BEFORE UPDATE ON public.waitlist
  FOR EACH ROW
  EXECUTE FUNCTION update_waitlist_updated_at();

-- Create index for faster lookups
CREATE INDEX idx_waitlist_email ON public.waitlist (email);
CREATE INDEX idx_waitlist_status ON public.waitlist (status);
CREATE INDEX idx_waitlist_created_at ON public.waitlist (created_at DESC);