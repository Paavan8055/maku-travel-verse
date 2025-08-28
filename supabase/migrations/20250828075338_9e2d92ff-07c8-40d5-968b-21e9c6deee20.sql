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

-- Create RLS policies for travel alerts
CREATE POLICY "Public read access to active travel alerts" ON public.travel_alerts
  FOR SELECT USING (alert_active = true);

CREATE POLICY "Admins can manage travel alerts" ON public.travel_alerts
  FOR ALL USING (is_secure_admin(auth.uid()));

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

-- Enable RLS on review photos table
ALTER TABLE public.review_photos ENABLE ROW LEVEL SECURITY;

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

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_destination_content_status ON public.destination_content(content_status);
CREATE INDEX IF NOT EXISTS idx_destination_content_country ON public.destination_content(country);
CREATE INDEX IF NOT EXISTS idx_content_images_destination ON public.content_images(destination_id);
CREATE INDEX IF NOT EXISTS idx_poi_content_destination ON public.poi_content(destination_id);
CREATE INDEX IF NOT EXISTS idx_poi_content_category ON public.poi_content(category);
CREATE INDEX IF NOT EXISTS idx_review_photos_review ON public.review_photos(review_id);
CREATE INDEX IF NOT EXISTS idx_travel_alerts_destination ON public.travel_alerts(destination_code);
CREATE INDEX IF NOT EXISTS idx_travel_alerts_active ON public.travel_alerts(alert_active);