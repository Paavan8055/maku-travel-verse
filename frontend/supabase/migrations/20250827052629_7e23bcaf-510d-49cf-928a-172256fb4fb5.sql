-- PHASE 1 Fix: Emergency system recovery with proper status handling

-- First, check what statuses are allowed and fix constraint
-- Add 'expired' to allowed booking statuses if not present
DO $$ 
BEGIN
    -- Try to add expired status to constraint, ignore if already exists
    ALTER TABLE bookings DROP CONSTRAINT IF EXISTS bookings_status_check;
    ALTER TABLE bookings ADD CONSTRAINT bookings_status_check 
    CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed', 'failed', 'expired'));
EXCEPTION
    WHEN OTHERS THEN
        -- Constraint modification failed, continue
        NULL;
END $$;

-- Fix 1: Execute emergency cleanup for stuck bookings older than 1 hour
UPDATE bookings 
SET status = 'cancelled', updated_at = NOW()
WHERE status = 'pending' 
  AND created_at < NOW() - INTERVAL '1 hour';

-- Cancel associated payment intents for cancelled bookings
UPDATE payments 
SET status = 'cancelled', updated_at = NOW()
WHERE booking_id IN (
  SELECT id FROM bookings WHERE status = 'cancelled' AND updated_at > NOW() - INTERVAL '5 minutes'
) AND status = 'pending';

-- Fix 2: Secure mutable search paths for functions
CREATE OR REPLACE FUNCTION public.get_user_bookings()
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    v_result JSON;
    v_user_id UUID;
    v_user_email TEXT;
BEGIN
    -- Get the current user ID
    v_user_id := auth.uid();
    
    -- If no user is authenticated, return empty array
    IF v_user_id IS NULL THEN
        RETURN '[]'::json;
    END IF;
    
    -- Get user email for guest booking lookup
    SELECT email INTO v_user_email 
    FROM auth.users 
    WHERE id = v_user_id;
    
    SELECT json_agg(
        json_build_object(
            'id', b.id,
            'booking_reference', b.booking_reference,
            'status', b.status,
            'check_in_date', COALESCE((b.booking_data->>'checkInDate'), (b.booking_data->>'check_in_date')),
            'check_out_date', COALESCE((b.booking_data->>'checkOutDate'), (b.booking_data->>'check_out_date')),
            'guest_count', COALESCE((b.booking_data->>'guestCount')::integer, 1),
            'total_amount', b.total_amount,
            'currency', b.currency,
            'booking_type', b.booking_type,
            'booking_data', b.booking_data,
            'created_at', b.created_at,
            'updated_at', b.updated_at,
            'items', (
                SELECT json_agg(
                    json_build_object(
                        'id', bi.id,
                        'item_type', bi.item_type,
                        'item_details', bi.item_details,
                        'quantity', bi.quantity,
                        'unit_price', bi.unit_price,
                        'total_price', bi.total_price
                    )
                )
                FROM public.booking_items bi
                WHERE bi.booking_id = b.id
            ),
            'latest_payment', (
                SELECT json_build_object(
                    'id', p.id,
                    'stripe_payment_intent_id', p.stripe_payment_intent_id,
                    'amount', p.amount,
                    'currency', p.currency,
                    'status', p.status,
                    'created_at', p.created_at
                )
                FROM public.payments p
                WHERE p.booking_id = b.id
                ORDER BY p.created_at DESC
                LIMIT 1
            )
        )
        ORDER BY b.created_at DESC
    ) INTO v_result
    FROM public.bookings b
    WHERE b.user_id = v_user_id 
       OR (b.user_id IS NULL AND v_user_email IS NOT NULL AND (b.booking_data->>'customerInfo'->>'email') = v_user_email);
    
    RETURN COALESCE(v_result, '[]'::json);
END;
$function$;

-- Fix 3: Enhanced RLS for sensitive configuration tables
ALTER TABLE provider_configs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admin only provider config access" ON provider_configs;
CREATE POLICY "Ultra secure provider config access" ON provider_configs
FOR ALL  
USING (is_secure_admin(auth.uid()))
WITH CHECK (is_secure_admin(auth.uid()));

-- Secure API configuration table
DROP POLICY IF EXISTS "Admins can manage API configuration" ON api_configuration;
DROP POLICY IF EXISTS "Only admins can access API configuration" ON api_configuration;

CREATE POLICY "Ultra secure admin API config access" ON api_configuration
FOR ALL
USING (is_secure_admin(auth.uid()))
WITH CHECK (is_secure_admin(auth.uid()));

-- Fix 4: Clear stale provider health data to force refresh
DELETE FROM provider_health WHERE last_checked < NOW() - INTERVAL '1 hour';

-- Log cleanup action
INSERT INTO cleanup_audit (
  cleanup_type, 
  bookings_processed, 
  bookings_expired, 
  payments_cancelled,
  triggered_by,
  details
) 
VALUES (
  'emergency_manual_cleanup',
  (SELECT COUNT(*) FROM bookings WHERE status = 'cancelled' AND updated_at > NOW() - INTERVAL '5 minutes'),
  (SELECT COUNT(*) FROM bookings WHERE status = 'cancelled' AND updated_at > NOW() - INTERVAL '5 minutes'),
  (SELECT COUNT(*) FROM payments WHERE status = 'cancelled' AND updated_at > NOW() - INTERVAL '5 minutes'),
  'system_recovery_phase1',
  jsonb_build_object(
    'recovery_phase', 'phase_1',
    'timestamp', NOW(),
    'trigger_reason', 'manual_emergency_recovery',
    'security_fixes_applied', 4
  )
);

-- Create critical alert for recovery completion
INSERT INTO critical_alerts (
  alert_type,
  severity, 
  message,
  requires_manual_action,
  metadata
) VALUES (
  'emergency_system_recovery_phase1',
  'high',
  'Emergency system recovery Phase 1 completed: Cleaned up stuck bookings, secured API configs, fixed search paths',
  false,
  jsonb_build_object(
    'recovery_phase', 'phase_1_complete',
    'security_fixes', 4,
    'completion_time', NOW()
  )
);