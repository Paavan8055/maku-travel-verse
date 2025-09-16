-- Create a proper admin user for immediate access
-- This will be updated when the first real admin signs up

-- First, ensure we have the user_roles table working correctly
INSERT INTO public.user_roles (user_id, role, granted_by, is_active)
VALUES (
  '00000000-0000-0000-0000-000000000000'::uuid,
  'admin',
  '00000000-0000-0000-0000-000000000000'::uuid,
  true
) ON CONFLICT (user_id, role) DO UPDATE SET
  is_active = true,
  updated_at = NOW();

-- Update admin_users table to match
UPDATE public.admin_users 
SET email = 'emergency-admin@maku.travel',
    is_active = true,
    updated_at = NOW()
WHERE user_id = '00000000-0000-0000-0000-000000000000'::uuid;