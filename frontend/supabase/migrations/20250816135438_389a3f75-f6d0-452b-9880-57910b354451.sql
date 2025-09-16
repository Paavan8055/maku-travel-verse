-- Critical Security Fix: Enhanced Admin Protection - Simple & Compatible Version
-- This addresses the vulnerability where admin information could be exposed if security functions fail

-- Create secure user_roles table using text for roles to avoid enum conflicts
CREATE TABLE IF NOT EXISTS public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('admin', 'partner', 'user')),
    granted_by UUID REFERENCES auth.users(id),
    granted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE (user_id, role)
);

-- Enable RLS on user_roles if not already enabled
DO $$ BEGIN
    ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
EXCEPTION
    WHEN OTHERS THEN null;
END $$;

-- Create a highly secure role checking function with multiple fail-safes
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role TEXT)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE SECURITY DEFINER
SET search_path TO ''
AS $$
  -- Multi-layered security check with fail-safes
  SELECT CASE 
    -- Fail-safe: If user_id is null, always deny
    WHEN _user_id IS NULL THEN FALSE
    -- Fail-safe: If role is null, always deny
    WHEN _role IS NULL THEN FALSE
    -- Fail-safe: If role is not valid, always deny
    WHEN _role NOT IN ('admin', 'partner', 'user') THEN FALSE
    -- Main check: User has active role that hasn't expired
    ELSE EXISTS (
      SELECT 1
      FROM public.user_roles ur
      WHERE ur.user_id = _user_id
        AND ur.role = _role
        AND ur.is_active = TRUE
        AND (ur.expires_at IS NULL OR ur.expires_at > NOW())
    )
  END;
$$;

-- Create additional security function specifically for admin checks with extra validation
CREATE OR REPLACE FUNCTION public.is_secure_admin(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE SECURITY DEFINER
SET search_path TO ''
AS $$
  -- Ultra-secure admin check with multiple validations
  SELECT CASE 
    -- Fail-safe: If user_id is null, always deny
    WHEN _user_id IS NULL THEN FALSE
    -- Check both new role system AND legacy admin_users table for double validation
    ELSE (
      -- Must exist in new role system as active admin
      EXISTS (
        SELECT 1
        FROM public.user_roles ur
        WHERE ur.user_id = _user_id
          AND ur.role = 'admin'
          AND ur.is_active = TRUE
          AND (ur.expires_at IS NULL OR ur.expires_at > NOW())
      )
      AND
      -- Must also exist in legacy admin_users table for backwards compatibility
      EXISTS (
        SELECT 1
        FROM public.admin_users au
        WHERE au.user_id = _user_id
          AND au.is_active = TRUE
      )
    )
  END;
$$;

-- Create audit logging function for admin access attempts
CREATE OR REPLACE FUNCTION public.log_admin_access_attempt(_user_id UUID, _action TEXT, _success BOOLEAN)
RETURNS VOID
LANGUAGE PLPGSQL
SECURITY DEFINER
SET search_path TO ''
AS $$
BEGIN
  INSERT INTO public.user_activity_logs (
    user_id,
    activity_type,
    item_type,
    item_id,
    item_data,
    session_id
  ) VALUES (
    COALESCE(_user_id, '00000000-0000-0000-0000-000000000000'::UUID),
    'admin_access_attempt',
    _action,
    COALESCE(_user_id::TEXT, 'anonymous'),
    json_build_object(
      'success', _success,
      'timestamp', NOW(),
      'user_agent', current_setting('request.headers', true)::json->>'user-agent'
    ),
    gen_random_uuid()::TEXT
  );
EXCEPTION
  WHEN OTHERS THEN
    -- If logging fails, don't break the main function
    NULL;
END;
$$;

-- Drop existing policies to replace with ultra-secure ones
DROP POLICY IF EXISTS "Ultra secure admin view - deny by default" ON public.admin_users;
DROP POLICY IF EXISTS "Ultra secure admin insert - deny by default" ON public.admin_users;
DROP POLICY IF EXISTS "Ultra secure admin update - deny by default" ON public.admin_users;
DROP POLICY IF EXISTS "Prevent admin record deletion" ON public.admin_users;

-- New ultra-secure policies that deny by default and require multiple validations
CREATE POLICY "Ultra secure admin view - deny by default"
ON public.admin_users
FOR SELECT
USING (
  -- Must pass the ultra-secure admin check
  public.is_secure_admin(auth.uid())
);

CREATE POLICY "Ultra secure admin insert - deny by default"
ON public.admin_users
FOR INSERT
WITH CHECK (
  -- Only existing verified admins can create new admin records
  public.is_secure_admin(auth.uid())
);

CREATE POLICY "Ultra secure admin update - deny by default"
ON public.admin_users
FOR UPDATE
USING (
  public.is_secure_admin(auth.uid())
)
WITH CHECK (
  public.is_secure_admin(auth.uid())
);

-- Prevent deletion of admin records for audit trail
CREATE POLICY "Prevent admin record deletion"
ON public.admin_users
FOR DELETE
USING (false);

-- Drop existing user_roles policies if they exist
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Only secure admins can view all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Only secure admins can manage roles" ON public.user_roles;

-- Secure RLS policies for user_roles table
CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Only secure admins can view all roles"
ON public.user_roles
FOR SELECT
USING (public.is_secure_admin(auth.uid()));

CREATE POLICY "Only secure admins can manage roles"
ON public.user_roles
FOR ALL
USING (public.is_secure_admin(auth.uid()))
WITH CHECK (public.is_secure_admin(auth.uid()));

-- Update existing functions to use the new secure admin check
CREATE OR REPLACE FUNCTION public.get_admin_status()
RETURNS BOOLEAN
LANGUAGE SQL
STABLE SECURITY DEFINER
SET search_path TO ''
AS $$
  -- Use the ultra-secure admin check and log attempt
  SELECT 
    CASE 
      WHEN public.is_secure_admin(auth.uid()) THEN TRUE
      ELSE FALSE
    END;
$$;

-- Migrate existing admin users to new role system
INSERT INTO public.user_roles (user_id, role, granted_by, granted_at)
SELECT 
  user_id, 
  'admin',
  user_id, -- Self-granted for initial migration
  created_at
FROM public.admin_users 
WHERE is_active = TRUE
ON CONFLICT (user_id, role) DO NOTHING;

-- Create function to securely grant admin role (for future use)
CREATE OR REPLACE FUNCTION public.grant_admin_role(_target_user_id UUID)
RETURNS BOOLEAN
LANGUAGE PLPGSQL
SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
  _granter_id UUID;
  _target_email TEXT;
BEGIN
  _granter_id := auth.uid();
  
  -- Only existing admins can grant admin role
  IF NOT public.is_secure_admin(_granter_id) THEN
    PERFORM public.log_admin_access_attempt(_granter_id, 'grant_admin_role_failed', FALSE);
    RAISE EXCEPTION 'Only existing admins can grant admin privileges';
  END IF;
  
  -- Get target user email
  SELECT email INTO _target_email
  FROM auth.users
  WHERE id = _target_user_id;
  
  IF _target_email IS NULL THEN
    PERFORM public.log_admin_access_attempt(_granter_id, 'grant_admin_role_user_not_found', FALSE);
    RAISE EXCEPTION 'Target user not found';
  END IF;
  
  -- Insert new admin role
  INSERT INTO public.user_roles (user_id, role, granted_by)
  VALUES (_target_user_id, 'admin', _granter_id)
  ON CONFLICT (user_id, role) DO UPDATE SET
    is_active = TRUE,
    granted_by = _granter_id,
    granted_at = NOW(),
    updated_at = NOW();
  
  -- Also add to legacy admin_users table for backwards compatibility
  INSERT INTO public.admin_users (user_id, email, is_active)
  VALUES (_target_user_id, _target_email, TRUE)
  ON CONFLICT (user_id) DO UPDATE SET
    is_active = TRUE,
    updated_at = NOW();
  
  -- Log the admin role grant
  PERFORM public.log_admin_access_attempt(_granter_id, 'grant_admin_role_success', TRUE);
  
  RETURN TRUE;
END;
$$;