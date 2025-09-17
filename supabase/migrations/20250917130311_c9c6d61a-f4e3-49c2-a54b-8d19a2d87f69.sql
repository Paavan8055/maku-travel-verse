-- Phase 1: Enhanced database tables for unified search system and Viator certification

-- Global search cache for cross-service results
CREATE TABLE IF NOT EXISTS public.global_search_cache (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  search_query text NOT NULL,
  search_type text NOT NULL CHECK (search_type IN ('unified', 'flight', 'hotel', 'activity')),
  destination_data jsonb,
  unified_results jsonb,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  expires_at timestamptz DEFAULT (now() + interval '1 hour'),
  user_id uuid,
  session_id text
);

-- Enable RLS
ALTER TABLE public.global_search_cache ENABLE ROW LEVEL SECURITY;

-- RLS policies for global search cache
CREATE POLICY "Users can view their own cached searches" ON public.global_search_cache
FOR SELECT USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Service role can manage search cache" ON public.global_search_cache
FOR ALL USING (auth.role() = 'service_role');

-- User search preferences and personalization
CREATE TABLE IF NOT EXISTS public.user_search_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) NOT NULL,
  preferred_destinations jsonb DEFAULT '[]',
  search_patterns jsonb DEFAULT '{}',
  personalization_data jsonb DEFAULT '{}',
  activity_preferences jsonb DEFAULT '{}',
  travel_style jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_search_preferences ENABLE ROW LEVEL SECURITY;

-- RLS policies for user preferences
CREATE POLICY "Users can manage their own search preferences" ON public.user_search_preferences
FOR ALL USING (auth.uid() = user_id);

-- Enhanced Viator booking questions table
CREATE TABLE IF NOT EXISTS public.viator_booking_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_code text NOT NULL,
  question_id text NOT NULL,
  question_text text NOT NULL,
  question_type text NOT NULL CHECK (question_type IN ('text', 'select', 'date', 'number', 'boolean')),
  required boolean DEFAULT false,
  options jsonb DEFAULT '[]',
  validation_rules jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(product_code, question_id)
);

-- Enable RLS
ALTER TABLE public.viator_booking_questions ENABLE ROW LEVEL SECURITY;

-- RLS policies for booking questions
CREATE POLICY "Authenticated users can view booking questions" ON public.viator_booking_questions
FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Service role can manage booking questions" ON public.viator_booking_questions
FOR ALL USING (auth.role() = 'service_role');

-- Enhanced Viator bookings table for certification compliance
CREATE TABLE IF NOT EXISTS public.viator_bookings_enhanced (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid REFERENCES public.bookings(id),
  viator_booking_reference text UNIQUE,
  product_code text NOT NULL,
  option_code text,
  travel_date date NOT NULL,
  travelers jsonb NOT NULL,
  booking_questions_answers jsonb DEFAULT '{}',
  booking_status text NOT NULL DEFAULT 'pending' CHECK (booking_status IN ('pending', 'confirmed', 'cancelled', 'failed')),
  confirmation_details jsonb,
  voucher_info jsonb,
  total_amount numeric(10,2),
  currency text DEFAULT 'AUD',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.viator_bookings_enhanced ENABLE ROW LEVEL SECURITY;

-- RLS policies for enhanced Viator bookings
CREATE POLICY "Users can view their own Viator bookings" ON public.viator_bookings_enhanced
FOR SELECT USING (
  booking_id IN (
    SELECT id FROM public.bookings WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Service role can manage Viator bookings" ON public.viator_bookings_enhanced
FOR ALL USING (auth.role() = 'service_role');

-- Search performance metrics table
CREATE TABLE IF NOT EXISTS public.search_performance_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  search_type text NOT NULL,
  provider_id text NOT NULL,
  response_time_ms integer,
  result_count integer,
  success boolean,
  error_message text,
  search_params jsonb,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.search_performance_metrics ENABLE ROW LEVEL SECURITY;

-- RLS policies for performance metrics
CREATE POLICY "Admins can view search performance metrics" ON public.search_performance_metrics
FOR SELECT USING (is_secure_admin(auth.uid()));

CREATE POLICY "Service role can manage performance metrics" ON public.search_performance_metrics
FOR ALL USING (auth.role() = 'service_role');

-- Update triggers for timestamps
CREATE OR REPLACE FUNCTION update_search_preferences_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_search_preferences_updated_at
  BEFORE UPDATE ON public.user_search_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_search_preferences_updated_at();

CREATE TRIGGER update_viator_booking_questions_updated_at
  BEFORE UPDATE ON public.viator_booking_questions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_viator_bookings_enhanced_updated_at
  BEFORE UPDATE ON public.viator_bookings_enhanced
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_global_search_cache_query ON public.global_search_cache(search_query, search_type);
CREATE INDEX IF NOT EXISTS idx_global_search_cache_expires ON public.global_search_cache(expires_at);
CREATE INDEX IF NOT EXISTS idx_user_search_preferences_user ON public.user_search_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_viator_booking_questions_product ON public.viator_booking_questions(product_code);
CREATE INDEX IF NOT EXISTS idx_search_performance_metrics_type ON public.search_performance_metrics(search_type, provider_id, created_at);