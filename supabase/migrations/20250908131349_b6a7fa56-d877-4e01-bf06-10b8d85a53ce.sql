-- Security Hardening - Critical Fixes (Corrected)
-- Fix 1: Secure agentic_tasks table with proper RLS
DROP POLICY IF EXISTS "Users and guests can create tasks" ON public.agentic_tasks;
DROP POLICY IF EXISTS "Users and guests can update their own tasks" ON public.agentic_tasks;
DROP POLICY IF EXISTS "Users and guests can view their own tasks" ON public.agentic_tasks;

-- Create new secure policies for agentic_tasks - require authentication
CREATE POLICY "Authenticated users can create their own tasks" 
ON public.agentic_tasks 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = user_id);

CREATE POLICY "Users can view their own tasks or admins all" 
ON public.agentic_tasks 
FOR SELECT 
USING (auth.uid() = user_id OR is_secure_admin(auth.uid()));

CREATE POLICY "Users can update their own tasks or admins all" 
ON public.agentic_tasks 
FOR UPDATE 
USING (auth.uid() = user_id OR is_secure_admin(auth.uid()));

CREATE POLICY "Users can delete their own tasks or admins all" 
ON public.agentic_tasks 
FOR DELETE 
USING (auth.uid() = user_id OR is_secure_admin(auth.uid()));

-- Fix 2: Secure agent context memory
DROP POLICY IF EXISTS "Users can view their agent context" ON public.agent_context_memory;
DROP POLICY IF EXISTS "Service role can manage agent context" ON public.agent_context_memory;

CREATE POLICY "Users can manage their own agent context" 
ON public.agent_context_memory 
FOR ALL 
USING (auth.uid() IS NOT NULL AND (auth.uid() = user_id OR is_secure_admin(auth.uid())))
WITH CHECK (auth.uid() IS NOT NULL AND (auth.uid() = user_id OR is_secure_admin(auth.uid())));

CREATE POLICY "Service role can manage context for authenticated users only" 
ON public.agent_context_memory 
FOR ALL 
USING (auth.role() = 'service_role' AND user_id IS NOT NULL);

-- Fix 3: Secure learning metrics
DROP POLICY IF EXISTS "Users can view their learning metrics" ON public.agent_learning_metrics;
DROP POLICY IF EXISTS "Service role can manage learning metrics" ON public.agent_learning_metrics;

CREATE POLICY "Users can view their own learning metrics only" 
ON public.agent_learning_metrics 
FOR SELECT 
USING (auth.uid() IS NOT NULL AND (auth.uid() = user_id OR is_secure_admin(auth.uid())));

CREATE POLICY "Service role can manage metrics for authenticated users only" 
ON public.agent_learning_metrics 
FOR ALL 
USING (auth.role() = 'service_role' AND user_id IS NOT NULL);

-- Fix 4: Add security audit logging
CREATE TABLE IF NOT EXISTS public.security_audit_log (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid,
    action_type text NOT NULL,
    resource_type text NOT NULL,
    resource_id text,
    ip_address inet,
    user_agent text,
    success boolean DEFAULT true,
    error_message text,
    metadata jsonb DEFAULT '{}',
    created_at timestamptz DEFAULT now()
);

ALTER TABLE public.security_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all security audit logs" 
ON public.security_audit_log 
FOR SELECT 
USING (is_secure_admin(auth.uid()));

CREATE POLICY "Service role can insert security audit logs" 
ON public.security_audit_log 
FOR INSERT 
WITH CHECK (auth.role() = 'service_role');

-- Function to log security events with proper search path
CREATE OR REPLACE FUNCTION public.log_security_event(
    p_action_type text,
    p_resource_type text,
    p_resource_id text DEFAULT NULL,
    p_success boolean DEFAULT true,
    p_error_message text DEFAULT NULL,
    p_metadata jsonb DEFAULT '{}'
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public', 'pg_catalog'
AS $$
BEGIN
    INSERT INTO public.security_audit_log (
        user_id,
        action_type,
        resource_type,
        resource_id,
        success,
        error_message,
        metadata
    ) VALUES (
        auth.uid(),
        p_action_type,
        p_resource_type,
        p_resource_id,
        p_success,
        p_error_message,
        p_metadata
    );
EXCEPTION
    WHEN OTHERS THEN
        -- Don't fail if logging fails
        NULL;
END;
$$;