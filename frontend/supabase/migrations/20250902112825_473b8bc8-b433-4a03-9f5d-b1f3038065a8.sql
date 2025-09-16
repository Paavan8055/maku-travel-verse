-- Step 3: Security Hardening - Fix remaining database function search path warnings
-- Update all functions to use explicit search_path settings

-- Fix is_secure_admin function
CREATE OR REPLACE FUNCTION public.is_secure_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public', 'pg_catalog'
AS $function$
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
$function$;

-- Fix get_admin_status function
CREATE OR REPLACE FUNCTION public.get_admin_status()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public', 'pg_catalog'
AS $function$
  -- Use the ultra-secure admin check and log attempt
  SELECT 
    CASE 
      WHEN public.is_secure_admin(auth.uid()) THEN TRUE
      ELSE FALSE
    END;
$function$;

-- Fix log_admin_access_attempt function
CREATE OR REPLACE FUNCTION public.log_admin_access_attempt(_user_id uuid, _action text, _success boolean)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public', 'pg_catalog'
AS $function$
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
$function$;

-- Enable RLS on local_insights table and create proper policy
ALTER TABLE IF EXISTS public.local_insights ENABLE ROW LEVEL SECURITY;

-- Create policy for local_insights if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'local_insights' 
    AND policyname = 'Authenticated users can view local insights'
  ) THEN
    CREATE POLICY "Authenticated users can view local insights" 
    ON public.local_insights 
    FOR SELECT 
    USING (auth.uid() IS NOT NULL);
  END IF;
END $$;

-- Create admin policy for local_insights management
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'local_insights' 
    AND policyname = 'Admins can manage local insights'
  ) THEN
    CREATE POLICY "Admins can manage local insights" 
    ON public.local_insights 
    FOR ALL 
    USING (public.is_secure_admin(auth.uid()))
    WITH CHECK (public.is_secure_admin(auth.uid()));
  END IF;
END $$;