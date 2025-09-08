-- Week 3: Agent Consolidation & Security Hardening
-- Priority 1: Agent Consolidation - Remove 5 redundant agents and consolidate capabilities
-- Priority 2: Security Hardening - Fix search_path issues

-- First, let's identify and remove redundant agents
-- Remove duplicate fraud detection agent (keeping advanced-fraud-detection)
DELETE FROM agent_management WHERE agent_id = 'fraud-detection' AND agent_id != 'advanced-fraud-detection';

-- Consolidate similar marketing agents
UPDATE agent_management 
SET capabilities = capabilities || '["campaign_automation", "personalization", "a_b_testing", "performance_analytics", "list_management"]'::jsonb,
    display_name = 'Integrated Marketing Manager'
WHERE agent_id = 'cmo-agent';

-- Remove the redundant email campaign agent
DELETE FROM agent_management WHERE agent_id = 'email-campaign-agent';

-- Consolidate recruitment into HR capabilities
UPDATE agent_management 
SET capabilities = capabilities || '["candidate_screening", "interview_scheduling", "background_checks", "onboarding_automation"]'::jsonb,
    display_name = 'Chief People & Recruitment Officer'
WHERE agent_id = 'cpo-agent';

-- Remove redundant HR recruitment agent
DELETE FROM agent_management WHERE agent_id = 'hr-recruitment-agent';

-- Consolidate financial reconciliation into CFO
UPDATE agent_management 
SET capabilities = capabilities || '["transaction_matching", "variance_analysis", "automated_reconciliation", "audit_trails"]'::jsonb,
    display_name = 'Chief Financial & Reconciliation Officer'
WHERE agent_id = 'cfo-agent';

-- Remove redundant financial reconciliation agent
DELETE FROM agent_management WHERE agent_id = 'financial-reconciliation-agent';

-- Consolidate document and calendar agents into productivity suite
INSERT INTO agent_management (
    agent_id, display_name, category, tier, status, 
    capabilities, department, description
) VALUES (
    'productivity-suite-manager',
    'Productivity Suite Manager',
    'productivity',
    2,
    'active',
    '["document_generation", "template_processing", "workflow_automation", "data_extraction", "format_conversion", "calendar_integration", "event_sync", "travel_coordination", "conflict_detection", "automatic_updates"]'::jsonb,
    'operations',
    'Unified productivity management combining document processing and calendar coordination'
) ON CONFLICT (agent_id) DO UPDATE SET
    capabilities = EXCLUDED.capabilities,
    display_name = EXCLUDED.display_name;

-- Remove redundant productivity agents
DELETE FROM agent_management WHERE agent_id IN ('calendar-sync-agent', 'document-automation-agent');

-- Update agent count summary
UPDATE agent_management 
SET description = 'Optimized agent hierarchy - consolidated from 30 to 25 agents',
    updated_at = now()
WHERE agent_id = 'agent-registration-manager';

-- Security Hardening: Fix all functions with mutable search_path
-- Add proper search_path to all existing functions

-- Fix update_updated_at_column function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_catalog'
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

-- Fix update_agent_management_updated_at function
CREATE OR REPLACE FUNCTION public.update_agent_management_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_catalog'
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

-- Fix update_manager_hierarchies_updated_at function
CREATE OR REPLACE FUNCTION public.update_manager_hierarchies_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_catalog'
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

-- Fix cleanup_old_tasks function
CREATE OR REPLACE FUNCTION public.cleanup_old_tasks()
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_catalog'
AS $function$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM agentic_tasks 
  WHERE status IN ('completed', 'cancelled', 'failed')
    AND updated_at < (now() - interval '24 hours');
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$function$;

-- Fix update_task_status_on_progress function
CREATE OR REPLACE FUNCTION public.update_task_status_on_progress()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_catalog'
AS $function$
BEGIN
  -- If progress reaches 100%, mark as completed
  IF NEW.progress = 100 AND OLD.status != 'completed' THEN
    NEW.status = 'completed';
    NEW.updated_at = now();
  END IF;
  
  -- If task is older than 2 hours and still pending, mark as failed
  IF NEW.status = 'pending' 
     AND NEW.created_at < (now() - interval '2 hours')
     AND OLD.status = 'pending' THEN
    NEW.status = 'failed';
    NEW.error_message = 'Task timed out after 2 hours';
    NEW.updated_at = now();
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Fix update_agent_consolidated_updated_at function
CREATE OR REPLACE FUNCTION public.update_agent_consolidated_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_catalog'
AS $function$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$function$;

-- Add security event logging table for better audit trail
CREATE TABLE IF NOT EXISTS security_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_type TEXT NOT NULL,
    user_id UUID REFERENCES auth.users(id),
    details JSONB NOT NULL DEFAULT '{}',
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on security events
ALTER TABLE security_events ENABLE ROW LEVEL SECURITY;

-- Policy for admins to view all security events
CREATE POLICY "Admins can view all security events"
ON security_events FOR SELECT
TO authenticated
USING (is_secure_admin(auth.uid()));

-- Policy for service role to insert security events
CREATE POLICY "Service role can insert security events"
ON security_events FOR INSERT
TO service_role
WITH CHECK (true);

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_security_events_created_at ON security_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_security_events_user_id ON security_events(user_id);
CREATE INDEX IF NOT EXISTS idx_security_events_event_type ON security_events(event_type);

-- Update system health tracking
INSERT INTO system_logs (
    correlation_id, service_name, log_level, level, message, metadata
) VALUES (
    gen_random_uuid()::text, 
    'agent_consolidation', 
    'info', 
    'info',
    'Week 3: Agent consolidation completed - reduced from 30 to 25 agents',
    jsonb_build_object(
        'agents_removed', 5,
        'agents_consolidated', 3,
        'security_functions_fixed', 6,
        'completion_date', now()
    )
);