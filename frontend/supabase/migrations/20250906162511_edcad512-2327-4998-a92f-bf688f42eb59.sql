-- Create SOP Framework Tables
CREATE TABLE public.sop_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  color TEXT DEFAULT 'blue',
  icon TEXT DEFAULT 'folder',
  parent_id UUID REFERENCES public.sop_categories(id),
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.sop_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  category_id UUID REFERENCES public.sop_categories(id),
  template_structure JSONB NOT NULL DEFAULT '{}',
  required_fields JSONB NOT NULL DEFAULT '[]',
  optional_fields JSONB NOT NULL DEFAULT '[]',
  automation_rules JSONB NOT NULL DEFAULT '{}',
  version TEXT NOT NULL DEFAULT '1.0.0',
  is_system_template BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.standard_operating_procedures (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  category_id UUID REFERENCES public.sop_categories(id),
  template_id UUID REFERENCES public.sop_templates(id),
  procedure_steps JSONB NOT NULL DEFAULT '[]',
  prerequisites JSONB NOT NULL DEFAULT '[]',
  expected_outcomes JSONB NOT NULL DEFAULT '[]',
  quality_checkpoints JSONB NOT NULL DEFAULT '[]',
  escalation_rules JSONB NOT NULL DEFAULT '{}',
  compliance_requirements JSONB NOT NULL DEFAULT '[]',
  automation_config JSONB NOT NULL DEFAULT '{}',
  estimated_duration_minutes INTEGER,
  complexity_level TEXT NOT NULL DEFAULT 'medium' CHECK (complexity_level IN ('simple', 'medium', 'complex', 'expert')),
  approval_required BOOLEAN NOT NULL DEFAULT false,
  version TEXT NOT NULL DEFAULT '1.0.0',
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'review', 'approved', 'active', 'deprecated')),
  effective_date TIMESTAMP WITH TIME ZONE,
  expiry_date TIMESTAMP WITH TIME ZONE,
  tags TEXT[] DEFAULT '{}',
  created_by UUID REFERENCES auth.users(id),
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.sop_executions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sop_id UUID NOT NULL REFERENCES public.standard_operating_procedures(id),
  executor_type TEXT NOT NULL DEFAULT 'agent' CHECK (executor_type IN ('agent', 'human', 'system')),
  executor_id TEXT NOT NULL,
  execution_context JSONB NOT NULL DEFAULT '{}',
  current_step INTEGER NOT NULL DEFAULT 0,
  total_steps INTEGER NOT NULL DEFAULT 0,
  execution_status TEXT NOT NULL DEFAULT 'pending' CHECK (execution_status IN ('pending', 'in_progress', 'completed', 'failed', 'cancelled', 'escalated')),
  step_results JSONB NOT NULL DEFAULT '[]',
  quality_scores JSONB NOT NULL DEFAULT '{}',
  compliance_checks JSONB NOT NULL DEFAULT '{}',
  deviation_notes TEXT,
  escalation_reason TEXT,
  escalated_to UUID REFERENCES auth.users(id),
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  estimated_completion TIMESTAMP WITH TIME ZONE,
  actual_duration_minutes INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.sop_compliance_audits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sop_id UUID NOT NULL REFERENCES public.standard_operating_procedures(id),
  execution_id UUID REFERENCES public.sop_executions(id),
  audit_type TEXT NOT NULL DEFAULT 'routine' CHECK (audit_type IN ('routine', 'incident', 'compliance', 'quality')),
  auditor_id UUID REFERENCES auth.users(id),
  audit_criteria JSONB NOT NULL DEFAULT '{}',
  findings JSONB NOT NULL DEFAULT '[]',
  compliance_score NUMERIC(3,2) CHECK (compliance_score >= 0 AND compliance_score <= 1),
  recommendations JSONB NOT NULL DEFAULT '[]',
  corrective_actions JSONB NOT NULL DEFAULT '[]',
  audit_status TEXT NOT NULL DEFAULT 'pending' CHECK (audit_status IN ('pending', 'in_progress', 'completed', 'requires_action')),
  due_date TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.ai_workplace_tasks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  task_type TEXT NOT NULL DEFAULT 'general' CHECK (task_type IN ('general', 'sop_execution', 'project_task', 'maintenance', 'review', 'training')),
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  status TEXT NOT NULL DEFAULT 'todo' CHECK (status IN ('todo', 'in_progress', 'review', 'completed', 'cancelled', 'blocked')),
  assigned_to_type TEXT NOT NULL DEFAULT 'agent' CHECK (assigned_to_type IN ('agent', 'human', 'team')),
  assigned_to_id TEXT,
  sop_id UUID REFERENCES public.standard_operating_procedures(id),
  project_id UUID,
  parent_task_id UUID REFERENCES public.ai_workplace_tasks(id),
  dependencies JSONB NOT NULL DEFAULT '[]',
  task_data JSONB NOT NULL DEFAULT '{}',
  estimated_duration_minutes INTEGER,
  actual_duration_minutes INTEGER,
  progress_percentage INTEGER DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
  quality_score NUMERIC(3,2) CHECK (quality_score >= 0 AND quality_score <= 1),
  tags TEXT[] DEFAULT '{}',
  due_date TIMESTAMP WITH TIME ZONE,
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.ai_workplace_projects (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  project_type TEXT NOT NULL DEFAULT 'standard' CHECK (project_type IN ('standard', 'template', 'recurring', 'maintenance')),
  status TEXT NOT NULL DEFAULT 'planning' CHECK (status IN ('planning', 'active', 'on_hold', 'completed', 'cancelled')),
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  project_manager_id UUID REFERENCES auth.users(id),
  team_members JSONB NOT NULL DEFAULT '[]',
  ai_agents JSONB NOT NULL DEFAULT '[]',
  project_goals JSONB NOT NULL DEFAULT '[]',
  milestones JSONB NOT NULL DEFAULT '[]',
  resources JSONB NOT NULL DEFAULT '{}',
  budget_allocated NUMERIC(10,2),
  budget_used NUMERIC(10,2) DEFAULT 0,
  start_date DATE,
  end_date DATE,
  estimated_completion DATE,
  actual_completion DATE,
  progress_percentage INTEGER DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
  risk_assessment JSONB NOT NULL DEFAULT '{}',
  tags TEXT[] DEFAULT '{}',
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.sop_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sop_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.standard_operating_procedures ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sop_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sop_compliance_audits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_workplace_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_workplace_projects ENABLE ROW LEVEL SECURITY;

-- RLS Policies for SOP Categories
CREATE POLICY "Admins can manage all SOP categories" ON public.sop_categories
  FOR ALL USING (is_secure_admin(auth.uid()));

CREATE POLICY "Users can view active SOP categories" ON public.sop_categories
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- RLS Policies for SOP Templates
CREATE POLICY "Admins can manage all SOP templates" ON public.sop_templates
  FOR ALL USING (is_secure_admin(auth.uid()));

CREATE POLICY "Users can view active SOP templates" ON public.sop_templates
  FOR SELECT USING (auth.uid() IS NOT NULL AND is_active = true);

-- RLS Policies for Standard Operating Procedures
CREATE POLICY "Admins can manage all SOPs" ON public.standard_operating_procedures
  FOR ALL USING (is_secure_admin(auth.uid()));

CREATE POLICY "Users can view approved SOPs" ON public.standard_operating_procedures
  FOR SELECT USING (auth.uid() IS NOT NULL AND status IN ('approved', 'active'));

CREATE POLICY "Users can create SOPs" ON public.standard_operating_procedures
  FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update their own draft SOPs" ON public.standard_operating_procedures
  FOR UPDATE USING (auth.uid() = created_by AND status = 'draft');

-- RLS Policies for SOP Executions
CREATE POLICY "Admins can view all SOP executions" ON public.sop_executions
  FOR SELECT USING (is_secure_admin(auth.uid()));

CREATE POLICY "Service role can manage SOP executions" ON public.sop_executions
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Users can view executions they're involved in" ON public.sop_executions
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- RLS Policies for SOP Compliance Audits
CREATE POLICY "Admins can manage all compliance audits" ON public.sop_compliance_audits
  FOR ALL USING (is_secure_admin(auth.uid()));

CREATE POLICY "Auditors can manage their audits" ON public.sop_compliance_audits
  FOR ALL USING (auth.uid() = auditor_id);

-- RLS Policies for AI Workplace Tasks
CREATE POLICY "Admins can manage all tasks" ON public.ai_workplace_tasks
  FOR ALL USING (is_secure_admin(auth.uid()));

CREATE POLICY "Users can create tasks" ON public.ai_workplace_tasks
  FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can view tasks they created or are assigned to" ON public.ai_workplace_tasks
  FOR SELECT USING (
    auth.uid() = created_by OR 
    (assigned_to_type = 'human' AND assigned_to_id = auth.uid()::text)
  );

CREATE POLICY "Users can update tasks they created" ON public.ai_workplace_tasks
  FOR UPDATE USING (auth.uid() = created_by);

-- RLS Policies for AI Workplace Projects
CREATE POLICY "Admins can manage all projects" ON public.ai_workplace_projects
  FOR ALL USING (is_secure_admin(auth.uid()));

CREATE POLICY "Users can create projects" ON public.ai_workplace_projects
  FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can view projects they created or manage" ON public.ai_workplace_projects
  FOR SELECT USING (
    auth.uid() = created_by OR 
    auth.uid() = project_manager_id OR
    team_members ? auth.uid()::text
  );

CREATE POLICY "Project managers can update their projects" ON public.ai_workplace_projects
  FOR UPDATE USING (auth.uid() = project_manager_id OR auth.uid() = created_by);

-- Create update triggers
CREATE TRIGGER update_sop_categories_updated_at
  BEFORE UPDATE ON public.sop_categories
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_sop_templates_updated_at
  BEFORE UPDATE ON public.sop_templates
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_standard_operating_procedures_updated_at
  BEFORE UPDATE ON public.standard_operating_procedures
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_sop_executions_updated_at
  BEFORE UPDATE ON public.sop_executions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_sop_compliance_audits_updated_at
  BEFORE UPDATE ON public.sop_compliance_audits
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_ai_workplace_tasks_updated_at
  BEFORE UPDATE ON public.ai_workplace_tasks
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_ai_workplace_projects_updated_at
  BEFORE UPDATE ON public.ai_workplace_projects
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Insert sample SOP categories
INSERT INTO public.sop_categories (name, description, color, icon) VALUES
('Customer Service', 'Procedures for handling customer interactions and support', 'blue', 'headphones'),
('Data Processing', 'SOPs for data collection, analysis, and reporting', 'green', 'database'),
('Quality Assurance', 'Quality control and testing procedures', 'purple', 'shield-check'),
('Security & Compliance', 'Security protocols and compliance procedures', 'red', 'lock'),
('Content Management', 'Content creation, editing, and publishing procedures', 'yellow', 'file-text'),
('Agent Operations', 'AI agent management and operational procedures', 'indigo', 'bot'),
('Human Resources', 'HR processes and employee management', 'pink', 'users');

-- Insert sample SOP templates
INSERT INTO public.sop_templates (name, description, category_id, template_structure, required_fields, optional_fields) VALUES
('Customer Inquiry Response', 'Template for responding to customer inquiries', 
 (SELECT id FROM public.sop_categories WHERE name = 'Customer Service'), 
 '{"sections": ["problem_identification", "solution_research", "response_composition", "quality_check", "follow_up"]}',
 '["customer_inquiry", "response_tone", "escalation_criteria"]',
 '["follow_up_schedule", "satisfaction_survey"]'),
 
('Data Analysis Report', 'Template for creating data analysis reports',
 (SELECT id FROM public.sop_categories WHERE name = 'Data Processing'),
 '{"sections": ["data_collection", "analysis_methodology", "findings", "recommendations", "visualization"]}',
 '["data_source", "analysis_type", "reporting_format"]',
 '["stakeholder_list", "presentation_slides"]'),

('Agent Performance Review', 'Template for reviewing AI agent performance',
 (SELECT id FROM public.sop_categories WHERE name = 'Agent Operations'),
 '{"sections": ["performance_metrics", "task_analysis", "improvement_areas", "recommendations", "action_plan"]}',
 '["agent_id", "review_period", "performance_criteria"]',
 '["training_recommendations", "configuration_changes"]');

-- Insert sample SOPs
INSERT INTO public.standard_operating_procedures (
  title, description, category_id, template_id, procedure_steps, 
  prerequisites, expected_outcomes, quality_checkpoints, 
  escalation_rules, estimated_duration_minutes, complexity_level, status
) VALUES
('Handle Customer Complaint', 'Comprehensive procedure for handling customer complaints',
 (SELECT id FROM public.sop_categories WHERE name = 'Customer Service'),
 (SELECT id FROM public.sop_templates WHERE name = 'Customer Inquiry Response'),
 '[
   {"step": 1, "title": "Acknowledge Receipt", "description": "Send immediate acknowledgment to customer", "estimated_minutes": 2},
   {"step": 2, "title": "Analyze Complaint", "description": "Review complaint details and categorize issue", "estimated_minutes": 5},
   {"step": 3, "title": "Research Solution", "description": "Investigate issue and identify resolution options", "estimated_minutes": 15},
   {"step": 4, "title": "Propose Resolution", "description": "Present solution options to customer", "estimated_minutes": 10},
   {"step": 5, "title": "Implement Solution", "description": "Execute agreed-upon resolution", "estimated_minutes": 20},
   {"step": 6, "title": "Follow Up", "description": "Confirm customer satisfaction", "estimated_minutes": 5}
 ]',
 '["customer_service_training", "access_to_customer_database", "escalation_contacts"]',
 '["customer_satisfaction", "issue_resolution", "documentation_complete"]',
 '["response_time_check", "solution_accuracy_check", "customer_satisfaction_check"]',
 '{"conditions": ["unresolved_after_1_hour", "customer_demands_manager", "legal_implications"], "escalate_to": "senior_agent"}',
 57, 'medium', 'approved'),

('Generate Weekly Analytics Report', 'Create comprehensive weekly performance analytics',
 (SELECT id FROM public.sop_categories WHERE name = 'Data Processing'),
 (SELECT id FROM public.sop_templates WHERE name = 'Data Analysis Report'),
 '[
   {"step": 1, "title": "Collect Data", "description": "Gather data from all relevant sources", "estimated_minutes": 30},
   {"step": 2, "title": "Clean and Validate", "description": "Ensure data quality and consistency", "estimated_minutes": 20},
   {"step": 3, "title": "Perform Analysis", "description": "Run statistical analysis and identify trends", "estimated_minutes": 45},
   {"step": 4, "title": "Create Visualizations", "description": "Generate charts and graphs", "estimated_minutes": 25},
   {"step": 5, "title": "Write Report", "description": "Compose findings and recommendations", "estimated_minutes": 40},
   {"step": 6, "title": "Review and Publish", "description": "Quality check and distribute report", "estimated_minutes": 15}
 ]',
 '["data_access_permissions", "analytics_tools", "report_template"]',
 '["accurate_data_analysis", "actionable_insights", "stakeholder_distribution"]',
 '["data_validation_check", "analysis_accuracy_check", "report_clarity_check"]',
 '{"conditions": ["data_anomalies_detected", "analysis_results_unexpected"], "escalate_to": "data_team_lead"}',
 175, 'complex', 'approved');