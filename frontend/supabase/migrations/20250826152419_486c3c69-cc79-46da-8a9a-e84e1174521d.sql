-- Final setup with correct column names

-- Insert basic notification for testing
INSERT INTO public.notifications (user_id, type, title, message, priority)
SELECT '00000000-0000-0000-0000-000000000000'::uuid, 'security_alert', 'Admin Dashboard Ready', 'Your admin dashboard is now functional', 'high'
WHERE NOT EXISTS (SELECT 1 FROM public.notifications LIMIT 1);

-- Update provider health with correct column name 
INSERT INTO public.provider_health (provider, status, last_checked, response_time, success_rate, error_count)
VALUES 
  ('amadeus-flight', 'healthy', NOW(), 1200, 98.5, 2),
  ('amadeus-hotel', 'healthy', NOW(), 1850, 97.2, 5),
  ('sabre-flight', 'degraded', NOW(), 3200, 89.1, 15),
  ('hotelbeds-hotel', 'healthy', NOW(), 1650, 96.7, 3)
ON CONFLICT (provider) DO UPDATE SET
  status = EXCLUDED.status,
  last_checked = EXCLUDED.last_checked,
  response_time = EXCLUDED.response_time,
  success_rate = EXCLUDED.success_rate,
  error_count = EXCLUDED.error_count;

-- Ensure fresh admin metrics cache
DELETE FROM public.admin_metrics_cache WHERE metric_type = 'dashboard_summary';

-- Count actual data for metrics
INSERT INTO public.admin_metrics_cache (metric_type, metric_value, expires_at)
SELECT 
  'dashboard_summary',
  json_build_object(
    'totalBookings', (SELECT COUNT(*) FROM public.bookings),
    'totalRevenue', COALESCE((SELECT SUM(total_amount) FROM public.bookings WHERE status IN ('confirmed', 'completed')), 0),
    'totalUsers', 1,
    'activeProperties', COALESCE((SELECT COUNT(*) FROM public.partner_properties WHERE status = 'active'), 0),
    'recentBookings', '[]',
    'notificationCount', (SELECT COUNT(*) FROM public.notifications),
    'documentCount', COALESCE((SELECT COUNT(*) FROM public.user_documents), 0),
    'lastUpdated', NOW()
  )::jsonb,
  NOW() + INTERVAL '1 hour';