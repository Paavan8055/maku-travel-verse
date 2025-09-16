-- Add tier column to agent_management table
ALTER TABLE public.agent_management 
ADD COLUMN tier integer DEFAULT 4;

-- Add tier names for better organization
ALTER TABLE public.agent_management 
ADD COLUMN tier_name text DEFAULT 'support';

-- Update existing agents with appropriate tiers based on their roles
-- Tier 1: Executive Managers (strategic oversight)
UPDATE public.agent_management 
SET tier = 1, tier_name = 'executive'
WHERE agent_id IN ('financial-transaction-manager', 'content-management-manager', 'operational-coordination-manager');

-- Tier 2: Operational Managers (business operations)  
UPDATE public.agent_management
SET tier = 2, tier_name = 'operational'
WHERE agent_id IN ('booking-agent', 'payment-agent', 'customer-service-agent', 'analytics-agent');

-- Tier 3: Specialist Managers (domain expertise)
UPDATE public.agent_management
SET tier = 3, tier_name = 'specialist'  
WHERE agent_id IN ('weather-tracker', 'currency-converter', 'destination-guide', 'price-monitor');

-- Tier 4: Support Agents (individual tasks) - already default
UPDATE public.agent_management
SET tier = 4, tier_name = 'support'
WHERE tier IS NULL OR tier = 4;

-- Add index for efficient queries
CREATE INDEX idx_agent_management_tier ON public.agent_management(tier);

-- Add check constraint to ensure valid tier values
ALTER TABLE public.agent_management 
ADD CONSTRAINT valid_tier CHECK (tier BETWEEN 1 AND 4);

-- Add check constraint for tier names
ALTER TABLE public.agent_management
ADD CONSTRAINT valid_tier_name CHECK (tier_name IN ('executive', 'operational', 'specialist', 'support'));