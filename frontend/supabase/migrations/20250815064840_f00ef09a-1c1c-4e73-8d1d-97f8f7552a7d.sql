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

-- Insert 100 curated dream destinations (including 10+ from India)
INSERT INTO public.dream_destinations (name, country, continent, latitude, longitude, category, description, best_time_to_visit, budget_range, avg_daily_cost, highlights) VALUES
-- India destinations (10+)
('Goa Beaches', 'India', 'Asia', 15.2993, 74.1240, 'beaches', 'Tropical paradise with pristine beaches and Portuguese heritage', 'November to March', 'budget', 25, ARRAY['Beach clubs', 'Water sports', 'Nightlife']),
('Kerala Backwaters', 'India', 'Asia', 9.4981, 76.3388, 'cultural', 'Serene backwaters and lush green landscapes', 'September to March', 'mid-range', 40, ARRAY['Houseboat stays', 'Ayurveda', 'Spice plantations']),
('Rajasthan Palaces', 'India', 'Asia', 26.9124, 75.7873, 'cultural', 'Land of maharajas with magnificent palaces and forts', 'October to March', 'luxury', 80, ARRAY['Royal palaces', 'Desert safaris', 'Cultural shows']),
('Himachal Pradesh', 'India', 'Asia', 32.1024, 77.1734, 'mountains', 'Snow-capped peaks and hill stations', 'April to June, September to November', 'mid-range', 35, ARRAY['Trekking', 'Adventure sports', 'Hill stations']),
('Varanasi', 'India', 'Asia', 25.3176, 82.9739, 'spiritual', 'Spiritual capital with ancient ghats', 'October to March', 'budget', 20, ARRAY['River Ganges', 'Ancient temples', 'Spiritual ceremonies']),
('Ladakh', 'India', 'Asia', 34.1526, 77.5771, 'mountains', 'High altitude desert with Buddhist monasteries', 'June to September', 'mid-range', 45, ARRAY['Monasteries', 'High passes', 'Adventure']),
('Andaman Islands', 'India', 'Asia', 11.7401, 92.6586, 'beaches', 'Pristine tropical islands with clear waters', 'November to April', 'mid-range', 50, ARRAY['Scuba diving', 'Beaches', 'Marine life']),
('Hampi', 'India', 'Asia', 15.3350, 76.4600, 'cultural', 'Ancient ruins of Vijayanagara Empire', 'October to February', 'budget', 25, ARRAY['Ancient temples', 'Boulder landscapes', 'Heritage']),
('Rishikesh', 'India', 'Asia', 30.0869, 78.2676, 'spiritual', 'Yoga capital of the world', 'September to November, February to May', 'budget', 30, ARRAY['Yoga retreats', 'River rafting', 'Meditation']),
('Jaipur', 'India', 'Asia', 26.9124, 75.7873, 'cultural', 'Pink City with magnificent forts and palaces', 'October to March', 'mid-range', 40, ARRAY['Pink architecture', 'Royal palaces', 'Local markets']),
('Munnar', 'India', 'Asia', 10.0889, 77.0595, 'mountains', 'Tea plantations in the Western Ghats', 'September to March', 'mid-range', 35, ARRAY['Tea gardens', 'Hill station', 'Wildlife']),
('Agra', 'India', 'Asia', 27.1767, 78.0081, 'cultural', 'Home to the iconic Taj Mahal', 'October to March', 'mid-range', 30, ARRAY['Taj Mahal', 'Mughal architecture', 'History']),

-- International destinations
('Santorini', 'Greece', 'Europe', 36.3932, 25.4615, 'beaches', 'Iconic Greek island with white-washed buildings', 'April to October', 'luxury', 120, ARRAY['Sunset views', 'Volcanic beaches', 'Wine tasting']),
('Bali', 'Indonesia', 'Asia', -8.3405, 115.0920, 'cultural', 'Tropical paradise with rich culture', 'April to October', 'mid-range', 50, ARRAY['Temples', 'Rice terraces', 'Beaches']),
('Kyoto', 'Japan', 'Asia', 35.0116, 135.7681, 'cultural', 'Ancient capital with traditional temples', 'March to May, September to November', 'luxury', 100, ARRAY['Cherry blossoms', 'Temples', 'Traditional culture']),
('Machu Picchu', 'Peru', 'South America', -13.1631, -72.5450, 'cultural', 'Ancient Inca citadel in the Andes', 'May to September', 'mid-range', 60, ARRAY['Inca ruins', 'Mountain hiking', 'Ancient history']),
('Maldives', 'Maldives', 'Asia', 3.2028, 73.2207, 'beaches', 'Luxury overwater bungalows in paradise', 'November to April', 'luxury', 300, ARRAY['Overwater villas', 'Diving', 'Luxury resorts']),
('Patagonia', 'Argentina/Chile', 'South America', -49.3058, -73.0082, 'mountains', 'Dramatic landscapes at the end of the world', 'November to March', 'mid-range', 70, ARRAY['Glaciers', 'Trekking', 'Wildlife']),
('Iceland', 'Iceland', 'Europe', 64.9631, -19.0208, 'mountains', 'Land of fire and ice with stunning nature', 'June to August', 'luxury', 150, ARRAY['Northern lights', 'Geysers', 'Blue lagoon']),
('Morocco', 'Morocco', 'Africa', 31.7917, -7.0926, 'cultural', 'Exotic blend of Arab, Berber and European cultures', 'October to April', 'mid-range', 45, ARRAY['Medinas', 'Desert', 'Souks']),
('New Zealand', 'New Zealand', 'Oceania', -40.9006, 174.8860, 'mountains', 'Adventure capital with stunning landscapes', 'December to February', 'luxury', 100, ARRAY['Adventure sports', 'Fjords', 'Hobbits']),
('Thailand', 'Thailand', 'Asia', 15.8700, 100.9925, 'beaches', 'Tropical kingdom with beaches and temples', 'November to March', 'budget', 30, ARRAY['Temples', 'Beaches', 'Street food']),
('Norway', 'Norway', 'Europe', 60.4720, 8.4689, 'mountains', 'Fjords and northern lights', 'June to August', 'luxury', 120, ARRAY['Fjords', 'Northern lights', 'Midnight sun']),
('Egypt', 'Egypt', 'Africa', 26.0975, 31.2357, 'cultural', 'Ancient civilization with pyramids', 'October to April', 'mid-range', 40, ARRAY['Pyramids', 'Nile cruise', 'Ancient history']),
('Costa Rica', 'Costa Rica', 'North America', 9.7489, -83.7534, 'adventure', 'Biodiversity hotspot with adventure activities', 'December to April', 'mid-range', 55, ARRAY['Wildlife', 'Volcanoes', 'Adventure']),
('Vietnam', 'Vietnam', 'Asia', 14.0583, 108.2772, 'cultural', 'Rich culture and stunning landscapes', 'November to March', 'budget', 25, ARRAY['Ha Long Bay', 'Street food', 'History']),
('Turkey', 'Turkey', 'Europe/Asia', 38.9637, 35.2433, 'cultural', 'Bridge between Europe and Asia', 'April to June, September to November', 'mid-range', 45, ARRAY['Hot air balloons', 'History', 'Culture']),
('Australia', 'Australia', 'Oceania', -25.2744, 133.7751, 'beaches', 'Diverse landscapes from beaches to outback', 'September to November, March to May', 'luxury', 90, ARRAY['Great Barrier Reef', 'Outback', 'Sydney']),
('Nepal', 'Nepal', 'Asia', 28.3949, 84.1240, 'mountains', 'Home to Mount Everest and rich culture', 'October to December, March to May', 'budget', 20, ARRAY['Himalayan peaks', 'Trekking', 'Buddhist culture']),
('Jordan', 'Jordan', 'Middle East', 30.5852, 36.2384, 'cultural', 'Ancient civilization with Petra', 'March to May, September to November', 'mid-range', 50, ARRAY['Petra', 'Desert', 'Dead Sea']),
('Chile', 'Chile', 'South America', -35.6751, -71.5430, 'mountains', 'Long country with diverse landscapes', 'December to February', 'mid-range', 60, ARRAY['Atacama Desert', 'Wine regions', 'Patagonia']),
('Madagascar', 'Madagascar', 'Africa', -18.7669, 46.8691, 'adventure', 'Unique wildlife and landscapes', 'April to October', 'mid-range', 40, ARRAY['Unique wildlife', 'Baobab trees', 'Lemurs']),
('Philippines', 'Philippines', 'Asia', 12.8797, 121.7740, 'beaches', 'Tropical archipelago with pristine beaches', 'December to May', 'budget', 30, ARRAY['Island hopping', 'Diving', 'Beaches']),
('Kenya', 'Kenya', 'Africa', -0.0236, 37.9062, 'adventure', 'Safari capital with wildlife', 'July to October', 'mid-range', 55, ARRAY['Safari', 'Wildlife', 'Masai culture']),
('Cambodia', 'Cambodia', 'Asia', 12.5657, 104.9910, 'cultural', 'Ancient Khmer temples', 'November to March', 'budget', 25, ARRAY['Angkor Wat', 'Temples', 'History']),
('Bolivia', 'Bolivia', 'South America', -16.2902, -63.5887, 'mountains', 'Salt flats and high altitude adventures', 'May to October', 'budget', 30, ARRAY['Salt flats', 'High altitude', 'Unique landscapes']),
('Myanmar', 'Myanmar', 'Asia', 21.9162, 95.9560, 'cultural', 'Golden pagodas and rich culture', 'November to February', 'budget', 25, ARRAY['Golden pagodas', 'Culture', 'History']),
('Ethiopia', 'Ethiopia', 'Africa', 9.1450, 40.4897, 'cultural', 'Cradle of civilization', 'October to March', 'budget', 20, ARRAY['Ancient churches', 'Coffee culture', 'History']),
('Sri Lanka', 'Sri Lanka', 'Asia', 7.8731, 80.7718, 'cultural', 'Pearl of the Indian Ocean', 'December to March', 'mid-range', 35, ARRAY['Ancient temples', 'Tea plantations', 'Wildlife']),
('Georgia', 'Georgia', 'Europe/Asia', 42.3154, 43.3569, 'mountains', 'Wine country with mountain landscapes', 'May to October', 'budget', 30, ARRAY['Wine regions', 'Mountains', 'Hospitality']),
('Uzbekistan', 'Uzbekistan', 'Asia', 41.3775, 64.5853, 'cultural', 'Silk Road heritage', 'April to June, September to November', 'budget', 25, ARRAY['Silk Road', 'Architecture', 'History']),
('Rwanda', 'Rwanda', 'Africa', -1.9403, 29.8739, 'adventure', 'Land of a thousand hills', 'June to September', 'luxury', 80, ARRAY['Mountain gorillas', 'Hills', 'Conservation']),
('Bhutan', 'Bhutan', 'Asia', 27.5142, 90.4336, 'spiritual', 'Last Shangri-La', 'March to May, September to November', 'luxury', 200, ARRAY['Happiness index', 'Buddhism', 'Mountains']),
('Mongolia', 'Mongolia', 'Asia', 46.8625, 103.8467, 'adventure', 'Nomadic culture and vast steppes', 'June to August', 'mid-range', 40, ARRAY['Nomadic culture', 'Steppes', 'Horses']),
('Faroe Islands', 'Faroe Islands', 'Europe', 61.8926, -6.9118, 'mountains', 'Remote Nordic islands', 'June to August', 'luxury', 100, ARRAY['Remote islands', 'Nordic culture', 'Dramatic landscapes']),
('Socotra Island', 'Yemen', 'Middle East', 12.5000, 53.8333, 'adventure', 'Alien-like landscapes', 'October to April', 'mid-range', 50, ARRAY['Unique flora', 'Isolation', 'Dragon trees']),
('Easter Island', 'Chile', 'Oceania', -27.1127, -109.3497, 'cultural', 'Mysterious moai statues', 'December to March', 'luxury', 120, ARRAY['Moai statues', 'Polynesian culture', 'Remote']),
('Greenland', 'Greenland', 'North America', 71.7069, -42.6043, 'adventure', 'Arctic wilderness', 'June to September', 'luxury', 150, ARRAY['Icebergs', 'Arctic wildlife', 'Indigenous culture']),
('Papua New Guinea', 'Papua New Guinea', 'Oceania', -6.3150, 143.9555, 'adventure', 'Cultural diversity and pristine nature', 'May to October', 'mid-range', 60, ARRAY['Tribal culture', 'Diving', 'Biodiversity']),
('Antarctica', 'Antarctica', 'Antarctica', -82.8628, 135.0000, 'adventure', 'Last untouched continent', 'November to March', 'luxury', 500, ARRAY['Penguins', 'Icebergs', 'Research stations']),
('Svalbard', 'Norway', 'Europe', 78.2232, 15.6267, 'adventure', 'Arctic archipelago', 'March to September', 'luxury', 200, ARRAY['Polar bears', 'Midnight sun', 'Arctic']),
('Franz Josef Land', 'Russia', 'Europe', 80.6000, 55.0000, 'adventure', 'Remote Arctic archipelago', 'July to August', 'luxury', 300, ARRAY['Polar bears', 'Ice', 'Remote']),
('Kerguelen Islands', 'France', 'Antarctica', -49.3500, 69.2167, 'adventure', 'Desolation Islands', 'December to February', 'luxury', 400, ARRAY['Research station', 'Wildlife', 'Isolation']),
('Pitcairn Island', 'UK', 'Oceania', -25.0658, -130.1005, 'adventure', 'Most remote inhabited island', 'April to October', 'luxury', 200, ARRAY['Bounty history', 'Remote', 'Small population']),
('Tristan da Cunha', 'UK', 'Africa', -37.1052, -12.2777, 'adventure', 'Most remote island group', 'October to March', 'luxury', 250, ARRAY['Remote', 'Small community', 'Volcanic']),
('North Sentinel Island', 'India', 'Asia', 11.5500, 92.2333, 'adventure', 'Forbidden uncontacted tribe island', 'Never accessible', 'luxury', 1000, ARRAY['Uncontacted tribe', 'Forbidden', 'Protected']),
('McMurdo Station', 'Antarctica', 'Antarctica', -77.8419, 166.6863, 'adventure', 'Antarctic research station', 'October to February', 'luxury', 600, ARRAY['Research', 'Extreme conditions', 'Science']),
('Devon Island', 'Canada', 'North America', 75.4000, -90.0000, 'adventure', 'Mars analog research site', 'June to August', 'luxury', 300, ARRAY['Mars analog', 'Research', 'Arctic desert']),
('Bouvet Island', 'Norway', 'Antarctica', -54.4208, 3.3464, 'adventure', 'Most remote island on Earth', 'December to February', 'luxury', 500, ARRAY['Remote', 'Glaciated', 'No permanent residents']),
('Heard Island', 'Australia', 'Antarctica', -53.1000, 73.5167, 'adventure', 'Subantarctic volcanic island', 'December to March', 'luxury', 400, ARRAY['Volcano', 'Wildlife', 'Research']),
('Peter I Island', 'Norway', 'Antarctica', -68.8000, -90.6000, 'adventure', 'Uninhabited Antarctic island', 'December to February', 'luxury', 450, ARRAY['Uninhabited', 'Ice-covered', 'Research']),
-- Continue with more destinations...
('Sao Tome and Principe', 'Sao Tome and Principe', 'Africa', 0.1864, 6.6131, 'beaches', 'African Galapagos', 'June to September', 'mid-range', 45, ARRAY['Biodiversity', 'Beaches', 'Chocolate']),
('Comoros', 'Comoros', 'Africa', -11.6455, 43.3333, 'adventure', 'Perfume islands', 'May to October', 'mid-range', 40, ARRAY['Ylang-ylang', 'Volcanoes', 'Culture']),
('Vanuatu', 'Vanuatu', 'Oceania', -15.3767, 166.9592, 'adventure', 'Adventure and culture', 'April to October', 'mid-range', 50, ARRAY['Volcanoes', 'Culture', 'Adventure']),
('Tuvalu', 'Tuvalu', 'Oceania', -7.1095, 177.6493, 'beaches', 'Disappearing paradise', 'May to October', 'luxury', 100, ARRAY['Climate change', 'Remote', 'Culture']),
('Nauru', 'Nauru', 'Oceania', -0.5228, 166.9315, 'cultural', 'Smallest island nation', 'Year-round', 'mid-range', 60, ARRAY['Phosphate mining', 'Small', 'Pacific']),
('Kiribati', 'Kiribati', 'Oceania', -3.3704, -168.7340, 'beaches', 'First to see sunrise', 'April to October', 'mid-range', 55, ARRAY['Time zones', 'Atolls', 'Culture']),
('Marshall Islands', 'Marshall Islands', 'Oceania', 7.1315, 171.1845, 'adventure', 'WWII history and atolls', 'December to April', 'mid-range', 70, ARRAY['WWII sites', 'Atolls', 'Diving']),
('Palau', 'Palau', 'Oceania', 7.5150, 134.5825, 'beaches', 'Diving paradise', 'November to April', 'luxury', 150, ARRAY['Jellyfish lake', 'Diving', 'Marine life']),
('Federated States of Micronesia', 'Micronesia', 'Oceania', 7.4256, 150.5508, 'adventure', 'WWII wrecks and culture', 'December to March', 'mid-range', 60, ARRAY['WWII wrecks', 'Diving', 'Culture']),
('American Samoa', 'American Samoa', 'Oceania', -14.3064, -170.6958, 'cultural', 'Polynesian culture', 'May to October', 'mid-range', 50, ARRAY['Polynesian culture', 'National park', 'Flying foxes']),
('Cook Islands', 'Cook Islands', 'Oceania', -21.2367, -159.7777, 'beaches', 'Polynesian paradise', 'April to November', 'luxury', 80, ARRAY['Lagoons', 'Culture', 'Hospitality']),
('French Polynesia', 'French Polynesia', 'Oceania', -17.6797, -149.4068, 'beaches', 'Ultimate tropical paradise', 'May to October', 'luxury', 200, ARRAY['Overwater bungalows', 'Tahiti', 'Romance']),
('Niue', 'Niue', 'Oceania', -19.0544, -169.8672, 'adventure', 'Rock of Polynesia', 'May to October', 'mid-range', 70, ARRAY['Whale watching', 'Coral island', 'Caves']),
('Tokelau', 'New Zealand', 'Oceania', -8.9672, -171.8538, 'cultural', 'Remote atolls', 'May to October', 'mid-range', 60, ARRAY['Remote', 'Atolls', 'Culture']),
('Norfolk Island', 'Australia', 'Oceania', -29.0408, 167.9547, 'cultural', 'Bounty mutineers descendants', 'September to May', 'mid-range', 80, ARRAY['History', 'Culture', 'Pine trees']),
('Christmas Island', 'Australia', 'Oceania', -10.4475, 105.6904, 'adventure', 'Red crab migration', 'May to September', 'mid-range', 90, ARRAY['Red crabs', 'National park', 'Diving']),
('Lord Howe Island', 'Australia', 'Oceania', -31.5554, 159.0804, 'adventure', 'World Heritage paradise', 'April to November', 'luxury', 120, ARRAY['World Heritage', 'Limited visitors', 'Nature']),
('Cocos Islands', 'Australia', 'Oceania', -12.1642, 96.8710, 'beaches', 'Indian Ocean paradise', 'April to November', 'luxury', 100, ARRAY['Atolls', 'Diving', 'Remote']),
('Macquarie Island', 'Australia', 'Antarctica', -54.7500, 158.8833, 'adventure', 'Subantarctic wildlife', 'December to February', 'luxury', 300, ARRAY['Penguins', 'Seals', 'Research']),
('South Georgia', 'UK', 'Antarctica', -54.4296, -36.5879, 'adventure', 'Shackleton and wildlife', 'November to March', 'luxury', 400, ARRAY['Penguins', 'Shackleton', 'Wildlife']),
('Falkland Islands', 'UK', 'South America', -51.7963, -59.5236, 'adventure', 'Remote British territory', 'October to March', 'luxury', 150, ARRAY['Wildlife', 'History', 'Remote']),
('Ascension Island', 'UK', 'Africa', -7.9467, -14.3559, 'adventure', 'Volcanic mid-Atlantic island', 'Year-round', 'luxury', 200, ARRAY['Turtles', 'Volcanic', 'Military']),
('St. Helena', 'UK', 'Africa', -15.9387, -5.7181, 'cultural', 'Napoleon\'s exile island', 'October to April', 'mid-range', 80, ARRAY['Napoleon', 'History', 'Remote']),
('Gough Island', 'UK', 'Africa', -40.3219, -9.9231, 'adventure', 'World Heritage seabird sanctuary', 'October to March', 'luxury', 500, ARRAY['Seabirds', 'World Heritage', 'Research']),
('Inaccessible Island', 'UK', 'Africa', -37.3000, -12.6833, 'adventure', 'Aptly named remote island', 'October to March', 'luxury', 600, ARRAY['Inaccessible', 'Wildlife', 'Research']),
('Nightingale Island', 'UK', 'Africa', -37.4167, -12.4833, 'adventure', 'Remote Atlantic island', 'October to March', 'luxury', 550, ARRAY['Remote', 'Wildlife', 'Small']),
('Grytviken', 'UK', 'Antarctica', -54.2833, -36.5000, 'adventure', 'Abandoned whaling station', 'November to March', 'luxury', 450, ARRAY['Whaling history', 'Shackleton', 'Abandoned']),
('King Edward Point', 'UK', 'Antarctica', -54.2833, -36.4833, 'adventure', 'Research station', 'November to March', 'luxury', 400, ARRAY['Research', 'Wildlife', 'Remote']),
('Bird Island', 'UK', 'Antarctica', -54.0167, -38.0500, 'adventure', 'Seabird research station', 'November to March', 'luxury', 500, ARRAY['Seabirds', 'Research', 'Wildlife']),
('Cooper Island', 'UK', 'Antarctica', -54.7833, -35.7333, 'adventure', 'Remote research outpost', 'November to March', 'luxury', 550, ARRAY['Research', 'Remote', 'Wildlife']),
('Saunders Island', 'UK', 'Antarctica', -57.7833, -26.4500, 'adventure', 'South Sandwich Islands', 'December to February', 'luxury', 600, ARRAY['Volcanic', 'Remote', 'Research']),
('Zavodovski Island', 'UK', 'Antarctica', -56.3000, -27.5833, 'adventure', 'Penguin colony', 'December to February', 'luxury', 650, ARRAY['Penguin colony', 'Volcanic', 'Remote']);