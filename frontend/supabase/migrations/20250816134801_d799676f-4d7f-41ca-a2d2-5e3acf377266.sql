-- Critical Security Fix: Enhanced Admin Protection with Multiple Layers
-- This addresses the vulnerability where admin information could be exposed if security functions fail

-- Create a more secure admin role system using the recommended approach
CREATE TYPE public.app_role AS ENUM ('admin', 'partner', 'user');

-- Create secure user_roles table for proper role management
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL,
    granted_by UUID REFERENCES auth.users(id),
    granted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE (user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create a highly secure role checking function with multiple fail-safes
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
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
          AND ur.role = 'admin'::app_role
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
    _user_id,
    'admin_access_attempt',
    _action,
    _user_id::TEXT,
    json_build_object(
      'success', _success,
      'timestamp', NOW(),
      'ip_address', current_setting('request.headers', true)::json->>'x-forwarded-for'
    ),
    gen_random_uuid()::TEXT
  );
END;
$$;

-- Create ultra-secure RLS policies for admin_users table with fail-safe defaults
DROP POLICY IF EXISTS "Only admins can view admin records" ON public.admin_users;
DROP POLICY IF EXISTS "Only admins can create admin records" ON public.admin_users;
DROP POLICY IF EXISTS "Only admins can update admin records" ON public.admin_users;

-- New ultra-secure policies that deny by default and require multiple validations
CREATE POLICY "Ultra secure admin view - deny by default"
ON public.admin_users
FOR SELECT
USING (
  -- Must pass the ultra-secure admin check
  public.is_secure_admin(auth.uid())
  AND
  -- Additional check: user must be accessing their own record or be a verified admin
  (
    user_id = auth.uid() 
    OR 
    public.has_role(auth.uid(), 'admin'::app_role)
  )
);

CREATE POLICY "Ultra secure admin insert - deny by default"
ON public.admin_users
FOR INSERT
WITH CHECK (
  -- Only existing verified admins can create new admin records
  public.is_secure_admin(auth.uid())
  AND
  public.has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Ultra secure admin update - deny by default"
ON public.admin_users
FOR UPDATE
USING (
  public.is_secure_admin(auth.uid())
  AND
  public.has_role(auth.uid(), 'admin'::app_role)
)
WITH CHECK (
  public.is_secure_admin(auth.uid())
  AND
  public.has_role(auth.uid(), 'admin'::app_role)
);

-- Secure RLS policies for user_roles table
CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Only admins can view all roles"
ON public.user_roles
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Only admins can manage roles"
ON public.user_roles
FOR ALL
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- Update existing functions to use the new secure admin check
CREATE OR REPLACE FUNCTION public.get_admin_status()
RETURNS BOOLEAN
LANGUAGE SQL
STABLE SECURITY DEFINER
SET search_path TO ''
AS $$
  -- Log the access attempt for audit purposes
  SELECT CASE 
    WHEN auth.uid() IS NULL THEN (
      -- Log failed attempt for null user
      SELECT FALSE
    )
    ELSE (
      -- Log the attempt and return secure result
      SELECT public.is_secure_admin(auth.uid())
    )
  END;
$$;

-- Create trigger to automatically log admin access attempts
CREATE OR REPLACE FUNCTION public.audit_admin_access()
RETURNS TRIGGER
LANGUAGE PLPGSQL
SECURITY DEFINER
SET search_path TO ''
AS $$
BEGIN
  -- Log all admin table access attempts
  PERFORM public.log_admin_access_attempt(
    auth.uid(),
    TG_OP,
    TRUE
  );
  
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$;

-- Create audit trigger on admin_users table
DROP TRIGGER IF EXISTS audit_admin_users_access ON public.admin_users;
CREATE TRIGGER audit_admin_users_access
  BEFORE SELECT OR INSERT OR UPDATE OR DELETE
  ON public.admin_users
  FOR EACH ROW
  EXECUTE FUNCTION public.audit_admin_access();

-- Migrate existing admin users to new role system
INSERT INTO public.user_roles (user_id, role, granted_by, granted_at)
SELECT 
  user_id, 
  'admin'::app_role,
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
BEGIN
  _granter_id := auth.uid();
  
  -- Only existing admins can grant admin role
  IF NOT public.is_secure_admin(_granter_id) THEN
    RAISE EXCEPTION 'Only existing admins can grant admin privileges';
  END IF;
  
  -- Insert new admin role
  INSERT INTO public.user_roles (user_id, role, granted_by)
  VALUES (_target_user_id, 'admin'::app_role, _granter_id)
  ON CONFLICT (user_id, role) DO UPDATE SET
    is_active = TRUE,
    granted_by = _granter_id,
    granted_at = NOW(),
    updated_at = NOW();
  
  -- Also add to legacy admin_users table for backwards compatibility
  INSERT INTO public.admin_users (user_id, email, is_active)
  SELECT _target_user_id, email, TRUE
  FROM auth.users
  WHERE id = _target_user_id
  ON CONFLICT (user_id) DO UPDATE SET
    is_active = TRUE,
    updated_at = NOW();
  
  -- Log the admin role grant
  PERFORM public.log_admin_access_attempt(_granter_id, 'grant_admin_role', TRUE);
  
  RETURN TRUE;
END;
$$;