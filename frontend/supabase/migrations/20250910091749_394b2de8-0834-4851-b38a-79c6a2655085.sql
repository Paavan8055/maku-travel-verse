-- Fix security warnings from linter

-- 1. Update function search paths to be more specific and secure
ALTER FUNCTION public.update_manager_hierarchies_updated_at() SET search_path = 'public';
ALTER FUNCTION public.update_updated_at_column() SET search_path = 'public';
ALTER FUNCTION public.update_agent_management_updated_at() SET search_path = 'public';
ALTER FUNCTION public.update_knowledge_base_search_vector() SET search_path = 'public';
ALTER FUNCTION public.update_agent_consolidated_updated_at() SET search_path = 'public';
ALTER FUNCTION public.update_api_configuration_updated_at() SET search_path = 'public';
ALTER FUNCTION public.update_provider_quotas_updated_at() SET search_path = 'public';
ALTER FUNCTION public.update_document_search_vector() SET search_path = 'public';
ALTER FUNCTION public.update_ai_workplace_updated_at() SET search_path = 'public';
ALTER FUNCTION public.update_updated_at_notifications() SET search_path = 'public';
ALTER FUNCTION public.update_updated_at_communication_preferences() SET search_path = 'public';
ALTER FUNCTION public.update_updated_at_booking_updates() SET search_path = 'public';
ALTER FUNCTION public.update_task_status_on_progress() SET search_path = 'public';

-- 2. Enhance admin security with additional verification
CREATE OR REPLACE FUNCTION public.verify_admin_access()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Verify user is authenticated
  IF auth.uid() IS NULL THEN
    RETURN false;
  END IF;
  
  -- Check admin status with multiple verification layers
  IF NOT public.is_secure_admin(auth.uid()) THEN
    RETURN false;
  END IF;
  
  -- Additional security: Check if user has recent activity
  IF NOT EXISTS (
    SELECT 1 FROM public.user_activity_logs 
    WHERE user_id = auth.uid() 
    AND created_at > NOW() - INTERVAL '7 days'
  ) THEN
    -- Log suspicious access attempt
    PERFORM public.log_admin_access_attempt(auth.uid(), 'inactive_admin_access', false);
    RETURN false;
  END IF;
  
  RETURN true;
END;
$$;

-- 3. Create secure admin session management
CREATE TABLE IF NOT EXISTS public.admin_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  session_token text NOT NULL UNIQUE,
  ip_address inet,
  user_agent text,
  created_at timestamptz DEFAULT NOW(),
  expires_at timestamptz DEFAULT (NOW() + INTERVAL '8 hours'),
  is_active boolean DEFAULT true,
  last_activity timestamptz DEFAULT NOW()
);

-- Enable RLS for admin sessions
ALTER TABLE public.admin_sessions ENABLE ROW LEVEL SECURITY;

-- Admin sessions policies
CREATE POLICY "Admins can manage their own sessions"
ON public.admin_sessions
FOR ALL
USING (is_secure_admin(auth.uid()) AND auth.uid() = user_id)
WITH CHECK (is_secure_admin(auth.uid()) AND auth.uid() = user_id);

-- 4. Add secure logging for all admin actions
CREATE OR REPLACE FUNCTION public.log_secure_admin_action(
  action_type text,
  resource_type text DEFAULT NULL,
  resource_id text DEFAULT NULL,
  action_data jsonb DEFAULT '{}'::jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  INSERT INTO public.system_logs (
    correlation_id,
    service_name,
    log_level,
    level,
    message,
    metadata,
    user_id
  ) VALUES (
    gen_random_uuid()::text,
    'admin_security',
    'info',
    'info',
    'Admin action: ' || action_type,
    jsonb_build_object(
      'action_type', action_type,
      'resource_type', resource_type,
      'resource_id', resource_id,
      'action_data', action_data,
      'timestamp', NOW(),
      'user_agent', current_setting('request.headers', true)::json->>'user-agent'
    ),
    auth.uid()
  );
END;
$$;