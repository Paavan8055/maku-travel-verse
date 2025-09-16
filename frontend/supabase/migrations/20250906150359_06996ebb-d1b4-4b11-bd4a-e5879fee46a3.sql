-- Phase 10: Human Resources & Knowledge Management Tables

-- Training tasks management
CREATE TABLE public.training_tasks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  task_name TEXT NOT NULL,
  description TEXT,
  task_type TEXT NOT NULL DEFAULT 'onboarding',
  required_for_roles TEXT[] NOT NULL DEFAULT '{}',
  estimated_duration_minutes INTEGER DEFAULT 60,
  content_url TEXT,
  completion_criteria JSONB NOT NULL DEFAULT '{}',
  is_mandatory BOOLEAN NOT NULL DEFAULT true,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Documentation version control
CREATE TABLE public.documentation_versions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  document_id TEXT NOT NULL,
  version_number TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  content_diff JSONB,
  change_summary TEXT,
  author_id UUID REFERENCES auth.users(id),
  reviewed_by UUID REFERENCES auth.users(id),
  status TEXT NOT NULL DEFAULT 'draft',
  published_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- User training completion tracking
CREATE TABLE public.user_training_completion (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  training_task_id UUID NOT NULL REFERENCES public.training_tasks(id),
  status TEXT NOT NULL DEFAULT 'not_started',
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  score NUMERIC,
  completion_evidence JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, training_task_id)
);

-- Knowledge base entries
CREATE TABLE public.knowledge_base_entries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  entry_key TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'general',
  tags TEXT[] NOT NULL DEFAULT '{}',
  search_vector tsvector,
  access_level TEXT NOT NULL DEFAULT 'internal',
  created_by UUID REFERENCES auth.users(id),
  last_updated_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Phase 11: Multi-Agent Orchestration Tables

-- Intent routing rules
CREATE TABLE public.intent_routing_rules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  intent_pattern TEXT NOT NULL,
  agent_id TEXT NOT NULL,
  priority INTEGER NOT NULL DEFAULT 1,
  conditions JSONB NOT NULL DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT true,
  success_count INTEGER NOT NULL DEFAULT 0,
  failure_count INTEGER NOT NULL DEFAULT 0,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Agent context and memory
CREATE TABLE public.agent_context_memory (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  agent_id TEXT NOT NULL,
  user_id UUID,
  session_id TEXT,
  context_type TEXT NOT NULL DEFAULT 'reasoning',
  context_data JSONB NOT NULL DEFAULT '{}',
  reasoning_summary TEXT,
  confidence_score NUMERIC,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Orchestration workflows
CREATE TABLE public.orchestration_workflows (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workflow_name TEXT NOT NULL,
  description TEXT,
  trigger_conditions JSONB NOT NULL DEFAULT '{}',
  agent_sequence JSONB NOT NULL DEFAULT '[]',
  workflow_config JSONB NOT NULL DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT true,
  execution_count INTEGER NOT NULL DEFAULT 0,
  success_rate NUMERIC DEFAULT 0,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Phase 12: Additional & Future Enhancements Tables

-- Supplier negotiations
CREATE TABLE public.supplier_negotiations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  supplier_id TEXT NOT NULL,
  negotiation_type TEXT NOT NULL,
  product_type TEXT NOT NULL,
  original_price NUMERIC NOT NULL,
  negotiated_price NUMERIC,
  negotiation_strategy JSONB NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'pending',
  negotiation_rounds INTEGER NOT NULL DEFAULT 0,
  final_terms JSONB,
  agent_id TEXT NOT NULL,
  user_id UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Voice interface sessions
CREATE TABLE public.voice_interface_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  session_id TEXT NOT NULL,
  language_code TEXT NOT NULL DEFAULT 'en-US',
  voice_preferences JSONB NOT NULL DEFAULT '{}',
  conversation_transcript JSONB NOT NULL DEFAULT '[]',
  audio_duration_seconds INTEGER,
  recognition_accuracy NUMERIC,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Translation cache
CREATE TABLE public.translation_cache (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  source_text TEXT NOT NULL,
  source_language TEXT NOT NULL,
  target_language TEXT NOT NULL,
  translated_text TEXT NOT NULL,
  translation_quality_score NUMERIC,
  provider TEXT NOT NULL DEFAULT 'google',
  cache_key TEXT NOT NULL UNIQUE,
  usage_count INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  last_used_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Calendar integrations
CREATE TABLE public.calendar_integrations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  provider TEXT NOT NULL,
  calendar_id TEXT NOT NULL,
  access_token_encrypted TEXT NOT NULL,
  refresh_token_encrypted TEXT,
  sync_preferences JSONB NOT NULL DEFAULT '{}',
  last_sync_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Group booking coordination
CREATE TABLE public.group_booking_coordination (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  coordinator_user_id UUID NOT NULL,
  group_name TEXT NOT NULL,
  group_size INTEGER NOT NULL,
  participants JSONB NOT NULL DEFAULT '[]',
  booking_preferences JSONB NOT NULL DEFAULT '{}',
  coordination_status TEXT NOT NULL DEFAULT 'organizing',
  voting_status JSONB NOT NULL DEFAULT '{}',
  final_bookings JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Sustainability metrics
CREATE TABLE public.sustainability_metrics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  booking_id UUID,
  user_id UUID,
  carbon_footprint_kg NUMERIC,
  sustainability_score NUMERIC,
  eco_alternatives JSONB,
  offset_recommendations JSONB,
  transportation_emissions NUMERIC,
  accommodation_emissions NUMERIC,
  activity_emissions NUMERIC,
  calculation_method TEXT NOT NULL DEFAULT 'standard',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX idx_training_tasks_type ON public.training_tasks(task_type);
CREATE INDEX idx_training_completion_user ON public.user_training_completion(user_id);
CREATE INDEX idx_training_completion_status ON public.user_training_completion(status);
CREATE INDEX idx_documentation_versions_document ON public.documentation_versions(document_id);
CREATE INDEX idx_knowledge_base_category ON public.knowledge_base_entries(category);
CREATE INDEX idx_knowledge_base_search ON public.knowledge_base_entries USING gin(search_vector);
CREATE INDEX idx_intent_routing_active ON public.intent_routing_rules(is_active, priority);
CREATE INDEX idx_agent_context_agent_user ON public.agent_context_memory(agent_id, user_id);
CREATE INDEX idx_orchestration_workflows_active ON public.orchestration_workflows(is_active);
CREATE INDEX idx_supplier_negotiations_status ON public.supplier_negotiations(status);
CREATE INDEX idx_voice_sessions_user ON public.voice_interface_sessions(user_id);
CREATE INDEX idx_translation_cache_key ON public.translation_cache(cache_key);
CREATE INDEX idx_calendar_integrations_user ON public.calendar_integrations(user_id);
CREATE INDEX idx_group_booking_coordinator ON public.group_booking_coordination(coordinator_user_id);
CREATE INDEX idx_sustainability_booking ON public.sustainability_metrics(booking_id);

-- Create search vector trigger for knowledge base
CREATE OR REPLACE FUNCTION public.update_knowledge_base_search_vector()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector := to_tsvector('english', COALESCE(NEW.title, '') || ' ' || COALESCE(NEW.content, ''));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_knowledge_base_search_vector_trigger
  BEFORE INSERT OR UPDATE ON public.knowledge_base_entries
  FOR EACH ROW EXECUTE FUNCTION public.update_knowledge_base_search_vector();

-- Add RLS policies
ALTER TABLE public.training_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documentation_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_training_completion ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.knowledge_base_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.intent_routing_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_context_memory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orchestration_workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.supplier_negotiations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.voice_interface_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.translation_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calendar_integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_booking_coordination ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sustainability_metrics ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Admins can manage training tasks" ON public.training_tasks FOR ALL TO authenticated USING (is_secure_admin(auth.uid()));
CREATE POLICY "Users can view their training tasks" ON public.training_tasks FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can manage documentation" ON public.documentation_versions FOR ALL TO authenticated USING (is_secure_admin(auth.uid()));
CREATE POLICY "Users can view published documentation" ON public.documentation_versions FOR SELECT TO authenticated USING (status = 'published');

CREATE POLICY "Users can manage their training completion" ON public.user_training_completion FOR ALL TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all training completion" ON public.user_training_completion FOR SELECT TO authenticated USING (is_secure_admin(auth.uid()));

CREATE POLICY "Users can view knowledge base" ON public.knowledge_base_entries FOR SELECT TO authenticated USING (access_level = 'public' OR access_level = 'internal');
CREATE POLICY "Admins can manage knowledge base" ON public.knowledge_base_entries FOR ALL TO authenticated USING (is_secure_admin(auth.uid()));

CREATE POLICY "Admins can manage intent routing" ON public.intent_routing_rules FOR ALL TO authenticated USING (is_secure_admin(auth.uid()));
CREATE POLICY "Service role can use intent routing" ON public.intent_routing_rules FOR SELECT TO service_role USING (true);

CREATE POLICY "Service role can manage agent context" ON public.agent_context_memory FOR ALL TO service_role USING (true);
CREATE POLICY "Users can view their agent context" ON public.agent_context_memory FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage orchestration workflows" ON public.orchestration_workflows FOR ALL TO authenticated USING (is_secure_admin(auth.uid()));
CREATE POLICY "Service role can execute workflows" ON public.orchestration_workflows FOR SELECT TO service_role USING (is_active = true);

CREATE POLICY "Service role can manage supplier negotiations" ON public.supplier_negotiations FOR ALL TO service_role USING (true);
CREATE POLICY "Users can view their negotiations" ON public.supplier_negotiations FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their voice sessions" ON public.voice_interface_sessions FOR ALL TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Service role can manage voice sessions" ON public.voice_interface_sessions FOR ALL TO service_role USING (true);

CREATE POLICY "Anyone can read translation cache" ON public.translation_cache FOR SELECT TO authenticated USING (true);
CREATE POLICY "Service role can manage translation cache" ON public.translation_cache FOR ALL TO service_role USING (true);

CREATE POLICY "Users can manage their calendar integrations" ON public.calendar_integrations FOR ALL TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their group bookings" ON public.group_booking_coordination FOR ALL TO authenticated USING (auth.uid() = coordinator_user_id OR auth.uid()::text = ANY(SELECT jsonb_array_elements_text(participants)));

CREATE POLICY "Users can view their sustainability metrics" ON public.sustainability_metrics FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Service role can manage sustainability metrics" ON public.sustainability_metrics FOR ALL TO service_role USING (true);