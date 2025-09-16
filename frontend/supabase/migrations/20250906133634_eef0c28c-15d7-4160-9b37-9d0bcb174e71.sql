-- Phase 4: Advanced Analytics & Forecasting Database Tables

-- Demand forecasting with ML predictions
CREATE TABLE public.demand_forecasts (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    destination_code TEXT NOT NULL,
    forecast_date DATE NOT NULL,
    forecast_period TEXT NOT NULL, -- 'daily', 'weekly', 'monthly'
    predicted_demand INTEGER NOT NULL,
    confidence_interval JSONB NOT NULL DEFAULT '{}',
    seasonal_factors JSONB DEFAULT '{}',
    external_factors JSONB DEFAULT '{}', -- weather, events, holidays
    model_version TEXT DEFAULT 'v1.0',
    accuracy_score NUMERIC(5,4) DEFAULT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Revenue projections and financial forecasting
CREATE TABLE public.revenue_projections (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    projection_period TEXT NOT NULL, -- 'monthly', 'quarterly', 'yearly'
    projection_date DATE NOT NULL,
    revenue_category TEXT NOT NULL, -- 'hotels', 'flights', 'activities', 'total'
    projected_revenue NUMERIC(12,2) NOT NULL,
    lower_bound NUMERIC(12,2) NOT NULL,
    upper_bound NUMERIC(12,2) NOT NULL,
    confidence_level NUMERIC(5,2) DEFAULT 95.0,
    scenario_type TEXT DEFAULT 'base', -- 'optimistic', 'base', 'pessimistic'
    model_factors JSONB DEFAULT '{}',
    actual_revenue NUMERIC(12,2) DEFAULT NULL,
    variance_percentage NUMERIC(5,2) DEFAULT NULL,
    currency TEXT NOT NULL DEFAULT 'AUD',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Market insights and competitive intelligence
CREATE TABLE public.market_insights (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    insight_type TEXT NOT NULL, -- 'trend', 'competitor', 'opportunity', 'threat'
    market_segment TEXT NOT NULL, -- 'luxury', 'budget', 'business', 'leisure'
    destination_code TEXT DEFAULT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    confidence_score NUMERIC(5,2) DEFAULT NULL,
    impact_level TEXT DEFAULT 'medium', -- 'low', 'medium', 'high', 'critical'
    recommendation TEXT DEFAULT NULL,
    supporting_data JSONB DEFAULT '{}',
    expiry_date DATE DEFAULT NULL,
    is_actionable BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Customer behavior analytics and CLV predictions
CREATE TABLE public.customer_behavior_analytics (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID DEFAULT NULL,
    customer_segment TEXT NOT NULL,
    behavior_pattern JSONB NOT NULL DEFAULT '{}',
    lifetime_value_prediction NUMERIC(10,2) DEFAULT NULL,
    churn_probability NUMERIC(5,4) DEFAULT NULL,
    next_booking_probability NUMERIC(5,4) DEFAULT NULL,
    preferred_destinations JSONB DEFAULT '[]',
    booking_frequency TEXT DEFAULT NULL, -- 'low', 'medium', 'high'
    average_booking_value NUMERIC(10,2) DEFAULT NULL,
    last_interaction_date DATE DEFAULT NULL,
    engagement_score NUMERIC(5,2) DEFAULT NULL,
    personalization_data JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Pricing optimization recommendations
CREATE TABLE public.pricing_optimization (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    product_type TEXT NOT NULL, -- 'hotel', 'flight', 'activity'
    destination_code TEXT NOT NULL,
    current_price NUMERIC(10,2) NOT NULL,
    recommended_price NUMERIC(10,2) NOT NULL,
    price_elasticity NUMERIC(5,4) DEFAULT NULL,
    demand_sensitivity NUMERIC(5,4) DEFAULT NULL,
    competitor_pricing JSONB DEFAULT '{}',
    optimization_factors JSONB DEFAULT '{}',
    expected_conversion_lift NUMERIC(5,2) DEFAULT NULL,
    revenue_impact_estimate NUMERIC(12,2) DEFAULT NULL,
    implementation_date DATE DEFAULT NULL,
    status TEXT DEFAULT 'pending', -- 'pending', 'implemented', 'rejected'
    currency TEXT NOT NULL DEFAULT 'AUD',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Risk assessments and mitigation strategies
CREATE TABLE public.risk_assessments (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    risk_category TEXT NOT NULL, -- 'financial', 'operational', 'market', 'technical'
    risk_title TEXT NOT NULL,
    risk_description TEXT NOT NULL,
    probability NUMERIC(5,2) NOT NULL, -- 0-100 percentage
    impact_score NUMERIC(5,2) NOT NULL, -- 1-10 scale
    risk_level TEXT NOT NULL, -- 'low', 'medium', 'high', 'critical'
    current_controls JSONB DEFAULT '[]',
    recommended_actions JSONB DEFAULT '[]',
    mitigation_timeline TEXT DEFAULT NULL,
    risk_owner TEXT DEFAULT NULL,
    status TEXT DEFAULT 'identified', -- 'identified', 'monitored', 'mitigated', 'closed'
    review_date DATE DEFAULT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Predictive alerts and notifications
CREATE TABLE public.predictive_alerts (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    alert_type TEXT NOT NULL, -- 'demand_surge', 'revenue_drop', 'churn_risk', 'opportunity'
    severity TEXT NOT NULL DEFAULT 'medium', -- 'low', 'medium', 'high', 'critical'
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    predicted_event_date DATE DEFAULT NULL,
    confidence_level NUMERIC(5,2) DEFAULT NULL,
    potential_impact JSONB DEFAULT '{}',
    recommended_actions JSONB DEFAULT '[]',
    affected_metrics JSONB DEFAULT '[]',
    is_read BOOLEAN DEFAULT false,
    is_actionable BOOLEAN DEFAULT true,
    resolved_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    resolved_by UUID DEFAULT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create indexes for performance optimization
CREATE INDEX idx_demand_forecasts_destination_date ON public.demand_forecasts(destination_code, forecast_date);
CREATE INDEX idx_revenue_projections_period_date ON public.revenue_projections(projection_period, projection_date);
CREATE INDEX idx_market_insights_type_segment ON public.market_insights(insight_type, market_segment);
CREATE INDEX idx_customer_behavior_user_segment ON public.customer_behavior_analytics(user_id, customer_segment);
CREATE INDEX idx_pricing_optimization_product_destination ON public.pricing_optimization(product_type, destination_code);
CREATE INDEX idx_risk_assessments_category_level ON public.risk_assessments(risk_category, risk_level);
CREATE INDEX idx_predictive_alerts_type_severity ON public.predictive_alerts(alert_type, severity);

-- Enable RLS on all tables
ALTER TABLE public.demand_forecasts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.revenue_projections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.market_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_behavior_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pricing_optimization ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.risk_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.predictive_alerts ENABLE ROW LEVEL SECURITY;

-- RLS policies for admin access
CREATE POLICY "Admins can manage demand forecasts" ON public.demand_forecasts
    FOR ALL USING (is_secure_admin(auth.uid()));

CREATE POLICY "Admins can manage revenue projections" ON public.revenue_projections
    FOR ALL USING (is_secure_admin(auth.uid()));

CREATE POLICY "Admins can manage market insights" ON public.market_insights
    FOR ALL USING (is_secure_admin(auth.uid()));

CREATE POLICY "Admins can manage customer behavior analytics" ON public.customer_behavior_analytics
    FOR ALL USING (is_secure_admin(auth.uid()));

CREATE POLICY "Admins can manage pricing optimization" ON public.pricing_optimization
    FOR ALL USING (is_secure_admin(auth.uid()));

CREATE POLICY "Admins can manage risk assessments" ON public.risk_assessments
    FOR ALL USING (is_secure_admin(auth.uid()));

CREATE POLICY "Admins can manage predictive alerts" ON public.predictive_alerts
    FOR ALL USING (is_secure_admin(auth.uid()));

-- Service role policies for agent operations
CREATE POLICY "Service role can manage all analytics data" ON public.demand_forecasts
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role can manage revenue data" ON public.revenue_projections
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role can manage market data" ON public.market_insights
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role can manage customer analytics" ON public.customer_behavior_analytics
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role can manage pricing data" ON public.pricing_optimization
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role can manage risk data" ON public.risk_assessments
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role can manage alert data" ON public.predictive_alerts
    FOR ALL USING (auth.role() = 'service_role');

-- Create update triggers for updated_at timestamps
CREATE TRIGGER update_demand_forecasts_updated_at
    BEFORE UPDATE ON public.demand_forecasts
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_revenue_projections_updated_at
    BEFORE UPDATE ON public.revenue_projections
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_market_insights_updated_at
    BEFORE UPDATE ON public.market_insights
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_customer_behavior_analytics_updated_at
    BEFORE UPDATE ON public.customer_behavior_analytics
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_pricing_optimization_updated_at
    BEFORE UPDATE ON public.pricing_optimization
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_risk_assessments_updated_at
    BEFORE UPDATE ON public.risk_assessments
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_predictive_alerts_updated_at
    BEFORE UPDATE ON public.predictive_alerts
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();