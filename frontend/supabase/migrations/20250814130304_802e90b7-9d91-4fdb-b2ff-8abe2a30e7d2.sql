-- Additional security hardening for profiles table
-- Ensure no anonymous access and add explicit deny policies

-- Add a policy to explicitly deny anonymous users from any access
CREATE POLICY "Deny anonymous access to profiles" 
ON public.profiles 
FOR ALL 
TO anon 
USING (false);

-- Add a policy to explicitly deny public role access
CREATE POLICY "Deny public access to profiles" 
ON public.profiles 
FOR ALL 
TO public 
USING (false);

-- Ensure only authenticated users with matching user_id can access profiles
-- Update existing policies to be more explicit (these will replace existing ones with same names)
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
CREATE POLICY "Users can view their own profile" 
ON public.profiles 
FOR SELECT 
TO authenticated 
USING (auth.uid() = user_id AND auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile" 
ON public.profiles 
FOR UPDATE 
TO authenticated 
USING (auth.uid() = user_id AND auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() = user_id AND auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
CREATE POLICY "Users can insert their own profile" 
ON public.profiles 
FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = user_id AND auth.uid() IS NOT NULL);

-- Verify RLS is enabled (should already be enabled)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Add additional security: ensure no one can delete profiles
CREATE POLICY "Prevent profile deletion" 
ON public.profiles 
FOR DELETE 
TO authenticated 
USING (false);