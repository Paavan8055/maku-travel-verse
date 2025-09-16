-- Security Hardening - Critical Fixes
-- Fix 1: Secure agentic_tasks table with proper RLS
DROP POLICY IF EXISTS "Users and guests can create tasks" ON public.agentic_tasks;
DROP POLICY IF EXISTS "Users and guests can update their own tasks" ON public.agentic_tasks;
DROP POLICY IF EXISTS "Users and guests can view their own tasks" ON public.agentic_tasks;

-- Create new secure policies for agentic_tasks
CREATE POLICY "Authenticated users can create their own tasks" 
ON public.agentic_tasks 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = user_id);

CREATE POLICY "Users can view their own tasks" 
ON public.agentic_tasks 
FOR SELECT 
USING (auth.uid() = user_id OR is_secure_admin(auth.uid()));

CREATE POLICY "Users can update their own tasks" 
ON public.agentic_tasks 
FOR UPDATE 
USING (auth.uid() = user_id OR is_secure_admin(auth.uid()));

CREATE POLICY "Users can delete their own tasks" 
ON public.agentic_tasks 
FOR DELETE 
USING (auth.uid() = user_id OR is_secure_admin(auth.uid()));

-- Fix 2: Secure orchestration workflows
CREATE TABLE IF NOT EXISTS public.orchestration_workflows (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid NOT NULL,
    workflow_name text NOT NULL,
    configuration jsonb NOT NULL DEFAULT '{}',
    status text DEFAULT 'active',
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.orchestration_workflows ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own workflows" 
ON public.orchestration_workflows 
FOR ALL 
USING (auth.uid() = user_id OR is_secure_admin(auth.uid()))
WITH CHECK (auth.uid() = user_id OR is_secure_admin(auth.uid()));

-- Fix 3: Secure database functions with proper search_path
CREATE OR REPLACE FUNCTION public.get_user_agent_tasks(p_user_id uuid)
RETURNS TABLE(
    id uuid,
    agent_id text,
    task_type text,
    status text,
    progress integer,
    created_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public', 'pg_catalog'
AS $$
BEGIN
    -- Only allow users to access their own tasks or admins to access all
    IF p_user_id != auth.uid() AND NOT is_secure_admin(auth.uid()) THEN
        RAISE EXCEPTION 'Access denied';
    END IF;
    
    RETURN QUERY
    SELECT 
        t.id,
        t.agent_id,
        t.intent as task_type,
        t.status,
        t.progress,
        t.created_at
    FROM public.agentic_tasks t
    WHERE t.user_id = p_user_id
    ORDER BY t.created_at DESC;
END;
$$;

-- Fix 4: Secure vector memory access
ALTER TABLE public.agent_context_memory ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their agent context" ON public.agent_context_memory;
DROP POLICY IF EXISTS "Service role can manage agent context" ON public.agent_context_memory;

CREATE POLICY "Users can manage their own agent context" 
ON public.agent_context_memory 
FOR ALL 
USING (auth.uid() = user_id OR is_secure_admin(auth.uid()))
WITH CHECK (auth.uid() = user_id OR is_secure_admin(auth.uid()));

CREATE POLICY "Service role can manage agent context for authenticated users" 
ON public.agent_context_memory 
FOR ALL 
USING (auth.role() = 'service_role' AND user_id IS NOT NULL);

-- Fix 5: Secure learning metrics
ALTER TABLE public.agent_learning_metrics ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their learning metrics" ON public.agent_learning_metrics;
DROP POLICY IF EXISTS "Service role can manage learning metrics" ON public.agent_learning_metrics;

CREATE POLICY "Users can view their own learning metrics" 
ON public.agent_learning_metrics 
FOR SELECT 
USING (auth.uid() = user_id OR is_secure_admin(auth.uid()));

CREATE POLICY "Service role can manage metrics for authenticated users" 
ON public.agent_learning_metrics 
FOR ALL 
USING (auth.role() = 'service_role' AND (user_id IS NOT NULL OR is_secure_admin(auth.uid())));

-- Fix 6: Add audit logging for security events
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

-- Function to log security events
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