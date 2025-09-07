-- First, let's add the current user as an admin to enable access to agent management
-- This will resolve the "Admin access required" errors

-- Add current user to admin_users table (replace with actual user email)
INSERT INTO public.admin_users (user_id, email, is_active)
VALUES (
  (SELECT id FROM auth.users WHERE email = 'paavanbhanvadiya@live.com' LIMIT 1),
  'paavanbhanvadiya@live.com',
  true
) ON CONFLICT (user_id) DO UPDATE SET
  is_active = true,
  updated_at = now();

-- Also ensure they have the admin role in user_roles
INSERT INTO public.user_roles (user_id, role, granted_by, is_active)
VALUES (
  (SELECT id FROM auth.users WHERE email = 'paavanbhanvadiya@live.com' LIMIT 1),
  'admin',
  (SELECT id FROM auth.users WHERE email = 'paavanbhanvadiya@live.com' LIMIT 1),
  true
) ON CONFLICT (user_id, role) DO UPDATE SET
  is_active = true,
  granted_by = (SELECT id FROM auth.users WHERE email = 'paavanbhanvadiya@live.com' LIMIT 1),
  granted_at = now(),
  updated_at = now();

-- Create some sample agent groups for demonstration
INSERT INTO public.agent_groups (group_name, description, group_type, created_by, configuration) VALUES
('Customer Service Team', 'Agents focused on customer support and inquiries', 'functional', 
 (SELECT id FROM auth.users WHERE email = 'paavanbhanvadiya@live.com' LIMIT 1), 
 '{"priority": "high", "response_time_target": "2min"}'),
('Analytics Team', 'Agents responsible for data analysis and reporting', 'functional',
 (SELECT id FROM auth.users WHERE email = 'paavanbhanvadiya@live.com' LIMIT 1),
 '{"data_sources": ["bookings", "users", "revenue"], "schedule": "hourly"}'),
('Security Team', 'Agents monitoring system security and compliance', 'security',
 (SELECT id FROM auth.users WHERE email = 'paavanbhanvadiya@live.com' LIMIT 1),
 '{"alert_level": "critical", "auto_response": true}')
ON CONFLICT (group_name) DO NOTHING;

-- Create sample batch operations
INSERT INTO public.agent_batch_operations (
  operation_name, operation_type, target_agents, operation_config, 
  total_targets, completed_targets, failed_targets, status, created_by
) VALUES
('Health Check All Agents', 'health_check', ARRAY['system-health', 'customer-service', 'booking-analytics'], 
 '{"check_type": "full", "timeout": 30}', 3, 3, 0, 'completed',
 (SELECT id FROM auth.users WHERE email = 'paavanbhanvadiya@live.com' LIMIT 1)),
('Update Agent Configurations', 'config_update', ARRAY['price-optimizer', 'security-audit'], 
 '{"config_version": "2.1", "restart_required": false}', 2, 1, 1, 'running',
 (SELECT id FROM auth.users WHERE email = 'paavanbhanvadiya@live.com' LIMIT 1))
ON CONFLICT DO NOTHING;