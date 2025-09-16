-- Fix search path for cleanup function
CREATE OR REPLACE FUNCTION public.cleanup_expired_agent_memory()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
    DELETE FROM public.agentic_memory 
    WHERE expires_at < NOW();
END;
$$;