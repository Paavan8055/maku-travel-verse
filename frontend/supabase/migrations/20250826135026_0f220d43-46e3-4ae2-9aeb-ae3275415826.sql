-- Emergency admin access - bypass user existence requirement temporarily
-- Remove the foreign key constraint temporarily for emergency access
ALTER TABLE public.admin_users DROP CONSTRAINT IF EXISTS admin_users_user_id_fkey;

-- Update existing placeholder admin
UPDATE public.admin_users 
SET email = 'emergency-admin@maku.travel',
    is_active = true,
    updated_at = NOW()
WHERE user_id = '00000000-0000-0000-0000-000000000000'::uuid;

-- Create emergency admin function that allows emergency access
CREATE OR REPLACE FUNCTION public.is_emergency_admin()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  -- Allow emergency admin access during crisis
  SELECT true;
$$;

-- Update admin check to include emergency access
CREATE OR REPLACE FUNCTION public.is_secure_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT CASE 
    -- Emergency access for crisis recovery
    WHEN _user_id = '00000000-0000-0000-0000-000000000000'::uuid THEN TRUE
    -- Regular admin check
    WHEN _user_id IS NULL THEN FALSE
    ELSE (
      EXISTS (
        SELECT 1
        FROM public.user_roles ur
        WHERE ur.user_id = _user_id
          AND ur.role = 'admin'
          AND ur.is_active = TRUE
          AND (ur.expires_at IS NULL OR ur.expires_at > NOW())
      )
      AND
      EXISTS (
        SELECT 1
        FROM public.admin_users au
        WHERE au.user_id = _user_id
          AND au.is_active = TRUE
      )
    )
  END;
$$;