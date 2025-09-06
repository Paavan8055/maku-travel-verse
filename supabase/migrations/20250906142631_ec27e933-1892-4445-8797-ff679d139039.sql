-- Phase 7: Finance & Billing Schema

-- Create invoices table for billing and invoice management
CREATE TABLE public.invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  booking_id UUID REFERENCES public.bookings(id) ON DELETE SET NULL,
  invoice_number TEXT UNIQUE NOT NULL,
  invoice_type TEXT NOT NULL DEFAULT 'booking', -- booking, top_up, refund, commission
  status TEXT NOT NULL DEFAULT 'draft', -- draft, sent, paid, overdue, cancelled
  amount NUMERIC NOT NULL,
  currency TEXT NOT NULL DEFAULT 'AUD',
  tax_amount NUMERIC DEFAULT 0,
  total_amount NUMERIC NOT NULL,
  payment_due_date DATE,
  billing_address JSONB,
  line_items JSONB NOT NULL DEFAULT '[]',
  payment_terms TEXT DEFAULT 'Due on receipt',
  notes TEXT,
  issued_date DATE DEFAULT CURRENT_DATE,
  paid_date DATE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create fraud alerts table for security monitoring
CREATE TABLE public.fraud_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  transaction_id UUID, -- Can reference payments, fund_transactions, etc.
  alert_type TEXT NOT NULL, -- suspicious_pattern, velocity_check, geo_anomaly, amount_threshold
  severity TEXT NOT NULL DEFAULT 'medium', -- low, medium, high, critical
  risk_score NUMERIC NOT NULL DEFAULT 0, -- 0-100 risk assessment
  alert_reason TEXT NOT NULL,
  detection_method TEXT NOT NULL, -- rule_based, ml_model, manual_review
  status TEXT NOT NULL DEFAULT 'active', -- active, investigating, resolved, false_positive
  resolved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  resolved_at TIMESTAMPTZ,
  resolution_notes TEXT,
  metadata JSONB DEFAULT '{}',
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Extend fund_transactions table with billing fields
ALTER TABLE public.fund_transactions 
ADD COLUMN IF NOT EXISTS invoice_id UUID REFERENCES public.invoices(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS billing_category TEXT DEFAULT 'general', -- top_up, booking, refund, fee, commission
ADD COLUMN IF NOT EXISTS tax_amount NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS processor_fee NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS net_amount NUMERIC,
ADD COLUMN IF NOT EXISTS payment_method TEXT,
ADD COLUMN IF NOT EXISTS external_transaction_id TEXT,
ADD COLUMN IF NOT EXISTS billing_metadata JSONB DEFAULT '{}';

-- Extend payments table with enhanced billing fields
ALTER TABLE public.payments 
ADD COLUMN IF NOT EXISTS invoice_id UUID REFERENCES public.invoices(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS fraud_check_status TEXT DEFAULT 'pending', -- pending, passed, flagged, blocked
ADD COLUMN IF NOT EXISTS risk_score NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS processor_fee NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS tax_amount NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS billing_address JSONB,
ADD COLUMN IF NOT EXISTS payment_method_details JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS refund_policy TEXT DEFAULT 'standard',
ADD COLUMN IF NOT EXISTS chargeback_liability TEXT DEFAULT 'merchant';

-- Enable RLS on new tables
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fraud_alerts ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for invoices
CREATE POLICY "Users can view their own invoices" 
ON public.invoices FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own invoices" 
ON public.invoices FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own invoices" 
ON public.invoices FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage all invoices" 
ON public.invoices FOR ALL 
USING (auth.role() = 'service_role');

CREATE POLICY "Admins can manage all invoices" 
ON public.invoices FOR ALL 
USING (is_secure_admin(auth.uid()));

-- Create RLS policies for fraud alerts  
CREATE POLICY "Admins can view all fraud alerts" 
ON public.fraud_alerts FOR SELECT 
USING (is_secure_admin(auth.uid()));

CREATE POLICY "Service role can manage all fraud alerts" 
ON public.fraud_alerts FOR ALL 
USING (auth.role() = 'service_role');

CREATE POLICY "Users can view their own fraud alerts" 
ON public.fraud_alerts FOR SELECT 
USING (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX idx_invoices_user_id ON public.invoices(user_id);
CREATE INDEX idx_invoices_status ON public.invoices(status);
CREATE INDEX idx_invoices_booking_id ON public.invoices(booking_id);
CREATE INDEX idx_invoices_invoice_number ON public.invoices(invoice_number);
CREATE INDEX idx_invoices_due_date ON public.invoices(payment_due_date);

CREATE INDEX idx_fraud_alerts_user_id ON public.fraud_alerts(user_id);
CREATE INDEX idx_fraud_alerts_severity ON public.fraud_alerts(severity);
CREATE INDEX idx_fraud_alerts_status ON public.fraud_alerts(status);
CREATE INDEX idx_fraud_alerts_risk_score ON public.fraud_alerts(risk_score);
CREATE INDEX idx_fraud_alerts_created_at ON public.fraud_alerts(created_at);

-- Create trigger for updating timestamps
CREATE TRIGGER update_invoices_updated_at
  BEFORE UPDATE ON public.invoices
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_fraud_alerts_updated_at
  BEFORE UPDATE ON public.fraud_alerts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to generate invoice numbers
CREATE OR REPLACE FUNCTION public.generate_invoice_number()
RETURNS TEXT AS $$
DECLARE
  year_suffix TEXT;
  sequence_num INTEGER;
  invoice_num TEXT;
BEGIN
  year_suffix := EXTRACT(YEAR FROM CURRENT_DATE)::TEXT;
  
  -- Get next sequence number for this year
  SELECT COALESCE(MAX(
    CASE 
      WHEN invoice_number ~ ('^INV-' || year_suffix || '-\d+$') 
      THEN CAST(SPLIT_PART(invoice_number, '-', 3) AS INTEGER)
      ELSE 0 
    END
  ), 0) + 1 
  INTO sequence_num
  FROM public.invoices 
  WHERE invoice_number LIKE 'INV-' || year_suffix || '-%';
  
  invoice_num := 'INV-' || year_suffix || '-' || LPAD(sequence_num::TEXT, 6, '0');
  
  RETURN invoice_num;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to calculate fraud risk score
CREATE OR REPLACE FUNCTION public.calculate_fraud_risk_score(
  p_user_id UUID,
  p_amount NUMERIC,
  p_payment_method TEXT,
  p_ip_address INET DEFAULT NULL
)
RETURNS NUMERIC AS $$
DECLARE
  risk_score NUMERIC := 0;
  user_transaction_count INTEGER;
  recent_transaction_count INTEGER;
  avg_transaction_amount NUMERIC;
BEGIN
  -- Base risk assessment
  
  -- Check user transaction history
  SELECT COUNT(*), AVG(amount) 
  INTO user_transaction_count, avg_transaction_amount
  FROM public.payments 
  WHERE user_id = p_user_id AND status = 'succeeded';
  
  -- New user risk (higher risk for new users)
  IF user_transaction_count = 0 THEN
    risk_score := risk_score + 25;
  ELSIF user_transaction_count < 5 THEN
    risk_score := risk_score + 15;
  END IF;
  
  -- Amount anomaly detection
  IF avg_transaction_amount IS NOT NULL AND p_amount > (avg_transaction_amount * 3) THEN
    risk_score := risk_score + 20;
  END IF;
  
  -- High amount threshold
  IF p_amount > 2000 THEN
    risk_score := risk_score + 15;
  ELSIF p_amount > 5000 THEN
    risk_score := risk_score + 30;
  END IF;
  
  -- Recent transaction velocity check
  SELECT COUNT(*) 
  INTO recent_transaction_count
  FROM public.payments 
  WHERE user_id = p_user_id 
  AND created_at >= NOW() - INTERVAL '1 hour';
  
  IF recent_transaction_count > 3 THEN
    risk_score := risk_score + 25;
  ELSIF recent_transaction_count > 5 THEN
    risk_score := risk_score + 40;
  END IF;
  
  -- Payment method risk
  IF p_payment_method = 'new_card' THEN
    risk_score := risk_score + 10;
  END IF;
  
  -- Ensure score is within 0-100 range
  risk_score := LEAST(100, GREATEST(0, risk_score));
  
  RETURN risk_score;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;