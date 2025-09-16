-- Fix critical security issue: Enable RLS on hotelbeds_monitoring table
ALTER TABLE public.hotelbeds_monitoring ENABLE ROW LEVEL SECURITY;

-- Add missing RLS policies for hotelbeds_monitoring table
CREATE POLICY "Admins can view HotelBeds monitoring" 
ON public.hotelbeds_monitoring 
FOR SELECT 
USING (is_secure_admin(auth.uid()));

CREATE POLICY "Service role can manage HotelBeds monitoring" 
ON public.hotelbeds_monitoring 
FOR ALL 
USING (auth.role() = 'service_role');

-- Ensure booking status tracking trigger is properly attached
DROP TRIGGER IF EXISTS track_booking_status_changes ON public.bookings;

CREATE TRIGGER track_booking_status_changes
  BEFORE UPDATE ON public.bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.track_booking_status_change();