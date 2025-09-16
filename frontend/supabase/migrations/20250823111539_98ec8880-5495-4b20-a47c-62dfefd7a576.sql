-- Phase 3: Security & Performance Fixes

-- 1. Tighten RLS policies on cache tables
-- Fix flight_offers_cache to require authentication
DROP POLICY IF EXISTS "Anyone can view flight offers cache" ON public.flight_offers_cache;
CREATE POLICY "Authenticated users can view flight offers cache" 
ON public.flight_offers_cache 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

-- Add missing policies for cache tables with admin-only write access
CREATE POLICY "Service role can manage flight offers cache" 
ON public.flight_offers_cache 
FOR ALL 
USING (auth.role() = 'service_role'::text);

CREATE POLICY "Service role can manage hotel offers cache" 
ON public.hotel_offers_cache 
FOR ALL 
USING (auth.role() = 'service_role'::text);

CREATE POLICY "Service role can manage activities offers cache" 
ON public.activities_offers_cache 
FOR INSERT 
WITH CHECK (auth.role() = 'service_role'::text);

CREATE POLICY "Service role can manage activities offers cache updates" 
ON public.activities_offers_cache 
FOR UPDATE 
USING (auth.role() = 'service_role'::text);

CREATE POLICY "Service role can manage activities offers cache deletes" 
ON public.activities_offers_cache 
FOR DELETE 
USING (auth.role() = 'service_role'::text);

-- 2. Fix database function security by adding search_path
CREATE OR REPLACE FUNCTION public.save_transfer_search(p_search_key text, p_origin jsonb, p_destination jsonb, p_pickup timestamp with time zone, p_passengers integer, p_luggage jsonb, p_offers jsonb, p_ttl timestamp with time zone)
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  INSERT INTO public.transfers_offers_cache(
    search_key, origin, destination, pickup_at, passengers, luggage, offers, ttl_expires_at
  ) VALUES (
    p_search_key, p_origin, p_destination, p_pickup, p_passengers, p_luggage, p_offers, p_ttl
  ) RETURNING id;
$function$;

CREATE OR REPLACE FUNCTION public.upsert_market_analytics(p_metric text, p_scope jsonb, p_data jsonb)
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  insert into public.market_analytics(metric, scope, data)
  values (p_metric, p_scope, p_data)
  returning id;
$function$;

-- 3. Create enhanced logging and monitoring tables
CREATE TABLE IF NOT EXISTS public.system_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  correlation_id text,
  service_name text NOT NULL,
  log_level text NOT NULL DEFAULT 'info',
  message text NOT NULL,
  metadata jsonb DEFAULT '{}',
  request_id text,
  user_id uuid,
  duration_ms integer,
  status_code integer,
  error_details jsonb,
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on system_logs
ALTER TABLE public.system_logs ENABLE ROW LEVEL SECURITY;

-- Create policies for system_logs
CREATE POLICY "Admins can view system logs" 
ON public.system_logs 
FOR SELECT 
USING (is_secure_admin(auth.uid()));

CREATE POLICY "Service role can manage system logs" 
ON public.system_logs 
FOR ALL 
USING (auth.role() = 'service_role'::text);

-- 4. Create performance monitoring table
CREATE TABLE IF NOT EXISTS public.performance_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  correlation_id text,
  metric_type text NOT NULL,
  operation text NOT NULL,
  duration_ms integer NOT NULL,
  success boolean DEFAULT true,
  error_message text,
  metadata jsonb DEFAULT '{}',
  user_id uuid,
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on performance_metrics
ALTER TABLE public.performance_metrics ENABLE ROW LEVEL SECURITY;

-- Create policies for performance_metrics
CREATE POLICY "Admins can view performance metrics" 
ON public.performance_metrics 
FOR SELECT 
USING (is_secure_admin(auth.uid()));

CREATE POLICY "Service role can manage performance metrics" 
ON public.performance_metrics 
FOR ALL 
USING (auth.role() = 'service_role'::text);

-- 5. Create security events table
CREATE TABLE IF NOT EXISTS public.security_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type text NOT NULL,
  severity text NOT NULL DEFAULT 'info',
  user_id uuid,
  ip_address inet,
  user_agent text,
  details jsonb DEFAULT '{}',
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on security_events
ALTER TABLE public.security_events ENABLE ROW LEVEL SECURITY;

-- Create policies for security_events
CREATE POLICY "Admins can view security events" 
ON public.security_events 
FOR SELECT 
USING (is_secure_admin(auth.uid()));

CREATE POLICY "Service role can manage security events" 
ON public.security_events 
FOR ALL 
USING (auth.role() = 'service_role'::text);

-- 6. Create function for logging system events
CREATE OR REPLACE FUNCTION public.log_system_event(
  p_correlation_id text,
  p_service_name text,
  p_log_level text,
  p_message text,
  p_metadata jsonb DEFAULT '{}',
  p_request_id text DEFAULT NULL,
  p_user_id uuid DEFAULT NULL,
  p_duration_ms integer DEFAULT NULL,
  p_status_code integer DEFAULT NULL,
  p_error_details jsonb DEFAULT NULL
)
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  INSERT INTO public.system_logs (
    correlation_id, service_name, log_level, message, metadata,
    request_id, user_id, duration_ms, status_code, error_details
  ) VALUES (
    p_correlation_id, p_service_name, p_log_level, p_message, p_metadata,
    p_request_id, p_user_id, p_duration_ms, p_status_code, p_error_details
  ) RETURNING id;
$function$;