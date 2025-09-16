-- Create agent management schema for Enhanced Admin Agent Management System

-- Agent management and configuration
CREATE TABLE public.agent_management (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  agent_id TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL DEFAULT 'general',
  status TEXT NOT NULL DEFAULT 'active',
  version TEXT NOT NULL DEFAULT '1.0.0',
  capabilities JSONB NOT NULL DEFAULT '[]',
  configuration JSONB NOT NULL DEFAULT '{}',
  permissions JSONB NOT NULL DEFAULT '{}',
  performance_settings JSONB NOT NULL DEFAULT '{}',
  health_status TEXT NOT NULL DEFAULT 'healthy',
  last_health_check TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id)
);

-- Agent groups for organizing agents
CREATE TABLE public.agent_groups (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  group_name TEXT NOT NULL UNIQUE,
  description TEXT,
  group_type TEXT NOT NULL DEFAULT 'functional',
  configuration JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- Agent group memberships
CREATE TABLE public.agent_group_memberships (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  agent_id TEXT NOT NULL,
  group_id UUID NOT NULL REFERENCES public.agent_groups(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member',
  added_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  added_by UUID REFERENCES auth.users(id),
  UNIQUE(agent_id, group_id)
);

-- Task templates for common operations
CREATE TABLE public.agent_task_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  template_name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL DEFAULT 'general',
  agent_types TEXT[] NOT NULL DEFAULT '{}',
  task_definition JSONB NOT NULL,
  default_parameters JSONB NOT NULL DEFAULT '{}',
  required_permissions TEXT[] NOT NULL DEFAULT '{}',
  estimated_duration_minutes INTEGER DEFAULT 5,
  is_system_template BOOLEAN NOT NULL DEFAULT FALSE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- Scheduled tasks for automation
CREATE TABLE public.agent_scheduled_tasks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  task_name TEXT NOT NULL,
  description TEXT,
  agent_id TEXT NOT NULL,
  template_id UUID REFERENCES public.agent_task_templates(id),
  task_parameters JSONB NOT NULL DEFAULT '{}',
  schedule_type TEXT NOT NULL DEFAULT 'once',
  schedule_config JSONB NOT NULL DEFAULT '{}',
  next_execution TIMESTAMP WITH TIME ZONE,
  last_execution TIMESTAMP WITH TIME ZONE,
  execution_count INTEGER NOT NULL DEFAULT 0,
  max_executions INTEGER,
  status TEXT NOT NULL DEFAULT 'scheduled',
  error_count INTEGER NOT NULL DEFAULT 0,
  last_error TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- Agent performance metrics
CREATE TABLE public.agent_performance_metrics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  agent_id TEXT NOT NULL,
  metric_date DATE NOT NULL DEFAULT CURRENT_DATE,
  total_tasks INTEGER NOT NULL DEFAULT 0,
  successful_tasks INTEGER NOT NULL DEFAULT 0,
  failed_tasks INTEGER NOT NULL DEFAULT 0,
  average_response_time_ms INTEGER NOT NULL DEFAULT 0,
  total_processing_time_ms BIGINT NOT NULL DEFAULT 0,
  memory_usage_mb INTEGER DEFAULT 0,
  cpu_usage_percent NUMERIC(5,2) DEFAULT 0,
  error_rate NUMERIC(5,2) NOT NULL DEFAULT 0,
  throughput_per_hour NUMERIC(10,2) NOT NULL DEFAULT 0,
  user_satisfaction_score NUMERIC(3,2) DEFAULT 0,
  cost_per_task NUMERIC(10,4) DEFAULT 0,
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(agent_id, metric_date)
);

-- Batch operations for bulk task management
CREATE TABLE public.agent_batch_operations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  operation_name TEXT NOT NULL,
  operation_type TEXT NOT NULL,
  target_agents TEXT[] NOT NULL DEFAULT '{}',
  target_groups UUID[] NOT NULL DEFAULT '{}',
  operation_config JSONB NOT NULL DEFAULT '{}',
  total_targets INTEGER NOT NULL DEFAULT 0,
  completed_targets INTEGER NOT NULL DEFAULT 0,
  failed_targets INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending',
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  error_details JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- Agent alerts and notifications
CREATE TABLE public.agent_alerts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  alert_type TEXT NOT NULL,
  severity TEXT NOT NULL DEFAULT 'medium',
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  agent_id TEXT,
  task_id UUID,
  alert_data JSONB NOT NULL DEFAULT '{}',
  is_resolved BOOLEAN NOT NULL DEFAULT FALSE,
  resolved_at TIMESTAMP WITH TIME ZONE,
  resolved_by UUID REFERENCES auth.users(id),
  acknowledgements JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Agent audit logs
CREATE TABLE public.agent_audit_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  action_type TEXT NOT NULL,
  action_description TEXT NOT NULL,
  agent_id TEXT,
  resource_type TEXT,
  resource_id TEXT,
  old_values JSONB,
  new_values JSONB,
  performed_by UUID REFERENCES auth.users(id),
  ip_address INET,
  user_agent TEXT,
  session_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX idx_agent_management_agent_id ON public.agent_management(agent_id);
CREATE INDEX idx_agent_management_status ON public.agent_management(status);
CREATE INDEX idx_agent_management_category ON public.agent_management(category);
CREATE INDEX idx_agent_group_memberships_agent_id ON public.agent_group_memberships(agent_id);
CREATE INDEX idx_agent_group_memberships_group_id ON public.agent_group_memberships(group_id);
CREATE INDEX idx_agent_task_templates_category ON public.agent_task_templates(category);
CREATE INDEX idx_agent_scheduled_tasks_agent_id ON public.agent_scheduled_tasks(agent_id);
CREATE INDEX idx_agent_scheduled_tasks_next_execution ON public.agent_scheduled_tasks(next_execution);
CREATE INDEX idx_agent_performance_metrics_agent_id ON public.agent_performance_metrics(agent_id);
CREATE INDEX idx_agent_performance_metrics_date ON public.agent_performance_metrics(metric_date);
CREATE INDEX idx_agent_batch_operations_status ON public.agent_batch_operations(status);
CREATE INDEX idx_agent_alerts_agent_id ON public.agent_alerts(agent_id);
CREATE INDEX idx_agent_alerts_severity ON public.agent_alerts(severity);
CREATE INDEX idx_agent_alerts_resolved ON public.agent_alerts(is_resolved);
CREATE INDEX idx_agent_audit_logs_agent_id ON public.agent_audit_logs(agent_id);
CREATE INDEX idx_agent_audit_logs_created_at ON public.agent_audit_logs(created_at);

-- Create triggers for updated_at
CREATE OR REPLACE FUNCTION public.update_agent_management_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_agent_management_updated_at
  BEFORE UPDATE ON public.agent_management
  FOR EACH ROW
  EXECUTE FUNCTION public.update_agent_management_updated_at();

CREATE TRIGGER update_agent_groups_updated_at
  BEFORE UPDATE ON public.agent_groups
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_agent_task_templates_updated_at
  BEFORE UPDATE ON public.agent_task_templates
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_agent_scheduled_tasks_updated_at
  BEFORE UPDATE ON public.agent_scheduled_tasks
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_agent_performance_metrics_updated_at
  BEFORE UPDATE ON public.agent_performance_metrics
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Enable RLS on all tables
ALTER TABLE public.agent_management ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_group_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_task_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_scheduled_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_performance_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_batch_operations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_audit_logs ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for admin access
CREATE POLICY "Admins can manage all agent management" ON public.agent_management
  FOR ALL USING (is_secure_admin(auth.uid()));

CREATE POLICY "Admins can manage all agent groups" ON public.agent_groups
  FOR ALL USING (is_secure_admin(auth.uid()));

CREATE POLICY "Admins can manage all agent group memberships" ON public.agent_group_memberships
  FOR ALL USING (is_secure_admin(auth.uid()));

CREATE POLICY "Admins can manage all agent task templates" ON public.agent_task_templates
  FOR ALL USING (is_secure_admin(auth.uid()));

CREATE POLICY "Admins can manage all agent scheduled tasks" ON public.agent_scheduled_tasks
  FOR ALL USING (is_secure_admin(auth.uid()));

CREATE POLICY "Admins can view all agent performance metrics" ON public.agent_performance_metrics
  FOR SELECT USING (is_secure_admin(auth.uid()));

CREATE POLICY "Service role can manage agent performance metrics" ON public.agent_performance_metrics
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Admins can manage all agent batch operations" ON public.agent_batch_operations
  FOR ALL USING (is_secure_admin(auth.uid()));

CREATE POLICY "Admins can view all agent alerts" ON public.agent_alerts
  FOR SELECT USING (is_secure_admin(auth.uid()));

CREATE POLICY "Service role can manage agent alerts" ON public.agent_alerts
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Admins can view all agent audit logs" ON public.agent_audit_logs
  FOR SELECT USING (is_secure_admin(auth.uid()));

CREATE POLICY "Service role can insert agent audit logs" ON public.agent_audit_logs
  FOR INSERT WITH CHECK (auth.role() = 'service_role');

-- Insert default agent groups
INSERT INTO public.agent_groups (group_name, description, group_type) VALUES
  ('Travel Planning', 'Agents focused on travel planning and recommendations', 'functional'),
  ('Booking Management', 'Agents handling booking operations and management', 'functional'),
  ('Customer Service', 'Agents providing customer support and assistance', 'functional'),
  ('Data Analysis', 'Agents performing analytics and data processing', 'functional'),
  ('Security & Compliance', 'Agents handling security and compliance tasks', 'functional'),
  ('Finance & Revenue', 'Agents managing financial operations', 'functional'),
  ('System Operations', 'Agents maintaining system health and operations', 'operational'),
  ('Emergency Response', 'Agents for critical and emergency situations', 'emergency');

-- Insert default task templates
INSERT INTO public.agent_task_templates (template_name, description, category, agent_types, task_definition) VALUES
  ('System Health Check', 'Comprehensive system health assessment', 'monitoring', ARRAY['system-health', 'monitoring'], '{"intent": "system_health_check", "params": {"check_all_services": true}}'),
  ('Customer Support Query', 'Handle customer support inquiries', 'customer_service', ARRAY['customer-service', 'support'], '{"intent": "handle_support_query", "params": {"priority": "normal"}}'),
  ('Booking Analysis', 'Analyze booking patterns and metrics', 'analytics', ARRAY['booking-analytics', 'data-analysis'], '{"intent": "analyze_bookings", "params": {"time_range": "24h"}}'),
  ('Price Optimization', 'Optimize pricing strategies', 'revenue', ARRAY['price-optimizer', 'revenue-management'], '{"intent": "optimize_pricing", "params": {"market_analysis": true}}'),
  ('Security Audit', 'Perform security assessment', 'security', ARRAY['security-audit', 'compliance'], '{"intent": "security_audit", "params": {"scope": "full"}}')