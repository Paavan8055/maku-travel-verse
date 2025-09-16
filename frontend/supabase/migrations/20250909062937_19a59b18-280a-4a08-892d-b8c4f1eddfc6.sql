-- Create comprehensive Master Bot Controller database schema

-- 1. Bot Result Aggregation Table
CREATE TABLE public.bot_result_aggregation (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    bot_id TEXT NOT NULL,
    bot_type TEXT NOT NULL CHECK (bot_type IN ('agentic', 'gpt', 'master')),
    result_type TEXT NOT NULL,
    result_data JSONB NOT NULL DEFAULT '{}',
    confidence_score NUMERIC CHECK (confidence_score >= 0 AND confidence_score <= 1),
    actionability_rating TEXT CHECK (actionability_rating IN ('low', 'medium', 'high', 'critical')),
    target_dashboard TEXT CHECK (target_dashboard IN ('user', 'partner', 'admin', 'all')),
    user_id UUID REFERENCES auth.users(id),
    session_id TEXT,
    correlation_id TEXT,
    metadata JSONB DEFAULT '{}',
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 2. Admin Bot Commands Table
CREATE TABLE public.admin_bot_commands (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    admin_user_id UUID NOT NULL REFERENCES auth.users(id),
    command_text TEXT NOT NULL,
    command_type TEXT NOT NULL CHECK (command_type IN ('query', 'control', 'analysis', 'optimization')),
    target_bots TEXT[] DEFAULT '{}',
    command_parameters JSONB DEFAULT '{}',
    execution_status TEXT NOT NULL DEFAULT 'pending' CHECK (execution_status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),
    result_ids UUID[],
    response_data JSONB,
    priority INTEGER DEFAULT 1 CHECK (priority >= 1 AND priority <= 5),
    estimated_duration_minutes INTEGER,
    actual_duration_minutes INTEGER,
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 3. Dashboard Context Store Table
CREATE TABLE public.dashboard_context_store (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    dashboard_type TEXT NOT NULL CHECK (dashboard_type IN ('user', 'partner', 'admin')),
    user_id UUID REFERENCES auth.users(id),
    context_key TEXT NOT NULL,
    context_data JSONB NOT NULL DEFAULT '{}',
    relevance_score NUMERIC CHECK (relevance_score >= 0 AND relevance_score <= 1),
    last_accessed TIMESTAMP WITH TIME ZONE DEFAULT now(),
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(dashboard_type, user_id, context_key)
);

-- 4. Bot Performance Analytics Table
CREATE TABLE public.bot_performance_analytics (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    bot_id TEXT NOT NULL,
    dashboard_type TEXT CHECK (dashboard_type IN ('user', 'partner', 'admin')),
    metric_type TEXT NOT NULL,
    metric_value NUMERIC NOT NULL,
    metric_metadata JSONB DEFAULT '{}',
    measurement_period TEXT DEFAULT 'daily',
    measurement_date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.bot_result_aggregation ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_bot_commands ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dashboard_context_store ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bot_performance_analytics ENABLE ROW LEVEL SECURITY;

-- RLS Policies for bot_result_aggregation
CREATE POLICY "Users can view their own bot results" ON public.bot_result_aggregation
    FOR SELECT USING (auth.uid() = user_id OR target_dashboard = 'all');

CREATE POLICY "Service role can manage all bot results" ON public.bot_result_aggregation
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Admins can view all bot results" ON public.bot_result_aggregation
    FOR SELECT USING (is_secure_admin(auth.uid()));

-- RLS Policies for admin_bot_commands
CREATE POLICY "Admins can manage their own commands" ON public.admin_bot_commands
    FOR ALL USING (is_secure_admin(auth.uid()) AND auth.uid() = admin_user_id)
    WITH CHECK (is_secure_admin(auth.uid()) AND auth.uid() = admin_user_id);

CREATE POLICY "Service role can update command status" ON public.admin_bot_commands
    FOR UPDATE USING (auth.role() = 'service_role');

-- RLS Policies for dashboard_context_store
CREATE POLICY "Users can manage their own dashboard context" ON public.dashboard_context_store
    FOR ALL USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all dashboard contexts" ON public.dashboard_context_store
    FOR SELECT USING (is_secure_admin(auth.uid()));

CREATE POLICY "Service role can manage all contexts" ON public.dashboard_context_store
    FOR ALL USING (auth.role() = 'service_role');

-- RLS Policies for bot_performance_analytics
CREATE POLICY "Admins can view all bot performance analytics" ON public.bot_performance_analytics
    FOR SELECT USING (is_secure_admin(auth.uid()));

CREATE POLICY "Service role can manage bot performance analytics" ON public.bot_performance_analytics
    FOR ALL USING (auth.role() = 'service_role');

-- Create indexes for better performance
CREATE INDEX idx_bot_result_aggregation_bot_id ON public.bot_result_aggregation(bot_id);
CREATE INDEX idx_bot_result_aggregation_user_id ON public.bot_result_aggregation(user_id);
CREATE INDEX idx_bot_result_aggregation_target_dashboard ON public.bot_result_aggregation(target_dashboard);
CREATE INDEX idx_bot_result_aggregation_created_at ON public.bot_result_aggregation(created_at DESC);

CREATE INDEX idx_admin_bot_commands_admin_user_id ON public.admin_bot_commands(admin_user_id);
CREATE INDEX idx_admin_bot_commands_status ON public.admin_bot_commands(execution_status);
CREATE INDEX idx_admin_bot_commands_created_at ON public.admin_bot_commands(created_at DESC);

CREATE INDEX idx_dashboard_context_store_dashboard_user ON public.dashboard_context_store(dashboard_type, user_id);
CREATE INDEX idx_dashboard_context_store_last_accessed ON public.dashboard_context_store(last_accessed DESC);

CREATE INDEX idx_bot_performance_analytics_bot_id ON public.bot_performance_analytics(bot_id);
CREATE INDEX idx_bot_performance_analytics_date ON public.bot_performance_analytics(measurement_date DESC);

-- Create triggers for updated_at columns
CREATE OR REPLACE FUNCTION public.update_updated_at_bot_results()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER update_bot_result_aggregation_updated_at
    BEFORE UPDATE ON public.bot_result_aggregation
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_bot_results();

CREATE TRIGGER update_admin_bot_commands_updated_at
    BEFORE UPDATE ON public.admin_bot_commands
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_bot_results();

CREATE TRIGGER update_dashboard_context_store_updated_at
    BEFORE UPDATE ON public.dashboard_context_store
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_bot_results();

-- Create function to aggregate agentic_tasks into bot_result_aggregation
CREATE OR REPLACE FUNCTION public.aggregate_agentic_task_result()
RETURNS TRIGGER AS $$
BEGIN
    -- Only aggregate completed or failed tasks
    IF NEW.status IN ('completed', 'failed') AND (OLD.status IS NULL OR OLD.status != NEW.status) THEN
        INSERT INTO public.bot_result_aggregation (
            bot_id,
            bot_type,
            result_type,
            result_data,
            confidence_score,
            actionability_rating,
            target_dashboard,
            user_id,
            session_id,
            correlation_id,
            metadata
        ) VALUES (
            NEW.agent_id,
            'agentic',
            NEW.intent,
            COALESCE(NEW.result, '{}'),
            CASE NEW.status WHEN 'completed' THEN 0.9 ELSE 0.1 END,
            CASE NEW.status WHEN 'completed' THEN 'high' ELSE 'low' END,
            'user',
            NEW.user_id,
            NEW.session_id,
            NEW.id::text,
            jsonb_build_object(
                'original_params', NEW.params,
                'progress', NEW.progress,
                'error_message', NEW.error_message
            )
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for agentic tasks
CREATE TRIGGER aggregate_agentic_task_on_completion
    AFTER UPDATE ON public.agentic_tasks
    FOR EACH ROW
    EXECUTE FUNCTION public.aggregate_agentic_task_result();