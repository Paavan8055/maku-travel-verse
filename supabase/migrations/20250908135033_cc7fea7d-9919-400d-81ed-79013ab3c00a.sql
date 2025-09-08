-- Fix the last function with search_path issue - likely has_role or handle_new_user

-- Update has_role function (user roles helper function)
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public', 'pg_catalog'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  );
$$;

-- Update handle_new_user function (auth trigger function)  
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public', 'pg_catalog'
AS $$
BEGIN
  -- Create user profile
  INSERT INTO public.profiles (user_id, email, created_at)
  VALUES (NEW.id, NEW.email, NOW());
  
  -- Initialize user loyalty if table exists
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'loyalty_points'
  ) THEN
    PERFORM initialize_user_loyalty();
  END IF;
  
  RETURN NEW;
END;
$$;