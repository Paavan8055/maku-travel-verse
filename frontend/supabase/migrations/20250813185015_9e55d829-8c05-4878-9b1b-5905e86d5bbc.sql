-- Phase 1: Trust & Conversion Database Setup

-- Reviews & Ratings System
CREATE TABLE public.detailed_reviews (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  booking_id UUID REFERENCES public.bookings(id),
  item_type TEXT NOT NULL, -- 'hotel', 'flight', 'activity'
  item_id TEXT NOT NULL,
  overall_rating INTEGER NOT NULL CHECK (overall_rating >= 1 AND overall_rating <= 5),
  cleanliness_rating INTEGER CHECK (cleanliness_rating >= 1 AND cleanliness_rating <= 5),
  service_rating INTEGER CHECK (service_rating >= 1 AND service_rating <= 5),
  value_rating INTEGER CHECK (value_rating >= 1 AND value_rating <= 5),
  location_rating INTEGER CHECK (location_rating >= 1 AND location_rating <= 5),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  photos JSONB DEFAULT '[]',
  helpful_votes INTEGER DEFAULT 0,
  is_verified BOOLEAN DEFAULT false,
  is_featured BOOLEAN DEFAULT false,
  travel_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enhanced Favorites with Price Tracking
CREATE TABLE public.enhanced_favorites (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  item_type TEXT NOT NULL,
  item_id TEXT NOT NULL,
  item_data JSONB NOT NULL,
  current_price NUMERIC,
  original_price NUMERIC,
  price_alert_threshold NUMERIC,
  is_price_alert_active BOOLEAN DEFAULT false,
  last_price_check TIMESTAMP WITH TIME ZONE DEFAULT now(),
  price_history JSONB DEFAULT '[]',
  notes TEXT,
  tags TEXT[] DEFAULT '{}',
  is_shared BOOLEAN DEFAULT false,
  share_token TEXT UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, item_type, item_id)
);

-- Social Proof Tracking
CREATE TABLE public.user_activity_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  session_id TEXT,
  activity_type TEXT NOT NULL, -- 'view', 'search', 'book', 'favorite'
  item_type TEXT, -- 'hotel', 'flight', 'activity'
  item_id TEXT,
  item_data JSONB,
  location TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Loyalty Points System
CREATE TABLE public.loyalty_points (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  total_points INTEGER DEFAULT 0,
  current_tier TEXT DEFAULT 'Explorer', -- 'Explorer', 'Adventurer', 'Globetrotter', 'VIP'
  points_to_next_tier INTEGER DEFAULT 1000,
  lifetime_points INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Points Transactions
CREATE TABLE public.points_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  transaction_type TEXT NOT NULL, -- 'earned', 'redeemed', 'expired', 'bonus'
  points INTEGER NOT NULL,
  reason TEXT NOT NULL,
  booking_id UUID,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Travel Journal
CREATE TABLE public.travel_journal (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  trip_title TEXT NOT NULL,
  destination TEXT NOT NULL,
  start_date DATE,
  end_date DATE,
  description TEXT,
  photos JSONB DEFAULT '[]',
  is_public BOOLEAN DEFAULT false,
  tags TEXT[] DEFAULT '{}',
  travel_companions INTEGER DEFAULT 1,
  budget_range TEXT,
  highlights TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Local Tips & Community
CREATE TABLE public.local_tips (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  location_id TEXT NOT NULL,
  tip_category TEXT NOT NULL, -- 'restaurant', 'attraction', 'transportation', 'cultural', 'safety'
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  photos JSONB DEFAULT '[]',
  helpful_votes INTEGER DEFAULT 0,
  is_verified BOOLEAN DEFAULT false,
  coordinates JSONB,
  budget_level TEXT, -- 'budget', 'mid-range', 'luxury'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Price Intelligence
CREATE TABLE public.price_predictions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  item_type TEXT NOT NULL,
  item_id TEXT NOT NULL,
  route TEXT,
  predicted_price NUMERIC NOT NULL,
  confidence_score NUMERIC DEFAULT 0.5,
  recommendation TEXT NOT NULL, -- 'book_now', 'wait', 'flexible'
  factors JSONB,
  valid_until TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- User Travel Analytics
CREATE TABLE public.travel_analytics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  year INTEGER NOT NULL,
  total_trips INTEGER DEFAULT 0,
  total_spent NUMERIC DEFAULT 0,
  carbon_footprint NUMERIC DEFAULT 0,
  countries_visited TEXT[] DEFAULT '{}',
  favorite_destinations TEXT[] DEFAULT '{}',
  travel_months INTEGER[] DEFAULT '{}',
  preferred_trip_length INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, year)
);

-- Enable RLS on all tables
ALTER TABLE public.detailed_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enhanced_favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loyalty_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.points_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.travel_journal ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.local_tips ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.price_predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.travel_analytics ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Detailed Reviews
CREATE POLICY "Users can view all reviews" ON public.detailed_reviews FOR SELECT USING (true);
CREATE POLICY "Users can create their own reviews" ON public.detailed_reviews FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own reviews" ON public.detailed_reviews FOR UPDATE USING (auth.uid() = user_id);

-- Enhanced Favorites
CREATE POLICY "Users can manage their own favorites" ON public.enhanced_favorites FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Anyone can view shared favorites" ON public.enhanced_favorites FOR SELECT USING (is_shared = true OR auth.uid() = user_id);

-- User Activity Logs
CREATE POLICY "Users can view their own activity" ON public.user_activity_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create activity logs" ON public.user_activity_logs FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- Loyalty Points
CREATE POLICY "Users can view their own loyalty points" ON public.loyalty_points FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Points Transactions
CREATE POLICY "Users can view their own points transactions" ON public.points_transactions FOR SELECT USING (auth.uid() = user_id);

-- Travel Journal
CREATE POLICY "Users can manage their own journal entries" ON public.travel_journal FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Anyone can view public journal entries" ON public.travel_journal FOR SELECT USING (is_public = true OR auth.uid() = user_id);

-- Local Tips
CREATE POLICY "Anyone can view local tips" ON public.local_tips FOR SELECT USING (true);
CREATE POLICY "Users can create local tips" ON public.local_tips FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own tips" ON public.local_tips FOR UPDATE USING (auth.uid() = user_id);

-- Price Predictions
CREATE POLICY "Anyone can view price predictions" ON public.price_predictions FOR SELECT USING (valid_until > now());

-- Travel Analytics
CREATE POLICY "Users can view their own analytics" ON public.travel_analytics FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Triggers for updated_at
CREATE TRIGGER update_detailed_reviews_updated_at BEFORE UPDATE ON public.detailed_reviews FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_enhanced_favorites_updated_at BEFORE UPDATE ON public.enhanced_favorites FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_loyalty_points_updated_at BEFORE UPDATE ON public.loyalty_points FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_travel_journal_updated_at BEFORE UPDATE ON public.travel_journal FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_travel_analytics_updated_at BEFORE UPDATE ON public.travel_analytics FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Initialize loyalty points for existing users
CREATE OR REPLACE FUNCTION public.initialize_user_loyalty()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.loyalty_points (user_id)
  VALUES (NEW.user_id)
  ON CONFLICT (user_id) DO NOTHING;
  
  INSERT INTO public.travel_analytics (user_id, year)
  VALUES (NEW.user_id, EXTRACT(YEAR FROM CURRENT_DATE))
  ON CONFLICT (user_id, year) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to initialize loyalty points when profile is created
CREATE TRIGGER initialize_user_loyalty_trigger
  AFTER INSERT ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.initialize_user_loyalty();