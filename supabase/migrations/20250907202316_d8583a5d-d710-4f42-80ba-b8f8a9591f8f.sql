-- Add workflow orchestration tables
CREATE TABLE IF NOT EXISTS public.gpt_bot_workflows (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workflow_name TEXT NOT NULL,
    description TEXT,
    workflow_steps JSONB NOT NULL DEFAULT '[]',
    created_by UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    is_template BOOLEAN DEFAULT false,
    category TEXT DEFAULT 'custom',
    estimated_duration_minutes INTEGER DEFAULT 10,
    success_rate NUMERIC DEFAULT 0,
    usage_count INTEGER DEFAULT 0
);

-- Enable RLS
ALTER TABLE public.gpt_bot_workflows ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view workflow templates" 
ON public.gpt_bot_workflows 
FOR SELECT 
USING (is_template = true OR created_by = auth.uid());

CREATE POLICY "Users can create workflows" 
ON public.gpt_bot_workflows 
FOR INSERT 
WITH CHECK (created_by = auth.uid());

CREATE POLICY "Users can update their workflows" 
ON public.gpt_bot_workflows 
FOR UPDATE 
USING (created_by = auth.uid());

CREATE POLICY "Admins can manage all workflows" 
ON public.gpt_bot_workflows 
FOR ALL 
USING (is_secure_admin(auth.uid()));

-- Workflow execution tracking
CREATE TABLE IF NOT EXISTS public.gpt_bot_workflow_executions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workflow_id UUID REFERENCES public.gpt_bot_workflows(id),
    user_id UUID,
    session_id TEXT,
    status TEXT DEFAULT 'running',
    current_step INTEGER DEFAULT 0,
    step_results JSONB DEFAULT '[]',
    started_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    completed_at TIMESTAMP WITH TIME ZONE,
    total_execution_time_ms INTEGER,
    error_message TEXT,
    metadata JSONB DEFAULT '{}'
);

-- Enable RLS
ALTER TABLE public.gpt_bot_workflow_executions ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their workflow executions" 
ON public.gpt_bot_workflow_executions 
FOR SELECT 
USING (user_id = auth.uid());

CREATE POLICY "Users can create workflow executions" 
ON public.gpt_bot_workflow_executions 
FOR INSERT 
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Service role can manage workflow executions" 
ON public.gpt_bot_workflow_executions 
FOR ALL 
USING (auth.role() = 'service_role');

-- Add workflow_id and token_usage to usage logs
ALTER TABLE public.gpt_bot_usage_logs 
ADD COLUMN IF NOT EXISTS workflow_id UUID,
ADD COLUMN IF NOT EXISTS token_usage JSONB;

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_gpt_bot_workflows_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_gpt_bot_workflows_updated_at
  BEFORE UPDATE ON public.gpt_bot_workflows
  FOR EACH ROW
  EXECUTE FUNCTION update_gpt_bot_workflows_updated_at();