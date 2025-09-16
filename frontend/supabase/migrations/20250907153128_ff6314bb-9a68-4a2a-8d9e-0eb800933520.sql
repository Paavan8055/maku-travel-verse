-- Create orchestration_workflows table for database-driven workflow templates
CREATE TABLE IF NOT EXISTS public.orchestration_workflows (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL DEFAULT 'general',
  template_type TEXT NOT NULL DEFAULT 'standard',
  workflow_data JSONB NOT NULL DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.orchestration_workflows ENABLE ROW LEVEL SECURITY;

-- Admin access policies
CREATE POLICY "Admins can manage all workflows" ON public.orchestration_workflows
  FOR ALL USING (public.is_secure_admin(auth.uid()));

-- Users can view active templates
CREATE POLICY "Users can view active workflow templates" ON public.orchestration_workflows
  FOR SELECT USING (is_active = true);

-- Users can manage their own workflows
CREATE POLICY "Users can manage their own workflows" ON public.orchestration_workflows
  FOR ALL USING (auth.uid() = created_by);

-- Update trigger
CREATE TRIGGER update_orchestration_workflows_updated_at
  BEFORE UPDATE ON public.orchestration_workflows
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();