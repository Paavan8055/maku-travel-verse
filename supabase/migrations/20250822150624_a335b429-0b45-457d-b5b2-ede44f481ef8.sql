-- Phase 1: Create missing health_checks table
CREATE TABLE IF NOT EXISTS public.health_checks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  status TEXT NOT NULL,
  services JSONB NOT NULL DEFAULT '{}',
  performance JSONB NOT NULL DEFAULT '{}',
  checked_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on health_checks table
ALTER TABLE public.health_checks ENABLE ROW LEVEL SECURITY;

-- Create policy for service role to manage health checks
CREATE POLICY "Service role can manage health checks"
ON public.health_checks
FOR ALL
USING (auth.role() = 'service_role');

-- Create policy for authenticated users to view health checks
CREATE POLICY "Authenticated users can view health checks"
ON public.health_checks
FOR SELECT
USING (auth.uid() IS NOT NULL);

-- Create index for better performance on recent checks
CREATE INDEX IF NOT EXISTS idx_health_checks_checked_at 
ON public.health_checks (checked_at DESC);

-- Create index on status for filtering
CREATE INDEX IF NOT EXISTS idx_health_checks_status 
ON public.health_checks (status);