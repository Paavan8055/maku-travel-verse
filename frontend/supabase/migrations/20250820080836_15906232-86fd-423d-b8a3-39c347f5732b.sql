-- Fix the remaining functions that still need secure search path
CREATE OR REPLACE FUNCTION public.log_admin_access_attempt(_user_id uuid, _action text, _success boolean)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
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

CREATE OR REPLACE FUNCTION public.grant_admin_role(_target_user_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE
  _granter_id UUID;
  _target_email TEXT;
BEGIN
  _granter_id := auth.uid();
  
  -- Only existing admins can grant admin role
  IF NOT public.is_secure_admin(_granter_id) THEN
    PERFORM public.log_admin_access_attempt(_granter_id, 'grant_admin_role_failed', FALSE);
    RAISE EXCEPTION 'Only existing admins can grant admin privileges';
  END IF;
  
  -- Get target user email
  SELECT email INTO _target_email
  FROM auth.users
  WHERE id = _target_user_id;
  
  IF _target_email IS NULL THEN
    PERFORM public.log_admin_access_attempt(_granter_id, 'grant_admin_role_user_not_found', FALSE);
    RAISE EXCEPTION 'Target user not found';
  END IF;
  
  -- Insert new admin role
  INSERT INTO public.user_roles (user_id, role, granted_by)
  VALUES (_target_user_id, 'admin', _granter_id)
  ON CONFLICT (user_id, role) DO UPDATE SET
    is_active = TRUE,
    granted_by = _granter_id,
    granted_at = NOW(),
    updated_at = NOW();
  
  -- Also add to legacy admin_users table for backwards compatibility
  INSERT INTO public.admin_users (user_id, email, is_active)
  VALUES (_target_user_id, _target_email, TRUE)
  ON CONFLICT (user_id) DO UPDATE SET
    is_active = TRUE,
    updated_at = NOW();
  
  -- Log the admin role grant
  PERFORM public.log_admin_access_attempt(_granter_id, 'grant_admin_role_success', TRUE);
  
  RETURN TRUE;
END;
$function$;

CREATE OR REPLACE FUNCTION public.check_bookmark_limit()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
BEGIN
  IF (SELECT COUNT(*) FROM public.user_dream_bookmarks WHERE user_id = NEW.user_id) >= 100 THEN
    RAISE EXCEPTION 'Maximum 100 dream destinations allowed per user';
  END IF;
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.initialize_user_loyalty()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
BEGIN
  INSERT INTO public.loyalty_points (user_id)
  VALUES (NEW.user_id)
  ON CONFLICT (user_id) DO NOTHING;
  
  INSERT INTO public.travel_analytics (user_id, year)
  VALUES (NEW.user_id, EXTRACT(YEAR FROM CURRENT_DATE))
  ON CONFLICT (user_id, year) DO NOTHING;
  
  RETURN NEW;
END;
$function$;