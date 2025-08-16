-- PHASE 1: Create guest booking security tables
CREATE TABLE IF NOT EXISTS public.guest_booking_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
    access_token TEXT NOT NULL UNIQUE,
    email_hash TEXT NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (NOW() + INTERVAL '24 hours'),
    access_level TEXT NOT NULL DEFAULT 'full' CHECK (access_level IN ('full', 'read_only')),
    access_count INTEGER DEFAULT 0,
    last_accessed TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS and indexes
ALTER TABLE public.guest_booking_tokens ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_guest_tokens_booking ON public.guest_booking_tokens(booking_id);
CREATE INDEX idx_guest_tokens_access ON public.guest_booking_tokens(access_token);
CREATE INDEX idx_guest_tokens_expires ON public.guest_booking_tokens(expires_at);

-- Create AI training data table
CREATE TABLE IF NOT EXISTS public.ai_training_bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    original_booking_id UUID NOT NULL,
    booking_type TEXT NOT NULL,
    anonymized_data JSONB NOT NULL,
    behavioral_patterns JSONB,
    location_data JSONB,
    price_patterns JSONB,
    booking_flow_data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    anonymized_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create booking access audit table
CREATE TABLE IF NOT EXISTS public.booking_access_audit (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id UUID NOT NULL,
    access_type TEXT NOT NULL CHECK (access_type IN ('guest_token', 'authenticated_user', 'admin', 'system')),
    access_method TEXT,
    ip_address INET,
    user_agent TEXT,
    accessed_data JSONB,
    success BOOLEAN NOT NULL,
    failure_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on new tables
ALTER TABLE public.booking_access_audit ENABLE ROW LEVEL SECURITY;