-- Create tables for agentic task tracking and real-time monitoring
CREATE TABLE IF NOT EXISTS public.agentic_tasks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  agent_id TEXT NOT NULL,
  intent TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'running', 'completed', 'failed', 'cancelled')),
  progress INTEGER NOT NULL DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  result JSONB,
  error TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for agent memory tracking
CREATE TABLE IF NOT EXISTS public.agentic_memory (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  agent_id TEXT NOT NULL,
  memory_type TEXT NOT NULL,
  data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for admin monitoring data
CREATE TABLE IF NOT EXISTS public.agent_metrics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  agent_id TEXT NOT NULL,
  metric_type TEXT NOT NULL,
  value NUMERIC NOT NULL,
  metadata JSONB,
  recorded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.agentic_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agentic_memory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_metrics ENABLE ROW LEVEL SECURITY;

-- RLS policies for agentic_tasks
CREATE POLICY "Users can view their own tasks" 
ON public.agentic_tasks 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own tasks" 
ON public.agentic_tasks 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own tasks" 
ON public.agentic_tasks 
FOR UPDATE 
USING (auth.uid() = user_id);

-- RLS policies for agentic_memory
CREATE POLICY "Users can view their own memory" 
ON public.agentic_memory 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own memory" 
ON public.agentic_memory 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own memory" 
ON public.agentic_memory 
FOR UPDATE 
USING (auth.uid() = user_id);

-- RLS policies for agent_metrics (admin only for viewing)
CREATE POLICY "Admin can view all agent metrics" 
ON public.agent_metrics 
FOR SELECT 
USING (true); -- This will need to be restricted to admin users once auth is implemented

CREATE POLICY "System can insert agent metrics" 
ON public.agent_metrics 
FOR INSERT 
WITH CHECK (true);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_agentic_tasks_updated_at
  BEFORE UPDATE ON public.agentic_tasks
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_agentic_memory_updated_at
  BEFORE UPDATE ON public.agentic_memory
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for task monitoring
ALTER TABLE public.agentic_tasks REPLICA IDENTITY FULL;
ALTER TABLE public.agentic_memory REPLICA IDENTITY FULL;
ALTER TABLE public.agent_metrics REPLICA IDENTITY FULL;

-- Add tables to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.agentic_tasks;
ALTER PUBLICATION supabase_realtime ADD TABLE public.agentic_memory;
ALTER PUBLICATION supabase_realtime ADD TABLE public.agent_metrics;