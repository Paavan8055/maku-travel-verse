-- Phase 5: Customer Support & Workflows - Missing Tables Only

-- Table for workflow sessions and tracking (if not exists)
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

-- Table for support tickets and escalations (if not exists)
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

-- Table for support ticket messages/conversations (if not exists)
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

-- Enable RLS on new tables (with checks for existing policies)
DO $$
BEGIN
  -- Enable RLS if not already enabled
  IF NOT (SELECT polrelid FROM pg_policy WHERE polrelid = 'public.workflow_sessions'::regclass LIMIT 1) THEN
    ALTER TABLE public.workflow_sessions ENABLE ROW LEVEL SECURITY;
  END IF;
  
  IF NOT (SELECT polrelid FROM pg_policy WHERE polrelid = 'public.support_tickets'::regclass LIMIT 1) THEN
    ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;
  END IF;
  
  IF NOT (SELECT polrelid FROM pg_policy WHERE polrelid = 'public.support_messages'::regclass LIMIT 1) THEN
    ALTER TABLE public.support_messages ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

-- Basic RLS Policies for new tables (with existence checks)
DO $$
BEGIN
  -- Workflow sessions policies
  IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'Users can manage their own workflow sessions' AND polrelid = 'public.workflow_sessions'::regclass) THEN
    EXECUTE 'CREATE POLICY "Users can manage their own workflow sessions" ON public.workflow_sessions FOR ALL USING (auth.uid() = user_id)';
  END IF;

  -- Support tickets policies  
  IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'Users can manage their own support tickets' AND polrelid = 'public.support_tickets'::regclass) THEN
    EXECUTE 'CREATE POLICY "Users can manage their own support tickets" ON public.support_tickets FOR ALL USING (auth.uid() = user_id)';
  END IF;

  -- Support messages policies
  IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'Users can view messages for their tickets' AND polrelid = 'public.support_messages'::regclass) THEN
    EXECUTE 'CREATE POLICY "Users can view messages for their tickets" ON public.support_messages FOR SELECT USING (ticket_id IN (SELECT id FROM public.support_tickets WHERE user_id = auth.uid()))';
  END IF;
END $$;

-- Function to generate unique ticket numbers (if not exists)
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