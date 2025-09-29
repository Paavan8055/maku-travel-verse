-- Enhanced Analytics and Event Tracking Schema
-- This migration creates comprehensive event tracking, user analytics, and monitoring tables

-- Create events table for detailed user interaction tracking
CREATE TABLE IF NOT EXISTS public.events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL,
  event_category TEXT NOT NULL, -- 'user_action', 'system', 'provider', 'booking', etc.
  user_id UUID REFERENCES auth.users(id),
  session_id TEXT,
  event_data JSONB NOT NULL DEFAULT '{}',
  properties JSONB DEFAULT '{}',
  context JSONB DEFAULT '{}', -- Device, location, referrer info
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  processed_at TIMESTAMPTZ,
  environment TEXT DEFAULT 'production'
);

-- Create indexes for faster analytics queries
CREATE INDEX idx_events_type_category ON public.events (event_type, event_category);
CREATE INDEX idx_events_user_id ON public.events (user_id);
CREATE INDEX idx_events_created_at ON public.events (created_at DESC);
CREATE INDEX idx_events_session_id ON public.events (session_id);
CREATE INDEX idx_events_environment ON public.events (environment);

-- Create provider_health table for monitoring API provider status
CREATE TABLE IF NOT EXISTS public.provider_health (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_name TEXT NOT NULL,
  environment TEXT NOT NULL DEFAULT 'production',
  status TEXT NOT NULL CHECK (status IN ('healthy', 'degraded', 'down', 'maintenance')),
  response_time_ms INTEGER,
  error_rate DECIMAL(5,4), -- e.g., 0.0523 for 5.23%
  last_check_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  error_message TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_provider_health_name_env ON public.provider_health (provider_name, environment);
CREATE INDEX idx_provider_health_status ON public.provider_health (status);
CREATE INDEX idx_provider_health_check_at ON public.provider_health (last_check_at DESC);

-- Create booking_metrics table for tracking booking patterns and anomalies
CREATE TABLE IF NOT EXISTS public.booking_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  metric_type TEXT NOT NULL, -- 'conversion_rate', 'booking_volume', 'average_value', etc.
  provider_name TEXT,
  environment TEXT DEFAULT 'production',
  time_period TEXT NOT NULL, -- 'hourly', 'daily', 'weekly'
  metric_value DECIMAL(15,4),
  additional_data JSONB DEFAULT '{}',
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_booking_metrics_type_provider ON public.booking_metrics (metric_type, provider_name);
CREATE INDEX idx_booking_metrics_recorded_at ON public.booking_metrics (recorded_at DESC);
CREATE INDEX idx_booking_metrics_environment ON public.booking_metrics (environment);

-- Create user_analytics table for user behavior patterns
CREATE TABLE IF NOT EXISTS public.user_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  session_id TEXT,
  page_views INTEGER DEFAULT 0,
  search_queries INTEGER DEFAULT 0,
  filter_interactions INTEGER DEFAULT 0,
  referral_clicks INTEGER DEFAULT 0,
  booking_attempts INTEGER DEFAULT 0,
  booking_completions INTEGER DEFAULT 0,
  time_spent_seconds INTEGER DEFAULT 0,
  last_activity_at TIMESTAMPTZ DEFAULT now(),
  properties JSONB DEFAULT '{}', -- User preferences, device info, etc.
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_user_analytics_user_id ON public.user_analytics (user_id);
CREATE INDEX idx_user_analytics_session_id ON public.user_analytics (session_id);
CREATE INDEX idx_user_analytics_last_activity ON public.user_analytics (last_activity_at DESC);

-- Create system_alerts table for monitoring and alerting
CREATE TABLE IF NOT EXISTS public.system_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_type TEXT NOT NULL, -- 'provider_down', 'high_error_rate', 'booking_anomaly', etc.
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  provider_name TEXT,
  environment TEXT DEFAULT 'production',
  alert_message TEXT NOT NULL,
  alert_data JSONB DEFAULT '{}',
  is_resolved BOOLEAN DEFAULT false,
  resolved_at TIMESTAMPTZ,
  resolved_by TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_system_alerts_type_severity ON public.system_alerts (alert_type, severity);
CREATE INDEX idx_system_alerts_provider ON public.system_alerts (provider_name);
CREATE INDEX idx_system_alerts_unresolved ON public.system_alerts (is_resolved, created_at DESC);
CREATE INDEX idx_system_alerts_environment ON public.system_alerts (environment);

-- Create analytics_dashboards table for storing dashboard configurations
CREATE TABLE IF NOT EXISTS public.analytics_dashboards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dashboard_name TEXT UNIQUE NOT NULL,
  dashboard_config JSONB NOT NULL,
  owner_id UUID REFERENCES auth.users(id),
  is_public BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on all analytics tables
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.provider_health ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.booking_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_dashboards ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Events: Users can create their own events, admins can read all
CREATE POLICY "Users can create events" ON public.events FOR INSERT WITH CHECK (auth.uid() = user_id OR auth.uid() IS NULL);
CREATE POLICY "Admins can read all events" ON public.events FOR SELECT USING (is_secure_admin(auth.uid()));
CREATE POLICY "Service role can manage events" ON public.events FOR ALL USING (auth.role() = 'service_role');

-- Provider Health: Service role and admins only
CREATE POLICY "Service role can manage provider health" ON public.provider_health FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Admins can read provider health" ON public.provider_health FOR SELECT USING (is_secure_admin(auth.uid()));

-- Booking Metrics: Service role and admins only
CREATE POLICY "Service role can manage booking metrics" ON public.booking_metrics FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Admins can read booking metrics" ON public.booking_metrics FOR SELECT USING (is_secure_admin(auth.uid()));

-- User Analytics: Users can read their own, admins can read all
CREATE POLICY "Users can read own analytics" ON public.user_analytics FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Service role can manage user analytics" ON public.user_analytics FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Admins can read all user analytics" ON public.user_analytics FOR SELECT USING (is_secure_admin(auth.uid()));

-- System Alerts: Admins and service role only
CREATE POLICY "Admins can manage alerts" ON public.system_alerts FOR ALL USING (is_secure_admin(auth.uid()));
CREATE POLICY "Service role can manage alerts" ON public.system_alerts FOR ALL USING (auth.role() = 'service_role');

-- Analytics Dashboards: Owners and admins
CREATE POLICY "Owners can manage dashboards" ON public.analytics_dashboards FOR ALL USING (auth.uid() = owner_id OR is_secure_admin(auth.uid()));
CREATE POLICY "Public dashboards readable" ON public.analytics_dashboards FOR SELECT USING (is_public = true OR auth.uid() = owner_id OR is_secure_admin(auth.uid()));

-- Create triggers for updated_at
CREATE OR REPLACE FUNCTION update_analytics_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER user_analytics_updated_at_trigger
  BEFORE UPDATE ON public.user_analytics
  FOR EACH ROW
  EXECUTE FUNCTION update_analytics_updated_at();

CREATE TRIGGER system_alerts_updated_at_trigger
  BEFORE UPDATE ON public.system_alerts
  FOR EACH ROW
  EXECUTE FUNCTION update_analytics_updated_at();

CREATE TRIGGER analytics_dashboards_updated_at_trigger
  BEFORE UPDATE ON public.analytics_dashboards
  FOR EACH ROW
  EXECUTE FUNCTION update_analytics_updated_at();

-- Insert initial dashboard configurations
INSERT INTO public.analytics_dashboards (dashboard_name, dashboard_config, is_public) VALUES
('provider_health_dashboard', '{
  "title": "Provider Health Dashboard",
  "widgets": [
    {"type": "provider_status_grid", "providers": ["amadeus", "sabre", "viator", "duffle", "ratehawk", "expedia"]},
    {"type": "response_time_chart", "time_range": "24h"},
    {"type": "error_rate_chart", "time_range": "24h"},
    {"type": "alert_list", "severity_filter": ["high", "critical"]}
  ],
  "refresh_interval": 60
}', true),

('booking_analytics_dashboard', '{
  "title": "Booking Analytics Dashboard", 
  "widgets": [
    {"type": "booking_volume_chart", "time_range": "7d"},
    {"type": "conversion_funnel", "steps": ["search", "select", "checkout", "complete"]},
    {"type": "provider_performance", "metrics": ["volume", "conversion_rate", "average_value"]},
    {"type": "geographic_distribution", "map_type": "bookings"}
  ],
  "refresh_interval": 300
}', true),

('user_engagement_dashboard', '{
  "title": "User Engagement Dashboard",
  "widgets": [
    {"type": "user_activity_heatmap", "time_range": "30d"},
    {"type": "feature_usage_chart", "features": ["search", "filters", "referrals", "nft", "airdrop"]},
    {"type": "user_journey_flow", "start_events": ["page_view", "search"]},
    {"type": "retention_cohort", "cohort_period": "weekly"}
  ],
  "refresh_interval": 600
}', true)

ON CONFLICT (dashboard_name) DO UPDATE SET
  dashboard_config = EXCLUDED.dashboard_config,
  updated_at = now();

-- Create sample event types for reference
CREATE TABLE IF NOT EXISTS public.event_types_reference (
  event_type TEXT PRIMARY KEY,
  category TEXT NOT NULL,
  description TEXT,
  sample_data JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

INSERT INTO public.event_types_reference (event_type, category, description, sample_data) VALUES
('page_view', 'user_action', 'User views a page', '{"page": "/hotels", "referrer": "/", "duration_ms": 5000}'),
('search_query', 'user_action', 'User performs a search', '{"query": "hotels in paris", "filters": {"stars": 4}, "results_count": 25}'),
('filter_applied', 'user_action', 'User applies/removes filters', '{"filter_type": "price_range", "value": "100-200", "action": "add"}'),
('provider_search', 'system', 'Search request sent to provider', '{"provider": "amadeus", "query_type": "hotel_search", "response_time_ms": 1200}'),
('booking_started', 'booking', 'User begins booking process', '{"provider": "expedia", "service_type": "hotel", "price": 150.00}'),
('booking_completed', 'booking', 'Booking successfully completed', '{"booking_id": "bk_123", "provider": "expedia", "total": 150.00, "payment_method": "stripe"}'),
('referral_click', 'user_action', 'User clicks referral link', '{"referral_code": "FRIEND123", "target_page": "/nft"}'),
('nft_claimed', 'user_action', 'User claims NFT reward', '{"nft_type": "travel_explorer", "rarity": "rare", "booking_id": "bk_123"}'),
('error_occurred', 'system', 'System error or exception', '{"error_type": "provider_timeout", "provider": "sabre", "endpoint": "/hotel-search"}'),
('alert_triggered', 'system', 'System alert triggered', '{"alert_type": "high_error_rate", "provider": "amadeus", "threshold": 0.05, "current": 0.08}')
ON CONFLICT (event_type) DO NOTHING;