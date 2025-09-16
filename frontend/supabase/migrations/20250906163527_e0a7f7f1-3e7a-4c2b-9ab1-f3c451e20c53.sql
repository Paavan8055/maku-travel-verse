-- Phase 2 & 3: Calendar, Docs, Search & Intelligence, Sheets modules

-- Calendar Events Table
CREATE TABLE public.calendar_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  event_type TEXT NOT NULL DEFAULT 'meeting',
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE NOT NULL,
  location TEXT,
  attendees JSONB NOT NULL DEFAULT '[]',
  created_by UUID REFERENCES auth.users(id),
  assigned_agent_id TEXT,
  project_id UUID REFERENCES ai_workplace_projects(id),
  task_id UUID REFERENCES ai_workplace_tasks(id),
  calendar_provider TEXT DEFAULT 'internal',
  external_event_id TEXT,
  status TEXT NOT NULL DEFAULT 'scheduled',
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Calendar Integrations Table
CREATE TABLE public.calendar_integrations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  provider TEXT NOT NULL,
  provider_config JSONB NOT NULL DEFAULT '{}',
  sync_enabled BOOLEAN NOT NULL DEFAULT true,
  last_sync_at TIMESTAMP WITH TIME ZONE,
  sync_status TEXT NOT NULL DEFAULT 'pending',
  error_details TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Documents Table
CREATE TABLE public.documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT,
  document_type TEXT NOT NULL DEFAULT 'general',
  category TEXT,
  tags TEXT[] DEFAULT '{}',
  file_path TEXT,
  file_size INTEGER,
  mime_type TEXT,
  created_by UUID REFERENCES auth.users(id),
  project_id UUID REFERENCES ai_workplace_projects(id),
  sop_id UUID REFERENCES standard_operating_procedures(id),
  status TEXT NOT NULL DEFAULT 'draft',
  version_number INTEGER NOT NULL DEFAULT 1,
  is_template BOOLEAN NOT NULL DEFAULT false,
  access_level TEXT NOT NULL DEFAULT 'private',
  metadata JSONB NOT NULL DEFAULT '{}',
  search_vector tsvector,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Document Versions Table
CREATE TABLE public.document_versions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL,
  title TEXT NOT NULL,
  content TEXT,
  changes_summary TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Knowledge Base Entries Table
CREATE TABLE public.knowledge_base_entries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT NOT NULL,
  subcategory TEXT,
  tags TEXT[] DEFAULT '{}',
  difficulty_level TEXT NOT NULL DEFAULT 'beginner',
  source_type TEXT NOT NULL DEFAULT 'manual',
  source_document_id UUID REFERENCES documents(id),
  source_sop_id UUID REFERENCES standard_operating_procedures(id),
  confidence_score NUMERIC DEFAULT 1.0,
  usage_count INTEGER NOT NULL DEFAULT 0,
  last_used_at TIMESTAMP WITH TIME ZONE,
  created_by UUID REFERENCES auth.users(id),
  search_vector tsvector,
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Search Analytics Table
CREATE TABLE public.search_analytics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  query TEXT NOT NULL,
  search_type TEXT NOT NULL DEFAULT 'general',
  user_id UUID REFERENCES auth.users(id),
  results_count INTEGER NOT NULL DEFAULT 0,
  clicked_result_id UUID,
  clicked_result_type TEXT,
  search_duration_ms INTEGER,
  filters_applied JSONB DEFAULT '{}',
  results_metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Data Sheets Table
CREATE TABLE public.data_sheets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  sheet_type TEXT NOT NULL DEFAULT 'analysis',
  data_source TEXT NOT NULL,
  configuration JSONB NOT NULL DEFAULT '{}',
  columns_config JSONB NOT NULL DEFAULT '[]',
  data_rows JSONB NOT NULL DEFAULT '[]',
  calculations JSONB NOT NULL DEFAULT '{}',
  charts_config JSONB NOT NULL DEFAULT '[]',
  created_by UUID REFERENCES auth.users(id),
  project_id UUID REFERENCES ai_workplace_projects(id),
  shared_with JSONB NOT NULL DEFAULT '[]',
  last_processed_at TIMESTAMP WITH TIME ZONE,
  processing_status TEXT NOT NULL DEFAULT 'ready',
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Data Processing Jobs Table
CREATE TABLE public.data_processing_jobs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  job_name TEXT NOT NULL,
  job_type TEXT NOT NULL,
  sheet_id UUID REFERENCES data_sheets(id),
  source_config JSONB NOT NULL DEFAULT '{}',
  processing_config JSONB NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'pending',
  progress_percentage INTEGER NOT NULL DEFAULT 0,
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  result_data JSONB,
  created_by UUID REFERENCES auth.users(id),
  scheduled_for TIMESTAMP WITH TIME ZONE,
  recurrence_pattern TEXT,
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Chat Conversations Table
CREATE TABLE public.chat_conversations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  conversation_type TEXT NOT NULL DEFAULT 'general',
  participants JSONB NOT NULL DEFAULT '[]',
  active_agents JSONB NOT NULL DEFAULT '[]',
  context_data JSONB NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'active',
  created_by UUID REFERENCES auth.users(id),
  project_id UUID REFERENCES ai_workplace_projects(id),
  last_message_at TIMESTAMP WITH TIME ZONE,
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Chat Messages Table
CREATE TABLE public.chat_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES chat_conversations(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES auth.users(id),
  sender_type TEXT NOT NULL DEFAULT 'human',
  agent_id TEXT,
  message_type TEXT NOT NULL DEFAULT 'text',
  content TEXT NOT NULL,
  attachments JSONB NOT NULL DEFAULT '[]',
  reply_to_id UUID REFERENCES chat_messages(id),
  is_system_message BOOLEAN NOT NULL DEFAULT false,
  processing_status TEXT DEFAULT 'completed',
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.calendar_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calendar_integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.knowledge_base_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.search_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.data_sheets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.data_processing_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- Calendar Events Policies
CREATE POLICY "Users can manage their own calendar events" 
ON public.calendar_events 
FOR ALL 
USING (auth.uid() = created_by OR auth.uid() IN (
  SELECT unnest(attendees::text[])::uuid
))
WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Admins can manage all calendar events" 
ON public.calendar_events 
FOR ALL 
USING (is_secure_admin(auth.uid()));

-- Calendar Integrations Policies
CREATE POLICY "Users can manage their own calendar integrations" 
ON public.calendar_integrations 
FOR ALL 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Documents Policies
CREATE POLICY "Users can view documents based on access level" 
ON public.documents 
FOR SELECT 
USING (
  access_level = 'public' OR 
  auth.uid() = created_by OR 
  (access_level = 'project' AND project_id IN (
    SELECT id FROM ai_workplace_projects 
    WHERE created_by = auth.uid() OR project_manager_id = auth.uid()
  ))
);

CREATE POLICY "Users can manage their own documents" 
ON public.documents 
FOR ALL 
USING (auth.uid() = created_by)
WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Admins can manage all documents" 
ON public.documents 
FOR ALL 
USING (is_secure_admin(auth.uid()));

-- Document Versions Policies
CREATE POLICY "Users can view document versions they have access to" 
ON public.document_versions 
FOR SELECT 
USING (document_id IN (
  SELECT id FROM documents WHERE 
  access_level = 'public' OR auth.uid() = created_by
));

CREATE POLICY "Users can manage versions of their documents" 
ON public.document_versions 
FOR ALL 
USING (document_id IN (
  SELECT id FROM documents WHERE created_by = auth.uid()
))
WITH CHECK (document_id IN (
  SELECT id FROM documents WHERE created_by = auth.uid()
));

-- Knowledge Base Entries Policies
CREATE POLICY "Users can view all knowledge base entries" 
ON public.knowledge_base_entries 
FOR SELECT 
USING (true);

CREATE POLICY "Users can manage their own knowledge base entries" 
ON public.knowledge_base_entries 
FOR ALL 
USING (auth.uid() = created_by)
WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Admins can manage all knowledge base entries" 
ON public.knowledge_base_entries 
FOR ALL 
USING (is_secure_admin(auth.uid()));

-- Search Analytics Policies
CREATE POLICY "Users can view their own search analytics" 
ON public.search_analytics 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Service role can insert search analytics" 
ON public.search_analytics 
FOR INSERT 
WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Admins can view all search analytics" 
ON public.search_analytics 
FOR ALL 
USING (is_secure_admin(auth.uid()));

-- Data Sheets Policies
CREATE POLICY "Users can manage their own data sheets" 
ON public.data_sheets 
FOR ALL 
USING (auth.uid() = created_by OR shared_with ? (auth.uid())::text)
WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Admins can manage all data sheets" 
ON public.data_sheets 
FOR ALL 
USING (is_secure_admin(auth.uid()));

-- Data Processing Jobs Policies
CREATE POLICY "Users can manage their own data processing jobs" 
ON public.data_processing_jobs 
FOR ALL 
USING (auth.uid() = created_by)
WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Service role can manage data processing jobs" 
ON public.data_processing_jobs 
FOR ALL 
USING (auth.role() = 'service_role');

-- Chat Conversations Policies
CREATE POLICY "Users can manage conversations they created or participate in" 
ON public.chat_conversations 
FOR ALL 
USING (auth.uid() = created_by OR participants ? (auth.uid())::text)
WITH CHECK (auth.uid() = created_by OR participants ? (auth.uid())::text);

-- Chat Messages Policies
CREATE POLICY "Users can view messages in conversations they participate in" 
ON public.chat_messages 
FOR SELECT 
USING (conversation_id IN (
  SELECT id FROM chat_conversations 
  WHERE created_by = auth.uid() OR participants ? (auth.uid())::text
));

CREATE POLICY "Users can insert messages in conversations they participate in" 
ON public.chat_messages 
FOR INSERT 
WITH CHECK (conversation_id IN (
  SELECT id FROM chat_conversations 
  WHERE created_by = auth.uid() OR participants ? (auth.uid())::text
) AND auth.uid() = sender_id);

-- Update triggers
CREATE TRIGGER update_calendar_events_updated_at
  BEFORE UPDATE ON public.calendar_events
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_calendar_integrations_updated_at
  BEFORE UPDATE ON public.calendar_integrations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_documents_updated_at
  BEFORE UPDATE ON public.documents
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_knowledge_base_entries_updated_at
  BEFORE UPDATE ON public.knowledge_base_entries
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_data_sheets_updated_at
  BEFORE UPDATE ON public.data_sheets
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_data_processing_jobs_updated_at
  BEFORE UPDATE ON public.data_processing_jobs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_chat_conversations_updated_at
  BEFORE UPDATE ON public.chat_conversations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Search vector updates
CREATE OR REPLACE FUNCTION update_documents_search_vector()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector := to_tsvector('english', COALESCE(NEW.title, '') || ' ' || COALESCE(NEW.content, ''));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_documents_search_vector_trigger
  BEFORE INSERT OR UPDATE ON public.documents
  FOR EACH ROW
  EXECUTE FUNCTION update_documents_search_vector();

CREATE TRIGGER update_knowledge_base_search_vector_trigger
  BEFORE INSERT OR UPDATE ON public.knowledge_base_entries
  FOR EACH ROW
  EXECUTE FUNCTION update_knowledge_base_search_vector();

-- Indexes for performance
CREATE INDEX idx_calendar_events_start_time ON public.calendar_events(start_time);
CREATE INDEX idx_calendar_events_assigned_agent ON public.calendar_events(assigned_agent_id);
CREATE INDEX idx_documents_search_vector ON public.documents USING gin(search_vector);
CREATE INDEX idx_documents_tags ON public.documents USING gin(tags);
CREATE INDEX idx_knowledge_base_search_vector ON public.knowledge_base_entries USING gin(search_vector);
CREATE INDEX idx_search_analytics_query ON public.search_analytics(query);
CREATE INDEX idx_chat_messages_conversation ON public.chat_messages(conversation_id, created_at);

-- Sample Data
INSERT INTO public.documents (title, content, document_type, category, created_by, status) VALUES
('Project Kickoff Template', 'Standard template for project kickoffs...', 'template', 'project_management', NULL, 'published'),
('Meeting Notes Template', 'Template for recording meeting notes...', 'template', 'meetings', NULL, 'published'),
('SOP Documentation Guide', 'Guide for creating standard operating procedures...', 'guide', 'procedures', NULL, 'published');

INSERT INTO public.knowledge_base_entries (title, content, category, tags, difficulty_level) VALUES
('How to Schedule Team Meetings', 'Step-by-step guide for scheduling effective team meetings...', 'meetings', ARRAY['scheduling', 'collaboration', 'productivity'], 'beginner'),
('Project Planning Best Practices', 'Comprehensive guide to planning successful projects...', 'project_management', ARRAY['planning', 'management', 'strategy'], 'intermediate'),
('AI Agent Integration Guide', 'Technical guide for integrating AI agents into workflows...', 'technical', ARRAY['ai', 'integration', 'automation'], 'advanced');

INSERT INTO public.data_sheets (name, description, sheet_type, data_source, created_by) VALUES
('Team Performance Metrics', 'Weekly performance tracking for all team members', 'metrics', 'manual', NULL),
('Project Cost Analysis', 'Budget tracking and cost analysis for active projects', 'analysis', 'projects', NULL),
('Agent Efficiency Report', 'Performance metrics for AI agents and task completion rates', 'report', 'agents', NULL);