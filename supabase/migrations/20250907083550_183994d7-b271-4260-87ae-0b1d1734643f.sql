-- Phase 3: Advanced Features & Integration Database Schema

-- AI Workplace Calendar with intelligent scheduling
CREATE TABLE public.ai_workplace_calendar (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    event_title TEXT NOT NULL,
    event_description TEXT,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE NOT NULL,
    timezone TEXT NOT NULL DEFAULT 'UTC',
    event_type TEXT NOT NULL DEFAULT 'meeting', -- meeting, travel, personal, etc.
    ai_suggestions JSONB DEFAULT '{}',
    travel_integration JSONB DEFAULT '{}', -- linked booking IDs, locations
    attendees JSONB DEFAULT '[]',
    location TEXT,
    is_ai_generated BOOLEAN DEFAULT false,
    conflict_resolution JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Document Intelligence for AI-powered document management
CREATE TABLE public.document_intelligence (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    document_name TEXT NOT NULL,
    document_type TEXT NOT NULL, -- passport, visa, insurance, ticket, etc.
    file_path TEXT,
    ai_analysis JSONB DEFAULT '{}', -- extracted data, confidence scores
    classification_confidence NUMERIC DEFAULT 0,
    expiry_date DATE,
    related_bookings JSONB DEFAULT '[]',
    tags JSONB DEFAULT '[]',
    security_level TEXT DEFAULT 'standard', -- standard, sensitive, confidential
    auto_categorized BOOLEAN DEFAULT false,
    search_vector TSVECTOR,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- ML Recommendation Models storage
CREATE TABLE public.ml_recommendation_models (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    model_name TEXT NOT NULL,
    model_version TEXT NOT NULL DEFAULT '1.0',
    model_type TEXT NOT NULL, -- collaborative, content_based, hybrid
    model_data JSONB NOT NULL,
    performance_metrics JSONB DEFAULT '{}',
    training_data_size INTEGER DEFAULT 0,
    last_trained TIMESTAMP WITH TIME ZONE DEFAULT now(),
    is_active BOOLEAN DEFAULT true,
    accuracy_score NUMERIC DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Corporate Travel Policies for business automation
CREATE TABLE public.corporate_policies (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id UUID NOT NULL,
    policy_name TEXT NOT NULL,
    policy_type TEXT NOT NULL, -- accommodation, transport, expense, approval
    policy_rules JSONB NOT NULL,
    approval_workflow JSONB DEFAULT '{}',
    budget_limits JSONB DEFAULT '{}',
    compliance_requirements JSONB DEFAULT '{}',
    effective_date DATE NOT NULL,
    expiry_date DATE,
    is_active BOOLEAN DEFAULT true,
    created_by UUID,
    updated_by UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- User Preference Learning for ML recommendations
CREATE TABLE public.travel_preferences_ml (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    preference_category TEXT NOT NULL, -- destinations, accommodations, activities, timing
    learned_preferences JSONB NOT NULL,
    confidence_score NUMERIC DEFAULT 0,
    interaction_count INTEGER DEFAULT 0,
    last_interaction TIMESTAMP WITH TIME ZONE DEFAULT now(),
    preference_source TEXT DEFAULT 'behavioral', -- behavioral, explicit, social
    feedback_score NUMERIC DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Dynamic Pricing Cache for real-time intelligence
CREATE TABLE public.dynamic_pricing_cache (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    product_type TEXT NOT NULL, -- hotel, flight, activity
    product_id TEXT NOT NULL,
    provider TEXT NOT NULL,
    base_price NUMERIC NOT NULL,
    dynamic_price NUMERIC NOT NULL,
    price_factors JSONB DEFAULT '{}', -- demand, seasonality, competition
    confidence_level NUMERIC DEFAULT 0,
    valid_until TIMESTAMP WITH TIME ZONE NOT NULL,
    market_conditions JSONB DEFAULT '{}',
    competitor_analysis JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Company profiles for corporate travel management
CREATE TABLE public.company_profiles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    company_name TEXT NOT NULL,
    industry TEXT,
    company_size TEXT, -- small, medium, large, enterprise
    billing_contact_id UUID,
    travel_admin_ids JSONB DEFAULT '[]',
    corporate_settings JSONB DEFAULT '{}',
    payment_methods JSONB DEFAULT '{}',
    reporting_preferences JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on all new tables
ALTER TABLE public.ai_workplace_calendar ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_intelligence ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ml_recommendation_models ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.corporate_policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.travel_preferences_ml ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dynamic_pricing_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_profiles ENABLE ROW LEVEL SECURITY;

-- Calendar policies
CREATE POLICY "Users can manage their own calendar events" ON public.ai_workplace_calendar
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Document intelligence policies
CREATE POLICY "Users can manage their own documents" ON public.document_intelligence
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ML models - read-only for users, full access for service role
CREATE POLICY "Users can view ML models" ON public.ml_recommendation_models
    FOR SELECT USING (is_active = true);

CREATE POLICY "Service role can manage ML models" ON public.ml_recommendation_models
    FOR ALL USING (auth.role() = 'service_role');

-- Corporate policies - company members only
CREATE POLICY "Company members can view their policies" ON public.corporate_policies
    FOR SELECT USING (
        company_id IN (
            SELECT cp.id FROM public.company_profiles cp 
            WHERE auth.uid() = ANY(SELECT jsonb_array_elements_text(cp.travel_admin_ids)::uuid)
        )
    );

-- Travel preferences - user specific
CREATE POLICY "Users can manage their preferences" ON public.travel_preferences_ml
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Pricing cache - read-only for authenticated users
CREATE POLICY "Authenticated users can view pricing data" ON public.dynamic_pricing_cache
    FOR SELECT USING (auth.uid() IS NOT NULL AND valid_until > now());

-- Company profiles - admin access
CREATE POLICY "Travel admins can manage company profiles" ON public.company_profiles
    FOR ALL USING (
        auth.uid() = ANY(SELECT jsonb_array_elements_text(travel_admin_ids)::uuid)
        OR auth.uid() = billing_contact_id
    );

-- Indexes for performance
CREATE INDEX idx_ai_calendar_user_time ON public.ai_workplace_calendar(user_id, start_time);
CREATE INDEX idx_document_intelligence_user ON public.document_intelligence(user_id);
CREATE INDEX idx_document_intelligence_type ON public.document_intelligence(document_type);
CREATE INDEX idx_document_intelligence_search ON public.document_intelligence USING GIN(search_vector);
CREATE INDEX idx_ml_models_active ON public.ml_recommendation_models(is_active, model_type);
CREATE INDEX idx_corporate_policies_company ON public.corporate_policies(company_id, is_active);
CREATE INDEX idx_travel_preferences_user ON public.travel_preferences_ml(user_id, preference_category);
CREATE INDEX idx_pricing_cache_product ON public.dynamic_pricing_cache(product_type, product_id, valid_until);

-- Update triggers
CREATE TRIGGER update_ai_calendar_updated_at
    BEFORE UPDATE ON public.ai_workplace_calendar
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_document_intelligence_updated_at
    BEFORE UPDATE ON public.document_intelligence
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_ml_models_updated_at
    BEFORE UPDATE ON public.ml_recommendation_models
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_corporate_policies_updated_at
    BEFORE UPDATE ON public.corporate_policies
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_travel_preferences_updated_at
    BEFORE UPDATE ON public.travel_preferences_ml
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Document search vector update function
CREATE OR REPLACE FUNCTION public.update_document_search_vector()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector := to_tsvector('english', 
    COALESCE(NEW.document_name, '') || ' ' || 
    COALESCE(NEW.document_type, '') || ' ' ||
    COALESCE(NEW.ai_analysis->>'extractedText', '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_document_search_vector_trigger
    BEFORE INSERT OR UPDATE ON public.document_intelligence
    FOR EACH ROW EXECUTE FUNCTION public.update_document_search_vector();