-- 1. User Preferences
CREATE TABLE public.user_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  preferred_airlines TEXT[],
  seat_class TEXT DEFAULT 'economy',
  room_type TEXT DEFAULT 'standard',
  meal_preferences TEXT[],
  language TEXT DEFAULT 'en',
  currency TEXT DEFAULT 'USD',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own preferences" 
ON public.user_preferences 
FOR SELECT 
USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can create their own preferences" 
ON public.user_preferences 
FOR INSERT 
WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "Users can update their own preferences" 
ON public.user_preferences 
FOR UPDATE 
USING (auth.uid()::text = user_id::text);

-- 2. Payment Vault
CREATE TABLE public.payment_methods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  type TEXT CHECK(type IN ('card','wallet','bank_transfer')),
  provider TEXT NOT NULL,
  last4 TEXT,
  expiry_month INT,
  expiry_year INT,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.payment_methods ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own payment methods" 
ON public.payment_methods 
FOR SELECT 
USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can create their own payment methods" 
ON public.payment_methods 
FOR INSERT 
WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "Users can update their own payment methods" 
ON public.payment_methods 
FOR UPDATE 
USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can delete their own payment methods" 
ON public.payment_methods 
FOR DELETE 
USING (auth.uid()::text = user_id::text);

-- 3. Passport Info
CREATE TABLE public.passport_info (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  country TEXT NOT NULL,
  passport_number TEXT,
  expiry_date DATE,
  verified BOOLEAN DEFAULT false,
  document_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.passport_info ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own passport info" 
ON public.passport_info 
FOR SELECT 
USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can create their own passport info" 
ON public.passport_info 
FOR INSERT 
WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "Users can update their own passport info" 
ON public.passport_info 
FOR UPDATE 
USING (auth.uid()::text = user_id::text);

-- 4. Favorites
CREATE TABLE public.saved_favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  item_type TEXT CHECK(item_type IN ('hotel','flight','experience','destination')),
  item_id TEXT NOT NULL,
  item_data JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.saved_favorites ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own favorites" 
ON public.saved_favorites 
FOR SELECT 
USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can create their own favorites" 
ON public.saved_favorites 
FOR INSERT 
WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "Users can delete their own favorites" 
ON public.saved_favorites 
FOR DELETE 
USING (auth.uid()::text = user_id::text);

-- 5. Visa Documents
CREATE TABLE public.visa_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  country TEXT NOT NULL,
  doc_type TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  document_url TEXT,
  expiry_date DATE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.visa_documents ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own visa documents" 
ON public.visa_documents 
FOR SELECT 
USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can create their own visa documents" 
ON public.visa_documents 
FOR INSERT 
WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "Users can update their own visa documents" 
ON public.visa_documents 
FOR UPDATE 
USING (auth.uid()::text = user_id::text);

-- 6. Dynamic Offers
CREATE TABLE public.dynamic_offers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  route TEXT NOT NULL,
  hotel_chain TEXT,
  airline TEXT,
  discount_pct INT DEFAULT 0,
  offer_type TEXT DEFAULT 'discount',
  description TEXT,
  valid_until TIMESTAMPTZ NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.dynamic_offers ENABLE ROW LEVEL SECURITY;

-- Create policies (public offers)
CREATE POLICY "Anyone can view active offers" 
ON public.dynamic_offers 
FOR SELECT 
USING (is_active = true AND valid_until > now());

-- 7. Local Insights
CREATE TABLE public.local_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id TEXT NOT NULL,
  tip_type TEXT NOT NULL,
  content TEXT NOT NULL,
  source TEXT DEFAULT 'community',
  rating DECIMAL(2,1) DEFAULT 0.0,
  is_featured BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.local_insights ENABLE ROW LEVEL SECURITY;

-- Create policies (public insights)
CREATE POLICY "Anyone can view local insights" 
ON public.local_insights 
FOR SELECT 
USING (true);

-- Create indexes for performance
CREATE INDEX idx_user_preferences_user_id ON public.user_preferences(user_id);
CREATE INDEX idx_payment_methods_user_id ON public.payment_methods(user_id);
CREATE INDEX idx_passport_info_user_id ON public.passport_info(user_id);
CREATE INDEX idx_saved_favorites_user_id ON public.saved_favorites(user_id);
CREATE INDEX idx_visa_documents_user_id ON public.visa_documents(user_id);
CREATE INDEX idx_dynamic_offers_route ON public.dynamic_offers(route);
CREATE INDEX idx_dynamic_offers_active ON public.dynamic_offers(is_active, valid_until);
CREATE INDEX idx_local_insights_location ON public.local_insights(location_id);

-- Seed data for dynamic offers
INSERT INTO public.dynamic_offers (route, hotel_chain, discount_pct, valid_until, description) VALUES
  ('NYC-LAX', 'Hilton', 20, NOW() + INTERVAL '7 days', 'Flash Sale: 20% off Hilton hotels'),
  ('LON-PAR', 'Marriott', 15, NOW() + INTERVAL '5 days', 'Weekend Special: 15% off Marriott properties'),
  ('SYD-MEL', 'Accor', 25, NOW() + INTERVAL '10 days', 'Australia Domestic: 25% off Accor hotels'),
  ('LAX-HNL', 'Hyatt', 30, NOW() + INTERVAL '3 days', 'Hawaii getaway: 30% off Hyatt resorts');

-- Seed data for local insights
INSERT INTO public.local_insights (location_id, tip_type, content, source, rating, is_featured) VALUES
  ('NYC', 'dining', 'Try the bagels at Ess-a-Bagel on 51st Street - locals swear by them!', 'local-guide', 4.8, true),
  ('NYC', 'transport', 'Buy a 7-day MetroCard for unlimited subway rides if staying a week', 'travel-blog', 4.5, false),
  ('PAR', 'transport', 'Buy a Navigo weekly pass for unlimited metro, bus, and RER travel', 'travel-blog', 4.7, true),
  ('PAR', 'dining', 'Visit L''As du Fallafel in Le Marais for the best falafel in the city', 'local-guide', 4.9, true),
  ('LON', 'sightseeing', 'Book the London Eye fast-track tickets online to skip the queue', 'travel-tips', 4.3, false),
  ('SYD', 'transport', 'Take the ferry to Manly Beach instead of driving - better views and cheaper parking', 'local-guide', 4.6, true);

-- Create trigger for updating timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers to tables with updated_at
CREATE TRIGGER update_user_preferences_updated_at
  BEFORE UPDATE ON public.user_preferences
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_payment_methods_updated_at
  BEFORE UPDATE ON public.payment_methods
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_passport_info_updated_at
  BEFORE UPDATE ON public.passport_info
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_visa_documents_updated_at
  BEFORE UPDATE ON public.visa_documents
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();