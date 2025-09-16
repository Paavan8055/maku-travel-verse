-- Create tables for enhanced conversational AI infrastructure

-- Table for conversation routing analytics
CREATE TABLE public.conversation_routing_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id TEXT NOT NULL,
  user_message TEXT NOT NULL,
  routing_decision JSONB,
  ai_system_used TEXT NOT NULL CHECK (ai_system_used IN ('openai', 'dialogflow', 'hybrid')),
  confidence NUMERIC CHECK (confidence >= 0 AND confidence <= 1),
  dashboard_type TEXT NOT NULL CHECK (dashboard_type IN ('admin', 'partner', 'user')),
  user_id UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table for Dialogflow CX interactions
CREATE TABLE public.dialogflow_interactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id TEXT NOT NULL,
  user_message TEXT NOT NULL,
  intent TEXT,
  confidence NUMERIC CHECK (confidence >= 0 AND confidence <= 1),
  dashboard_type TEXT NOT NULL CHECK (dashboard_type IN ('admin', 'partner', 'user')),
  user_id UUID,
  response_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table for universal AI interactions tracking
CREATE TABLE public.universal_ai_interactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  interaction_type TEXT NOT NULL,
  dashboard_type TEXT NOT NULL CHECK (dashboard_type IN ('admin', 'partner', 'user')),
  ai_type TEXT NOT NULL CHECK (ai_type IN ('maku', 'agentic', 'dialogflow', 'universal')),
  user_id UUID,
  session_id TEXT,
  context_data JSONB,
  duration_ms INTEGER,
  success BOOLEAN DEFAULT true,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table for voice interaction logs
CREATE TABLE public.voice_interaction_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id TEXT NOT NULL,
  audio_duration_ms INTEGER,
  transcribed_text TEXT,
  confidence_score NUMERIC CHECK (confidence_score >= 0 AND confidence_score <= 1),
  language_detected TEXT DEFAULT 'en',
  user_id UUID,
  processing_time_ms INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.conversation_routing_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dialogflow_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.universal_ai_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.voice_interaction_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for conversation_routing_logs
CREATE POLICY "Users can view their own routing logs" 
ON public.conversation_routing_logs 
FOR SELECT 
USING (auth.uid()::text = user_id::text);

CREATE POLICY "System can insert routing logs" 
ON public.conversation_routing_logs 
FOR INSERT 
WITH CHECK (true);

-- RLS Policies for dialogflow_interactions
CREATE POLICY "Users can view their own dialogflow interactions" 
ON public.dialogflow_interactions 
FOR SELECT 
USING (auth.uid()::text = user_id::text);

CREATE POLICY "System can insert dialogflow interactions" 
ON public.dialogflow_interactions 
FOR INSERT 
WITH CHECK (true);

-- RLS Policies for universal_ai_interactions
CREATE POLICY "Users can view their own AI interactions" 
ON public.universal_ai_interactions 
FOR SELECT 
USING (auth.uid()::text = user_id::text);

CREATE POLICY "System can insert AI interactions" 
ON public.universal_ai_interactions 
FOR INSERT 
WITH CHECK (true);

-- RLS Policies for voice_interaction_logs
CREATE POLICY "Users can view their own voice logs" 
ON public.voice_interaction_logs 
FOR SELECT 
USING (auth.uid()::text = user_id::text);

CREATE POLICY "System can insert voice logs" 
ON public.voice_interaction_logs 
FOR INSERT 
WITH CHECK (true);

-- Create indexes for better performance
CREATE INDEX idx_conversation_routing_logs_user_id ON public.conversation_routing_logs(user_id);
CREATE INDEX idx_conversation_routing_logs_session_id ON public.conversation_routing_logs(session_id);
CREATE INDEX idx_conversation_routing_logs_created_at ON public.conversation_routing_logs(created_at);

CREATE INDEX idx_dialogflow_interactions_user_id ON public.dialogflow_interactions(user_id);
CREATE INDEX idx_dialogflow_interactions_session_id ON public.dialogflow_interactions(session_id);
CREATE INDEX idx_dialogflow_interactions_created_at ON public.dialogflow_interactions(created_at);

CREATE INDEX idx_universal_ai_interactions_user_id ON public.universal_ai_interactions(user_id);
CREATE INDEX idx_universal_ai_interactions_dashboard_type ON public.universal_ai_interactions(dashboard_type);
CREATE INDEX idx_universal_ai_interactions_created_at ON public.universal_ai_interactions(created_at);

CREATE INDEX idx_voice_interaction_logs_user_id ON public.voice_interaction_logs(user_id);
CREATE INDEX idx_voice_interaction_logs_session_id ON public.voice_interaction_logs(session_id);
CREATE INDEX idx_voice_interaction_logs_created_at ON public.voice_interaction_logs(created_at);