-- Create provider configuration table for managing API providers
CREATE TABLE public.provider_configs (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('flight', 'hotel', 'activity')),
  enabled BOOLEAN NOT NULL DEFAULT true,
  priority INTEGER NOT NULL DEFAULT 1,
  circuit_breaker JSONB NOT NULL DEFAULT '{
    "failureCount": 0,
    "lastFailure": null,
    "timeout": 30000,
    "state": "closed"
  }'::jsonb,
  health_score INTEGER NOT NULL DEFAULT 100,
  response_time INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create provider metrics table for tracking performance
CREATE TABLE public.provider_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id TEXT NOT NULL,
  success BOOLEAN NOT NULL,
  response_time INTEGER NOT NULL,
  error_message TEXT,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create feature flags table for gradual rollouts
CREATE TABLE public.feature_flags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  flag_name TEXT UNIQUE NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT false,
  rollout_percentage INTEGER NOT NULL DEFAULT 0 CHECK (rollout_percentage >= 0 AND rollout_percentage <= 100),
  target_users JSONB DEFAULT '[]'::jsonb,
  conditions JSONB DEFAULT '{}'::jsonb,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create system monitoring table for health checks
CREATE TABLE public.health_checks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  status TEXT NOT NULL CHECK (status IN ('healthy', 'degraded', 'unhealthy')),
  services JSONB NOT NULL,
  performance JSONB NOT NULL,
  checked_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create error tracking table for Sentry-like functionality
CREATE TABLE public.error_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  correlation_id TEXT NOT NULL,
  error_type TEXT NOT NULL,
  error_message TEXT NOT NULL,
  stack_trace TEXT,
  user_id UUID REFERENCES auth.users(id),
  user_context JSONB DEFAULT '{}'::jsonb,
  request_context JSONB DEFAULT '{}'::jsonb,
  severity TEXT NOT NULL DEFAULT 'error' CHECK (severity IN ('debug', 'info', 'warning', 'error', 'fatal')),
  environment TEXT NOT NULL DEFAULT 'production',
  resolved BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Insert default provider configurations
INSERT INTO public.provider_configs (id, name, type, priority) VALUES
('amadeus-flight', 'Amadeus', 'flight', 1),
('sabre-flight', 'Sabre', 'flight', 2),
('amadeus-hotel', 'Amadeus', 'hotel', 1),
('hotelbeds-hotel', 'HotelBeds', 'hotel', 2),
('sabre-hotel', 'Sabre', 'hotel', 3),
('amadeus-activity', 'Amadeus', 'activity', 1),
('hotelbeds-activity', 'HotelBeds', 'activity', 2);

-- Insert default feature flags
INSERT INTO public.feature_flags (flag_name, enabled, rollout_percentage, description) VALUES
('provider_rotation_enabled', true, 100, 'Enable automatic provider rotation when APIs fail'),
('sentry_error_tracking', false, 0, 'Enable Sentry error tracking integration'),
('advanced_caching', true, 100, 'Enable advanced caching strategies'),
('performance_monitoring', true, 100, 'Enable detailed performance monitoring'),
('fallback_data_mode', true, 100, 'Show fallback data when all providers fail');

-- Enable RLS on all tables
ALTER TABLE public.provider_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.provider_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feature_flags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.health_checks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.error_tracking ENABLE ROW LEVEL SECURITY;

-- Create policies for admin access
CREATE POLICY "Admin full access to provider_configs" ON public.provider_configs
  FOR ALL USING (public.is_secure_admin(auth.uid()));

CREATE POLICY "Admin full access to provider_metrics" ON public.provider_metrics
  FOR ALL USING (public.is_secure_admin(auth.uid()));

CREATE POLICY "Admin full access to feature_flags" ON public.feature_flags
  FOR ALL USING (public.is_secure_admin(auth.uid()));

CREATE POLICY "Admin full access to health_checks" ON public.health_checks
  FOR ALL USING (public.is_secure_admin(auth.uid()));

CREATE POLICY "Admin full access to error_tracking" ON public.error_tracking
  FOR ALL USING (public.is_secure_admin(auth.uid()));

-- Create policies for service role (edge functions)
CREATE POLICY "Service role access to provider_configs" ON public.provider_configs
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Service role access to provider_metrics" ON public.provider_metrics
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Service role access to feature_flags" ON public.feature_flags
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Service role access to health_checks" ON public.health_checks
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Service role access to error_tracking" ON public.error_tracking
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- Create indexes for performance
CREATE INDEX idx_provider_metrics_provider_id ON public.provider_metrics(provider_id);
CREATE INDEX idx_provider_metrics_timestamp ON public.provider_metrics(timestamp);
CREATE INDEX idx_health_checks_checked_at ON public.health_checks(checked_at);
CREATE INDEX idx_error_tracking_correlation_id ON public.error_tracking(correlation_id);
CREATE INDEX idx_error_tracking_created_at ON public.error_tracking(created_at);
CREATE INDEX idx_feature_flags_flag_name ON public.feature_flags(flag_name);

-- Create trigger for updating updated_at timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_provider_configs_updated_at
    BEFORE UPDATE ON public.provider_configs
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_feature_flags_updated_at
    BEFORE UPDATE ON public.feature_flags
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_error_tracking_updated_at
    BEFORE UPDATE ON public.error_tracking
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();