-- Add department and reporting structure to agent_management table
ALTER TABLE public.agent_management 
ADD COLUMN IF NOT EXISTS department text,
ADD COLUMN IF NOT EXISTS reports_to_agent_id text,
ADD COLUMN IF NOT EXISTS is_department_head boolean DEFAULT false;

-- First, remove the tier constraint to allow tier 0
ALTER TABLE public.agent_management DROP CONSTRAINT IF EXISTS valid_tier;

-- Add new constraint allowing tiers 0-4
ALTER TABLE public.agent_management ADD CONSTRAINT valid_tier CHECK (tier >= 0 AND tier <= 4);

-- Add CEO at Tier 0
INSERT INTO public.agent_management (
  agent_id, display_name, description, category, status, tier, tier_name, 
  department, is_department_head, capabilities, configuration, permissions, performance_settings
) VALUES (
  'ceo-agent', 
  'Chief Executive Officer', 
  'Strategic leadership and company-wide decision making', 
  'executive', 
  'active', 
  0, 
  'executive', 
  'executive', 
  true,
  '["strategic_planning", "company_governance", "board_relations"]'::jsonb,
  '{}'::jsonb,
  '{}'::jsonb,
  '{}'::jsonb
) ON CONFLICT (agent_id) DO NOTHING;

-- Add Department Heads (Tier 1)
INSERT INTO public.agent_management (
  agent_id, display_name, description, category, status, tier, tier_name, 
  department, is_department_head, reports_to_agent_id, capabilities, configuration, permissions, performance_settings
) VALUES 
('cto-agent', 'Chief Technology Officer', 'Technology strategy and system architecture', 'technology', 'active', 1, 'executive', 'technology', true, 'ceo-agent', '["technology_strategy", "system_architecture", "development_oversight"]'::jsonb, '{}'::jsonb, '{}'::jsonb, '{}'::jsonb),
('cfo-agent', 'Chief Financial Officer', 'Financial strategy and fiscal management', 'finance', 'active', 1, 'executive', 'finance', true, 'ceo-agent', '["financial_strategy", "budget_management", "financial_reporting"]'::jsonb, '{}'::jsonb, '{}'::jsonb, '{}'::jsonb),
('cmo-agent', 'Chief Marketing Officer', 'Marketing strategy and brand management', 'marketing', 'active', 1, 'executive', 'marketing', true, 'ceo-agent', '["marketing_strategy", "brand_management", "campaign_oversight"]'::jsonb, '{}'::jsonb, '{}'::jsonb, '{}'::jsonb),
('coo-agent', 'Chief Operating Officer', 'Operations strategy and process optimization', 'operations', 'active', 1, 'executive', 'operations', true, 'ceo-agent', '["operations_strategy", "process_optimization", "resource_management"]'::jsonb, '{}'::jsonb, '{}'::jsonb, '{}'::jsonb),
('cpo-agent', 'Chief People Officer', 'Human resources and organizational development', 'hr', 'active', 1, 'executive', 'human_resources', true, 'ceo-agent', '["hr_strategy", "talent_management", "organizational_development"]'::jsonb, '{}'::jsonb, '{}'::jsonb, '{}'::jsonb)
ON CONFLICT (agent_id) DO NOTHING;

-- Update existing manager agents to Tier 2 and assign departments
UPDATE public.agent_management 
SET tier = 2, 
    tier_name = 'management',
    department = CASE 
      WHEN agent_id LIKE '%financial%' OR agent_id LIKE '%revenue%' THEN 'finance'
      WHEN agent_id LIKE '%marketing%' OR agent_id LIKE '%content%' THEN 'marketing'
      WHEN agent_id LIKE '%inventory%' OR agent_id LIKE '%operations%' THEN 'operations'
      WHEN agent_id LIKE '%analytics%' OR agent_id LIKE '%customer%' THEN 'analytics'
      ELSE 'operations'
    END,
    reports_to_agent_id = CASE 
      WHEN agent_id LIKE '%financial%' OR agent_id LIKE '%revenue%' THEN 'cfo-agent'
      WHEN agent_id LIKE '%marketing%' OR agent_id LIKE '%content%' THEN 'cmo-agent'
      WHEN agent_id LIKE '%inventory%' OR agent_id LIKE '%operations%' THEN 'coo-agent'
      WHEN agent_id LIKE '%analytics%' OR agent_id LIKE '%customer%' THEN 'coo-agent'
      ELSE 'coo-agent'
    END
WHERE tier = 1 AND agent_id NOT IN ('ceo-agent', 'cto-agent', 'cfo-agent', 'cmo-agent', 'coo-agent', 'cpo-agent');

-- Move coordinators and specialists to Tier 3
UPDATE public.agent_management 
SET tier = 3,
    tier_name = 'coordination',
    department = CASE 
      WHEN category LIKE '%travel%' OR category LIKE '%booking%' THEN 'operations'
      WHEN category LIKE '%security%' OR category LIKE '%compliance%' THEN 'technology'
      WHEN category LIKE '%support%' OR category LIKE '%service%' THEN 'customer_service'
      WHEN category LIKE '%finance%' OR category LIKE '%payment%' THEN 'finance'
      WHEN category LIKE '%marketing%' OR category LIKE '%content%' THEN 'marketing'
      ELSE 'operations'
    END
WHERE tier = 4 AND (display_name LIKE '%Coordinator%' OR display_name LIKE '%Specialist%');

-- Update support agents to Tier 4
UPDATE public.agent_management 
SET tier = 4,
    tier_name = 'support',
    department = CASE 
      WHEN category LIKE '%support%' OR category LIKE '%service%' THEN 'customer_service'
      WHEN category LIKE '%admin%' OR category LIKE '%general%' THEN 'operations'
      ELSE 'operations'
    END
WHERE tier = 4 AND display_name NOT LIKE '%Coordinator%' AND display_name NOT LIKE '%Specialist%';

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_agent_management_department ON public.agent_management(department);
CREATE INDEX IF NOT EXISTS idx_agent_management_reports_to ON public.agent_management(reports_to_agent_id);