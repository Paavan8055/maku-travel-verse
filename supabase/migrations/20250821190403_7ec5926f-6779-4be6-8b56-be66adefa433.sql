-- Create webhook idempotency table for preventing duplicate webhook processing
CREATE TABLE IF NOT EXISTS public.webhook_idempotency (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  idempotency_key TEXT NOT NULL,
  webhook_id TEXT NOT NULL,
  response_data JSONB,
  processed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  UNIQUE(idempotency_key, webhook_id)
);

-- Enable RLS
ALTER TABLE public.webhook_idempotency ENABLE ROW LEVEL SECURITY;

-- Only service role can manage webhook idempotency records
CREATE POLICY "Service role can manage webhook idempotency"
  ON public.webhook_idempotency
  FOR ALL
  USING (auth.role() = 'service_role');

-- Add index for efficient lookups
CREATE INDEX IF NOT EXISTS idx_webhook_idempotency_lookup 
  ON public.webhook_idempotency(idempotency_key, webhook_id);

-- Add index for cleanup (remove old records)
CREATE INDEX IF NOT EXISTS idx_webhook_idempotency_created_at 
  ON public.webhook_idempotency(created_at);

-- Create correlation tracking table for request tracing
CREATE TABLE IF NOT EXISTS public.correlation_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  correlation_id TEXT NOT NULL,
  request_type TEXT NOT NULL,
  request_data JSONB,
  response_data JSONB,
  user_id UUID,
  duration_ms INTEGER,
  status TEXT NOT NULL DEFAULT 'in_progress',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS
ALTER TABLE public.correlation_tracking ENABLE ROW LEVEL SECURITY;

-- Admins can view all correlation data
CREATE POLICY "Admins can view correlation tracking"
  ON public.correlation_tracking
  FOR SELECT
  USING (is_secure_admin(auth.uid()));

-- Service role can manage correlation tracking
CREATE POLICY "Service role can manage correlation tracking"
  ON public.correlation_tracking
  FOR ALL
  USING (auth.role() = 'service_role');

-- Users can view their own correlation data
CREATE POLICY "Users can view own correlation tracking"
  ON public.correlation_tracking
  FOR SELECT
  USING (auth.uid() = user_id);

-- Add indexes for correlation tracking
CREATE INDEX IF NOT EXISTS idx_correlation_tracking_correlation_id 
  ON public.correlation_tracking(correlation_id);

CREATE INDEX IF NOT EXISTS idx_correlation_tracking_user_id 
  ON public.correlation_tracking(user_id);

CREATE INDEX IF NOT EXISTS idx_correlation_tracking_status 
  ON public.correlation_tracking(status);