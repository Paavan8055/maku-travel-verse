-- Add Master AI Bot and Maku Bot entries with all required fields
INSERT INTO gpt_bot_registry (
  id,
  bot_name,
  bot_type,
  description,
  capabilities,
  category,
  integration_status,
  is_system_bot,
  configuration,
  chat_gpt_url
) VALUES 
(
  gen_random_uuid(),
  'master-ai-analyst',
  'Master AI Analyst',
  'Advanced AI analyst for comprehensive system analysis, troubleshooting, and predictive insights across the MAKU platform.',
  '["system_analysis", "troubleshooting", "predictive_analytics", "performance_optimization", "data_insights"]'::jsonb,
  'System Management',
  'active',
  true,
  '{
    "model": "gpt-5-2025-08-07",
    "temperature": 0.7,
    "max_tokens": 2000,
    "system_prompt": "You are the Master AI Analyst for MAKU Travel. You provide comprehensive system analysis, troubleshoot issues, and deliver actionable insights with confidence ratings and structured recommendations."
  }'::jsonb,
  'https://api.openai.com/v1/chat/completions'
),
(
  gen_random_uuid(),
  'maku-bot',
  'MAKU Travel Assistant',
  'Intelligent travel assistant specializing in personalized travel recommendations across Family, Solo, Pet, and Spiritual travel verticals.',
  '["travel_planning", "booking_assistance", "destination_recommendations", "travel_advice", "vertical_specialization"]'::jsonb,
  'Travel Assistance',
  'active',
  true,
  '{
    "model": "gpt-5-2025-08-07",
    "temperature": 0.8,
    "max_tokens": 1500,
    "system_prompt": "You are MAKU Bot, an intelligent travel assistant specializing in personalized travel experiences. You help users plan amazing trips based on their travel vertical (Family, Solo, Pet, Spiritual) with expert recommendations."
  }'::jsonb,
  'https://api.openai.com/v1/chat/completions'
),
(
  gen_random_uuid(),
  'maku-bot-family',
  'Family Travel Specialist',
  'Specialized AI assistant for family travel planning with kid-friendly recommendations and family-oriented travel advice.',
  '["family_travel", "kid_friendly_destinations", "family_accommodations", "group_activities"]'::jsonb,
  'Travel Assistance',
  'active',
  true,
  '{
    "model": "gpt-5-2025-08-07",
    "temperature": 0.8,
    "max_tokens": 1500,
    "vertical": "Family",
    "system_prompt": "You are MAKU Bot specializing in Family Travel. You help families plan memorable trips with kid-friendly destinations, family accommodations, and engaging activities for all ages."
  }'::jsonb,
  'https://api.openai.com/v1/chat/completions'
),
(
  gen_random_uuid(),
  'maku-bot-solo',
  'Solo Travel Specialist',
  'AI assistant focused on solo travel experiences, safety recommendations, and unique solo traveler opportunities.',
  '["solo_travel", "safety_tips", "solo_experiences", "independent_travel"]'::jsonb,
  'Travel Assistance',
  'active',
  true,
  '{
    "model": "gpt-5-2025-08-07",
    "temperature": 0.8,
    "max_tokens": 1500,
    "vertical": "Solo",
    "system_prompt": "You are MAKU Bot specializing in Solo Travel. You help solo travelers discover amazing destinations, ensure safety, and find unique experiences perfect for independent exploration."
  }'::jsonb,
  'https://api.openai.com/v1/chat/completions'
),
(
  gen_random_uuid(),
  'maku-bot-pet',
  'Pet Travel Specialist',
  'Specialized assistant for pet-friendly travel planning, including pet accommodations and pet-safe destinations.',
  '["pet_travel", "pet_friendly_hotels", "pet_activities", "travel_regulations"]'::jsonb,
  'Travel Assistance',
  'active',
  true,
  '{
    "model": "gpt-5-2025-08-07",
    "temperature": 0.8,
    "max_tokens": 1500,
    "vertical": "Pet",
    "system_prompt": "You are MAKU Bot specializing in Pet Travel. You help pet owners plan trips with their furry companions, finding pet-friendly accommodations, activities, and ensuring comfortable travel for pets."
  }'::jsonb,
  'https://api.openai.com/v1/chat/completions'
),
(
  gen_random_uuid(),
  'maku-bot-spiritual',
  'Spiritual Travel Specialist',
  'AI assistant for spiritual and wellness travel, including retreat recommendations and sacred destination guidance.',
  '["spiritual_travel", "wellness_retreats", "meditation_centers", "sacred_destinations"]'::jsonb,
  'Travel Assistance',
  'active',
  true,
  '{
    "model": "gpt-5-2025-08-07",
    "temperature": 0.8,
    "max_tokens": 1500,
    "vertical": "Spiritual",
    "system_prompt": "You are MAKU Bot specializing in Spiritual Travel. You help travelers find transformative spiritual experiences, wellness retreats, meditation centers, and sacred destinations for personal growth."
  }'::jsonb,
  'https://api.openai.com/v1/chat/completions'
);