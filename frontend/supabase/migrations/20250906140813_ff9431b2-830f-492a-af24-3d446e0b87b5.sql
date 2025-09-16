-- Phase 5: Customer Support & Workflows - Simple Table Creation

-- Table for workflow sessions and tracking
CREATE TABLE IF NOT EXISTS public.workflow_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  workflow_type TEXT NOT NULL,
  current_step INTEGER NOT NULL DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'in_progress',
  step_history JSONB NOT NULL DEFAULT '[]'::jsonb,
  session_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  escalation_level INTEGER NOT NULL DEFAULT 0,
  customer_satisfaction INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ
);

-- Table for support tickets
CREATE TABLE IF NOT EXISTS public.support_tickets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  ticket_number TEXT NOT NULL UNIQUE,
  subject TEXT NOT NULL,
  description TEXT NOT NULL,
  priority TEXT NOT NULL DEFAULT 'medium',
  status TEXT NOT NULL DEFAULT 'open',
  category TEXT NOT NULL DEFAULT 'general',
  assigned_agent UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  escalation_level INTEGER NOT NULL DEFAULT 0,
  customer_satisfaction INTEGER,
  resolution_notes TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  resolved_at TIMESTAMPTZ
);

-- Table for support messages
CREATE TABLE IF NOT EXISTS public.support_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ticket_id UUID NOT NULL REFERENCES public.support_tickets(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  sender_type TEXT NOT NULL DEFAULT 'customer',
  message_type TEXT NOT NULL DEFAULT 'text',
  content TEXT NOT NULL,
  attachments JSONB NOT NULL DEFAULT '[]'::jsonb,
  is_internal BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.workflow_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_messages ENABLE ROW LEVEL SECURITY;

-- Basic RLS Policies
CREATE POLICY "workflow_sessions_user_access" ON public.workflow_sessions
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "support_tickets_user_access" ON public.support_tickets
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "support_messages_user_access" ON public.support_messages
  FOR SELECT USING (
    ticket_id IN (
      SELECT id FROM public.support_tickets 
      WHERE user_id = auth.uid()
    )
  );

-- Service role policies
CREATE POLICY "workflow_sessions_service_role" ON public.workflow_sessions
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "support_tickets_service_role" ON public.support_tickets
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "support_messages_service_role" ON public.support_messages
  FOR ALL USING (auth.role() = 'service_role');