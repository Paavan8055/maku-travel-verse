-- Phase 6: Data Management & Integration Tables

-- Migration logs for schema migration tracking
CREATE TABLE public.migration_logs (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    migration_name TEXT NOT NULL,
    migration_version TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    error_message TEXT,
    rollback_sql TEXT,
    applied_by UUID REFERENCES auth.users(id),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- API key rotations for credential management  
CREATE TABLE public.api_key_rotations (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    provider TEXT NOT NULL,
    key_name TEXT NOT NULL,
    rotation_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    old_key_hash TEXT,
    new_key_hash TEXT,
    rotation_reason TEXT,
    rotated_by UUID REFERENCES auth.users(id),
    next_rotation_date TIMESTAMP WITH TIME ZONE,
    status TEXT NOT NULL DEFAULT 'active',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Data import logs for ingestion tracking
CREATE TABLE public.data_import_logs (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    import_source TEXT NOT NULL,
    import_type TEXT NOT NULL,
    file_name TEXT,
    file_size BIGINT,
    total_records INTEGER DEFAULT 0,
    processed_records INTEGER DEFAULT 0,
    failed_records INTEGER DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'pending',
    started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    error_details JSONB,
    validation_errors JSONB,
    processed_by UUID REFERENCES auth.users(id),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.migration_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_key_rotations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.data_import_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for migration_logs
CREATE POLICY "Admins can manage migration logs" ON public.migration_logs
FOR ALL USING (is_secure_admin(auth.uid()));

CREATE POLICY "Service role can manage migration logs" ON public.migration_logs
FOR ALL USING (auth.role() = 'service_role');

-- RLS Policies for api_key_rotations
CREATE POLICY "Admins can manage API key rotations" ON public.api_key_rotations
FOR ALL USING (is_secure_admin(auth.uid()));

CREATE POLICY "Service role can manage API key rotations" ON public.api_key_rotations
FOR ALL USING (auth.role() = 'service_role');

-- RLS Policies for data_import_logs
CREATE POLICY "Admins can manage data import logs" ON public.data_import_logs
FOR ALL USING (is_secure_admin(auth.uid()));

CREATE POLICY "Service role can manage data import logs" ON public.data_import_logs
FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Users can view their own import logs" ON public.data_import_logs
FOR SELECT USING (auth.uid() = processed_by);

-- Add triggers for updated_at
CREATE TRIGGER update_migration_logs_updated_at
    BEFORE UPDATE ON public.migration_logs
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_api_key_rotations_updated_at
    BEFORE UPDATE ON public.api_key_rotations
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_data_import_logs_updated_at
    BEFORE UPDATE ON public.data_import_logs
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Indexes for performance
CREATE INDEX idx_migration_logs_status ON public.migration_logs(status);
CREATE INDEX idx_migration_logs_version ON public.migration_logs(migration_version);
CREATE INDEX idx_api_key_rotations_provider ON public.api_key_rotations(provider, key_name);
CREATE INDEX idx_api_key_rotations_next_rotation ON public.api_key_rotations(next_rotation_date) WHERE status = 'active';
CREATE INDEX idx_data_import_logs_status ON public.data_import_logs(status);
CREATE INDEX idx_data_import_logs_source ON public.data_import_logs(import_source, import_type);