-- Phase 2: Supplier & Partnership Management Tables

-- Partners table for managing supplier relationships
CREATE TABLE public.partners (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    partner_name TEXT NOT NULL,
    partner_type TEXT NOT NULL CHECK (partner_type IN ('hotel', 'flight', 'activity', 'car_rental', 'transfer', 'insurance')),
    contact_info JSONB NOT NULL DEFAULT '{}',
    api_credentials JSONB DEFAULT '{}',
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'pending', 'suspended')),
    commission_rate NUMERIC NOT NULL DEFAULT 0,
    payment_terms TEXT DEFAULT 'NET30',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    metadata JSONB DEFAULT '{}'
);

-- Supplier rates for dynamic pricing
CREATE TABLE public.supplier_rates (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    partner_id UUID NOT NULL REFERENCES public.partners(id),
    service_type TEXT NOT NULL,
    base_rate NUMERIC NOT NULL,
    markup_percentage NUMERIC DEFAULT 0,
    currency TEXT NOT NULL DEFAULT 'AUD',
    valid_from DATE NOT NULL,
    valid_to DATE,
    booking_conditions JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Supplier contracts management
CREATE TABLE public.supplier_contracts (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    partner_id UUID NOT NULL REFERENCES public.partners(id),
    contract_number TEXT NOT NULL UNIQUE,
    contract_type TEXT NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE,
    terms_and_conditions JSONB NOT NULL DEFAULT '{}',
    commission_structure JSONB NOT NULL DEFAULT '{}',
    payment_schedule TEXT DEFAULT 'monthly',
    auto_renewal BOOLEAN DEFAULT false,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'expired', 'terminated', 'pending')),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    signed_by UUID REFERENCES auth.users(id),
    contract_documents JSONB DEFAULT '[]'
);

-- Commission tracking for all partner transactions
CREATE TABLE public.commission_tracking (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    partner_id UUID NOT NULL REFERENCES public.partners(id),
    booking_id UUID REFERENCES public.bookings(id),
    transaction_type TEXT NOT NULL CHECK (transaction_type IN ('booking', 'cancellation', 'modification', 'refund')),
    gross_amount NUMERIC NOT NULL,
    commission_rate NUMERIC NOT NULL,
    commission_amount NUMERIC NOT NULL,
    currency TEXT NOT NULL DEFAULT 'AUD',
    payment_status TEXT NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'disputed', 'cancelled')),
    payment_date DATE,
    invoice_number TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    metadata JSONB DEFAULT '{}'
);

-- Enable RLS on all tables
ALTER TABLE public.partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.supplier_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.supplier_contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.commission_tracking ENABLE ROW LEVEL SECURITY;

-- RLS Policies for Partners
CREATE POLICY "Admins can manage all partners" ON public.partners
    FOR ALL USING (is_secure_admin(auth.uid()));

CREATE POLICY "Service role can manage partners" ON public.partners
    FOR ALL USING (auth.role() = 'service_role');

-- RLS Policies for Supplier Rates
CREATE POLICY "Admins can manage supplier rates" ON public.supplier_rates
    FOR ALL USING (is_secure_admin(auth.uid()));

CREATE POLICY "Service role can manage supplier rates" ON public.supplier_rates
    FOR ALL USING (auth.role() = 'service_role');

-- RLS Policies for Supplier Contracts
CREATE POLICY "Admins can manage supplier contracts" ON public.supplier_contracts
    FOR ALL USING (is_secure_admin(auth.uid()));

CREATE POLICY "Service role can manage supplier contracts" ON public.supplier_contracts
    FOR ALL USING (auth.role() = 'service_role');

-- RLS Policies for Commission Tracking
CREATE POLICY "Admins can view commission tracking" ON public.commission_tracking
    FOR SELECT USING (is_secure_admin(auth.uid()));

CREATE POLICY "Service role can manage commission tracking" ON public.commission_tracking
    FOR ALL USING (auth.role() = 'service_role');

-- Indexes for performance
CREATE INDEX idx_partners_type_status ON public.partners(partner_type, status);
CREATE INDEX idx_supplier_rates_partner_service ON public.supplier_rates(partner_id, service_type);
CREATE INDEX idx_supplier_rates_dates ON public.supplier_rates(valid_from, valid_to);
CREATE INDEX idx_supplier_contracts_partner_status ON public.supplier_contracts(partner_id, status);
CREATE INDEX idx_commission_tracking_partner_date ON public.commission_tracking(partner_id, created_at);
CREATE INDEX idx_commission_tracking_booking ON public.commission_tracking(booking_id);

-- Updated_at triggers
CREATE TRIGGER update_partners_updated_at
    BEFORE UPDATE ON public.partners
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_supplier_rates_updated_at
    BEFORE UPDATE ON public.supplier_rates
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_supplier_contracts_updated_at
    BEFORE UPDATE ON public.supplier_contracts
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_commission_tracking_updated_at
    BEFORE UPDATE ON public.commission_tracking
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();