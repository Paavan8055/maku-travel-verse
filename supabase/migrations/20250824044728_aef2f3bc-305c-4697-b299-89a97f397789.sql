-- Create RPC functions for communication preferences and booking updates

-- Function to get user booking updates
CREATE OR REPLACE FUNCTION public.get_user_booking_updates(p_user_id UUID)
RETURNS TABLE (
  id UUID,
  booking_id UUID,
  booking_reference TEXT,
  update_type TEXT,
  title TEXT,
  message TEXT,
  status TEXT,
  booking_type TEXT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    bu.id,
    bu.booking_id,
    bu.booking_reference,
    bu.update_type,
    bu.title,
    bu.message,
    bu.status,
    bu.booking_type,
    bu.metadata,
    bu.created_at
  FROM public.booking_updates bu
  WHERE bu.user_id = p_user_id
  ORDER BY bu.created_at DESC
  LIMIT 50;
END;
$$;

-- Function to get user communication preferences
CREATE OR REPLACE FUNCTION public.get_user_communication_preferences(p_user_id UUID)
RETURNS TABLE (
  id UUID,
  user_id UUID,
  preferences JSONB,
  email_frequency TEXT,
  timezone TEXT,
  language TEXT,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    cp.id,
    cp.user_id,
    cp.preferences,
    cp.email_frequency,
    cp.timezone,
    cp.language,
    cp.created_at,
    cp.updated_at
  FROM public.communication_preferences cp
  WHERE cp.user_id = p_user_id;
END;
$$;

-- Function to upsert communication preferences
CREATE OR REPLACE FUNCTION public.upsert_communication_preferences(
  p_user_id UUID,
  p_preferences JSONB,
  p_email_frequency TEXT,
  p_timezone TEXT,
  p_language TEXT
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id UUID;
BEGIN
  INSERT INTO public.communication_preferences (
    user_id,
    preferences,
    email_frequency,
    timezone,
    language
  ) VALUES (
    p_user_id,
    p_preferences,
    p_email_frequency,
    p_timezone,
    p_language
  )
  ON CONFLICT (user_id) 
  DO UPDATE SET
    preferences = EXCLUDED.preferences,
    email_frequency = EXCLUDED.email_frequency,
    timezone = EXCLUDED.timezone,
    language = EXCLUDED.language,
    updated_at = NOW()
  RETURNING id INTO v_id;
  
  RETURN v_id;
END;
$$;