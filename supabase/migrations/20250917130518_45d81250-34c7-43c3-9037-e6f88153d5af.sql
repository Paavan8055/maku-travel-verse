-- Phase 1: Enhanced database tables (create only missing ones)

-- Global search cache for cross-service results (only if not exists)
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

-- Enable RLS only if not already enabled
DO $$ BEGIN
  ALTER TABLE public.global_search_cache ENABLE ROW LEVEL SECURITY;
EXCEPTION WHEN duplicate_table THEN 
  NULL; -- RLS already enabled
END $$;

-- Create policies only if they don't exist
DO $$ BEGIN
  CREATE POLICY "Users can view their own cached searches" ON public.global_search_cache
  FOR SELECT USING (auth.uid() = user_id OR user_id IS NULL);
EXCEPTION WHEN duplicate_object THEN 
  NULL; -- Policy already exists
END $$;

DO $$ BEGIN
  CREATE POLICY "Service role can manage search cache" ON public.global_search_cache
  FOR ALL USING (auth.role() = 'service_role');
EXCEPTION WHEN duplicate_object THEN 
  NULL; -- Policy already exists  
END $$;

-- User search preferences (only if not exists)
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

-- Enable RLS and create policies for user preferences
DO $$ BEGIN
  ALTER TABLE public.user_search_preferences ENABLE ROW LEVEL SECURITY;
EXCEPTION WHEN duplicate_table THEN 
  NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Users can manage their own search preferences" ON public.user_search_preferences
  FOR ALL USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN 
  NULL;
END $$;

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

-- Enable RLS and create policies for performance metrics
DO $$ BEGIN
  ALTER TABLE public.search_performance_metrics ENABLE ROW LEVEL SECURITY;
EXCEPTION WHEN duplicate_table THEN 
  NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Admins can view search performance metrics" ON public.search_performance_metrics
  FOR SELECT USING (is_secure_admin(auth.uid()));
EXCEPTION WHEN duplicate_object THEN 
  NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Service role can manage performance metrics" ON public.search_performance_metrics
  FOR ALL USING (auth.role() = 'service_role');
EXCEPTION WHEN duplicate_object THEN 
  NULL;
END $$;

-- Create indexes for performance (only if not exists)
CREATE INDEX IF NOT EXISTS idx_global_search_cache_query ON public.global_search_cache(search_query, search_type);
CREATE INDEX IF NOT EXISTS idx_global_search_cache_expires ON public.global_search_cache(expires_at);
CREATE INDEX IF NOT EXISTS idx_user_search_preferences_user ON public.user_search_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_search_performance_metrics_type ON public.search_performance_metrics(search_type, provider_id, created_at);