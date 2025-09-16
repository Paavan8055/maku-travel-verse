-- Update agents with proper tier assignments based on their capabilities and roles

-- Tier 1: Executive Managers (strategic oversight)
UPDATE public.agent_management 
SET tier = 1, tier_name = 'executive'
WHERE agent_id IN ('travel-booking-agent', 'data-analytics-agent') 
   OR display_name ILIKE '%coordinator%' 
   OR display_name ILIKE '%manager%'
   OR display_name ILIKE '%engine%';

-- Tier 2: Operational Managers (business operations)
UPDATE public.agent_management
SET tier = 2, tier_name = 'operational'
WHERE agent_id IN ('customer-support-agent', 'calendar-sync-agent', 'hr-recruitment-agent')
   OR display_name ILIKE '%assistant%'
   OR category IN ('support', 'productivity', 'hr');

-- Tier 3: Specialist Managers (domain expertise) 
UPDATE public.agent_management
SET tier = 3, tier_name = 'specialist'
WHERE category IN ('finance', 'marketing', 'security')
   OR capabilities::text ILIKE '%specialized%'
   OR capabilities::text ILIKE '%expert%';