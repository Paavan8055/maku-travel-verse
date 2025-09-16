-- Phase 3: Critical Security Fixes & Production Readiness
-- Fix 1: Function Search Path Security
-- Update existing functions to set secure search_path

-- Fix create_flight_order function
CREATE OR REPLACE FUNCTION public.create_flight_order(p_profile_id uuid, p_amadeus_order_id text, p_offer_source text, p_offer_json jsonb, p_passengers jsonb, p_seatmaps jsonb, p_status text, p_pnr text, p_ticket_numbers text[], p_price_total numeric, p_price_currency text, p_checkin_links jsonb, p_analytics jsonb, p_meta jsonb)
 RETURNS uuid
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  insert into public.flights_orders(
    profile_id, amadeus_order_id, offer_source, offer_json, passengers, seatmaps,
    status, pnr, ticket_numbers, price_total, price_currency, checkin_links, analytics, meta
  ) values (
    p_profile_id, p_amadeus_order_id, p_offer_source, p_offer_json, p_passengers, p_seatmaps,
    coalesce(p_status,'created'), p_pnr, p_ticket_numbers, p_price_total, p_price_currency, p_checkin_links, p_analytics, p_meta
  ) returning id;
$function$;

-- Fix create_hotel_order function
CREATE OR REPLACE FUNCTION public.create_hotel_order(p_profile_id uuid, p_amadeus_booking_id text, p_hotel_id text, p_offer_json jsonb, p_guests jsonb, p_status text, p_confirmation_code text, p_checkin date, p_checkout date, p_rooms integer, p_total_price numeric, p_currency text, p_meta jsonb)
 RETURNS uuid
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  insert into public.hotels_orders(
    profile_id, amadeus_booking_id, hotel_id, offer_json, guests, status, confirmation_code,
    checkin, checkout, rooms, total_price, currency, meta
  ) values (
    p_profile_id, p_amadeus_booking_id, p_hotel_id, p_offer_json, p_guests, coalesce(p_status,'reserved'),
    p_confirmation_code, p_checkin, p_checkout, p_rooms, p_total_price, p_currency, p_meta
  ) returning id;
$function$;

-- Create production-ready booking status tracking
CREATE TABLE IF NOT EXISTS public.booking_status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  previous_status TEXT NOT NULL,
  new_status TEXT NOT NULL,
  reason TEXT,
  error_details JSONB,
  changed_by UUID REFERENCES auth.users(id),
  changed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Enable RLS for booking status history
ALTER TABLE public.booking_status_history ENABLE ROW LEVEL SECURITY;

-- Create policy for users to view their booking status history
CREATE POLICY "Users can view their booking status history"
ON public.booking_status_history
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.bookings b
    WHERE b.id = booking_status_history.booking_id
    AND b.user_id = auth.uid()
  )
);

-- Create policy for service role to manage all status history
CREATE POLICY "Service role can manage booking status history"
ON public.booking_status_history
FOR ALL
USING (auth.role() = 'service_role'::text);

-- Create function to track booking status changes
CREATE OR REPLACE FUNCTION public.track_booking_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Only track if status actually changed
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO public.booking_status_history (
      booking_id,
      previous_status,
      new_status,
      reason,
      changed_by,
      changed_at,
      metadata
    ) VALUES (
      NEW.id,
      COALESCE(OLD.status, 'pending'),
      NEW.status,
      'System update',
      auth.uid(),
      now(),
      jsonb_build_object(
        'updated_at', NEW.updated_at,
        'booking_reference', NEW.booking_reference
      )
    );
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Create trigger for booking status tracking
DROP TRIGGER IF EXISTS track_booking_status_changes ON public.bookings;
CREATE TRIGGER track_booking_status_changes
  AFTER UPDATE ON public.bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.track_booking_status_change();

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
  webhook_id TEXT NOT NULL,
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
CREATE UNIQUE INDEX IF NOT EXISTS idx_webhook_events_unique ON public.webhook_events(webhook_id, provider);
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
  p_webhook_id TEXT,
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
  WHERE webhook_id = p_webhook_id
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
      webhook_id,
      event_type,
      provider,
      payload
    ) VALUES (
      p_webhook_id,
      p_event_type,
      p_provider,
      p_payload
    );
  END IF;
  
  RETURN jsonb_build_object(
    'success', true,
    'webhook_id', p_webhook_id,
    'ready_to_process', true
  );
END;
$function$;