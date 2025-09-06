-- Create agentic_tasks table for the 70-agent system
CREATE TABLE IF NOT EXISTS public.agentic_tasks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    agent_id TEXT NOT NULL,
    intent TEXT NOT NULL,
    params JSONB NOT NULL DEFAULT '{}',
    status TEXT NOT NULL DEFAULT 'pending',
    progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
    result JSONB,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_agentic_tasks_user_id ON public.agentic_tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_agentic_tasks_status ON public.agentic_tasks(status);
CREATE INDEX IF NOT EXISTS idx_agentic_tasks_agent_id ON public.agentic_tasks(agent_id);
CREATE INDEX IF NOT EXISTS idx_agentic_tasks_created_at ON public.agentic_tasks(created_at DESC);

-- Enable Row Level Security
ALTER TABLE public.agentic_tasks ENABLE ROW LEVEL SECURITY;

-- RLS Policies for agentic_tasks
CREATE POLICY "Users can view their own tasks" ON public.agentic_tasks
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own tasks" ON public.agentic_tasks
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own tasks" ON public.agentic_tasks
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage all tasks" ON public.agentic_tasks
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Admins can view all tasks" ON public.agentic_tasks
    FOR SELECT USING (is_secure_admin(auth.uid()));

CREATE POLICY "Admins can update all tasks" ON public.agentic_tasks
    FOR UPDATE USING (is_secure_admin(auth.uid()));

-- Add updated_at trigger
CREATE TRIGGER update_agentic_tasks_updated_at
    BEFORE UPDATE ON public.agentic_tasks
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for agentic_tasks
ALTER TABLE public.agentic_tasks REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.agentic_tasks;