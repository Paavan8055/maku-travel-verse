-- Create manager hierarchies table
CREATE TABLE public.manager_hierarchies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  manager_id TEXT NOT NULL,
  reports_to TEXT NULL,
  tier INTEGER NOT NULL,
  supervises TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create agent delegations table
CREATE TABLE public.agent_delegations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  manager_id TEXT NOT NULL,
  agent_id TEXT NOT NULL,
  task_type TEXT NOT NULL,
  delegation_status TEXT NOT NULL DEFAULT 'active',
  user_id UUID NULL,
  task_params JSONB NOT NULL DEFAULT '{}',
  delegation_result JSONB NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE NULL,
  error_message TEXT NULL
);

-- Enable RLS on both tables
ALTER TABLE public.manager_hierarchies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_delegations ENABLE ROW LEVEL SECURITY;

-- Create policies for manager hierarchies
CREATE POLICY "Admins can manage manager hierarchies" 
ON public.manager_hierarchies 
FOR ALL 
USING (is_secure_admin(auth.uid()));

CREATE POLICY "Service role can manage manager hierarchies" 
ON public.manager_hierarchies 
FOR ALL 
USING (auth.role() = 'service_role');

-- Create policies for agent delegations
CREATE POLICY "Admins can view all agent delegations" 
ON public.agent_delegations 
FOR SELECT 
USING (is_secure_admin(auth.uid()));

CREATE POLICY "Service role can manage agent delegations" 
ON public.agent_delegations 
FOR ALL 
USING (auth.role() = 'service_role');

CREATE POLICY "Users can view their own delegations" 
ON public.agent_delegations 
FOR SELECT 
USING (auth.uid() = user_id);

-- Add indexes for performance
CREATE INDEX idx_manager_hierarchies_manager_id ON public.manager_hierarchies(manager_id);
CREATE INDEX idx_manager_hierarchies_reports_to ON public.manager_hierarchies(reports_to);
CREATE INDEX idx_agent_delegations_manager_id ON public.agent_delegations(manager_id);
CREATE INDEX idx_agent_delegations_agent_id ON public.agent_delegations(agent_id);
CREATE INDEX idx_agent_delegations_user_id ON public.agent_delegations(user_id);
CREATE INDEX idx_agent_delegations_status ON public.agent_delegations(delegation_status);

-- Insert initial manager hierarchy data
INSERT INTO public.manager_hierarchies (manager_id, reports_to, tier, supervises) VALUES
('revenue-management-manager', NULL, 1, ARRAY['inventory-management-manager', 'pricing-optimization-agent', 'demand-forecaster']),
('operations-management-manager', NULL, 1, ARRAY['booking-integrity-manager', 'analytics-reporting-manager', 'system-monitoring-agent']),
('risk-management-manager', NULL, 1, ARRAY['compliance-agent', 'security-monitor', 'audit-trail-manager']),
('content-management-manager', NULL, 1, ARRAY['marketing-campaign-manager', 'content-creator', 'social-media-manager']),
('financial-transaction-manager', NULL, 1, ARRAY['payment-processor', 'billing-agent', 'financial-analyst']),
('inventory-management-manager', 'revenue-management-manager', 2, ARRAY['availability-tracker', 'allocation-optimizer', 'supplier-coordinator']),
('customer-relationship-manager', 'operations-management-manager', 2, ARRAY['loyalty-manager', 'customer-segmenter', 'personalization-engine']),
('analytics-reporting-manager', 'operations-management-manager', 2, ARRAY['data-analyst', 'performance-tracker', 'business-intelligence']),
('marketing-campaign-manager', 'content-management-manager', 2, ARRAY['email-marketer', 'social-media-manager', 'ad-campaign-optimizer']);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_manager_hierarchies_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_manager_hierarchies_updated_at
BEFORE UPDATE ON public.manager_hierarchies
FOR EACH ROW
EXECUTE FUNCTION public.update_manager_hierarchies_updated_at();