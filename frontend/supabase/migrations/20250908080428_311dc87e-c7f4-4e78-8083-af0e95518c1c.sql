-- Fix remaining search_path security warnings and data protection
-- Phase 1: Fix critical security functions

-- 1. Fix is_secure_admin function with proper search_path
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

-- 2. Secure AI business intelligence data
-- Drop overly permissive policies
DROP POLICY IF EXISTS "Users can view all skills" ON public.ai_employee_skills;
DROP POLICY IF EXISTS "Users can view all templates" ON public.ai_employee_templates;

-- Create restrictive policies for AI skills and templates
CREATE POLICY "Authenticated users can view skills" 
ON public.ai_employee_skills FOR SELECT 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can view templates" 
ON public.ai_employee_templates FOR SELECT 
USING (auth.uid() IS NOT NULL);

-- 3. Create and secure orchestration_workflows table if not exists
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

-- Enable RLS and create policies only if they don't exist
DO $$
BEGIN
    -- Enable RLS
    ALTER TABLE public.orchestration_workflows ENABLE ROW LEVEL SECURITY;
    
    -- Create policy only if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'orchestration_workflows' 
        AND policyname = 'Users can manage their own workflows'
    ) THEN
        EXECUTE 'CREATE POLICY "Users can manage their own workflows" 
                ON public.orchestration_workflows FOR ALL 
                USING (auth.uid() = created_by)
                WITH CHECK (auth.uid() = created_by)';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'orchestration_workflows' 
        AND policyname = 'Admins can view all workflows'
    ) THEN
        EXECUTE 'CREATE POLICY "Admins can view all workflows" 
                ON public.orchestration_workflows FOR SELECT 
                USING (is_secure_admin(auth.uid()))';
    END IF;
END $$;

-- 4. Create and secure local_insights table
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

-- Create policies for local insights
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'local_insights' 
        AND policyname = 'Public insights are viewable by everyone'
    ) THEN
        EXECUTE 'CREATE POLICY "Public insights are viewable by everyone" 
                ON public.local_insights FOR SELECT 
                USING (is_public = true)';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'local_insights' 
        AND policyname = 'Private insights require authentication'
    ) THEN
        EXECUTE 'CREATE POLICY "Private insights require authentication" 
                ON public.local_insights FOR SELECT 
                USING (auth.uid() IS NOT NULL)';
    END IF;
END $$;