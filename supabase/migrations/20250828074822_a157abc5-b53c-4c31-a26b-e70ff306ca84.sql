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

-- Enhance reviews table with photo upload and verification
ALTER TABLE public.detailed_reviews 
ADD COLUMN IF NOT EXISTS photo_urls TEXT[],
ADD COLUMN IF NOT EXISTS moderation_status TEXT DEFAULT 'pending'::text,
ADD COLUMN IF NOT EXISTS moderator_notes TEXT,
ADD COLUMN IF NOT EXISTS review_source TEXT DEFAULT 'user'::text,
ADD COLUMN IF NOT EXISTS supplier_verified BOOLEAN DEFAULT false;

-- Create review photos table for better management
CREATE TABLE IF NOT EXISTS public.review_photos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  review_id UUID NOT NULL REFERENCES public.detailed_reviews(id),
  photo_url TEXT NOT NULL,
  photo_caption TEXT,
  upload_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  is_approved BOOLEAN DEFAULT false,
  file_size INTEGER,
  file_type TEXT
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
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on new tables
ALTER TABLE public.destination_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.poi_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.review_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.travel_alerts ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for destination content
CREATE POLICY "Public read access to destination content" ON public.destination_content
  FOR SELECT USING (content_status = 'published');

CREATE POLICY "Admins can manage destination content" ON public.destination_content
  FOR ALL USING (is_secure_admin(auth.uid()));

-- Create RLS policies for content images
CREATE POLICY "Public read access to content images" ON public.content_images
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage content images" ON public.content_images
  FOR ALL USING (is_secure_admin(auth.uid()));

-- Create RLS policies for POI content
CREATE POLICY "Public read access to POI content" ON public.poi_content
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage POI content" ON public.poi_content
  FOR ALL USING (is_secure_admin(auth.uid()));

-- Create RLS policies for review photos
CREATE POLICY "Users can view approved review photos" ON public.review_photos
  FOR SELECT USING (is_approved = true);

CREATE POLICY "Users can manage their own review photos" ON public.review_photos
  FOR ALL USING (
    review_id IN (
      SELECT id FROM public.detailed_reviews 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage all review photos" ON public.review_photos
  FOR ALL USING (is_secure_admin(auth.uid()));

-- Create RLS policies for travel alerts
CREATE POLICY "Public read access to active travel alerts" ON public.travel_alerts
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage travel alerts" ON public.travel_alerts
  FOR ALL USING (is_secure_admin(auth.uid()));

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_destination_content_status ON public.destination_content(content_status);
CREATE INDEX IF NOT EXISTS idx_destination_content_country ON public.destination_content(country);
CREATE INDEX IF NOT EXISTS idx_content_images_destination ON public.content_images(destination_id);
CREATE INDEX IF NOT EXISTS idx_poi_content_destination ON public.poi_content(destination_id);
CREATE INDEX IF NOT EXISTS idx_poi_content_category ON public.poi_content(category);
CREATE INDEX IF NOT EXISTS idx_review_photos_review ON public.review_photos(review_id);
CREATE INDEX IF NOT EXISTS idx_travel_alerts_destination ON public.travel_alerts(destination_code);
CREATE INDEX IF NOT EXISTS idx_travel_alerts_active ON public.travel_alerts(is_active);

-- Create functions for content management
CREATE OR REPLACE FUNCTION public.update_destination_content_updated_at()
RETURNS trigger AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.update_poi_content_updated_at()
RETURNS trigger AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.update_travel_alerts_updated_at()
RETURNS trigger AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers
CREATE TRIGGER update_destination_content_updated_at
    BEFORE UPDATE ON public.destination_content
    FOR EACH ROW
    EXECUTE FUNCTION public.update_destination_content_updated_at();

CREATE TRIGGER update_poi_content_updated_at
    BEFORE UPDATE ON public.poi_content
    FOR EACH ROW
    EXECUTE FUNCTION public.update_poi_content_updated_at();

CREATE TRIGGER update_travel_alerts_updated_at
    BEFORE UPDATE ON public.travel_alerts
    FOR EACH ROW
    EXECUTE FUNCTION public.update_travel_alerts_updated_at();