-- Create enhanced agent memory tables for advanced learning and adaptation
CREATE TABLE IF NOT EXISTS public.enhanced_agent_memory (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  agent_id TEXT NOT NULL,
  user_id UUID,
  memory_type TEXT NOT NULL DEFAULT 'episodic',
  content JSONB NOT NULL DEFAULT '{}',
  importance_score NUMERIC DEFAULT 0.5,
  access_count INTEGER DEFAULT 0,
  last_accessed TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE
);

-- Create agent learning metrics table
CREATE TABLE IF NOT EXISTS public.agent_learning_metrics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  agent_id TEXT NOT NULL,
  user_id UUID,
  metric_type TEXT NOT NULL,
  metric_value NUMERIC NOT NULL,
  context JSONB DEFAULT '{}',
  feedback_score NUMERIC,
  improvement_delta NUMERIC DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create safety validation logs table
CREATE TABLE IF NOT EXISTS public.agent_safety_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  agent_id TEXT NOT NULL,
  request_id TEXT NOT NULL,
  validation_type TEXT NOT NULL,
  input_content JSONB NOT NULL,
  output_content JSONB,
  safety_score NUMERIC DEFAULT 1.0,
  violations JSONB DEFAULT '[]',
  action_taken TEXT,
  escalated_to_human BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create human feedback table for RLHF
CREATE TABLE IF NOT EXISTS public.agent_human_feedback (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  agent_id TEXT NOT NULL,
  user_id UUID NOT NULL,
  task_id UUID,
  interaction_context JSONB NOT NULL,
  feedback_type TEXT NOT NULL,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  feedback_text TEXT,
  improvement_suggestions JSONB DEFAULT '[]',
  processed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.enhanced_agent_memory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_learning_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_safety_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_human_feedback ENABLE ROW LEVEL SECURITY;

-- RLS Policies for enhanced_agent_memory
CREATE POLICY "Service role can manage enhanced agent memory" 
ON public.enhanced_agent_memory FOR ALL 
USING (auth.role() = 'service_role');

CREATE POLICY "Users can access their agent memory" 
ON public.enhanced_agent_memory FOR SELECT 
USING (auth.uid() = user_id);

-- RLS Policies for agent_learning_metrics
CREATE POLICY "Service role can manage learning metrics" 
ON public.agent_learning_metrics FOR ALL 
USING (auth.role() = 'service_role');

CREATE POLICY "Users can view their learning metrics" 
ON public.agent_learning_metrics FOR SELECT 
USING (auth.uid() = user_id);

-- RLS Policies for agent_safety_logs
CREATE POLICY "Admins can view all safety logs" 
ON public.agent_safety_logs FOR SELECT 
USING (is_secure_admin(auth.uid()));

CREATE POLICY "Service role can manage safety logs" 
ON public.agent_safety_logs FOR ALL 
USING (auth.role() = 'service_role');

-- RLS Policies for agent_human_feedback
CREATE POLICY "Users can manage their own feedback" 
ON public.agent_human_feedback FOR ALL 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Service role can read feedback" 
ON public.agent_human_feedback FOR SELECT 
USING (auth.role() = 'service_role');

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_enhanced_agent_memory_agent_user ON public.enhanced_agent_memory(agent_id, user_id);
CREATE INDEX IF NOT EXISTS idx_enhanced_agent_memory_type ON public.enhanced_agent_memory(memory_type);
CREATE INDEX IF NOT EXISTS idx_enhanced_agent_memory_importance ON public.enhanced_agent_memory(importance_score DESC);
CREATE INDEX IF NOT EXISTS idx_agent_learning_metrics_agent ON public.agent_learning_metrics(agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_safety_logs_agent ON public.agent_safety_logs(agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_human_feedback_agent ON public.agent_human_feedback(agent_id);