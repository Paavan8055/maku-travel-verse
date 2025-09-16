-- Create tables for AI Workplace Foundation Phase 1

-- AI Employee Skills table
CREATE TABLE public.ai_employee_skills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  skill_name TEXT NOT NULL,
  skill_description TEXT,
  skill_category TEXT NOT NULL DEFAULT 'general',
  skill_definition JSONB NOT NULL DEFAULT '{}',
  natural_language_prompt TEXT NOT NULL,
  example_inputs JSONB DEFAULT '[]',
  example_outputs JSONB DEFAULT '[]',
  skill_parameters JSONB DEFAULT '{}',
  prerequisites JSONB DEFAULT '[]',
  skill_difficulty TEXT NOT NULL DEFAULT 'beginner',
  is_template BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- AI Employee Templates table  
CREATE TABLE public.ai_employee_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_name TEXT NOT NULL,
  template_description TEXT,
  job_role TEXT NOT NULL,
  department TEXT,
  required_skills JSONB DEFAULT '[]',
  optional_skills JSONB DEFAULT '[]',
  default_configuration JSONB DEFAULT '{}',
  personality_traits JSONB DEFAULT '{}',
  communication_style TEXT DEFAULT 'professional',
  is_system_template BOOLEAN DEFAULT FALSE,
  template_category TEXT DEFAULT 'general',
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- AI Employee Instances table
CREATE TABLE public.ai_employees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_name TEXT NOT NULL,
  employee_description TEXT,
  job_title TEXT NOT NULL,
  department TEXT,
  template_id UUID REFERENCES ai_employee_templates(id),
  assigned_skills JSONB DEFAULT '[]',
  custom_configuration JSONB DEFAULT '{}',
  personality_profile JSONB DEFAULT '{}',
  status TEXT DEFAULT 'training',
  onboarding_completed BOOLEAN DEFAULT FALSE,
  performance_score NUMERIC DEFAULT 0,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Skill Compositions table (for complex skills made of multiple sub-skills)
CREATE TABLE public.skill_compositions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_skill_id UUID REFERENCES ai_employee_skills(id) ON DELETE CASCADE,
  child_skill_id UUID REFERENCES ai_employee_skills(id) ON DELETE CASCADE,
  execution_order INTEGER DEFAULT 0,
  condition_logic JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- AI Employee Training Progress table
CREATE TABLE public.ai_employee_training (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID REFERENCES ai_employees(id) ON DELETE CASCADE,
  skill_id UUID REFERENCES ai_employee_skills(id) ON DELETE CASCADE,
  training_status TEXT DEFAULT 'pending',
  proficiency_level INTEGER DEFAULT 0,
  training_data JSONB DEFAULT '{}',
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on all tables
ALTER TABLE public.ai_employee_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_employee_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.skill_compositions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_employee_training ENABLE ROW LEVEL SECURITY;

-- RLS Policies for ai_employee_skills
CREATE POLICY "Users can view all skills" ON public.ai_employee_skills
  FOR SELECT USING (TRUE);

CREATE POLICY "Authenticated users can create skills" ON public.ai_employee_skills
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update their own skills" ON public.ai_employee_skills
  FOR UPDATE USING (created_by = auth.uid());

CREATE POLICY "Admins can manage all skills" ON public.ai_employee_skills
  FOR ALL USING (is_secure_admin(auth.uid()));

-- RLS Policies for ai_employee_templates
CREATE POLICY "Users can view all templates" ON public.ai_employee_templates
  FOR SELECT USING (TRUE);

CREATE POLICY "Authenticated users can create templates" ON public.ai_employee_templates
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update their own templates" ON public.ai_employee_templates
  FOR UPDATE USING (created_by = auth.uid());

CREATE POLICY "Admins can manage all templates" ON public.ai_employee_templates
  FOR ALL USING (is_secure_admin(auth.uid()));

-- RLS Policies for ai_employees
CREATE POLICY "Users can view their own employees" ON public.ai_employees
  FOR SELECT USING (created_by = auth.uid());

CREATE POLICY "Users can create their own employees" ON public.ai_employees
  FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update their own employees" ON public.ai_employees
  FOR UPDATE USING (created_by = auth.uid());

CREATE POLICY "Users can delete their own employees" ON public.ai_employees
  FOR DELETE USING (created_by = auth.uid());

CREATE POLICY "Admins can manage all employees" ON public.ai_employees
  FOR ALL USING (is_secure_admin(auth.uid()));

-- RLS Policies for skill_compositions
CREATE POLICY "Users can view skill compositions" ON public.skill_compositions
  FOR SELECT USING (TRUE);

CREATE POLICY "Authenticated users can create skill compositions" ON public.skill_compositions
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- RLS Policies for ai_employee_training
CREATE POLICY "Users can view training for their employees" ON public.ai_employee_training
  FOR SELECT USING (employee_id IN (SELECT id FROM ai_employees WHERE created_by = auth.uid()));

CREATE POLICY "Users can manage training for their employees" ON public.ai_employee_training
  FOR ALL USING (employee_id IN (SELECT id FROM ai_employees WHERE created_by = auth.uid()));

CREATE POLICY "Admins can manage all training" ON public.ai_employee_training
  FOR ALL USING (is_secure_admin(auth.uid()));

-- Create update triggers
CREATE OR REPLACE FUNCTION update_ai_workplace_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_ai_employee_skills_updated_at
  BEFORE UPDATE ON public.ai_employee_skills
  FOR EACH ROW EXECUTE FUNCTION update_ai_workplace_updated_at();

CREATE TRIGGER update_ai_employee_templates_updated_at
  BEFORE UPDATE ON public.ai_employee_templates
  FOR EACH ROW EXECUTE FUNCTION update_ai_workplace_updated_at();

CREATE TRIGGER update_ai_employees_updated_at
  BEFORE UPDATE ON public.ai_employees
  FOR EACH ROW EXECUTE FUNCTION update_ai_workplace_updated_at();

-- Insert sample skill templates
INSERT INTO public.ai_employee_skills (skill_name, skill_description, skill_category, natural_language_prompt, skill_definition, is_template) VALUES
('Customer Support Chat', 'Handle customer inquiries via chat with empathy and efficiency', 'customer_service', 
'You are a helpful customer support agent. Respond to customer inquiries with empathy, provide accurate information, and escalate complex issues when needed.',
'{"input_format": "customer_message", "output_format": "support_response", "tools": ["knowledge_base", "ticket_system"], "escalation_triggers": ["refund_request", "technical_issue", "complaint"]}', 
TRUE),

('Email Marketing Copy', 'Create engaging email marketing content that drives conversions', 'marketing',
'Write compelling email marketing copy that engages subscribers and drives action. Include clear subject lines, personalized content, and strong calls-to-action.',
'{"input_format": "campaign_brief", "output_format": "email_content", "elements": ["subject_line", "preview_text", "body", "cta"], "tone_options": ["professional", "friendly", "urgent"]}',
TRUE),

('Data Analysis & Reporting', 'Analyze data sets and create insightful reports with recommendations', 'analytics',
'Analyze the provided data, identify trends and patterns, and create a comprehensive report with actionable insights and recommendations.',
'{"input_format": "dataset", "output_format": "analysis_report", "tools": ["statistical_analysis", "visualization"], "sections": ["summary", "findings", "recommendations"]}',
TRUE),

('Social Media Content', 'Create engaging social media posts optimized for different platforms', 'marketing',
'Create engaging social media content tailored to the specific platform. Include relevant hashtags, compelling visuals descriptions, and platform-optimized formatting.',
'{"input_format": "content_brief", "output_format": "social_post", "platforms": ["twitter", "linkedin", "instagram", "facebook"], "elements": ["text", "hashtags", "visual_description"]}',
TRUE),

('Code Review & Documentation', 'Review code for quality, security, and best practices', 'development',
'Review the provided code for bugs, security issues, performance problems, and adherence to best practices. Provide detailed feedback and suggestions for improvement.',
'{"input_format": "code_snippet", "output_format": "review_report", "checks": ["syntax", "security", "performance", "best_practices"], "suggestion_format": "actionable_feedback"}',
TRUE);

-- Insert sample employee templates
INSERT INTO public.ai_employee_templates (template_name, template_description, job_role, department, required_skills, default_configuration) VALUES
('Customer Success Specialist', 'AI employee specialized in customer support and relationship management', 'Customer Success Specialist', 'Customer Service',
'["Customer Support Chat"]',
'{"response_time": "immediate", "escalation_threshold": "complex_technical", "personality": "empathetic_professional", "availability": "24/7"}'),

('Marketing Content Creator', 'AI employee focused on creating marketing content across channels', 'Content Marketing Specialist', 'Marketing',
'["Email Marketing Copy", "Social Media Content"]',
'{"content_style": "brand_aligned", "approval_required": true, "posting_schedule": "automated", "target_audience": "general"}'),

('Business Analyst', 'AI employee specialized in data analysis and business intelligence', 'Business Intelligence Analyst', 'Analytics',
'["Data Analysis & Reporting"]',
'{"analysis_depth": "comprehensive", "visualization_preference": "charts_and_graphs", "report_frequency": "weekly", "stakeholder_level": "executive"}'),

('Development Assistant', 'AI employee that assists with code review and development tasks', 'Development Assistant', 'Engineering',
'["Code Review & Documentation"]',
'{"review_depth": "thorough", "coding_standards": "industry_best_practices", "security_focus": "high", "documentation_style": "detailed"}');