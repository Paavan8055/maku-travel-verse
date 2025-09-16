-- Create a secure function to check if a user is an admin by user_id only
-- This prevents email enumeration attacks while maintaining functionality
CREATE OR REPLACE FUNCTION public.is_user_admin(check_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.admin_users 
    WHERE user_id = check_user_id AND is_active = true
  );
$$;

-- Create a function to get admin status safely (returns boolean only, no emails)
CREATE OR REPLACE FUNCTION public.get_admin_status()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.admin_users 
    WHERE user_id = auth.uid() AND is_active = true
  );
$$;

-- Update RLS policies to be more restrictive
DROP POLICY IF EXISTS "Admin users can view themselves" ON public.admin_users;
DROP POLICY IF EXISTS "Admin users can insert their own record" ON public.admin_users;

-- Only allow admins to view admin records (no email exposure to non-admins)
CREATE POLICY "Only admins can view admin records"
ON public.admin_users
FOR SELECT
USING (public.is_user_admin(auth.uid()));

-- Only allow existing admins to create new admin records
CREATE POLICY "Only admins can create admin records"
ON public.admin_users  
FOR INSERT
WITH CHECK (public.is_user_admin(auth.uid()));

-- Only allow admins to update admin records
CREATE POLICY "Only admins can update admin records"
ON public.admin_users
FOR UPDATE
USING (public.is_user_admin(auth.uid()));

-- Prevent deletion of admin records for audit trail
CREATE POLICY "Prevent admin record deletion"
ON public.admin_users
FOR DELETE
USING (false);