-- Create tables for Phase 3 enterprise features

-- Price alerts table
CREATE TABLE IF NOT EXISTS public.price_alerts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  search_criteria JSONB NOT NULL,
  target_price NUMERIC NOT NULL,
  current_price NUMERIC NOT NULL,
  threshold_percentage INTEGER NOT NULL DEFAULT 10,
  is_active BOOLEAN NOT NULL DEFAULT true,
  notification_method TEXT NOT NULL DEFAULT 'email' CHECK (notification_method IN ('email', 'push', 'both')),
  last_checked TIMESTAMP WITH TIME ZONE,
  last_triggered TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Test results table for comprehensive testing framework
CREATE TABLE IF NOT EXISTS public.test_results (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  suite_name TEXT NOT NULL,
  test_type TEXT NOT NULL,
  results JSONB NOT NULL,
  pass_rate NUMERIC NOT NULL,
  total_duration INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- System health snapshots for monitoring
CREATE TABLE IF NOT EXISTS public.system_health_snapshots (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  overall_health NUMERIC NOT NULL,
  component_health JSONB NOT NULL,
  active_alerts INTEGER NOT NULL DEFAULT 0,
  performance_metrics JSONB,
  uptime_percentage NUMERIC NOT NULL DEFAULT 100.0
);

-- Multi-provider redundancy tracking
CREATE TABLE IF NOT EXISTS public.circuit_breaker_state (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  provider_id TEXT NOT NULL UNIQUE,
  state TEXT NOT NULL DEFAULT 'closed' CHECK (state IN ('closed', 'open', 'half-open')),
  failure_count INTEGER NOT NULL DEFAULT 0,
  last_failure TIMESTAMP WITH TIME ZONE,
  next_attempt TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.price_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.test_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_health_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.circuit_breaker_state ENABLE ROW LEVEL SECURITY;

-- RLS policies for price_alerts (user can only see their own)
CREATE POLICY "Users can view their own price alerts"
ON public.price_alerts FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own price alerts"
ON public.price_alerts FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own price alerts"
ON public.price_alerts FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own price alerts"
ON public.price_alerts FOR DELETE
USING (auth.uid() = user_id);

-- Admin-only policies for test_results and system monitoring
CREATE POLICY "Admins can view test results"
ON public.test_results FOR SELECT
USING (public.is_secure_admin(auth.uid()));

CREATE POLICY "System can insert test results"
ON public.test_results FOR INSERT
WITH CHECK (true);

CREATE POLICY "Admins can view system health snapshots"
ON public.system_health_snapshots FOR SELECT
USING (public.is_secure_admin(auth.uid()));

CREATE POLICY "System can insert health snapshots"
ON public.system_health_snapshots FOR INSERT
WITH CHECK (true);

-- Circuit breaker state is system-managed
CREATE POLICY "System can manage circuit breaker state"
ON public.circuit_breaker_state FOR ALL
USING (true);

-- Triggers for updated_at timestamps
CREATE TRIGGER update_price_alerts_updated_at
BEFORE UPDATE ON public.price_alerts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_circuit_breaker_updated_at
BEFORE UPDATE ON public.circuit_breaker_state
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Indexes for better performance
CREATE INDEX idx_price_alerts_user_id ON public.price_alerts(user_id);
CREATE INDEX idx_price_alerts_active ON public.price_alerts(is_active) WHERE is_active = true;
CREATE INDEX idx_price_alerts_last_checked ON public.price_alerts(last_checked);
CREATE INDEX idx_test_results_created_at ON public.test_results(created_at);
CREATE INDEX idx_system_health_timestamp ON public.system_health_snapshots(timestamp);
CREATE INDEX idx_circuit_breaker_provider ON public.circuit_breaker_state(provider_id);