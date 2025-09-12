-- Create enhanced tables for comprehensive OTA business intelligence

-- Provider performance tracking table
CREATE TABLE IF NOT EXISTS public.provider_performance_metrics (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    provider_id TEXT NOT NULL,
    provider_name TEXT NOT NULL,
    date DATE DEFAULT CURRENT_DATE,
    total_requests INTEGER DEFAULT 0,
    successful_requests INTEGER DEFAULT 0,
    failed_requests INTEGER DEFAULT 0,
    avg_response_time_ms NUMERIC DEFAULT 0,
    revenue_generated NUMERIC DEFAULT 0,
    conversion_rate NUMERIC DEFAULT 0,
    customer_satisfaction_score NUMERIC DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(provider_id, date)
);

-- Revenue tracking and protection table
CREATE TABLE IF NOT EXISTS public.revenue_protection_metrics (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    correlation_id TEXT NOT NULL,
    booking_type TEXT NOT NULL,
    potential_revenue NUMERIC NOT NULL DEFAULT 0,
    lost_revenue NUMERIC DEFAULT 0,
    customer_tier TEXT DEFAULT 'standard',
    failure_reason TEXT,
    provider_id TEXT,
    recovery_attempted BOOLEAN DEFAULT FALSE,
    recovery_successful BOOLEAN DEFAULT FALSE,
    escalated BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Customer journey analytics table
CREATE TABLE IF NOT EXISTS public.customer_journey_analytics (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    session_id TEXT NOT NULL,
    correlation_id TEXT,
    user_id UUID,
    journey_stage TEXT NOT NULL, -- 'search', 'select', 'review', 'payment', 'confirmation'
    funnel_step INTEGER NOT NULL,
    booking_type TEXT,
    provider_used TEXT,
    duration_ms INTEGER,
    abandoned BOOLEAN DEFAULT FALSE,
    abandonment_reason TEXT,
    device_type TEXT DEFAULT 'desktop',
    booking_value NUMERIC DEFAULT 0,
    customer_lifetime_value NUMERIC DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Partner discovery and onboarding tracking
CREATE TABLE IF NOT EXISTS public.partner_onboarding_metrics (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    partner_name TEXT NOT NULL,
    discovery_method TEXT NOT NULL, -- 'auto_discovery', 'manual', 'referral', 'competitive_intel'
    market_opportunity_score NUMERIC DEFAULT 0,
    predicted_roi NUMERIC DEFAULT 0,
    onboarding_stage TEXT DEFAULT 'discovered', -- 'discovered', 'assessment', 'negotiation', 'integration', 'active'
    time_to_onboard_days INTEGER,
    integration_complexity_score NUMERIC DEFAULT 0,
    revenue_potential NUMERIC DEFAULT 0,
    risk_assessment_score NUMERIC DEFAULT 0,
    competitive_advantage_score NUMERIC DEFAULT 0,
    assigned_to UUID,
    priority_level INTEGER DEFAULT 3, -- 1=critical, 2=high, 3=medium, 4=low
    status TEXT DEFAULT 'pending',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Real-time business alerts table
CREATE TABLE IF NOT EXISTS public.business_alerts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    alert_type TEXT NOT NULL, -- 'revenue_risk', 'provider_degradation', 'conversion_drop', 'vip_impact'
    severity TEXT NOT NULL DEFAULT 'medium', -- 'critical', 'high', 'medium', 'low'
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    correlation_id TEXT,
    provider_id TEXT,
    user_id UUID,
    revenue_impact NUMERIC DEFAULT 0,
    escalation_level INTEGER DEFAULT 1,
    resolved BOOLEAN DEFAULT FALSE,
    resolved_at TIMESTAMP WITH TIME ZONE,
    resolved_by UUID,
    auto_generated BOOLEAN DEFAULT TRUE,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Predictive analytics data table  
CREATE TABLE IF NOT EXISTS public.predictive_analytics_data (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    metric_type TEXT NOT NULL, -- 'seasonal_demand', 'churn_prediction', 'revenue_forecast'
    time_period DATE NOT NULL,
    provider_id TEXT,
    booking_type TEXT,
    predicted_value NUMERIC NOT NULL,
    actual_value NUMERIC,
    confidence_score NUMERIC DEFAULT 0,
    model_version TEXT DEFAULT 'v1.0',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(metric_type, time_period, provider_id, booking_type)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_provider_performance_provider_date ON public.provider_performance_metrics(provider_id, date);
CREATE INDEX IF NOT EXISTS idx_revenue_protection_correlation ON public.revenue_protection_metrics(correlation_id);
CREATE INDEX IF NOT EXISTS idx_customer_journey_session ON public.customer_journey_analytics(session_id);
CREATE INDEX IF NOT EXISTS idx_partner_onboarding_stage ON public.partner_onboarding_metrics(onboarding_stage, priority_level);
CREATE INDEX IF NOT EXISTS idx_business_alerts_severity ON public.business_alerts(severity, resolved, created_at);
CREATE INDEX IF NOT EXISTS idx_predictive_analytics_type_period ON public.predictive_analytics_data(metric_type, time_period);

-- Create triggers for updated_at
CREATE TRIGGER update_provider_performance_updated_at
    BEFORE UPDATE ON public.provider_performance_metrics
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_revenue_protection_updated_at
    BEFORE UPDATE ON public.revenue_protection_metrics
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_partner_onboarding_updated_at  
    BEFORE UPDATE ON public.partner_onboarding_metrics
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Row Level Security
ALTER TABLE public.provider_performance_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.revenue_protection_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_journey_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partner_onboarding_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.predictive_analytics_data ENABLE ROW LEVEL SECURITY;

-- Admin-only policies for business intelligence data
CREATE POLICY "Admin access to provider performance metrics" ON public.provider_performance_metrics
    FOR ALL USING (public.is_admin(auth.uid()));

CREATE POLICY "Admin access to revenue protection metrics" ON public.revenue_protection_metrics
    FOR ALL USING (public.is_admin(auth.uid()));

CREATE POLICY "Admin access to customer journey analytics" ON public.customer_journey_analytics
    FOR ALL USING (public.is_admin(auth.uid()));

CREATE POLICY "Admin access to partner onboarding metrics" ON public.partner_onboarding_metrics
    FOR ALL USING (public.is_admin(auth.uid()));

CREATE POLICY "Admin access to business alerts" ON public.business_alerts
    FOR ALL USING (public.is_admin(auth.uid()));

CREATE POLICY "Admin access to predictive analytics data" ON public.predictive_analytics_data
    FOR ALL USING (public.is_admin(auth.uid()));