-- Create admin users table
CREATE TABLE public.admin_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS for admin users
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

-- Create policy for admin users to manage themselves
CREATE POLICY "Admin users can view themselves" ON public.admin_users
FOR SELECT
USING (auth.uid() = user_id);

-- Create policy for insert (registration)
CREATE POLICY "Admin users can insert their own record" ON public.admin_users
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Add trial and payment tracking fields to partner_profiles
ALTER TABLE public.partner_profiles ADD COLUMN trial_status TEXT DEFAULT 'none' CHECK (trial_status IN ('none', 'active', 'completed', 'skipped'));
ALTER TABLE public.partner_profiles ADD COLUMN payment_status TEXT DEFAULT 'unpaid' CHECK (payment_status IN ('unpaid', 'trial_secured', 'paid', 'failed'));
ALTER TABLE public.partner_profiles ADD COLUMN onboarding_choice TEXT DEFAULT 'trial' CHECK (onboarding_choice IN ('trial', 'immediate_payment'));
ALTER TABLE public.partner_profiles ADD COLUMN stripe_customer_id TEXT;
ALTER TABLE public.partner_profiles ADD COLUMN stripe_setup_intent_id TEXT;
ALTER TABLE public.partner_profiles ADD COLUMN stripe_payment_intent_id TEXT;
ALTER TABLE public.partner_profiles ADD COLUMN trial_start_date TIMESTAMPTZ;
ALTER TABLE public.partner_profiles ADD COLUMN trial_expires_at TIMESTAMPTZ;
ALTER TABLE public.partner_profiles ADD COLUMN onboarding_fee_paid BOOLEAN DEFAULT false;
ALTER TABLE public.partner_profiles ADD COLUMN documents_verified BOOLEAN DEFAULT false;

-- Create partner onboarding payments tracking table
CREATE TABLE public.partner_onboarding_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id UUID REFERENCES public.partner_profiles(id) ON DELETE CASCADE,
  stripe_payment_intent_id TEXT,
  stripe_setup_intent_id TEXT,
  amount NUMERIC NOT NULL,
  currency TEXT NOT NULL DEFAULT 'AUD',
  payment_type TEXT NOT NULL CHECK (payment_type IN ('trial_setup', 'immediate', 'trial_conversion')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'succeeded', 'failed', 'cancelled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS for partner onboarding payments
ALTER TABLE public.partner_onboarding_payments ENABLE ROW LEVEL SECURITY;

-- Create policies for partner onboarding payments
CREATE POLICY "Partners can view their own payments" ON public.partner_onboarding_payments
FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.partner_profiles pp
  WHERE pp.id = partner_onboarding_payments.partner_id 
  AND pp.user_id = auth.uid()
));

-- Allow admins to view all payments
CREATE POLICY "Admins can view all payments" ON public.partner_onboarding_payments
FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.admin_users au
  WHERE au.user_id = auth.uid() AND au.is_active = true
));

-- Create policy for inserting payments (edge functions with service role)
CREATE POLICY "Service role can manage payments" ON public.partner_onboarding_payments
FOR ALL
USING (true)
WITH CHECK (true);

-- Create function to check if user is admin
CREATE OR REPLACE FUNCTION public.is_admin(user_id_param UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.admin_users 
    WHERE user_id = user_id_param AND is_active = true
  );
$$;

-- Update partner profiles policies to allow admin access
CREATE POLICY "Admins can view all partner profiles" ON public.partner_profiles
FOR SELECT
USING (public.is_admin(auth.uid()));

-- Create policy for admins to update any partner profile
CREATE POLICY "Admins can update any partner profile" ON public.partner_profiles
FOR UPDATE
USING (public.is_admin(auth.uid()));

-- Update trigger for admin users
CREATE TRIGGER update_admin_users_updated_at
BEFORE UPDATE ON public.admin_users
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Update trigger for partner onboarding payments
CREATE TRIGGER update_partner_onboarding_payments_updated_at
BEFORE UPDATE ON public.partner_onboarding_payments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();