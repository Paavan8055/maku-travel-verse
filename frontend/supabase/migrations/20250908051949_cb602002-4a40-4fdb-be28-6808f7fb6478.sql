-- Week 2: Database Schema Consolidation and Performance Optimization
-- Target: Reduce query time from 78ms to 50ms, consolidate 16 agent tables into 3 core tables

-- 1. STRATEGIC INDEXES for Performance Optimization
-- Add compound indexes for most common queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_agent_management_status_category 
ON agent_management (status, category) WHERE status = 'active';

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_agent_management_tier_health 
ON agent_management (tier, health_status, last_health_check);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_agentic_tasks_status_user_created 
ON agentic_tasks (status, user_id, created_at DESC) WHERE status IN ('pending', 'in_progress');

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_agentic_tasks_agent_status 
ON agentic_tasks (agent_id, status, updated_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_agent_performance_metrics_date_agent 
ON agent_performance_metrics (metric_date DESC, agent_id);

-- Partial indexes for hot data (last 7 days)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_agentic_tasks_recent_hot 
ON agentic_tasks (status, created_at, agent_id) 
WHERE created_at > NOW() - INTERVAL '7 days';

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_agent_context_memory_session_recent 
ON agent_context_memory (session_id, agent_id, created_at DESC) 
WHERE created_at > NOW() - INTERVAL '24 hours';

-- 2. CONSOLIDATED CORE TABLES STRUCTURE

-- Create new consolidated agent runtime table
CREATE TABLE IF NOT EXISTS agent_runtime_consolidated (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_id TEXT NOT NULL,
    
    -- Core Management Data (from agent_management)
    display_name TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'active',
    category TEXT NOT NULL DEFAULT 'general',
    tier INTEGER DEFAULT 4,
    tier_name TEXT DEFAULT 'support',
    health_status TEXT NOT NULL DEFAULT 'healthy',
    last_health_check TIMESTAMPTZ DEFAULT NOW(),
    
    -- Configuration & Capabilities
    configuration JSONB NOT NULL DEFAULT '{}',
    capabilities JSONB NOT NULL DEFAULT '[]',
    permissions JSONB NOT NULL DEFAULT '{}',
    performance_settings JSONB NOT NULL DEFAULT '{}',
    
    -- Performance Metrics (consolidated from agent_performance_metrics)
    current_metrics JSONB NOT NULL DEFAULT '{
        "total_tasks": 0,
        "successful_tasks": 0,
        "failed_tasks": 0,
        "average_response_time_ms": 0,
        "error_rate": 0,
        "throughput_per_hour": 0,
        "last_updated": null
    }',
    
    -- Context & Memory Summary
    active_contexts INTEGER DEFAULT 0,
    memory_usage_mb INTEGER DEFAULT 0,
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Constraints
    UNIQUE(agent_id)
);

-- Create consolidated agent tasks table (merge agentic_tasks, agent_task_queue, agent_delegations)
CREATE TABLE IF NOT EXISTS agent_tasks_consolidated (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Core Task Data
    task_type TEXT NOT NULL,
    agent_id TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    priority INTEGER DEFAULT 1,
    
    -- User & Session Data
    user_id UUID,
    session_id TEXT,
    correlation_id TEXT,
    
    -- Task Content
    intent TEXT,
    params JSONB NOT NULL DEFAULT '{}',
    task_data JSONB NOT NULL DEFAULT '{}',
    result JSONB,
    
    -- Progress Tracking
    progress INTEGER DEFAULT 0,
    estimated_duration_minutes INTEGER,
    actual_duration_minutes INTEGER,
    
    -- Delegation Data (consolidated from agent_delegations)
    manager_id TEXT,
    delegation_status TEXT,
    delegation_result JSONB,
    
    -- Error Handling
    error_message TEXT,
    retry_count INTEGER DEFAULT 0,
    max_retries INTEGER DEFAULT 3,
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    assigned_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Performance indexes
    CONSTRAINT valid_priority CHECK (priority >= 1 AND priority <= 5),
    CONSTRAINT valid_progress CHECK (progress >= 0 AND progress <= 100)
);

-- Create consolidated agent audit table (merge agent_audit_logs, agent_alerts)
CREATE TABLE IF NOT EXISTS agent_audit_consolidated (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Core Audit Data
    entry_type TEXT NOT NULL, -- 'audit', 'alert', 'performance'
    severity TEXT NOT NULL DEFAULT 'info', -- 'low', 'medium', 'high', 'critical'
    
    -- Agent & Action Data
    agent_id TEXT,
    action_type TEXT NOT NULL,
    action_description TEXT NOT NULL,
    
    -- Alert Data (from agent_alerts)
    alert_type TEXT,
    title TEXT,
    message TEXT,
    alert_data JSONB DEFAULT '{}',
    is_resolved BOOLEAN DEFAULT FALSE,
    resolved_at TIMESTAMPTZ,
    resolved_by UUID,
    acknowledgements JSONB DEFAULT '[]',
    
    -- Audit Data (from agent_audit_logs)
    resource_type TEXT,
    resource_id TEXT,
    old_values JSONB,
    new_values JSONB,
    performed_by UUID,
    
    -- Session & Context
    session_id TEXT,
    ip_address INET,
    user_agent TEXT,
    correlation_id TEXT,
    
    -- Metadata
    metadata JSONB DEFAULT '{}',
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. ADD STRATEGIC INDEXES TO NEW CONSOLIDATED TABLES

-- Agent Runtime Indexes
CREATE INDEX idx_agent_runtime_status_category ON agent_runtime_consolidated (status, category);
CREATE INDEX idx_agent_runtime_tier_health ON agent_runtime_consolidated (tier, health_status);
CREATE INDEX idx_agent_runtime_agent_id ON agent_runtime_consolidated (agent_id);
CREATE INDEX idx_agent_runtime_updated_at ON agent_runtime_consolidated (updated_at DESC);

-- Agent Tasks Indexes (covering most common queries)
CREATE INDEX idx_agent_tasks_status_priority ON agent_tasks_consolidated (status, priority DESC, created_at DESC);
CREATE INDEX idx_agent_tasks_agent_status ON agent_tasks_consolidated (agent_id, status, updated_at DESC);
CREATE INDEX idx_agent_tasks_user_status ON agent_tasks_consolidated (user_id, status, created_at DESC) WHERE user_id IS NOT NULL;
CREATE INDEX idx_agent_tasks_session ON agent_tasks_consolidated (session_id, agent_id) WHERE session_id IS NOT NULL;

-- Agent Audit Indexes
CREATE INDEX idx_agent_audit_type_severity ON agent_audit_consolidated (entry_type, severity, created_at DESC);
CREATE INDEX idx_agent_audit_agent_action ON agent_audit_consolidated (agent_id, action_type, created_at DESC);
CREATE INDEX idx_agent_audit_unresolved_alerts ON agent_audit_consolidated (entry_type, is_resolved, severity) 
WHERE entry_type = 'alert' AND is_resolved = FALSE;

-- 4. CREATE TRIGGERS FOR AUTO-UPDATE TIMESTAMPS
CREATE OR REPLACE FUNCTION update_agent_consolidated_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers to consolidated tables
CREATE TRIGGER trigger_agent_runtime_updated_at
    BEFORE UPDATE ON agent_runtime_consolidated
    FOR EACH ROW EXECUTE FUNCTION update_agent_consolidated_updated_at();

CREATE TRIGGER trigger_agent_tasks_updated_at
    BEFORE UPDATE ON agent_tasks_consolidated
    FOR EACH ROW EXECUTE FUNCTION update_agent_consolidated_updated_at();

CREATE TRIGGER trigger_agent_audit_updated_at
    BEFORE UPDATE ON agent_audit_consolidated
    FOR EACH ROW EXECUTE FUNCTION update_agent_consolidated_updated_at();

-- 5. PERFORMANCE OPTIMIZATION: Add materialized view for real-time agent stats
CREATE MATERIALIZED VIEW IF NOT EXISTS agent_performance_summary AS
SELECT 
    arc.agent_id,
    arc.display_name,
    arc.status,
    arc.category,
    arc.tier,
    arc.health_status,
    
    -- Task statistics from last 24 hours
    COUNT(atc.id) FILTER (WHERE atc.created_at > NOW() - INTERVAL '24 hours') as tasks_24h,
    COUNT(atc.id) FILTER (WHERE atc.status = 'completed' AND atc.created_at > NOW() - INTERVAL '24 hours') as completed_24h,
    COUNT(atc.id) FILTER (WHERE atc.status = 'failed' AND atc.created_at > NOW() - INTERVAL '24 hours') as failed_24h,
    
    -- Performance metrics
    AVG(atc.actual_duration_minutes) FILTER (WHERE atc.completed_at > NOW() - INTERVAL '24 hours') as avg_duration_24h,
    COUNT(aac.id) FILTER (WHERE aac.entry_type = 'alert' AND aac.is_resolved = FALSE) as open_alerts,
    
    -- Current status
    arc.current_metrics,
    arc.last_health_check,
    arc.updated_at

FROM agent_runtime_consolidated arc
LEFT JOIN agent_tasks_consolidated atc ON arc.agent_id = atc.agent_id
LEFT JOIN agent_audit_consolidated aac ON arc.agent_id = aac.agent_id
WHERE arc.status = 'active'
GROUP BY arc.id, arc.agent_id, arc.display_name, arc.status, arc.category, arc.tier, 
         arc.health_status, arc.current_metrics, arc.last_health_check, arc.updated_at;

-- Create index on materialized view
CREATE INDEX idx_agent_perf_summary_agent_id ON agent_performance_summary (agent_id);
CREATE INDEX idx_agent_perf_summary_category_tier ON agent_performance_summary (category, tier);

-- 6. RLS POLICIES for consolidated tables
ALTER TABLE agent_runtime_consolidated ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_tasks_consolidated ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_audit_consolidated ENABLE ROW LEVEL SECURITY;

-- Admin access to all consolidated data
CREATE POLICY "Admins can manage all agent runtime data" ON agent_runtime_consolidated
    FOR ALL USING (is_secure_admin(auth.uid()));

CREATE POLICY "Admins can manage all agent tasks data" ON agent_tasks_consolidated
    FOR ALL USING (is_secure_admin(auth.uid()));

CREATE POLICY "Admins can manage all agent audit data" ON agent_audit_consolidated
    FOR ALL USING (is_secure_admin(auth.uid()));

-- Service role access
CREATE POLICY "Service role can manage agent runtime" ON agent_runtime_consolidated
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role can manage agent tasks" ON agent_tasks_consolidated
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role can manage agent audit" ON agent_audit_consolidated
    FOR ALL USING (auth.role() = 'service_role');

-- User access to their own tasks
CREATE POLICY "Users can view their own agent tasks" ON agent_tasks_consolidated
    FOR SELECT USING (auth.uid() = user_id OR (auth.uid() IS NULL AND user_id IS NULL));

-- 7. CLEANUP FUNCTION for old data
CREATE OR REPLACE FUNCTION cleanup_old_agent_data()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER := 0;
BEGIN
    -- Clean up completed tasks older than 30 days
    DELETE FROM agent_tasks_consolidated 
    WHERE status IN ('completed', 'failed', 'cancelled')
      AND completed_at < NOW() - INTERVAL '30 days';
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    -- Clean up old audit entries (keep last 90 days)
    DELETE FROM agent_audit_consolidated 
    WHERE entry_type IN ('audit', 'performance')
      AND created_at < NOW() - INTERVAL '90 days';
    
    -- Keep critical alerts for 180 days
    DELETE FROM agent_audit_consolidated 
    WHERE entry_type = 'alert' 
      AND severity NOT IN ('high', 'critical')
      AND created_at < NOW() - INTERVAL '90 days';
      
    DELETE FROM agent_audit_consolidated 
    WHERE entry_type = 'alert' 
      AND severity IN ('high', 'critical')
      AND is_resolved = TRUE
      AND created_at < NOW() - INTERVAL '180 days';
    
    -- Refresh materialized view
    REFRESH MATERIALIZED VIEW agent_performance_summary;
    
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Schedule cleanup to run daily
SELECT cron.schedule('cleanup-agent-data', '0 2 * * *', 'SELECT cleanup_old_agent_data();');