-- Fix the last functions with correct signatures and search_path

-- Update has_role function with correct text type
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role text)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public', 'pg_catalog'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role::text
  );
$$;

-- Update handle_new_user function (no parameters)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public', 'pg_catalog'
AS $$
BEGIN
  -- Create user profile
  INSERT INTO public.profiles (user_id, email, created_at)
  VALUES (NEW.id, NEW.email, NOW())
  ON CONFLICT (user_id) DO NOTHING;
  
  RETURN NEW;
END;
$$;