-- Phase 1: Fix remaining database functions with secure search path
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
begin
  new.updated_at = now();
  return new;
end;
$function$;

CREATE OR REPLACE FUNCTION public.trigger_anonymize_guest_booking()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
BEGIN
    -- Only process guest bookings (user_id IS NULL)
    IF NEW.user_id IS NULL AND NEW.status IN ('confirmed', 'completed') THEN
        -- Defer the anonymization to avoid blocking the main transaction
        PERFORM pg_notify(
            'anonymize_booking', 
            json_build_object('booking_id', NEW.id)::text
        );
    END IF;
    
    RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.cleanup_expired_guest_tokens()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
BEGIN
    DELETE FROM public.guest_booking_tokens 
    WHERE expires_at < NOW() - INTERVAL '7 days';
END;
$function$;

CREATE OR REPLACE FUNCTION public.auto_anonymize_old_guest_bookings()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE
    _booking_record RECORD;
BEGIN
    -- Process guest bookings older than 30 days that haven't been anonymized
    FOR _booking_record IN 
        SELECT b.id 
        FROM public.bookings b
        LEFT JOIN public.ai_training_bookings ai ON ai.original_booking_id = b.id
        WHERE b.user_id IS NULL 
        AND b.created_at < NOW() - INTERVAL '30 days'
        AND ai.id IS NULL
        AND b.status IN ('confirmed', 'completed', 'cancelled')
        LIMIT 100
    LOOP
        PERFORM public.anonymize_booking_for_ai(_booking_record.id);
    END LOOP;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_gift_card_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$function$;

-- Phase 3: Protect business data - require authentication for sensitive tables
-- Drop existing permissive policies and create secure ones

-- Hotels table - require authentication to prevent competitive intelligence
DROP POLICY IF EXISTS "hotels_public_read" ON public.hotels;
CREATE POLICY "Authenticated users can view hotels" ON public.hotels
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- Dream destinations - require authentication
DROP POLICY IF EXISTS "Anyone can view dream destinations" ON public.dream_destinations;
CREATE POLICY "Authenticated users can view dream destinations" ON public.dream_destinations
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- Local insights - require authentication
DROP POLICY IF EXISTS "Anyone can view local insights" ON public.local_insights;
CREATE POLICY "Authenticated users can view local insights" ON public.local_insights
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- Flight offers cache - already secured in previous migration
-- Hotel offers cache - already secured in previous migration  
-- Activities offers cache - secure it now
DROP POLICY IF EXISTS "Anyone can view activity offers cache" ON public.activities_offers_cache;
CREATE POLICY "Authenticated users can view activity offers cache" ON public.activities_offers_cache
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- Dynamic offers - keep public for marketing but add expiry validation
DROP POLICY IF EXISTS "Anyone can view active offers" ON public.dynamic_offers;
CREATE POLICY "Anyone can view active valid offers" ON public.dynamic_offers
  FOR SELECT USING (is_active = true AND valid_until > now());

-- Airlines and airports can remain public as they are reference data
-- Cities already secured in previous migration