-- Create bot_configurations table for GPT Bot Registry
CREATE TABLE IF NOT EXISTS public.bot_configurations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  bot_id TEXT NOT NULL UNIQUE,
  enabled BOOLEAN DEFAULT true,
  configuration JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.bot_configurations ENABLE ROW LEVEL SECURITY;

-- Create policies for admin access only
CREATE POLICY "Admin users can manage bot configurations" ON public.bot_configurations
  FOR ALL USING (public.is_secure_admin(auth.uid()));

-- Create test_results and conversation_logs tables
CREATE TABLE IF NOT EXISTS public.test_results (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  suite_id TEXT NOT NULL,
  results JSONB NOT NULL,
  status TEXT NOT NULL,
  total_tests INTEGER DEFAULT 0,
  passed_tests INTEGER DEFAULT 0,
  failed_tests INTEGER DEFAULT 0,
  total_duration INTEGER DEFAULT 0,
  executed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.conversation_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  dashboard_type TEXT NOT NULL,
  user_message TEXT NOT NULL,
  ai_response TEXT NOT NULL,
  intent TEXT,
  confidence NUMERIC,
  entities JSONB DEFAULT '[]',
  action TEXT,
  action_params JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.test_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_logs ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Admin users can view test results" ON public.test_results
  FOR SELECT USING (public.is_secure_admin(auth.uid()));

CREATE POLICY "Users can view their own conversation logs" ON public.conversation_logs
  FOR SELECT USING (auth.uid() = user_id OR public.is_secure_admin(auth.uid()));