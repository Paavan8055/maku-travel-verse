-- Create notifications table
CREATE TABLE public.notifications (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('flight_delay', 'price_drop', 'check_in', 'weather_alert', 'document_expiry', 'booking_confirmed', 'payment_success', 'security_alert')),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('high', 'medium', 'low')),
    is_read BOOLEAN NOT NULL DEFAULT false,
    action_url TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on notifications
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for notifications
CREATE POLICY "Users can view their own notifications" 
ON public.notifications 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications" 
ON public.notifications 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Service role can create notifications for users
CREATE POLICY "Service role can create notifications" 
ON public.notifications 
FOR INSERT 
WITH CHECK (auth.role() = 'service_role');

-- Create user documents table
CREATE TABLE public.user_documents (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    document_type TEXT NOT NULL CHECK (document_type IN ('boarding_pass', 'hotel_confirmation', 'passport', 'visa', 'insurance', 'receipt', 'vaccination')),
    title TEXT NOT NULL,
    description TEXT,
    file_path TEXT,
    file_size INTEGER,
    mime_type TEXT,
    document_number TEXT,
    issue_date DATE,
    expiry_date DATE,
    issuing_authority TEXT,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'expired', 'revoked')),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on user documents
ALTER TABLE public.user_documents ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for user documents
CREATE POLICY "Users can manage their own documents" 
ON public.user_documents 
FOR ALL 
USING (auth.uid() = user_id) 
WITH CHECK (auth.uid() = user_id);

-- Create admin dashboard metrics table for caching
CREATE TABLE public.admin_metrics_cache (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    metric_type TEXT NOT NULL,
    metric_value JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '1 hour')
);

-- Enable RLS on admin metrics cache
ALTER TABLE public.admin_metrics_cache ENABLE ROW LEVEL SECURITY;

-- Only admins can access metrics cache
CREATE POLICY "Admins can access metrics cache" 
ON public.admin_metrics_cache 
FOR ALL 
USING (is_secure_admin(auth.uid()));

-- Create trigger to update updated_at timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_notifications()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_notifications_updated_at
    BEFORE UPDATE ON public.notifications
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_notifications();

CREATE TRIGGER trigger_update_documents_updated_at
    BEFORE UPDATE ON public.user_documents
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to check document expiry and create notifications
CREATE OR REPLACE FUNCTION public.check_document_expiry()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Create notifications for documents expiring within 90 days
    INSERT INTO public.notifications (user_id, type, title, message, priority, metadata)
    SELECT 
        ud.user_id,
        'document_expiry',
        'Document Expiry Warning',
        'Your ' || ud.title || ' expires on ' || ud.expiry_date::text || '. Please renew to avoid travel disruptions.',
        CASE 
            WHEN ud.expiry_date <= CURRENT_DATE + interval '30 days' THEN 'high'
            WHEN ud.expiry_date <= CURRENT_DATE + interval '60 days' THEN 'medium'
            ELSE 'low'
        END,
        jsonb_build_object('document_id', ud.id, 'expiry_date', ud.expiry_date)
    FROM public.user_documents ud
    WHERE ud.expiry_date IS NOT NULL
    AND ud.expiry_date <= CURRENT_DATE + interval '90 days'
    AND ud.expiry_date > CURRENT_DATE
    AND ud.status = 'active'
    AND NOT EXISTS (
        SELECT 1 FROM public.notifications n
        WHERE n.user_id = ud.user_id
        AND n.type = 'document_expiry'
        AND n.metadata->>'document_id' = ud.id::text
        AND n.created_at > CURRENT_DATE - interval '7 days'
    );
END;
$$;