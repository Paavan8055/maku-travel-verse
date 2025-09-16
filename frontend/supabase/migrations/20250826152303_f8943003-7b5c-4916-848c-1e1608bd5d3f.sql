-- Complete the setup with correct table structures

-- Insert sample notifications with proper UUID casting
INSERT INTO public.notifications (user_id, type, title, message, priority)
SELECT '00000000-0000-0000-0000-000000000000'::uuid, 'security_alert', 'Security Update', 'New security patches have been applied', 'high'
WHERE NOT EXISTS (SELECT 1 FROM public.notifications WHERE type = 'security_alert' LIMIT 1);

-- Insert sample system logs 
INSERT INTO public.system_logs (correlation_id, service_name, log_level, message, metadata)
SELECT 'sys-001', 'admin-dashboard', 'info', 'Admin dashboard accessed', '{"user_agent": "Mozilla/5.0", "ip": "127.0.0.1"}'
WHERE NOT EXISTS (SELECT 1 FROM public.system_logs WHERE correlation_id = 'sys-001');

-- Update provider health data with current status
UPDATE public.provider_health SET 
  status = 'healthy',
  last_checked = NOW(),
  response_time = 1200,
  success_rate = 98.5,
  error_count = 2
WHERE provider_id = 'amadeus-flight';

-- Update provider quotas with realistic data
UPDATE public.provider_quotas SET
  quota_used = 245,
  quota_limit = 1000,
  percentage_used = 24.5,
  status = 'healthy',
  last_checked = NOW()
WHERE provider_id = 'amadeus-flight';

-- Refresh admin metrics cache with real data
DELETE FROM public.admin_metrics_cache WHERE metric_type = 'dashboard_summary';

INSERT INTO public.admin_metrics_cache (metric_type, metric_value, expires_at)
VALUES 
  ('dashboard_summary', 
   '{
     "totalBookings": 0,
     "totalRevenue": 0,
     "totalUsers": 1,
     "activeProperties": 0,
     "recentBookings": [],
     "notificationCount": 1,
     "documentCount": 0,
     "lastUpdated": "' || NOW()::text || '"
   }'::jsonb,
   NOW() + INTERVAL '1 hour');