-- Grant admin access to paavanbhanvadiya@live.com
-- User ID: ef3e63c7-b68e-4cc3-b23f-97b5bb34cc3c

-- Insert into admin_users table
INSERT INTO public.admin_users (user_id, email, is_active)
VALUES ('ef3e63c7-b68e-4cc3-b23f-97b5bb34cc3c', 'paavanbhanvadiya@live.com', true)
ON CONFLICT (user_id) DO UPDATE SET
  is_active = true,
  updated_at = NOW();

-- Insert into user_roles table  
INSERT INTO public.user_roles (user_id, role, granted_by, is_active)
VALUES ('ef3e63c7-b68e-4cc3-b23f-97b5bb34cc3c', 'admin', 'ef3e63c7-b68e-4cc3-b23f-97b5bb34cc3c', true)
ON CONFLICT (user_id, role) DO UPDATE SET
  is_active = true,
  granted_at = NOW(),
  updated_at = NOW();

-- Verify admin access is working
SELECT 
  au.email,
  au.is_active as admin_active,
  ur.role,
  ur.is_active as role_active,
  public.is_secure_admin(au.user_id) as has_secure_admin_access
FROM public.admin_users au
LEFT JOIN public.user_roles ur ON au.user_id = ur.user_id AND ur.role = 'admin'
WHERE au.email = 'paavanbhanvadiya@live.com';