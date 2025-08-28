-- Fix security issues: Enable RLS and add proper security function settings

-- Enable RLS on new tables
ALTER TABLE public.hotelbeds_monitoring ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.booking_status_history ENABLE ROW LEVEL SECURITY;

-- Add search_path to security definer function
DROP FUNCTION IF EXISTS public.track_booking_status_change();
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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public';

-- Add RLS policies for monitoring table
CREATE POLICY "Admins can view HotelBeds monitoring" 
ON public.hotelbeds_monitoring 
FOR SELECT 
USING (is_secure_admin(auth.uid()));

CREATE POLICY "Service role can manage HotelBeds monitoring" 
ON public.hotelbeds_monitoring 
FOR ALL 
USING (auth.role() = 'service_role');

-- Add RLS policies for booking status history
CREATE POLICY "Users can view their booking status history" 
ON public.booking_status_history 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.bookings b 
  WHERE b.id = booking_status_history.booking_id 
  AND b.user_id = auth.uid()
));

CREATE POLICY "Service role can manage booking status history" 
ON public.booking_status_history 
FOR ALL 
USING (auth.role() = 'service_role');

-- Create trigger for booking status changes on bookings table
DROP TRIGGER IF EXISTS track_booking_status_changes ON public.bookings;
CREATE TRIGGER track_booking_status_changes
  BEFORE UPDATE ON public.bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.track_booking_status_change();