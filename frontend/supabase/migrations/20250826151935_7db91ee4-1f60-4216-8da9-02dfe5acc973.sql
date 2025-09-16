-- Fix the migration with correct notification types and seed sample data

-- Insert some sample notifications with valid types
INSERT INTO public.notifications (user_id, type, title, message, priority)
VALUES 
  ('00000000-0000-0000-0000-000000000000', 'security_alert', 'Security Update', 'New security patches have been applied', 'high'),
  ('00000000-0000-0000-0000-000000000000', 'booking_confirmed', 'Welcome to Admin Dashboard', 'Your admin access has been configured', 'medium'),
  ('00000000-0000-0000-0000-000000000000', 'payment_success', 'System Status', 'All systems are operational', 'low');

-- Insert sample system logs
INSERT INTO public.system_logs (correlation_id, service_name, log_level, message, metadata)
VALUES 
  ('sys-001', 'admin-dashboard', 'info', 'Admin dashboard accessed', '{"user_agent": "Mozilla/5.0", "ip": "127.0.0.1"}'),
  ('sys-002', 'provider-rotation', 'warn', 'Provider response time elevated', '{"provider": "amadeus", "response_time": 2500}'),
  ('sys-003', 'booking-system', 'info', 'Booking created successfully', '{"booking_id": "BK001", "amount": 299.99}');

-- Insert sample performance metrics
INSERT INTO public.performance_metrics (metric_name, metric_value, timestamp, metadata)
VALUES 
  ('response_time_avg', 245.5, NOW(), '{"service": "api", "endpoint": "/admin/metrics"}'),
  ('error_rate', 0.02, NOW(), '{"service": "provider-rotation", "total_requests": 1000}'),
  ('memory_usage', 67.8, NOW(), '{"service": "edge-functions", "unit": "percentage"}');

-- Insert sample security events
INSERT INTO public.security_events (event_type, severity, description, user_id, metadata)
VALUES 
  ('login_attempt', 'low', 'Successful admin login', '00000000-0000-0000-0000-000000000000', '{"ip": "127.0.0.1", "user_agent": "Mozilla/5.0"}'),
  ('permission_check', 'medium', 'Admin permission verified', '00000000-0000-0000-0000-000000000000', '{"resource": "admin-metrics", "granted": true}'),
  ('api_key_usage', 'low', 'API key used for provider access', NULL, '{"provider": "amadeus", "key_type": "test"}');

-- Insert sample provider health data  
INSERT INTO public.provider_health (provider_id, status, last_checked, response_time, success_rate, error_count, last_error)
VALUES 
  ('amadeus-flight', 'healthy', NOW(), 1200, 98.5, 2, NULL),
  ('amadeus-hotel', 'healthy', NOW(), 1850, 97.2, 5, NULL),
  ('sabre-flight', 'degraded', NOW(), 3200, 89.1, 15, 'Rate limit exceeded'),
  ('sabre-hotel', 'healthy', NOW(), 2100, 95.8, 8, NULL),
  ('hotelbeds-hotel', 'healthy', NOW(), 1650, 96.7, 3, NULL);

-- Update provider quotas with sample data
INSERT INTO public.provider_quotas (provider_id, provider_name, service_type, quota_used, quota_limit, percentage_used, status, last_checked)
VALUES 
  ('amadeus-flight', 'amadeus', 'api_calls', 245, 1000, 24.5, 'healthy', NOW()),
  ('amadeus-hotel', 'amadeus', 'api_calls', 189, 1000, 18.9, 'healthy', NOW()),
  ('sabre-flight', 'sabre', 'api_calls', 856, 1000, 85.6, 'warning', NOW()),
  ('sabre-hotel', 'sabre', 'api_calls', 623, 1000, 62.3, 'healthy', NOW()),
  ('hotelbeds-hotel', 'hotelbeds', 'api_calls', 412, 2000, 20.6, 'healthy', NOW())
ON CONFLICT (provider_id) DO UPDATE SET
  quota_used = EXCLUDED.quota_used,
  quota_limit = EXCLUDED.quota_limit,
  percentage_used = EXCLUDED.percentage_used,
  status = EXCLUDED.status,
  last_checked = EXCLUDED.last_checked;

-- Insert some sample bookings to show data in dashboard
INSERT INTO public.bookings (booking_reference, user_id, booking_type, booking_data, total_amount, currency, status)
VALUES 
  ('BK' || UPPER(SUBSTRING(gen_random_uuid()::text FROM 1 FOR 8)), '00000000-0000-0000-0000-000000000000', 'flight', 
   '{"origin": "SYD", "destination": "MEL", "departure": "2025-09-15", "passengers": 2}', 
   299.99, 'AUD', 'confirmed'),
  ('BK' || UPPER(SUBSTRING(gen_random_uuid()::text FROM 1 FOR 8)), '00000000-0000-0000-0000-000000000000', 'hotel', 
   '{"hotel_name": "Sydney Harbour Hotel", "checkin": "2025-09-15", "checkout": "2025-09-17", "guests": 2}', 
   450.00, 'AUD', 'confirmed'),
  ('BK' || UPPER(SUBSTRING(gen_random_uuid()::text FROM 1 FOR 8)), '00000000-0000-0000-0000-000000000000', 'activity', 
   '{"activity": "Sydney Opera House Tour", "date": "2025-09-16", "participants": 2}', 
   120.00, 'AUD', 'completed');

-- Clear the cache and insert fresh admin metrics
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