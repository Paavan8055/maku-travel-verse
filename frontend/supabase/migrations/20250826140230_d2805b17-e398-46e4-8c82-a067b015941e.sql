-- Grant admin access to paavanbhanvadiya@live.com 
-- User ID: ef3e63c7-b68e-4cc3-b23f-97b5bb34cc3c

-- Insert into admin_users table (use email for conflict resolution)
INSERT INTO public.admin_users (user_id, email, is_active)
VALUES ('ef3e63c7-b68e-4cc3-b23f-97b5bb34cc3c', 'paavanbhanvadiya@live.com', true)
ON CONFLICT (email) DO UPDATE SET
  user_id = EXCLUDED.user_id,
  is_active = true,
  updated_at = NOW();

-- Insert into user_roles table (no unique constraint, so check first)
INSERT INTO public.user_roles (user_id, role, granted_by, is_active)
SELECT 'ef3e63c7-b68e-4cc3-b23f-97b5bb34cc3c', 'admin', 'ef3e63c7-b68e-4cc3-b23f-97b5bb34cc3c', true
WHERE NOT EXISTS (
  SELECT 1 FROM public.user_roles 
  WHERE user_id = 'ef3e63c7-b68e-4cc3-b23f-97b5bb34cc3c' AND role = 'admin'
);

-- Verify the setup
SELECT 
  au.email,
  au.is_active as admin_active,
  ur.role,
  ur.is_active as role_active
FROM public.admin_users au
LEFT JOIN public.user_roles ur ON au.user_id = ur.user_id AND ur.role = 'admin'
WHERE au.email = 'paavanbhanvadiya@live.com';