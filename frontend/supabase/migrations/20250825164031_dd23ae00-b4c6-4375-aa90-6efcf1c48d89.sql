-- Security hardening: Restrict provider metrics and configs access to admins only

-- Update RLS policies for provider_metrics table (if it exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'provider_metrics') THEN
        -- Drop existing policies
        DROP POLICY IF EXISTS "Public read access" ON provider_metrics;
        DROP POLICY IF EXISTS "Anyone can view provider metrics" ON provider_metrics;
        
        -- Create admin-only policy
        CREATE POLICY "Admin access only to provider metrics" 
        ON provider_metrics FOR ALL 
        USING (is_secure_admin(auth.uid()));
    END IF;
END
$$;

-- Update RLS policies for provider_configs table (if it exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'provider_configs') THEN
        -- Drop existing policies
        DROP POLICY IF EXISTS "Public read access" ON provider_configs;
        DROP POLICY IF EXISTS "Anyone can view provider configs" ON provider_configs;
        
        -- Create admin-only policy
        CREATE POLICY "Admin access only to provider configs" 
        ON provider_configs FOR ALL 
        USING (is_secure_admin(auth.uid()));
    END IF;
END
$$;

-- Create critical_alerts table if it doesn't exist (for production monitoring)
CREATE TABLE IF NOT EXISTS critical_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    alert_type TEXT NOT NULL,
    message TEXT NOT NULL,
    severity TEXT NOT NULL DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    booking_id UUID REFERENCES bookings(id),
    resolved BOOLEAN DEFAULT false,
    resolved_at TIMESTAMP WITH TIME ZONE,
    resolved_by UUID,
    requires_manual_action BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on critical_alerts
ALTER TABLE critical_alerts ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for critical_alerts
CREATE POLICY "Admins can manage critical alerts" 
ON critical_alerts FOR ALL 
USING (is_secure_admin(auth.uid()));

CREATE POLICY "Service role can create critical alerts" 
ON critical_alerts FOR INSERT 
WITH CHECK (auth.role() = 'service_role');

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_critical_alerts_unresolved ON critical_alerts (resolved, created_at) WHERE resolved = false;

-- Create function to automatically create critical alerts for stuck bookings
CREATE OR REPLACE FUNCTION create_stuck_booking_alert()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
    -- Create alerts for bookings stuck in pending for more than 2 hours
    INSERT INTO critical_alerts (alert_type, message, severity, booking_id, requires_manual_action)
    SELECT 
        'stuck_booking',
        'Booking ' || booking_reference || ' has been pending for over 2 hours',
        CASE 
            WHEN created_at < NOW() - INTERVAL '24 hours' THEN 'critical'
            WHEN created_at < NOW() - INTERVAL '6 hours' THEN 'high'
            ELSE 'medium'
        END,
        id,
        true
    FROM bookings 
    WHERE status = 'pending' 
    AND created_at < NOW() - INTERVAL '2 hours'
    AND id NOT IN (
        SELECT booking_id 
        FROM critical_alerts 
        WHERE alert_type = 'stuck_booking' 
        AND resolved = false 
        AND booking_id IS NOT NULL
    );
END;
$$;