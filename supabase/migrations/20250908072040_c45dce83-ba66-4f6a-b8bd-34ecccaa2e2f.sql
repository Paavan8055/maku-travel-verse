-- Fix remaining search_path security warnings for trigger functions
-- Update all remaining update trigger functions to include search_path

-- Fix update_document_search_vector function
CREATE OR REPLACE FUNCTION public.update_document_search_vector()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_catalog'
AS $function$
BEGIN
  NEW.search_vector := to_tsvector('english', 
    COALESCE(NEW.document_name, '') || ' ' || 
    COALESCE(NEW.document_type, '') || ' ' ||
    COALESCE(NEW.ai_analysis->>'extractedText', '')
  );
  RETURN NEW;
END;
$function$;

-- Fix update_knowledge_base_search_vector function
CREATE OR REPLACE FUNCTION public.update_knowledge_base_search_vector()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_catalog'
AS $function$
BEGIN
  NEW.search_vector := to_tsvector('english', COALESCE(NEW.title, '') || ' ' || COALESCE(NEW.content, ''));
  RETURN NEW;
END;
$function$;

-- Fix update_partner_analytics function
CREATE OR REPLACE FUNCTION public.update_partner_analytics()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_catalog'
AS $function$
DECLARE
    v_year INTEGER;
    v_month INTEGER;
BEGIN
    v_year := EXTRACT(YEAR FROM NEW.created_at);
    v_month := EXTRACT(MONTH FROM NEW.created_at);
    
    -- Update or insert analytics record
    INSERT INTO public.partner_analytics (
        partner_id,
        year,
        month,
        total_bookings,
        total_revenue,
        total_commission
    ) VALUES (
        NEW.partner_id,
        v_year,
        v_month,
        1,
        NEW.booking_value,
        NEW.commission_amount
    )
    ON CONFLICT (partner_id, year, month) 
    DO UPDATE SET 
        total_bookings = partner_analytics.total_bookings + 1,
        total_revenue = partner_analytics.total_revenue + NEW.booking_value,
        total_commission = partner_analytics.total_commission + NEW.commission_amount,
        avg_booking_value = (partner_analytics.total_revenue + NEW.booking_value) / (partner_analytics.total_bookings + 1),
        updated_at = now();
    
    RETURN NEW;
END;
$function$;

-- Fix update_session_funnel_progress function
CREATE OR REPLACE FUNCTION public.update_session_funnel_progress(p_session_id text, p_step_order integer, p_timestamp timestamp with time zone)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_catalog'
AS $function$
BEGIN
    INSERT INTO public.session_analytics (
        session_id,
        funnel_progress,
        last_activity,
        total_events
    ) VALUES (
        p_session_id,
        p_step_order,
        p_timestamp,
        1
    )
    ON CONFLICT (session_id) 
    DO UPDATE SET
        funnel_progress = GREATEST(session_analytics.funnel_progress, p_step_order),
        last_activity = p_timestamp,
        total_events = session_analytics.total_events + 1,
        updated_at = NOW();
END;
$function$;

-- Fix update_gift_card_updated_at function
CREATE OR REPLACE FUNCTION public.update_gift_card_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_catalog'
AS $function$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$function$;

-- Fix track_booking_status_change function
CREATE OR REPLACE FUNCTION public.track_booking_status_change()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_catalog'
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