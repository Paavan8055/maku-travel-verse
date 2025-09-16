-- Create booking updates table for real-time status updates
CREATE TABLE IF NOT EXISTS public.booking_updates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  booking_id UUID NOT NULL,
  booking_reference TEXT NOT NULL,
  update_type TEXT NOT NULL CHECK (update_type IN ('status_change', 'schedule_change', 'gate_change', 'reminder', 'cancellation')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('info', 'warning', 'success', 'error')),
  booking_type TEXT NOT NULL CHECK (booking_type IN ('hotel', 'flight', 'activity', 'transfer')),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create communication preferences table
CREATE TABLE IF NOT EXISTS public.communication_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  preferences JSONB NOT NULL DEFAULT '{
    "email_notifications": true,
    "push_notifications": true,
    "sms_notifications": false,
    "booking_confirmations": true,
    "status_updates": true,
    "marketing_emails": false,
    "price_alerts": true,
    "check_in_reminders": true,
    "travel_tips": false,
    "security_alerts": true
  }',
  email_frequency TEXT NOT NULL DEFAULT 'immediate' CHECK (email_frequency IN ('immediate', 'daily', 'weekly')),
  timezone TEXT NOT NULL DEFAULT 'UTC',
  language TEXT NOT NULL DEFAULT 'en',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.booking_updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.communication_preferences ENABLE ROW LEVEL SECURITY;

-- Booking updates policies
CREATE POLICY "Users can view their own booking updates" ON public.booking_updates
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage booking updates" ON public.booking_updates
FOR ALL USING (auth.role() = 'service_role'::text);

-- Communication preferences policies
CREATE POLICY "Users can manage their own communication preferences" ON public.communication_preferences
FOR ALL USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Add triggers for updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_booking_updates()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_booking_updates_updated_at
BEFORE UPDATE ON public.booking_updates
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_booking_updates();

CREATE OR REPLACE FUNCTION public.update_updated_at_communication_preferences()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_communication_preferences_updated_at
BEFORE UPDATE ON public.communication_preferences
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_communication_preferences();