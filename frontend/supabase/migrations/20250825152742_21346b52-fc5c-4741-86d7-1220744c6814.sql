-- Create conversion tracking tables
CREATE TABLE IF NOT EXISTS public.conversion_events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    event_name TEXT NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    session_id TEXT NOT NULL,
    page_url TEXT NOT NULL,
    properties JSONB DEFAULT '{}',
    value NUMERIC,
    currency TEXT DEFAULT 'AUD',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.funnel_steps (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    step_name TEXT NOT NULL,
    step_order INTEGER NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    session_id TEXT NOT NULL,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.session_analytics (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    session_id TEXT UNIQUE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    first_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    total_events INTEGER DEFAULT 0,
    total_value NUMERIC DEFAULT 0,
    currency TEXT DEFAULT 'AUD',
    funnel_progress INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_conversion_events_session_id ON public.conversion_events(session_id);
CREATE INDEX IF NOT EXISTS idx_conversion_events_user_id ON public.conversion_events(user_id);
CREATE INDEX IF NOT EXISTS idx_conversion_events_event_name ON public.conversion_events(event_name);
CREATE INDEX IF NOT EXISTS idx_conversion_events_created_at ON public.conversion_events(created_at);

CREATE INDEX IF NOT EXISTS idx_funnel_steps_session_id ON public.funnel_steps(session_id);
CREATE INDEX IF NOT EXISTS idx_funnel_steps_user_id ON public.funnel_steps(user_id);
CREATE INDEX IF NOT EXISTS idx_funnel_steps_step_order ON public.funnel_steps(step_order);
CREATE INDEX IF NOT EXISTS idx_funnel_steps_created_at ON public.funnel_steps(created_at);

CREATE INDEX IF NOT EXISTS idx_session_analytics_session_id ON public.session_analytics(session_id);
CREATE INDEX IF NOT EXISTS idx_session_analytics_user_id ON public.session_analytics(user_id);

-- Enable RLS
ALTER TABLE public.conversion_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.funnel_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.session_analytics ENABLE ROW LEVEL SECURITY;

-- RLS policies for conversion_events
CREATE POLICY "Users can view their own conversion events" ON public.conversion_events
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage all conversion events" ON public.conversion_events
    FOR ALL USING (auth.role() = 'service_role');

-- RLS policies for funnel_steps
CREATE POLICY "Users can view their own funnel steps" ON public.funnel_steps
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage all funnel steps" ON public.funnel_steps
    FOR ALL USING (auth.role() = 'service_role');

-- RLS policies for session_analytics
CREATE POLICY "Users can view their own session analytics" ON public.session_analytics
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage all session analytics" ON public.session_analytics
    FOR ALL USING (auth.role() = 'service_role');

-- Function to update session funnel progress
CREATE OR REPLACE FUNCTION public.update_session_funnel_progress(
    p_session_id TEXT,
    p_step_order INTEGER,
    p_timestamp TIMESTAMP WITH TIME ZONE
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO public.session_analytics (
        session_id,
        funnel_progress,
        last_activity,
        total_events
    ) VALUES (
        p_session_id,
        p_step_order,
        p_timestamp,
        1
    )
    ON CONFLICT (session_id) 
    DO UPDATE SET
        funnel_progress = GREATEST(session_analytics.funnel_progress, p_step_order),
        last_activity = p_timestamp,
        total_events = session_analytics.total_events + 1,
        updated_at = NOW();
END;
$$;

-- Trigger for updated_at on session_analytics
CREATE TRIGGER update_session_analytics_updated_at
    BEFORE UPDATE ON public.session_analytics
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();