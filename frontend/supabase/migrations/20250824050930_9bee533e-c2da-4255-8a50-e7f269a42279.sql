-- Phase 3B: API Monitoring, Webhooks & Production Infrastructure

-- Create production monitoring table for API health
CREATE TABLE IF NOT EXISTS public.api_health_monitoring (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider TEXT NOT NULL, -- 'amadeus', 'hotelbeds', 'sabre', 'stripe'
  endpoint TEXT NOT NULL,
  status TEXT NOT NULL, -- 'healthy', 'degraded', 'down'
  response_time_ms INTEGER,
  error_message TEXT,
  error_count INTEGER DEFAULT 0,
  last_success_at TIMESTAMP WITH TIME ZONE,
  checked_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Create index for efficient querying
CREATE INDEX IF NOT EXISTS idx_api_health_provider_endpoint ON public.api_health_monitoring(provider, endpoint);
CREATE INDEX IF NOT EXISTS idx_api_health_checked_at ON public.api_health_monitoring(checked_at DESC);

-- Enable RLS for API health monitoring
ALTER TABLE public.api_health_monitoring ENABLE ROW LEVEL SECURITY;

-- Create policy for admins to view API health
CREATE POLICY "Admins can view API health monitoring"
ON public.api_health_monitoring
FOR SELECT
USING (is_secure_admin(auth.uid()));

-- Create policy for service role to manage API health
CREATE POLICY "Service role can manage API health monitoring"
ON public.api_health_monitoring
FOR ALL
USING (auth.role() = 'service_role'::text);

-- Create production-ready webhook idempotency table
CREATE TABLE IF NOT EXISTS public.webhook_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id TEXT NOT NULL, -- renamed from webhook_id to event_id
  event_type TEXT NOT NULL,
  provider TEXT NOT NULL, -- 'stripe', 'amadeus', etc.
  payload JSONB NOT NULL,
  processed BOOLEAN DEFAULT FALSE,
  processed_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create unique constraint for webhook idempotency
CREATE UNIQUE INDEX IF NOT EXISTS idx_webhook_events_unique ON public.webhook_events(event_id, provider);
CREATE INDEX IF NOT EXISTS idx_webhook_events_processed ON public.webhook_events(processed, created_at);

-- Enable RLS for webhook events
ALTER TABLE public.webhook_events ENABLE ROW LEVEL SECURITY;

-- Create policy for service role to manage webhook events
CREATE POLICY "Service role can manage webhook events"
ON public.webhook_events
FOR ALL
USING (auth.role() = 'service_role'::text);

-- Create function to handle webhook idempotency
CREATE OR REPLACE FUNCTION public.process_webhook_event(
  p_event_id TEXT,
  p_event_type TEXT,
  p_provider TEXT,
  p_payload JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_existing_event RECORD;
  v_result JSONB;
BEGIN
  -- Check if webhook already processed
  SELECT * INTO v_existing_event
  FROM public.webhook_events
  WHERE event_id = p_event_id
  AND provider = p_provider;
  
  IF FOUND THEN
    IF v_existing_event.processed THEN
      -- Already processed, return success
      RETURN jsonb_build_object(
        'success', true,
        'already_processed', true,
        'processed_at', v_existing_event.processed_at
      );
    ELSE
      -- Update retry count
      UPDATE public.webhook_events
      SET retry_count = retry_count + 1,
          updated_at = now()
      WHERE id = v_existing_event.id;
    END IF;
  ELSE
    -- Insert new webhook event
    INSERT INTO public.webhook_events (
      event_id,
      event_type,
      provider,
      payload
    ) VALUES (
      p_event_id,
      p_event_type,
      p_provider,
      p_payload
    );
  END IF;
  
  RETURN jsonb_build_object(
    'success', true,
    'event_id', p_event_id,
    'ready_to_process', true
  );
END;
$function$;

-- Create function to log API health status
CREATE OR REPLACE FUNCTION public.log_api_health(
  p_provider TEXT,
  p_endpoint TEXT,
  p_status TEXT,
  p_response_time_ms INTEGER DEFAULT NULL,
  p_error_message TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_health_id UUID;
BEGIN
  INSERT INTO public.api_health_monitoring (
    provider,
    endpoint,
    status,
    response_time_ms,
    error_message,
    error_count,
    last_success_at,
    checked_at,
    metadata
  ) VALUES (
    p_provider,
    p_endpoint,
    p_status,
    p_response_time_ms,
    p_error_message,
    CASE WHEN p_status = 'healthy' THEN 0 ELSE 1 END,
    CASE WHEN p_status = 'healthy' THEN now() ELSE NULL END,
    now(),
    p_metadata
  ) RETURNING id INTO v_health_id;
  
  RETURN v_health_id;
END;
$function$;