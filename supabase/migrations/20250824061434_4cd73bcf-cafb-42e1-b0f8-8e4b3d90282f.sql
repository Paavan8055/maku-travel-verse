-- First create the missing booking_transactions table
CREATE TABLE IF NOT EXISTS public.booking_transactions (
  booking_id UUID PRIMARY KEY,
  status TEXT NOT NULL DEFAULT 'pending',
  stripe_payment_intent_id TEXT,
  provider_booking_id TEXT,
  total_amount NUMERIC NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  booking_data JSONB NOT NULL,
  failure_reason TEXT,
  rollback_required BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create critical alerts table for monitoring
CREATE TABLE IF NOT EXISTS public.critical_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID,
  alert_type TEXT NOT NULL,
  message TEXT NOT NULL,
  severity TEXT NOT NULL DEFAULT 'medium',
  requires_manual_action BOOLEAN DEFAULT FALSE,
  resolved BOOLEAN DEFAULT FALSE,
  resolved_at TIMESTAMP WITH TIME ZONE,
  resolved_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create API health tracking table
CREATE TABLE IF NOT EXISTS public.api_health_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider TEXT NOT NULL,
  endpoint TEXT NOT NULL,
  status TEXT NOT NULL,
  response_time_ms INTEGER,
  error_message TEXT,
  checked_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Enable RLS on new tables
ALTER TABLE public.booking_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.critical_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_health_logs ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for new tables
CREATE POLICY "Service role can manage booking transactions" ON public.booking_transactions
FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Users can view their booking transactions" ON public.booking_transactions
FOR SELECT USING (
  booking_id IN (
    SELECT id FROM public.bookings WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Admins can manage critical alerts" ON public.critical_alerts
FOR ALL USING (is_secure_admin(auth.uid()));

CREATE POLICY "Service role can create critical alerts" ON public.critical_alerts
FOR INSERT WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Admins can view API health logs" ON public.api_health_logs
FOR SELECT USING (is_secure_admin(auth.uid()));

CREATE POLICY "Service role can insert API health logs" ON public.api_health_logs
FOR INSERT WITH CHECK (auth.role() = 'service_role');

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_booking_transactions_status ON public.booking_transactions(status);
CREATE INDEX IF NOT EXISTS idx_booking_transactions_stripe_pi ON public.booking_transactions(stripe_payment_intent_id);
CREATE INDEX IF NOT EXISTS idx_critical_alerts_booking_id ON public.critical_alerts(booking_id);
CREATE INDEX IF NOT EXISTS idx_critical_alerts_unresolved ON public.critical_alerts(resolved) WHERE resolved = FALSE;
CREATE INDEX IF NOT EXISTS idx_api_health_logs_provider_endpoint ON public.api_health_logs(provider, endpoint);
CREATE INDEX IF NOT EXISTS idx_api_health_logs_checked_at ON public.api_health_logs(checked_at);

-- Add check constraints
ALTER TABLE public.booking_transactions 
ADD CONSTRAINT check_valid_status 
CHECK (status IN ('pending', 'payment_processing', 'payment_confirmed', 'booking_confirmed', 'completed', 'failed', 'cancelled'));

ALTER TABLE public.critical_alerts 
ADD CONSTRAINT check_valid_severity 
CHECK (severity IN ('low', 'medium', 'high', 'critical'));