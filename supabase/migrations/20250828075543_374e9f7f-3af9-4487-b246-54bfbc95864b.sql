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

-- Create RLS policies for travel alerts using the correct column name
CREATE POLICY "Public read access to active travel alerts" ON public.travel_alerts
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage travel alerts" ON public.travel_alerts
  FOR ALL USING (is_secure_admin(auth.uid()));

-- Enhance reviews table with photo upload and verification
ALTER TABLE public.detailed_reviews 
ADD COLUMN IF NOT EXISTS photo_urls TEXT[],
ADD COLUMN IF NOT EXISTS moderation_status TEXT DEFAULT 'pending'::text,
ADD COLUMN IF NOT EXISTS moderator_notes TEXT,
ADD COLUMN IF NOT EXISTS review_source TEXT DEFAULT 'user'::text,
ADD COLUMN IF NOT EXISTS supplier_verified BOOLEAN DEFAULT false;