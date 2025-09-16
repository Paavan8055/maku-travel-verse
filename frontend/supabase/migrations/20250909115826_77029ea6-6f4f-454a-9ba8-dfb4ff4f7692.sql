-- Create prompt management tables
CREATE TABLE public.prompt_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  external_id TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  content TEXT NOT NULL,
  version TEXT NOT NULL DEFAULT '1.0.0',
  category TEXT DEFAULT 'general',
  tags TEXT[] DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  metadata JSONB DEFAULT '{}',
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create prompt usage analytics table
CREATE TABLE public.prompt_usage_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prompt_id UUID REFERENCES public.prompt_templates(id) ON DELETE CASCADE,
  external_prompt_id TEXT,
  user_id UUID,
  session_id TEXT,
  usage_context JSONB DEFAULT '{}',
  performance_metrics JSONB DEFAULT '{}',
  response_time_ms INTEGER,
  success BOOLEAN DEFAULT true,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create prompt versions table for tracking changes
CREATE TABLE public.prompt_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prompt_id UUID REFERENCES public.prompt_templates(id) ON DELETE CASCADE,
  version TEXT NOT NULL,
  content TEXT NOT NULL,
  changelog TEXT,
  is_current BOOLEAN DEFAULT false,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.prompt_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prompt_usage_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prompt_versions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for prompt_templates
CREATE POLICY "Admins can manage all prompts" 
ON public.prompt_templates FOR ALL 
USING (is_secure_admin(auth.uid()));

CREATE POLICY "Authenticated users can read active prompts" 
ON public.prompt_templates FOR SELECT 
USING (auth.uid() IS NOT NULL AND is_active = true);

-- RLS Policies for prompt_usage_analytics  
CREATE POLICY "Service role can manage analytics" 
ON public.prompt_usage_analytics FOR ALL 
USING (auth.role() = 'service_role');

CREATE POLICY "Admins can view analytics" 
ON public.prompt_usage_analytics FOR SELECT 
USING (is_secure_admin(auth.uid()));

CREATE POLICY "Users can view their own analytics" 
ON public.prompt_usage_analytics FOR SELECT 
USING (auth.uid() = user_id);

-- RLS Policies for prompt_versions
CREATE POLICY "Admins can manage prompt versions" 
ON public.prompt_versions FOR ALL 
USING (is_secure_admin(auth.uid()));

CREATE POLICY "Authenticated users can read prompt versions" 
ON public.prompt_versions FOR SELECT 
USING (auth.uid() IS NOT NULL);

-- Triggers for updated_at
CREATE TRIGGER update_prompt_templates_updated_at
BEFORE UPDATE ON public.prompt_templates
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add indexes for performance
CREATE INDEX idx_prompt_templates_external_id ON public.prompt_templates(external_id);
CREATE INDEX idx_prompt_templates_category ON public.prompt_templates(category);
CREATE INDEX idx_prompt_templates_active ON public.prompt_templates(is_active);
CREATE INDEX idx_prompt_usage_analytics_prompt_id ON public.prompt_usage_analytics(prompt_id);
CREATE INDEX idx_prompt_usage_analytics_created_at ON public.prompt_usage_analytics(created_at);
CREATE INDEX idx_prompt_versions_prompt_id ON public.prompt_versions(prompt_id);
CREATE INDEX idx_prompt_versions_current ON public.prompt_versions(is_current);