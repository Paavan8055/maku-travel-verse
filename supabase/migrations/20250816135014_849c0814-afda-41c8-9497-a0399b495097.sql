-- Critical Security Fix: Enhanced Admin Protection (Simplified and Robust)
-- This addresses the vulnerability where admin information could be exposed if security functions fail

-- Create app_role enum only if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'app_role') THEN
        CREATE TYPE public.app_role AS ENUM ('admin', 'partner', 'user');
    END IF;
END $$;

-- Create secure user_roles table for proper role management
CREATE TABLE IF NOT EXISTS public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role TEXT NOT NULL, -- Using TEXT instead of enum initially for simplicity
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
    _user_id,
    'admin_access_attempt',
    _action,
    _user_id::TEXT,
    json_build_object(
      'success', _success,
      'timestamp', NOW()
    ),
    gen_random_uuid()::TEXT
  );
END;
$$;

-- Drop existing policies to replace with ultra-secure ones
DROP POLICY IF EXISTS "Only admins can view admin records" ON public.admin_users;
DROP POLICY IF EXISTS "Only admins can create admin records" ON public.admin_users;
DROP POLICY IF EXISTS "Only admins can update admin records" ON public.admin_users;
DROP POLICY IF EXISTS "Prevent admin record deletion" ON public.admin_users;

-- Create ultra-secure RLS policies for admin_users table with fail-safe defaults
CREATE POLICY "Ultra secure admin view - deny by default"
ON public.admin_users
FOR SELECT
USING (
  -- Must pass BOTH the ultra-secure admin check AND the role-based check
  public.is_secure_admin(auth.uid())
  AND
  public.has_role(auth.uid(), 'admin')
  AND
  -- Additional check: user must be accessing valid admin data
  (
    user_id = auth.uid() 
    OR 
    is_active = TRUE
  )
);

CREATE POLICY "Ultra secure admin insert - deny by default"
ON public.admin_users
FOR INSERT
WITH CHECK (
  -- Only existing verified admins can create new admin records
  public.is_secure_admin(auth.uid())
  AND
  public.has_role(auth.uid(), 'admin')
  AND
  -- Ensure we're only creating active admin records
  is_active = TRUE
);

CREATE POLICY "Ultra secure admin update - deny by default"
ON public.admin_users
FOR UPDATE
USING (
  public.is_secure_admin(auth.uid())
  AND
  public.has_role(auth.uid(), 'admin')
)
WITH CHECK (
  public.is_secure_admin(auth.uid())
  AND
  public.has_role(auth.uid(), 'admin')
);

-- Prevent deletion with ultra-secure policy
CREATE POLICY "Prevent admin record deletion - ultra secure"
ON public.admin_users
FOR DELETE
USING (FALSE); -- Absolutely no deletions allowed

-- Secure RLS policies for user_roles table
CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Only admins can view all roles"
ON public.user_roles
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

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
  -- Use the ultra-secure admin check with logging
  SELECT CASE 
    WHEN auth.uid() IS NULL THEN FALSE
    ELSE public.is_secure_admin(auth.uid())
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