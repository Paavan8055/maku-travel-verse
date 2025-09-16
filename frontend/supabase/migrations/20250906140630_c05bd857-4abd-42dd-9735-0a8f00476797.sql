-- Phase 5: Customer Support & Workflows - Additional Tables

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

-- Table for security events and incidents
CREATE TABLE IF NOT EXISTS public.security_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL,
  severity TEXT NOT NULL DEFAULT 'medium',
  ip_address INET,
  user_agent TEXT,
  threat_level INTEGER NOT NULL DEFAULT 1,
  actions_performed TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  resolved BOOLEAN NOT NULL DEFAULT false,
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Table for customer support tickets and escalations
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

-- Table for support ticket messages/conversations
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

-- Enable RLS on all new tables
ALTER TABLE public.workflow_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.security_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies for workflow_sessions
CREATE POLICY "Users can manage their own workflow sessions" ON public.workflow_sessions
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage all workflow sessions" ON public.workflow_sessions
  FOR ALL USING (auth.role() = 'service_role');

-- RLS Policies for security_events
CREATE POLICY "Admins can view all security events" ON public.security_events
  FOR SELECT USING (is_secure_admin(auth.uid()));

CREATE POLICY "Service role can manage security events" ON public.security_events
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Users can view their own security events" ON public.security_events
  FOR SELECT USING (auth.uid() = user_id);

-- RLS Policies for support_tickets
CREATE POLICY "Users can manage their own support tickets" ON public.support_tickets
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all support tickets" ON public.support_tickets
  FOR ALL USING (is_secure_admin(auth.uid()));

CREATE POLICY "Service role can manage support tickets" ON public.support_tickets
  FOR ALL USING (auth.role() = 'service_role');

-- RLS Policies for support_messages
CREATE POLICY "Users can view messages for their tickets" ON public.support_messages
  FOR SELECT USING (
    ticket_id IN (
      SELECT id FROM public.support_tickets 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create messages for their tickets" ON public.support_messages
  FOR INSERT WITH CHECK (
    ticket_id IN (
      SELECT id FROM public.support_tickets 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage all support messages" ON public.support_messages
  FOR ALL USING (is_secure_admin(auth.uid()));

CREATE POLICY "Service role can manage support messages" ON public.support_messages
  FOR ALL USING (auth.role() = 'service_role');

-- Triggers for updated_at timestamps
CREATE TRIGGER update_workflow_sessions_updated_at
  BEFORE UPDATE ON public.workflow_sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_support_tickets_updated_at
  BEFORE UPDATE ON public.support_tickets
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Function to generate unique ticket numbers
CREATE OR REPLACE FUNCTION public.generate_ticket_number()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  ticket_num TEXT;
  exists BOOLEAN;
BEGIN
  LOOP
    -- Generate ticket number: TKT + YYYYMMDD + 4 random digits
    ticket_num := 'TKT' || to_char(now(), 'YYYYMMDD') || LPAD(floor(random() * 10000)::text, 4, '0');
    
    -- Check if ticket number already exists
    SELECT EXISTS(SELECT 1 FROM public.support_tickets WHERE ticket_number = ticket_num) INTO exists;
    
    IF NOT exists THEN
      RETURN ticket_num;
    END IF;
  END LOOP;
END;
$$;

-- Trigger to auto-generate ticket numbers
CREATE OR REPLACE FUNCTION public.set_ticket_number()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NEW.ticket_number IS NULL THEN
    NEW.ticket_number := public.generate_ticket_number();
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER set_support_ticket_number
  BEFORE INSERT ON public.support_tickets
  FOR EACH ROW
  EXECUTE FUNCTION public.set_ticket_number();