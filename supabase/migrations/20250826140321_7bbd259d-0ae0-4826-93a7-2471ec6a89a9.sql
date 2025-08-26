-- Grant admin access to paavanbhanvadiya@live.com
-- Correct User ID: f9208e3b-5612-47d8-b98e-02809b3bc89c

-- Insert into admin_users table
INSERT INTO public.admin_users (user_id, email, is_active)
VALUES ('f9208e3b-5612-47d8-b98e-02809b3bc89c', 'paavanbhanvadiya@live.com', true);

-- Insert into user_roles table  
INSERT INTO public.user_roles (user_id, role, granted_by, is_active)
VALUES ('f9208e3b-5612-47d8-b98e-02809b3bc89c', 'admin', 'f9208e3b-5612-47d8-b98e-02809b3bc89c', true);

-- Verify admin access
SELECT 
  au.email,
  au.is_active as admin_active,
  ur.role,
  ur.is_active as role_active,
  public.is_secure_admin(au.user_id) as has_secure_admin_access
FROM public.admin_users au
LEFT JOIN public.user_roles ur ON au.user_id = ur.user_id AND ur.role = 'admin'
WHERE au.email = 'paavanbhanvadiya@live.com';