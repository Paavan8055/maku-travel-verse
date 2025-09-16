-- CRITICAL SECURITY FIX: Secure partner_profiles table
-- Handle existing policies and implement proper security

-- Check and drop existing security policies if they exist
DO $$
BEGIN
    -- Drop existing deny policies if they exist
    DROP POLICY IF EXISTS "Deny anonymous access to partner profiles" ON public.partner_profiles;
    DROP POLICY IF EXISTS "Deny public access to partner profiles" ON public.partner_profiles;
    DROP POLICY IF EXISTS "Prevent partner profile deletion" ON public.partner_profiles;
    
    -- Drop and recreate main policies with proper security
    DROP POLICY IF EXISTS "Admins can view all partner profiles" ON public.partner_profiles;
    DROP POLICY IF EXISTS "Admins can update any partner profile" ON public.partner_profiles;
    DROP POLICY IF EXISTS "Partners can create their own profile" ON public.partner_profiles;
    DROP POLICY IF EXISTS "Partners can update their own profile" ON public.partner_profiles;
    DROP POLICY IF EXISTS "Partners can view their own profile" ON public.partner_profiles;
END
$$;

-- Explicitly deny ALL access to anonymous users
CREATE POLICY "Deny anonymous access to partner profiles" 
ON public.partner_profiles 
FOR ALL 
TO anon 
USING (false);

-- Explicitly deny ALL access to public role
CREATE POLICY "Deny public access to partner profiles" 
ON public.partner_profiles 
FOR ALL 
TO public 
USING (false);

-- Allow authenticated partners to view ONLY their own profile
CREATE POLICY "Partners can view their own profile" 
ON public.partner_profiles 
FOR SELECT 
TO authenticated 
USING (auth.uid() = user_id AND auth.uid() IS NOT NULL);

-- Allow authenticated partners to create ONLY their own profile
CREATE POLICY "Partners can create their own profile" 
ON public.partner_profiles 
FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = user_id AND auth.uid() IS NOT NULL);

-- Allow authenticated partners to update ONLY their own profile
CREATE POLICY "Partners can update their own profile" 
ON public.partner_profiles 
FOR UPDATE 
TO authenticated 
USING (auth.uid() = user_id AND auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() = user_id AND auth.uid() IS NOT NULL);

-- Allow admins to view all partner profiles (but only if properly authenticated)
CREATE POLICY "Admins can view all partner profiles" 
ON public.partner_profiles 
FOR SELECT 
TO authenticated 
USING (is_admin(auth.uid()) AND auth.uid() IS NOT NULL);

-- Allow admins to update any partner profile (but only if properly authenticated)
CREATE POLICY "Admins can update any partner profile" 
ON public.partner_profiles 
FOR UPDATE 
TO authenticated 
USING (is_admin(auth.uid()) AND auth.uid() IS NOT NULL);

-- Prevent ALL deletion of partner profiles (even by admins for data integrity)
CREATE POLICY "Prevent partner profile deletion" 
ON public.partner_profiles 
FOR DELETE 
TO authenticated 
USING (false);

-- Ensure RLS is enabled
ALTER TABLE public.partner_profiles ENABLE ROW LEVEL SECURITY;