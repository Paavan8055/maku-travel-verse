-- Enable pg_cron and pg_net extensions for automated cleanup
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Create automated cleanup cron job - runs every 15 minutes
SELECT cron.schedule(
  'auto-cleanup-stuck-bookings',
  '*/15 * * * *',
  $$
  SELECT
    net.http_post(
        url:='https://iomeddeasarntjhqzndu.supabase.co/functions/v1/fix-stuck-bookings',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlvbWVkZGVhc2FybnRqaHF6bmR1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDM4OTQ2OSwiZXhwIjoyMDY5OTY1NDY5fQ.d6CdnpT5BkVJLjhVZvyQFCPEIFhH0xQWf6XNjQNjqJM"}'::jsonb,
        body:='{"automated": true, "timeout_minutes": 60}'::jsonb
    ) as request_id;
  $$
);

-- Create cleanup audit table for tracking
CREATE TABLE IF NOT EXISTS public.cleanup_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cleanup_type TEXT NOT NULL,
  bookings_processed INTEGER DEFAULT 0,
  bookings_expired INTEGER DEFAULT 0,
  payments_cancelled INTEGER DEFAULT 0,
  errors_encountered INTEGER DEFAULT 0,
  execution_time_ms INTEGER,
  triggered_by TEXT DEFAULT 'automated',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  details JSONB DEFAULT '{}'::jsonb
);

-- Enable RLS
ALTER TABLE public.cleanup_audit ENABLE ROW LEVEL SECURITY;

-- Admin access to cleanup audit
CREATE POLICY "Admins can view cleanup audit" 
ON public.cleanup_audit 
FOR SELECT 
USING (is_secure_admin(auth.uid()));

-- Service role can insert cleanup records
CREATE POLICY "Service role can insert cleanup audit" 
ON public.cleanup_audit 
FOR INSERT 
WITH CHECK (auth.role() = 'service_role');

-- Create function to get cleanup stats
CREATE OR REPLACE FUNCTION public.get_cleanup_stats()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    v_result JSON;
BEGIN
    SELECT json_build_object(
        'total_cleanups_24h', (
            SELECT COUNT(*) 
            FROM cleanup_audit 
            WHERE created_at > NOW() - INTERVAL '24 hours'
        ),
        'bookings_cleaned_24h', (
            SELECT COALESCE(SUM(bookings_expired), 0) 
            FROM cleanup_audit 
            WHERE created_at > NOW() - INTERVAL '24 hours'
        ),
        'current_pending', (
            SELECT COUNT(*) 
            FROM bookings 
            WHERE status = 'pending' 
            AND created_at < NOW() - INTERVAL '60 minutes'
        ),
        'last_cleanup', (
            SELECT created_at 
            FROM cleanup_audit 
            ORDER BY created_at DESC 
            LIMIT 1
        )
    ) INTO v_result;
    
    RETURN v_result;
END;
$$;