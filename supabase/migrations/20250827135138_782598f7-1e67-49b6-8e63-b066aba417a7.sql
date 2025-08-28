-- MAKU.Travel Database Optimization Migration (Part 1)
-- Critical Security & Function Fixes + Missing Indexes

-- Fix the function security issue with mutable search path
CREATE OR REPLACE FUNCTION public.update_provider_quotas_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

-- Add missing indexes on high-traffic foreign key columns (highest priority)
CREATE INDEX IF NOT EXISTS idx_bookings_user_id ON public.bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_pnr_records_user_id ON public.pnr_records(user_id);
CREATE INDEX IF NOT EXISTS idx_price_alerts_user_id ON public.price_alerts(user_id);
CREATE INDEX IF NOT EXISTS idx_user_activity_logs_user_id ON public.user_activity_logs(user_id);

-- Add time-based indexes for cleanup operations
CREATE INDEX IF NOT EXISTS idx_health_checks_created_at ON public.health_checks(created_at);
CREATE INDEX IF NOT EXISTS idx_provider_metrics_timestamp ON public.provider_metrics(timestamp);
CREATE INDEX IF NOT EXISTS idx_system_logs_created_at ON public.system_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_booking_access_audit_created_at ON public.booking_access_audit(created_at);

-- Add composite indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_bookings_user_status ON public.bookings(user_id, status);
CREATE INDEX IF NOT EXISTS idx_bookings_user_created ON public.bookings(user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_user_activity_logs_user_type ON public.user_activity_logs(user_id, activity_type);
CREATE INDEX IF NOT EXISTS idx_booking_updates_user_created ON public.booking_updates(user_id, created_at);

-- Add indexes for provider performance monitoring
CREATE INDEX IF NOT EXISTS idx_provider_health_provider_checked ON public.provider_health(provider_id, last_checked);
CREATE INDEX IF NOT EXISTS idx_provider_quotas_provider_updated ON public.provider_quotas(provider_id, updated_at);