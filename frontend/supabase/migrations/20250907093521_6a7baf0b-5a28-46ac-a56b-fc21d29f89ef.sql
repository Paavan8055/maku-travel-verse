-- Fix admin access and add sample data without constraint conflicts
-- First, ensure the admin_users table has the right constraints
ALTER TABLE public.admin_users ADD CONSTRAINT admin_users_user_id_key UNIQUE (user_id);

-- Add the current user as an admin 
INSERT INTO public.admin_users (user_id, email, is_active)
SELECT id, email, true
FROM auth.users 
WHERE email = 'paavanbhanvadiya@live.com'
ON CONFLICT (user_id) DO UPDATE SET
    is_active = true,
    updated_at = now();

-- Create sample agent groups for demonstration
INSERT INTO public.agent_groups (group_name, description, group_type, configuration) VALUES
('Customer Service Team', 'Agents focused on customer support and inquiries', 'functional', 
 '{"priority": "high", "response_time_target": "2min"}'::jsonb),
('Analytics Team', 'Agents responsible for data analysis and reporting', 'functional',
 '{"data_sources": ["bookings", "users", "revenue"], "schedule": "hourly"}'::jsonb),
('Security Team', 'Agents monitoring system security and compliance', 'security',
 '{"alert_level": "critical", "auto_response": true}'::jsonb)
ON CONFLICT (group_name) DO NOTHING;

-- Create sample batch operations
INSERT INTO public.agent_batch_operations (
    operation_name, operation_type, target_agents, operation_config, 
    total_targets, completed_targets, failed_targets, status
) VALUES
('Health Check All Agents', 'health_check', ARRAY['system-health', 'customer-service', 'booking-analytics'], 
 '{"check_type": "full", "timeout": 30}'::jsonb, 3, 3, 0, 'completed'),
('Update Agent Configurations', 'config_update', ARRAY['price-optimizer', 'security-audit'], 
 '{"config_version": "2.1", "restart_required": false}'::jsonb, 2, 1, 1, 'running');

-- Create sample agent alerts
INSERT INTO public.agent_alerts (
    alert_type, severity, title, message, agent_id, is_resolved, alert_data
) VALUES
('performance_degradation', 'high', 'High Response Time Detected', 
 'Agent system-health is experiencing response times above 5 seconds', 'system-health', false,
 '{"avg_response_time": "7.2s", "threshold": "5s"}'::jsonb),
('configuration_error', 'critical', 'Agent Configuration Invalid', 
 'Price optimizer agent has invalid pricing rules configuration', 'price-optimizer', false,
 '{"config_field": "pricing_rules", "error": "missing_required_field"}'::jsonb),
('task_queue_full', 'medium', 'Task Queue at Capacity', 
 'Customer service agent task queue is at 95% capacity', 'customer-service', true,
 '{"queue_size": 95, "max_capacity": 100}'::jsonb);