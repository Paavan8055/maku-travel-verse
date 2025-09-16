-- Create dream destinations table with 100 curated locations
CREATE TABLE public.dream_destinations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  country TEXT NOT NULL,
  continent TEXT NOT NULL,
  latitude NUMERIC NOT NULL,
  longitude NUMERIC NOT NULL,
  category TEXT NOT NULL, -- beaches, cities, mountains, cultural, spiritual, adventure
  description TEXT,
  best_time_to_visit TEXT,
  budget_range TEXT, -- budget, mid-range, luxury
  avg_daily_cost NUMERIC,
  photo_url TEXT,
  highlights TEXT[],
  weather_info JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user bookmarks table (max 100 per user)
CREATE TABLE public.user_dream_bookmarks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  destination_id UUID NOT NULL REFERENCES public.dream_destinations(id) ON DELETE CASCADE,
  notes TEXT,
  priority INTEGER DEFAULT 1, -- 1-5 scale
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, destination_id)
);

-- Enable RLS
ALTER TABLE public.dream_destinations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_dream_bookmarks ENABLE ROW LEVEL SECURITY;

-- RLS Policies for dream destinations (publicly viewable)
CREATE POLICY "Anyone can view dream destinations" 
ON public.dream_destinations 
FOR SELECT 
USING (true);

-- RLS Policies for user bookmarks
CREATE POLICY "Users can view their own bookmarks" 
ON public.user_dream_bookmarks 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own bookmarks" 
ON public.user_dream_bookmarks 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own bookmarks" 
ON public.user_dream_bookmarks 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own bookmarks" 
ON public.user_dream_bookmarks 
FOR DELETE 
USING (auth.uid() = user_id);

-- Function to check bookmark limit
CREATE OR REPLACE FUNCTION check_bookmark_limit()
RETURNS TRIGGER AS $$
BEGIN
  IF (SELECT COUNT(*) FROM public.user_dream_bookmarks WHERE user_id = NEW.user_id) >= 100 THEN
    RAISE EXCEPTION 'Maximum 100 dream destinations allowed per user';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to enforce bookmark limit
CREATE TRIGGER enforce_bookmark_limit
  BEFORE INSERT ON public.user_dream_bookmarks
  FOR EACH ROW
  EXECUTE FUNCTION check_bookmark_limit();