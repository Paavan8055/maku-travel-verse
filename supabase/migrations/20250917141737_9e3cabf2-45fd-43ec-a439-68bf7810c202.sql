-- Enhanced Travel Information Architecture Schema
-- This migration implements the comprehensive data management architecture

-- 1. Unified Search Query Management with Deduplication
CREATE TABLE IF NOT EXISTS public.unified_search_queries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  query_hash TEXT UNIQUE NOT NULL,
  search_type TEXT NOT NULL CHECK (search_type IN ('flight', 'hotel', 'activity')),
  normalized_params JSONB NOT NULL,
  geographic_region TEXT,
  seasonal_context JSONB DEFAULT '{}',
  user_segment TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for faster query hash lookups
CREATE INDEX IF NOT EXISTS idx_unified_search_queries_hash ON public.unified_search_queries(query_hash);
CREATE INDEX IF NOT EXISTS idx_unified_search_queries_type_region ON public.unified_search_queries(search_type, geographic_region);

-- 2. Enhanced Provider Response Cache with Intelligence
CREATE TABLE IF NOT EXISTS public.provider_response_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  query_hash TEXT NOT NULL REFERENCES public.unified_search_queries(query_hash) ON DELETE CASCADE,
  provider_id TEXT NOT NULL,
  response_data JSONB NOT NULL,
  response_quality_score INTEGER DEFAULT 0 CHECK (response_quality_score >= 0 AND response_quality_score <= 100),
  geographic_relevance JSONB DEFAULT '{}',
  price_competitiveness NUMERIC DEFAULT 0,
  expires_at TIMESTAMPTZ NOT NULL,
  last_validated TIMESTAMPTZ DEFAULT NOW(),
  hit_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_provider_response_cache_query ON public.provider_response_cache(query_hash);
CREATE INDEX IF NOT EXISTS idx_provider_response_cache_expires ON public.provider_response_cache(expires_at);
CREATE INDEX IF NOT EXISTS idx_provider_response_cache_provider ON public.provider_response_cache(provider_id);

-- 3. Search Pattern Intelligence for Predictive Features
CREATE TABLE IF NOT EXISTS public.search_pattern_intelligence (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pattern_type TEXT NOT NULL CHECK (pattern_type IN ('seasonal', 'geographic', 'demographic', 'price_trend', 'booking_behavior')),
  pattern_data JSONB NOT NULL,
  confidence_score NUMERIC NOT NULL CHECK (confidence_score >= 0 AND confidence_score <= 1),
  usage_frequency INTEGER DEFAULT 0,
  seasonal_relevance JSONB DEFAULT '{}',
  geographic_scope TEXT[] DEFAULT '{}',
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for pattern matching
CREATE INDEX IF NOT EXISTS idx_search_pattern_intelligence_type ON public.search_pattern_intelligence(pattern_type);
CREATE INDEX IF NOT EXISTS idx_search_pattern_intelligence_confidence ON public.search_pattern_intelligence(confidence_score DESC);

-- 4. Enhanced Search Audit with Performance Tracking
ALTER TABLE public.search_audit 
ADD COLUMN IF NOT EXISTS response_time_ms INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS cache_hit BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS provider_used TEXT,
ADD COLUMN IF NOT EXISTS quality_score INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS geographic_context JSONB DEFAULT '{}';

-- 5. Provider Health Enhancement
ALTER TABLE public.provider_health 
ADD COLUMN IF NOT EXISTS predictive_health_score INTEGER DEFAULT 100,
ADD COLUMN IF NOT EXISTS avg_quality_score NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS user_satisfaction_rating NUMERIC DEFAULT 0;

-- 6. Cross-Module Data Synchronization Table
CREATE TABLE IF NOT EXISTS public.cross_module_context (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_session_id TEXT NOT NULL,
  module_type TEXT NOT NULL CHECK (module_type IN ('flight', 'hotel', 'activity')),
  context_data JSONB NOT NULL,
  shared_parameters JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '2 hours')
);

-- Index for session-based context sharing
CREATE INDEX IF NOT EXISTS idx_cross_module_context_session ON public.cross_module_context(user_session_id, module_type);
CREATE INDEX IF NOT EXISTS idx_cross_module_context_expires ON public.cross_module_context(expires_at);

-- 7. Intelligent Cache Warming Schedule
CREATE TABLE IF NOT EXISTS public.cache_warming_schedule (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  destination TEXT NOT NULL,
  search_type TEXT NOT NULL,
  priority_level INTEGER DEFAULT 1,
  warm_parameters JSONB NOT NULL,
  next_warm_at TIMESTAMPTZ NOT NULL,
  last_warmed_at TIMESTAMPTZ,
  success_rate NUMERIC DEFAULT 1.0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for cache warming optimization
CREATE INDEX IF NOT EXISTS idx_cache_warming_schedule_next ON public.cache_warming_schedule(next_warm_at);
CREATE INDEX IF NOT EXISTS idx_cache_warming_schedule_priority ON public.cache_warming_schedule(priority_level DESC);

-- 8. Data Quality Monitoring
CREATE TABLE IF NOT EXISTS public.data_quality_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id TEXT NOT NULL,
  data_type TEXT NOT NULL,
  quality_score INTEGER NOT NULL CHECK (quality_score >= 0 AND quality_score <= 100),
  completeness_score INTEGER NOT NULL CHECK (completeness_score >= 0 AND completeness_score <= 100),
  accuracy_score INTEGER NOT NULL CHECK (accuracy_score >= 0 AND accuracy_score <= 100),
  freshness_score INTEGER NOT NULL CHECK (freshness_score >= 0 AND freshness_score <= 100),
  sample_size INTEGER DEFAULT 1,
  measurement_date TIMESTAMPTZ DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'
);

-- Index for quality tracking
CREATE INDEX IF NOT EXISTS idx_data_quality_metrics_provider ON public.data_quality_metrics(provider_id, measurement_date DESC);

-- 9. Enable RLS on all new tables
ALTER TABLE public.unified_search_queries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.provider_response_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.search_pattern_intelligence ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cross_module_context ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cache_warming_schedule ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.data_quality_metrics ENABLE ROW LEVEL SECURITY;

-- 10. RLS Policies for secure access
-- Service role can manage all data
CREATE POLICY "Service role can manage unified search queries" ON public.unified_search_queries FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role can manage provider response cache" ON public.provider_response_cache FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role can manage search patterns" ON public.search_pattern_intelligence FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role can manage cross module context" ON public.cross_module_context FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role can manage cache warming" ON public.cache_warming_schedule FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role can manage data quality" ON public.data_quality_metrics FOR ALL USING (auth.role() = 'service_role');

-- Authenticated users can read search queries and cache for their own use
CREATE POLICY "Authenticated users can read unified search queries" ON public.unified_search_queries FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can read provider cache" ON public.provider_response_cache FOR SELECT USING (auth.uid() IS NOT NULL);

-- Admins can view all data
CREATE POLICY "Admins can view all search intelligence data" ON public.search_pattern_intelligence FOR SELECT USING (is_secure_admin(auth.uid()));
CREATE POLICY "Admins can view all data quality metrics" ON public.data_quality_metrics FOR SELECT USING (is_secure_admin(auth.uid()));

-- 11. Functions for intelligent operations
CREATE OR REPLACE FUNCTION public.generate_search_query_hash(params JSONB, search_type TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Create a consistent hash from normalized search parameters
  RETURN encode(
    digest(
      search_type || '::' || (params::text), 
      'sha256'
    ), 
    'hex'
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.get_intelligent_cache_data(p_query_hash TEXT, p_max_age_hours INTEGER DEFAULT 24)
RETURNS TABLE(
  provider_id TEXT,
  response_data JSONB,
  quality_score INTEGER,
  age_hours INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    prc.provider_id,
    prc.response_data,
    prc.response_quality_score,
    EXTRACT(HOURS FROM (NOW() - prc.created_at))::INTEGER as age_hours
  FROM public.provider_response_cache prc
  WHERE prc.query_hash = p_query_hash
    AND prc.expires_at > NOW()
    AND EXTRACT(HOURS FROM (NOW() - prc.created_at)) <= p_max_age_hours
  ORDER BY prc.response_quality_score DESC, prc.hit_count DESC
  LIMIT 5;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_cache_hit_count(p_cache_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.provider_response_cache 
  SET hit_count = hit_count + 1, last_validated = NOW()
  WHERE id = p_cache_id;
END;
$$;

-- 12. Triggers for automatic maintenance
CREATE OR REPLACE FUNCTION public.update_search_patterns_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_search_pattern_intelligence_updated_at
  BEFORE UPDATE ON public.search_pattern_intelligence
  FOR EACH ROW EXECUTE FUNCTION public.update_search_patterns_updated_at();

CREATE TRIGGER update_unified_search_queries_updated_at
  BEFORE UPDATE ON public.unified_search_queries
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 13. Cleanup function for expired data
CREATE OR REPLACE FUNCTION public.cleanup_intelligent_cache()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Clean expired cache entries
  DELETE FROM public.provider_response_cache WHERE expires_at < NOW() - INTERVAL '1 day';
  
  -- Clean expired cross-module context
  DELETE FROM public.cross_module_context WHERE expires_at < NOW();
  
  -- Clean old search patterns with low confidence
  DELETE FROM public.search_pattern_intelligence 
  WHERE updated_at < NOW() - INTERVAL '30 days' AND confidence_score < 0.3;
  
  -- Clean old quality metrics
  DELETE FROM public.data_quality_metrics WHERE measurement_date < NOW() - INTERVAL '90 days';
END;
$$;