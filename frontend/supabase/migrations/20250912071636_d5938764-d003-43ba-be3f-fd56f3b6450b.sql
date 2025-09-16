-- Phase 1: Foundation Enhancement - Database Schema for Provider Auto-Discovery

-- Create provider discovery log table to track auto-detection events
CREATE TABLE IF NOT EXISTS public.provider_discovery_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  discovery_method TEXT NOT NULL, -- 'api_scan', 'marketplace', 'manual', 'webhook'
  discovered_provider_name TEXT NOT NULL,
  discovered_endpoint TEXT,
  discovered_capabilities JSONB DEFAULT '[]'::jsonb,
  discovery_metadata JSONB DEFAULT '{}'::jsonb,
  verification_status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'verified', 'failed'
  verification_errors JSONB DEFAULT '[]'::jsonb,
  auto_configured BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  verified_at TIMESTAMP WITH TIME ZONE,
  configured_at TIMESTAMP WITH TIME ZONE
);

-- Create pending providers table for discovered but unverified providers
CREATE TABLE IF NOT EXISTS public.pending_providers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  discovery_log_id UUID REFERENCES public.provider_discovery_log(id) ON DELETE CASCADE,
  provider_name TEXT NOT NULL,
  provider_type TEXT NOT NULL, -- 'flight', 'hotel', 'activity', 'transfer'
  api_endpoint TEXT NOT NULL,
  authentication_type TEXT, -- 'oauth', 'api_key', 'basic', 'bearer'
  capabilities JSONB DEFAULT '[]'::jsonb,
  estimated_setup_time_minutes INTEGER DEFAULT 30,
  cost_estimation JSONB DEFAULT '{}'::jsonb,
  integration_complexity TEXT DEFAULT 'medium', -- 'simple', 'medium', 'complex'
  approval_status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
  approved_by UUID,
  approved_at TIMESTAMP WITH TIME ZONE,
  rejection_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Extend provider_configs with auto-discovery metadata
ALTER TABLE public.provider_configs 
ADD COLUMN IF NOT EXISTS auto_discovered BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS discovery_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS discovery_method TEXT,
ADD COLUMN IF NOT EXISTS marketplace_metadata JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS auto_config_score NUMERIC(3,2) DEFAULT 0.0;

-- Create discovery automation rules table
CREATE TABLE IF NOT EXISTS public.discovery_automation_rules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  rule_name TEXT NOT NULL,
  rule_type TEXT NOT NULL, -- 'auto_approve', 'auto_test', 'notification', 'workflow'
  conditions JSONB NOT NULL DEFAULT '{}'::jsonb,
  actions JSONB NOT NULL DEFAULT '{}'::jsonb,
  priority INTEGER DEFAULT 1,
  is_active BOOLEAN DEFAULT true,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  last_triggered TIMESTAMP WITH TIME ZONE,
  trigger_count INTEGER DEFAULT 0
);

-- Enable RLS on new tables
ALTER TABLE public.provider_discovery_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pending_providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.discovery_automation_rules ENABLE ROW LEVEL SECURITY;

-- RLS Policies for provider_discovery_log
CREATE POLICY "Admins can manage discovery logs" ON public.provider_discovery_log
  FOR ALL USING (is_secure_admin(auth.uid()));

CREATE POLICY "Service role can manage discovery logs" ON public.provider_discovery_log
  FOR ALL USING (auth.role() = 'service_role');

-- RLS Policies for pending_providers
CREATE POLICY "Admins can manage pending providers" ON public.pending_providers
  FOR ALL USING (is_secure_admin(auth.uid()));

CREATE POLICY "Service role can manage pending providers" ON public.pending_providers
  FOR ALL USING (auth.role() = 'service_role');

-- RLS Policies for discovery_automation_rules
CREATE POLICY "Admins can manage discovery automation rules" ON public.discovery_automation_rules
  FOR ALL USING (is_secure_admin(auth.uid()));

-- Insert default discovery automation rules
INSERT INTO public.discovery_automation_rules (rule_name, rule_type, conditions, actions, priority) VALUES
('Auto-approve trusted marketplaces', 'auto_approve', 
 '{"discovery_method": ["marketplace"], "provider_complexity": ["simple", "medium"]}',
 '{"auto_approve": true, "notify_admin": true, "auto_test": true}', 1),
('High-value provider notification', 'notification',
 '{"estimated_value": {"min": 1000}, "capabilities": {"min_count": 3}}',
 '{"priority": "high", "notify_channels": ["email", "dashboard"], "escalate_to": "senior_admin"}', 2),
('Auto-test simple integrations', 'auto_test',
 '{"integration_complexity": ["simple"], "authentication_type": ["api_key"]}',
 '{"run_credential_test": true, "run_endpoint_test": true, "timeout_minutes": 15}', 3);

-- Create function to trigger discovery workflows
CREATE OR REPLACE FUNCTION public.trigger_discovery_workflow()
RETURNS TRIGGER AS $$
BEGIN
  -- Notify Master Bot about new discovery
  INSERT INTO public.agent_tasks_consolidated (
    agent_id, task_type, params, user_id, priority, status
  ) VALUES (
    'discovery-agent', 'provider_discovery_review', 
    jsonb_build_object(
      'discovery_log_id', NEW.id,
      'provider_name', NEW.discovered_provider_name,
      'discovery_method', NEW.discovery_method,
      'auto_triggered', true
    ),
    NULL, 2, 'pending'
  );

  -- Check automation rules
  PERFORM pg_notify('provider_discovery', json_build_object(
    'event', 'new_discovery',
    'discovery_id', NEW.id,
    'provider_name', NEW.discovered_provider_name,
    'method', NEW.discovery_method
  )::text);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public';

-- Create trigger for discovery workflow
CREATE OR REPLACE TRIGGER trigger_discovery_workflow_on_insert
  AFTER INSERT ON public.provider_discovery_log
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_discovery_workflow();

-- Create function to update pending provider status
CREATE OR REPLACE FUNCTION public.update_pending_provider_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public';

-- Create trigger for pending providers
CREATE OR REPLACE TRIGGER update_pending_providers_updated_at
  BEFORE UPDATE ON public.pending_providers
  FOR EACH ROW
  EXECUTE FUNCTION public.update_pending_provider_updated_at();

-- Create trigger for discovery automation rules
CREATE OR REPLACE TRIGGER update_discovery_automation_rules_updated_at
  BEFORE UPDATE ON public.discovery_automation_rules
  FOR EACH ROW
  EXECUTE FUNCTION public.update_pending_provider_updated_at();