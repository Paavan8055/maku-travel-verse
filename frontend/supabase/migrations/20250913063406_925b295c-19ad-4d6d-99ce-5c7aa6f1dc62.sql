-- Security Enhancement: Fix Profiles Table RLS Policies
-- Addresses: Customer Personal Data Protection

-- Drop existing problematic policies
DROP POLICY IF EXISTS "Deny anonymous access to profiles" ON public.profiles;
DROP POLICY IF EXISTS "Deny public access to profiles" ON public.profiles;
DROP POLICY IF EXISTS "Prevent profile deletion" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;

-- Create secure, GDPR-compliant RLS policies
-- Users can only view their own profile
CREATE POLICY "Users can view own profile only" 
ON public.profiles 
FOR SELECT 
TO authenticated 
USING (auth.uid() = user_id);

-- Users can only insert their own profile
CREATE POLICY "Users can insert own profile only" 
ON public.profiles 
FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = user_id AND auth.uid() IS NOT NULL);

-- Users can only update their own profile
CREATE POLICY "Users can update own profile only" 
ON public.profiles 
FOR UPDATE 
TO authenticated 
USING (auth.uid() = user_id AND auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() = user_id AND auth.uid() IS NOT NULL);

-- Users can delete their own profile (GDPR compliance)
CREATE POLICY "Users can delete own profile only" 
ON public.profiles 
FOR DELETE 
TO authenticated 
USING (auth.uid() = user_id AND auth.uid() IS NOT NULL);

-- Admin access for legitimate business operations
CREATE POLICY "Secure admins can manage profiles" 
ON public.profiles 
FOR ALL 
TO authenticated 
USING (is_secure_admin(auth.uid()))
WITH CHECK (is_secure_admin(auth.uid()));

-- Block all anonymous access completely
CREATE POLICY "Block anonymous access" 
ON public.profiles 
FOR ALL 
TO anon 
USING (false);

-- Block all public role access
CREATE POLICY "Block public access" 
ON public.profiles 
FOR ALL 
TO public 
USING (false);

-- Add security audit logging trigger for profile access
CREATE OR REPLACE FUNCTION log_profile_access()
RETURNS TRIGGER AS $$
BEGIN
  -- Log profile access attempts for security monitoring
  INSERT INTO public.system_logs (
    correlation_id, service_name, log_level, level, message, metadata, user_id
  ) VALUES (
    gen_random_uuid()::text, 
    'profile_access_audit', 
    'info', 
    'info',
    'Profile accessed: ' || TG_OP,
    jsonb_build_object(
      'profile_id', COALESCE(NEW.id, OLD.id),
      'operation', TG_OP,
      'accessed_by', auth.uid(),
      'timestamp', NOW()
    ),
    auth.uid()
  );
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;