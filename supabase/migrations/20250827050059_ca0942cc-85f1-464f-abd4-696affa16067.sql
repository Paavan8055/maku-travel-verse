-- Emergency Security Fix: Add RLS policies for exposed provider tables
ALTER TABLE public.provider_configs ENABLE ROW LEVEL SECURITY;

-- Admin access only for provider configs
CREATE POLICY "Only admins can access provider configs" 
ON public.provider_configs 
FOR ALL 
USING (is_secure_admin(auth.uid()));

-- Fix provider_quotas table security
ALTER TABLE public.provider_quotas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Only admins can access provider quotas" 
ON public.provider_quotas 
FOR ALL 
USING (is_secure_admin(auth.uid()));

-- Secure API configuration
ALTER TABLE public.api_configuration ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Only admins can access API configuration" 
ON public.api_configuration 
FOR ALL 
USING (is_secure_admin(auth.uid()));

-- Emergency cleanup function for orphaned payment intents
CREATE OR REPLACE FUNCTION emergency_cleanup_payments()
RETURNS JSON AS $$
DECLARE
    cleanup_count INTEGER := 0;
    result JSON;
BEGIN
    -- Count orphaned payments
    SELECT COUNT(*) INTO cleanup_count
    FROM payments p
    LEFT JOIN bookings b ON p.booking_id = b.id
    WHERE b.id IS NULL OR (b.status = 'pending' AND b.created_at < NOW() - INTERVAL '2 hours');
    
    -- Log the emergency cleanup
    INSERT INTO critical_alerts (
        alert_type, 
        severity, 
        message, 
        requires_manual_action,
        metadata
    ) VALUES (
        'emergency_payment_cleanup',
        'high',
        'Emergency cleanup identified ' || cleanup_count || ' orphaned payment records',
        true,
        jsonb_build_object('orphaned_payments', cleanup_count, 'cleanup_time', NOW())
    );
    
    result := json_build_object(
        'success', true,
        'orphaned_payments_found', cleanup_count,
        'cleanup_time', NOW(),
        'message', 'Emergency cleanup analysis completed'
    );
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;