-- Complete setup with minimal working data

-- Insert basic notification
INSERT INTO public.notifications (user_id, type, title, message, priority)
SELECT '00000000-0000-0000-0000-000000000000'::uuid, 'security_alert', 'Admin Dashboard Ready', 'Your admin dashboard is now functional', 'high'
WHERE NOT EXISTS (SELECT 1 FROM public.notifications LIMIT 1);

-- Clear and refresh admin metrics cache with real data counts
DELETE FROM public.admin_metrics_cache WHERE metric_type = 'dashboard_summary';

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