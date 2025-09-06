-- Create agentic_memory table for agent-specific context storage
CREATE TABLE public.agentic_memory (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  agent_id TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id TEXT,
  memory_key TEXT NOT NULL,
  memory_data JSONB NOT NULL DEFAULT '{}',
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX idx_agentic_memory_agent_user ON public.agentic_memory(agent_id, user_id);
CREATE INDEX idx_agentic_memory_session ON public.agentic_memory(session_id);
CREATE INDEX idx_agentic_memory_expires ON public.agentic_memory(expires_at);

-- Enable Row Level Security
ALTER TABLE public.agentic_memory ENABLE ROW LEVEL SECURITY;

-- Create policies for agentic_memory
CREATE POLICY "Users can manage their own agent memory" 
ON public.agentic_memory 
FOR ALL 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Service role can manage all agent memory" 
ON public.agentic_memory 
FOR ALL 
USING (auth.role() = 'service_role');

-- Create trigger for updating timestamps
CREATE TRIGGER update_agentic_memory_updated_at
  BEFORE UPDATE ON public.agentic_memory
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to clean up expired memory
CREATE OR REPLACE FUNCTION public.cleanup_expired_agent_memory()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
    DELETE FROM public.agentic_memory 
    WHERE expires_at < NOW();
END;
$$;