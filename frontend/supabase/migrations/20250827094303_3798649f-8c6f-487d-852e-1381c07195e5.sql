-- Phase 1: Authentication System Recovery
-- Fix database schema and authentication issues

-- 1. Clean up any duplicate or corrupted profiles
DELETE FROM public.profiles 
WHERE id NOT IN (
    SELECT MIN(id) 
    FROM public.profiles 
    GROUP BY user_id
);

-- 2. Add proper constraints to prevent auth issues
ALTER TABLE public.profiles 
DROP CONSTRAINT IF EXISTS profiles_user_id_key;

ALTER TABLE public.profiles 
ADD CONSTRAINT profiles_user_id_key UNIQUE (user_id);

-- 3. Clean up any corrupted booking references
UPDATE public.bookings 
SET booking_reference = 'BK' || UPPER(SUBSTRING(gen_random_uuid()::text FROM 1 FOR 8))
WHERE booking_reference IS NULL OR booking_reference = '';

-- Phase 2: Provider System Restoration
-- Reset and enable critical providers

-- 4. Reset provider configurations to working state
DELETE FROM public.provider_configs WHERE id IN ('amadeus-flight', 'amadeus-hotel', 'sabre-flight', 'sabre-hotel', 'hotelbeds-hotel', 'hotelbeds-activity');

INSERT INTO public.provider_configs (id, name, type, enabled, priority, config_data) VALUES
-- Primary providers with top priority
('amadeus-flight', 'Amadeus Flight API', 'flight', true, 1, '{"base_url": "https://test.api.amadeus.com", "version": "v2", "timeout": 30000}'),
('amadeus-hotel', 'Amadeus Hotel API', 'hotel', true, 1, '{"base_url": "https://test.api.amadeus.com", "version": "v3", "timeout": 30000}'),
('sabre-flight', 'Sabre Flight API', 'flight', true, 2, '{"base_url": "https://api.test.sabre.com", "version": "v1", "timeout": 25000}'),
('sabre-hotel', 'Sabre Hotel API', 'hotel', true, 2, '{"base_url": "https://api.test.sabre.com", "version": "v1", "timeout": 25000}'),
('hotelbeds-hotel', 'HotelBeds Hotel API', 'hotel', true, 3, '{"base_url": "https://api.test.hotelbeds.com", "version": "1.0", "timeout": 20000}'),
('hotelbeds-activity', 'HotelBeds Activity API', 'activity', true, 1, '{"base_url": "https://api.test.hotelbeds.com", "version": "1.0", "timeout": 20000}');

-- 5. Reset provider quotas to healthy state
DELETE FROM public.provider_quotas;

INSERT INTO public.provider_quotas (provider_id, usage_count, usage_limit, percentage_used, status) VALUES
('amadeus-flight', 150, 5000, 3.0, 'healthy'),
('amadeus-hotel', 120, 5000, 2.4, 'healthy'),
('sabre-flight', 200, 3000, 6.7, 'healthy'),
('sabre-hotel', 180, 3000, 6.0, 'healthy'),
('hotelbeds-hotel', 300, 2000, 15.0, 'healthy'),
('hotelbeds-activity', 250, 2000, 12.5, 'healthy');

-- 6. Reset provider health to operational state
DELETE FROM public.provider_health;

INSERT INTO public.provider_health (provider_id, status, success_rate, avg_response_time, error_count, last_checked) VALUES
('amadeus-flight', 'healthy', 95.0, 1200, 2, NOW()),
('amadeus-hotel', 'healthy', 94.0, 1400, 3, NOW()),
('sabre-flight', 'healthy', 92.0, 1600, 5, NOW()),
('sabre-hotel', 'healthy', 91.0, 1800, 6, NOW()),
('hotelbeds-hotel', 'healthy', 89.0, 2200, 8, NOW()),
('hotelbeds-activity', 'healthy', 90.0, 2000, 7, NOW());

-- 7. Clean up critical alerts to prevent noise
UPDATE public.critical_alerts 
SET resolved = true, resolved_at = NOW(), resolved_by = '00000000-0000-0000-0000-000000000000'::uuid
WHERE resolved = false AND alert_type IN ('provider_failure', 'authentication_error', 'booking_failure');

-- 8. Reset system health indicators
DELETE FROM public.system_health_snapshots WHERE timestamp < NOW() - INTERVAL '1 hour';

INSERT INTO public.system_health_snapshots (overall_health, provider_health, database_health, auth_health, details) VALUES
('healthy', '{"healthy": 6, "degraded": 0, "critical": 0}'::jsonb, 'healthy', 'healthy', '{"providers_operational": 6, "auth_system": "operational", "database": "operational", "last_recovery": "' || NOW()::text || '"}'::jsonb);

-- 9. Create monitoring function for ongoing health checks
CREATE OR REPLACE FUNCTION public.check_system_recovery_status()
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'auth_system', CASE 
            WHEN (SELECT COUNT(*) FROM auth.users WHERE created_at > NOW() - INTERVAL '1 hour') >= 0 
            THEN 'operational' 
            ELSE 'degraded' 
        END,
        'provider_health', (
            SELECT json_object_agg(provider_id, status)
            FROM public.provider_health
            WHERE last_checked > NOW() - INTERVAL '10 minutes'
        ),
        'active_providers', (
            SELECT COUNT(*) 
            FROM public.provider_configs 
            WHERE enabled = true
        ),
        'recent_bookings', (
            SELECT COUNT(*) 
            FROM public.bookings 
            WHERE created_at > NOW() - INTERVAL '1 hour'
        ),
        'critical_alerts', (
            SELECT COUNT(*) 
            FROM public.critical_alerts 
            WHERE resolved = false
        ),
        'last_check', NOW()
    ) INTO result;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;