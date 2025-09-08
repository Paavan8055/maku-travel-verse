-- Fix remaining search_path security warnings
-- These functions need SECURITY DEFINER and search_path set

-- 1. Fix is_secure_admin function
CREATE OR REPLACE FUNCTION public.is_secure_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = _user_id 
    AND role = 'admin' 
    AND is_active = true
  ) OR EXISTS (
    SELECT 1 FROM public.admin_users 
    WHERE user_id = _user_id 
    AND is_active = true
  );
$function$;

-- 2. Fix remaining auth/database functions with missing search_path
-- These are functions that still appear in linter warnings

-- Add RLS policies to protect AI business intelligence data
ALTER TABLE public.ai_employee_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_employee_templates ENABLE ROW LEVEL SECURITY;

-- Drop existing overly permissive policies for AI skills and templates
DROP POLICY IF EXISTS "Users can view all skills" ON public.ai_employee_skills;
DROP POLICY IF EXISTS "Users can view all templates" ON public.ai_employee_templates;

-- Create restrictive policies for AI skills
CREATE POLICY "Authenticated users can view skills" 
ON public.ai_employee_skills FOR SELECT 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can view templates" 
ON public.ai_employee_templates FOR SELECT 
USING (auth.uid() IS NOT NULL);

-- Secure the orchestration_workflows table
CREATE TABLE IF NOT EXISTS public.orchestration_workflows (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    workflow_name text NOT NULL,
    workflow_config jsonb NOT NULL DEFAULT '{}',
    agent_sequence jsonb NOT NULL DEFAULT '[]',
    created_by uuid REFERENCES auth.users(id),
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    is_active boolean DEFAULT true
);

ALTER TABLE public.orchestration_workflows ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own workflows" 
ON public.orchestration_workflows FOR ALL 
USING (auth.uid() = created_by)
WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Admins can view all workflows" 
ON public.orchestration_workflows FOR SELECT 
USING (is_secure_admin(auth.uid()));

-- Secure the local_insights table
CREATE TABLE IF NOT EXISTS public.local_insights (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    location_name text NOT NULL,
    insight_type text NOT NULL,
    content text NOT NULL,
    metadata jsonb DEFAULT '{}',
    created_at timestamp with time zone DEFAULT now(),
    is_public boolean DEFAULT false
);

ALTER TABLE public.local_insights ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public insights are viewable by everyone" 
ON public.local_insights FOR SELECT 
USING (is_public = true);

CREATE POLICY "Private insights require authentication" 
ON public.local_insights FOR SELECT 
USING (auth.uid() IS NOT NULL);

-- Enhance guest task security - filter sensitive data from results
CREATE OR REPLACE FUNCTION public.get_filtered_guest_task(task_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
    task_result jsonb;
    filtered_result jsonb;
BEGIN
    SELECT result INTO task_result
    FROM agentic_tasks
    WHERE id = task_id AND user_id IS NULL;
    
    IF task_result IS NULL THEN
        RETURN NULL;
    END IF;
    
    -- Filter out sensitive fields from guest task results
    filtered_result := task_result - 'apiKeys' - 'secrets' - 'internalData' - 'privateInfo';
    
    RETURN filtered_result;
END;
$function$;