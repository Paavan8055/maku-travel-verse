-- Final fix with proper UUID casting and finish setup

-- Insert sample data with proper UUID casting
INSERT INTO public.notifications (user_id, type, title, message, priority)
SELECT '00000000-0000-0000-0000-000000000000'::uuid, 'security_alert', 'Security Update', 'New security patches have been applied', 'high'
WHERE NOT EXISTS (SELECT 1 FROM public.notifications WHERE type = 'security_alert' LIMIT 1);

INSERT INTO public.notifications (user_id, type, title, message, priority)
SELECT '00000000-0000-0000-0000-000000000000'::uuid, 'booking_confirmed', 'Welcome to Admin Dashboard', 'Your admin access has been configured', 'medium'
WHERE NOT EXISTS (SELECT 1 FROM public.notifications WHERE type = 'booking_confirmed' LIMIT 1);

INSERT INTO public.notifications (user_id, type, title, message, priority)
SELECT '00000000-0000-0000-0000-000000000000'::uuid, 'payment_success', 'System Status', 'All systems are operational', 'low'
WHERE NOT EXISTS (SELECT 1 FROM public.notifications WHERE type = 'payment_success' LIMIT 1);

-- Insert sample system logs 
INSERT INTO public.system_logs (correlation_id, service_name, log_level, message, metadata)
SELECT 'sys-001', 'admin-dashboard', 'info', 'Admin dashboard accessed', '{"user_agent": "Mozilla/5.0", "ip": "127.0.0.1"}'
WHERE NOT EXISTS (SELECT 1 FROM public.system_logs WHERE correlation_id = 'sys-001');

-- Insert sample security events
INSERT INTO public.security_events (event_type, severity, description, user_id, metadata)
SELECT 'login_attempt', 'low', 'Successful admin login', '00000000-0000-0000-0000-000000000000'::uuid, '{"ip": "127.0.0.1", "user_agent": "Mozilla/5.0"}'
WHERE NOT EXISTS (SELECT 1 FROM public.security_events WHERE event_type = 'login_attempt' LIMIT 1);

-- Update provider health and quota data
INSERT INTO public.provider_health (provider_id, status, last_checked, response_time, success_rate, error_count, last_error)
VALUES 
  ('amadeus-flight', 'healthy', NOW(), 1200, 98.5, 2, NULL),
  ('amadeus-hotel', 'healthy', NOW(), 1850, 97.2, 5, NULL),
  ('sabre-flight', 'degraded', NOW(), 3200, 89.1, 15, 'Rate limit exceeded'),
  ('sabre-hotel', 'healthy', NOW(), 2100, 95.8, 8, NULL),
  ('hotelbeds-hotel', 'healthy', NOW(), 1650, 96.7, 3, NULL)
ON CONFLICT (provider_id) DO UPDATE SET
  status = EXCLUDED.status,
  last_checked = EXCLUDED.last_checked,
  response_time = EXCLUDED.response_time,
  success_rate = EXCLUDED.success_rate,
  error_count = EXCLUDED.error_count,
  last_error = EXCLUDED.last_error;

-- Refresh admin metrics cache
DELETE FROM public.admin_metrics_cache WHERE metric_type = 'dashboard_summary';

INSERT INTO public.admin_metrics_cache (metric_type, metric_value, expires_at)
VALUES 
  ('dashboard_summary', 
   '{
     "totalBookings": 3,
     "totalRevenue": 869.99,
     "totalUsers": 1,
     "activeProperties": 0,
     "recentBookings": [
       {
         "id": "sample-1",
         "booking_reference": "BK12345678",
         "booking_type": "flight",
         "total_amount": 299.99,
         "currency": "AUD",
         "status": "confirmed",
         "created_at": "' || NOW()::text || '"
       }
     ],
     "notificationCount": 3,
     "documentCount": 0,
     "lastUpdated": "' || NOW()::text || '"
   }'::jsonb,
   NOW() + INTERVAL '1 hour');