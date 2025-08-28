-- Phase 2: Create tables for SEO and Analytics enhancement

-- Create funnel analytics table for conversion tracking
CREATE TABLE IF NOT EXISTS public.funnel_analytics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id TEXT NOT NULL,
  user_id UUID NULL,
  step_name TEXT NOT NULL,
  step_order INTEGER NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  metadata JSONB NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create session analytics table for tracking user sessions
CREATE TABLE IF NOT EXISTS public.session_analytics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id TEXT NOT NULL UNIQUE,
  user_id UUID NULL,
  funnel_progress INTEGER NOT NULL DEFAULT 1,
  last_activity TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  total_events INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_funnel_analytics_session_id ON public.funnel_analytics(session_id);
CREATE INDEX IF NOT EXISTS idx_funnel_analytics_step_order ON public.funnel_analytics(step_order);
CREATE INDEX IF NOT EXISTS idx_funnel_analytics_timestamp ON public.funnel_analytics(timestamp);
CREATE INDEX IF NOT EXISTS idx_session_analytics_session_id ON public.session_analytics(session_id);
CREATE INDEX IF NOT EXISTS idx_session_analytics_user_id ON public.session_analytics(user_id);

-- Enable RLS
ALTER TABLE public.funnel_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.session_analytics ENABLE ROW LEVEL SECURITY;

-- RLS Policies for funnel_analytics
CREATE POLICY "Users can view their own funnel analytics" ON public.funnel_analytics
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage funnel analytics" ON public.funnel_analytics
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Admins can view all funnel analytics" ON public.funnel_analytics
  FOR SELECT USING (is_secure_admin(auth.uid()));

-- RLS Policies for session_analytics  
CREATE POLICY "Users can view their own session analytics" ON public.session_analytics
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage session analytics" ON public.session_analytics
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Admins can view all session analytics" ON public.session_analytics
  FOR SELECT USING (is_secure_admin(auth.uid()));

-- Create updated_at trigger for session_analytics
CREATE TRIGGER update_session_analytics_updated_at
  BEFORE UPDATE ON public.session_analytics
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();