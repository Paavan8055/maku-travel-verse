-- Create user_memories table for Mem0 integration
CREATE TABLE IF NOT EXISTS public.user_memories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mem0_id TEXT UNIQUE NOT NULL,
  user_id TEXT NOT NULL, -- Mem0 user ID (may not match auth.users)
  memory_content TEXT NOT NULL,
  memory_type TEXT NOT NULL DEFAULT 'general_travel_memory',
  metadata JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create user_travel_preferences table for extracted preferences
CREATE TABLE IF NOT EXISTS public.user_travel_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT UNIQUE NOT NULL,
  preferences JSONB NOT NULL DEFAULT '{}',
  last_memory_update TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create backup_logs table for backup tracking
CREATE TABLE IF NOT EXISTS public.backup_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  backup_name TEXT UNIQUE NOT NULL,
  backup_type TEXT NOT NULL,
  file_size_bytes BIGINT,
  tables_included TEXT[],
  git_commit TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  environment TEXT DEFAULT 'production'
);

-- Create monitoring_logs table for system monitoring
CREATE TABLE IF NOT EXISTS public.monitoring_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  timestamp TIMESTAMPTZ NOT NULL DEFAULT now(),
  git_commit TEXT,
  workflow_run TEXT,
  health_status JSONB NOT NULL DEFAULT '{}',
  performance JSONB DEFAULT '{}',
  provider_health JSONB DEFAULT '{}',
  environment TEXT DEFAULT 'production'
);

-- Enable RLS on new tables
ALTER TABLE public.user_memories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_travel_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.backup_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.monitoring_logs ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for user_memories
CREATE POLICY "Service role can manage user memories" 
ON public.user_memories 
FOR ALL 
USING (auth.role() = 'service_role');

CREATE POLICY "Users can read own memories" 
ON public.user_memories 
FOR SELECT 
USING (user_id = auth.jwt() ->> 'sub' OR is_secure_admin(auth.uid()));

-- Create RLS policies for user_travel_preferences
CREATE POLICY "Service role can manage travel preferences" 
ON public.user_travel_preferences 
FOR ALL 
USING (auth.role() = 'service_role');

CREATE POLICY "Users can read own preferences" 
ON public.user_travel_preferences 
FOR SELECT 
USING (user_id = auth.jwt() ->> 'sub' OR is_secure_admin(auth.uid()));

-- Create RLS policies for backup_logs
CREATE POLICY "Service role can manage backup logs" 
ON public.backup_logs 
FOR ALL 
USING (auth.role() = 'service_role');

CREATE POLICY "Admins can read backup logs" 
ON public.backup_logs 
FOR SELECT 
USING (is_secure_admin(auth.uid()));

-- Create RLS policies for monitoring_logs
CREATE POLICY "Service role can manage monitoring logs" 
ON public.monitoring_logs 
FOR ALL 
USING (auth.role() = 'service_role');

CREATE POLICY "Admins can read monitoring logs" 
ON public.monitoring_logs 
FOR SELECT 
USING (is_secure_admin(auth.uid()));

-- Create indexes
CREATE INDEX idx_user_memories_user_id ON public.user_memories (user_id);
CREATE INDEX idx_user_memories_type ON public.user_memories (memory_type);
CREATE INDEX idx_user_memories_active ON public.user_memories (is_active, created_at DESC);
CREATE INDEX idx_travel_preferences_user_id ON public.user_travel_preferences (user_id);
CREATE INDEX idx_backup_logs_created_at ON public.backup_logs (created_at DESC);
CREATE INDEX idx_monitoring_logs_timestamp ON public.monitoring_logs (timestamp DESC);

-- Create triggers for updated_at
CREATE TRIGGER user_memories_updated_at_trigger
  BEFORE UPDATE ON public.user_memories
  FOR EACH ROW
  EXECUTE FUNCTION update_environment_updated_at();

CREATE TRIGGER user_travel_preferences_updated_at_trigger
  BEFORE UPDATE ON public.user_travel_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_environment_updated_at();