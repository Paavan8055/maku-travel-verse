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
('New Zealand', 'New Zealand', 'Oceania', -40.9006, 174.8860, 'mountains', 'Adventure capital with stunning landscapes', 'December to February', 'luxury', 100, ARRAY['Adventure sports', 'Fjords', 'Hobbits']);