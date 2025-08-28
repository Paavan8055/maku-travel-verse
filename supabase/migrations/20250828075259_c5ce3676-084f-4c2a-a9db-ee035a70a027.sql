-- Create content management tables
CREATE TABLE IF NOT EXISTS public.destination_content (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  destination_id TEXT NOT NULL,
  destination_name TEXT NOT NULL,
  country TEXT NOT NULL,
  continent TEXT,
  description TEXT,
  highlights TEXT[],
  best_time_to_visit TEXT,
  weather_info JSONB,
  safety_info JSONB,
  currency TEXT,
  language TEXT[],
  content_status TEXT DEFAULT 'draft'::text,
  content_source TEXT DEFAULT 'manual'::text,
  supplier_data JSONB DEFAULT '{}'::jsonb,
  seo_title TEXT,
  seo_description TEXT,
  seo_keywords TEXT[],
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create content images table
CREATE TABLE IF NOT EXISTS public.content_images (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  destination_id TEXT NOT NULL,
  image_url TEXT NOT NULL,
  image_caption TEXT,
  image_category TEXT DEFAULT 'general'::text,
  image_source TEXT DEFAULT 'supplier'::text,
  supplier_attribution TEXT,
  display_order INTEGER DEFAULT 0,
  is_featured BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create points of interest content table
CREATE TABLE IF NOT EXISTS public.poi_content (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  destination_id TEXT NOT NULL,
  poi_id TEXT NOT NULL,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT,
  coordinates JSONB,
  opening_hours JSONB,
  admission_fee JSONB,
  supplier_data JSONB DEFAULT '{}'::jsonb,
  rating NUMERIC(3,2),
  review_count INTEGER DEFAULT 0,
  image_urls TEXT[],
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create travel alerts table for real-time advisories
CREATE TABLE IF NOT EXISTS public.travel_alerts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  destination_code TEXT NOT NULL,
  alert_type TEXT NOT NULL,
  severity TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  effective_date TIMESTAMP WITH TIME ZONE,
  expiry_date TIMESTAMP WITH TIME ZONE,
  supplier_source TEXT,
  alert_data JSONB DEFAULT '{}'::jsonb,
  alert_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on new tables
ALTER TABLE public.destination_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.poi_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.travel_alerts ENABLE ROW LEVEL SECURITY;