-- Create monitoring table for HotelBeds operations
CREATE TABLE IF NOT EXISTS public.hotelbeds_monitoring (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL,
  function_name TEXT NOT NULL,
  correlation_id TEXT NOT NULL,
  duration_ms INTEGER,
  status_code INTEGER,
  error_message TEXT,
  booking_reference TEXT,
  hotel_code TEXT,
  rate_key TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create index for efficient querying
CREATE INDEX IF NOT EXISTS idx_hotelbeds_monitoring_created_at ON public.hotelbeds_monitoring(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_hotelbeds_monitoring_event_type ON public.hotelbeds_monitoring(event_type);
CREATE INDEX IF NOT EXISTS idx_hotelbeds_monitoring_correlation_id ON public.hotelbeds_monitoring(correlation_id);

-- Create booking status history table for detailed tracking
CREATE TABLE IF NOT EXISTS public.booking_status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL,
  previous_status TEXT,
  new_status TEXT NOT NULL,
  reason TEXT,
  changed_by UUID,
  changed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'
);

-- Create index for booking status history
CREATE INDEX IF NOT EXISTS idx_booking_status_history_booking_id ON public.booking_status_history(booking_id);
CREATE INDEX IF NOT EXISTS idx_booking_status_history_changed_at ON public.booking_status_history(changed_at DESC);

-- Create trigger to track booking status changes
CREATE OR REPLACE FUNCTION public.track_booking_status_change()
RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER;