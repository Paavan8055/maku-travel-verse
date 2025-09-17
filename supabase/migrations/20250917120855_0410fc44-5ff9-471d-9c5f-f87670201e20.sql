-- Phase 2: Core Viator Database Schema
-- Create viator_activities table for persistent activity storage
CREATE TABLE public.viator_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_code TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  short_description TEXT,
  category_id TEXT,
  subcategory_id TEXT,
  location JSONB,
  pricing JSONB,
  duration_info JSONB,
  reviews JSONB,
  images JSONB,
  tags TEXT[],
  raw_data JSONB,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  search_vector tsvector,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create viator_pricing_history table for price tracking
CREATE TABLE public.viator_pricing_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_code TEXT NOT NULL,
  from_price DECIMAL(10,2),
  currency TEXT DEFAULT 'AUD',
  recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  FOREIGN KEY (product_code) REFERENCES public.viator_activities(product_code) ON DELETE CASCADE
);

-- Create viator_availability table for availability caching
CREATE TABLE public.viator_availability (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_code TEXT NOT NULL,
  date DATE NOT NULL,
  available BOOLEAN DEFAULT true,
  price DECIMAL(10,2),
  currency TEXT DEFAULT 'AUD',
  cached_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '15 minutes'),
  FOREIGN KEY (product_code) REFERENCES public.viator_activities(product_code) ON DELETE CASCADE,
  UNIQUE(product_code, date)
);

-- Create viator_search_cache table for search result caching
CREATE TABLE public.viator_search_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  search_key TEXT UNIQUE NOT NULL,
  destination TEXT NOT NULL,
  category_id TEXT,
  start_date DATE,
  end_date DATE,
  results JSONB NOT NULL,
  total_count INTEGER DEFAULT 0,
  cached_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '1 hour')
);

-- Create indexes for performance
CREATE INDEX idx_viator_activities_product_code ON public.viator_activities(product_code);
CREATE INDEX idx_viator_activities_category ON public.viator_activities(category_id);
CREATE INDEX idx_viator_activities_location ON public.viator_activities USING GIN(location);
CREATE INDEX idx_viator_activities_pricing ON public.viator_activities USING GIN(pricing);
CREATE INDEX idx_viator_activities_search_vector ON public.viator_activities USING GIN(search_vector);
CREATE INDEX idx_viator_activities_updated ON public.viator_activities(last_updated);

CREATE INDEX idx_viator_pricing_product_date ON public.viator_pricing_history(product_code, recorded_at);
CREATE INDEX idx_viator_availability_product_date ON public.viator_availability(product_code, date);
CREATE INDEX idx_viator_availability_expires ON public.viator_availability(expires_at);
CREATE INDEX idx_viator_search_cache_key ON public.viator_search_cache(search_key);
CREATE INDEX idx_viator_search_cache_expires ON public.viator_search_cache(expires_at);

-- Create function to update search vector
CREATE OR REPLACE FUNCTION public.update_viator_search_vector()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector := to_tsvector('english', 
    COALESCE(NEW.title, '') || ' ' || 
    COALESCE(NEW.description, '') || ' ' ||
    COALESCE(NEW.short_description, '') || ' ' ||
    COALESCE(array_to_string(NEW.tags, ' '), '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for search vector updates
CREATE TRIGGER update_viator_activities_search_vector
  BEFORE INSERT OR UPDATE ON public.viator_activities
  FOR EACH ROW
  EXECUTE FUNCTION public.update_viator_search_vector();

-- Create function to clean up expired cache entries
CREATE OR REPLACE FUNCTION public.cleanup_viator_cache()
RETURNS void AS $$
BEGIN
  DELETE FROM public.viator_availability WHERE expires_at < NOW();
  DELETE FROM public.viator_search_cache WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Enable Row Level Security
ALTER TABLE public.viator_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.viator_pricing_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.viator_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.viator_search_cache ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for public read access (activities are public data)
CREATE POLICY "Public read access for viator activities" ON public.viator_activities
  FOR SELECT USING (true);

CREATE POLICY "Service role can manage viator activities" ON public.viator_activities
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Public read access for viator pricing history" ON public.viator_pricing_history
  FOR SELECT USING (true);

CREATE POLICY "Service role can manage viator pricing history" ON public.viator_pricing_history
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Public read access for viator availability" ON public.viator_availability
  FOR SELECT USING (true);

CREATE POLICY "Service role can manage viator availability" ON public.viator_availability
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role can manage viator search cache" ON public.viator_search_cache
  FOR ALL USING (auth.role() = 'service_role');