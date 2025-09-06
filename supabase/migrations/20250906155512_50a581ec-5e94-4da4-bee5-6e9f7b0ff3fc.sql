-- Populate agent management data with all available agents
INSERT INTO public.agent_management (
  agent_id, display_name, description, category, status, health_status,
  version, capabilities, configuration, permissions, performance_settings
) VALUES 
-- Existing agents
('hr-recruitment-agent', 'HR Recruitment Assistant', 'Streamlines hiring processes and candidate management', 'hr', 'active', 'healthy', '2.1.0', 
 '["candidate_screening", "interview_scheduling", "background_checks", "onboarding_automation"]'::jsonb,
 '{"auto_screen": true, "schedule_interviews": true, "send_notifications": true}'::jsonb,
 '{"read_candidates": true, "write_interviews": true, "access_background_checks": true}'::jsonb,
 '{"max_concurrent_tasks": 10, "priority_level": "high", "response_timeout": 30000}'::jsonb),

('travel-booking-agent', 'Smart Travel Coordinator', 'Handles complex multi-service travel bookings with real-time optimization', 'travel', 'active', 'healthy', '3.2.1',
 '["flight_booking", "hotel_reservation", "activity_planning", "itinerary_optimization", "real_time_updates"]'::jsonb,
 '{"auto_optimize": true, "price_monitoring": true, "alternative_suggestions": true}'::jsonb,
 '{"book_flights": true, "reserve_hotels": true, "manage_activities": true, "access_pricing": true}'::jsonb,
 '{"max_concurrent_bookings": 25, "priority_level": "critical", "response_timeout": 45000}'::jsonb),

('data-analytics-agent', 'Advanced Analytics Engine', 'Processes complex data patterns and generates actionable insights', 'analytics', 'active', 'healthy', '4.0.2',
 '["pattern_recognition", "predictive_modeling", "report_generation", "data_visualization", "anomaly_detection"]'::jsonb,
 '{"auto_analysis": true, "scheduled_reports": true, "alert_thresholds": {"critical": 95, "warning": 80}}'::jsonb,
 '{"read_all_data": true, "generate_reports": true, "create_visualizations": true}'::jsonb,
 '{"max_data_processing": 1000000, "priority_level": "high", "response_timeout": 120000}'::jsonb),

('customer-support-agent', 'Intelligent Support Assistant', 'Provides 24/7 customer support with context-aware responses', 'support', 'active', 'healthy', '2.8.3',
 '["natural_language_processing", "ticket_routing", "knowledge_base_search", "escalation_management"]'::jsonb,
 '{"auto_respond": true, "escalate_complex": true, "learn_from_interactions": true}'::jsonb,
 '{"read_tickets": true, "respond_customers": true, "escalate_issues": true, "access_knowledge_base": true}'::jsonb,
 '{"max_concurrent_chats": 50, "priority_level": "critical", "response_timeout": 15000}'::jsonb),

-- New agents from the modules
('calendar-sync-agent', 'Calendar Synchronization Manager', 'Manages calendar integrations and travel booking synchronization', 'productivity', 'active', 'healthy', '1.5.2',
 '["calendar_integration", "event_sync", "travel_coordination", "conflict_detection", "automatic_updates"]'::jsonb,
 '{"sync_frequency": 300, "conflict_resolution": "auto", "notification_preferences": {"email": true, "push": true}}'::jsonb,
 '{"read_calendars": true, "write_events": true, "sync_bookings": true, "resolve_conflicts": true}'::jsonb,
 '{"max_calendars": 20, "priority_level": "medium", "response_timeout": 25000}'::jsonb),

('group-booking-coordinator', 'Group Travel Coordinator', 'Orchestrates complex group bookings with multi-participant management', 'travel', 'active', 'healthy', '2.3.1',
 '["group_coordination", "multi_booking", "payment_splitting", "communication_hub", "itinerary_sync"]'::jsonb,
 '{"auto_coordinate": true, "payment_reminders": true, "group_notifications": true}'::jsonb,
 '{"coordinate_groups": true, "manage_payments": true, "send_communications": true, "sync_itineraries": true}'::jsonb,
 '{"max_group_size": 100, "priority_level": "high", "response_timeout": 60000}'::jsonb),

('predictive-rebooking-agent', 'Predictive Rebooking Assistant', 'Proactively manages rebookings using ML-driven predictions', 'travel', 'active', 'healthy', '3.1.0',
 '["predictive_analytics", "rebooking_automation", "risk_assessment", "customer_communication", "alternative_options"]'::jsonb,
 '{"prediction_threshold": 0.7, "auto_rebook": false, "customer_approval": true}'::jsonb,
 '{"predict_disruptions": true, "auto_rebook": true, "communicate_changes": true, "access_alternatives": true}'::jsonb,
 '{"max_predictions": 1000, "priority_level": "critical", "response_timeout": 30000}'::jsonb),

('sustainable-travel-advisor', 'Sustainable Travel Advisor', 'Promotes eco-friendly travel options and carbon footprint optimization', 'travel', 'active', 'healthy', '1.8.4',
 '["carbon_calculation", "eco_recommendations", "sustainable_options", "offset_programs", "green_certifications"]'::jsonb,
 '{"carbon_priority": "medium", "eco_alternatives": true, "offset_suggestions": true}'::jsonb,
 '{"calculate_emissions": true, "recommend_alternatives": true, "manage_offsets": true, "verify_certifications": true}'::jsonb,
 '{"max_calculations": 500, "priority_level": "medium", "response_timeout": 35000}'::jsonb),

-- Additional productivity agents
('document-automation-agent', 'Document Processing Engine', 'Automates document generation, processing, and workflow management', 'productivity', 'active', 'healthy', '2.5.7',
 '["document_generation", "template_processing", "workflow_automation", "data_extraction", "format_conversion"]'::jsonb,
 '{"auto_generate": true, "template_library": true, "quality_checks": true}'::jsonb,
 '{"generate_documents": true, "process_templates": true, "extract_data": true, "convert_formats": true}'::jsonb,
 '{"max_documents": 200, "priority_level": "medium", "response_timeout": 40000}'::jsonb),

('financial-reconciliation-agent', 'Financial Reconciliation Assistant', 'Handles complex financial reconciliation and reporting processes', 'finance', 'active', 'healthy', '3.4.2',
 '["transaction_matching", "variance_analysis", "automated_reconciliation", "report_generation", "audit_trails"]'::jsonb,
 '{"auto_reconcile": true, "variance_threshold": 0.01, "audit_logging": true}'::jsonb,
 '{"reconcile_accounts": true, "generate_reports": true, "analyze_variances": true, "maintain_audit_trails": true}'::jsonb,
 '{"max_transactions": 10000, "priority_level": "high", "response_timeout": 90000}'::jsonb),

('security-monitoring-agent', 'Security Monitoring System', 'Advanced security monitoring and threat detection capabilities', 'security', 'active', 'healthy', '4.1.3',
 '["threat_detection", "log_analysis", "anomaly_detection", "incident_response", "compliance_monitoring"]'::jsonb,
 '{"real_time_monitoring": true, "auto_response": false, "alert_severity": "medium"}'::jsonb,
 '{"monitor_systems": true, "detect_threats": true, "analyze_logs": true, "respond_incidents": true}'::jsonb,
 '{"max_events": 50000, "priority_level": "critical", "response_timeout": 10000}'::jsonb),

('inventory-optimization-agent', 'Inventory Optimization Engine', 'Optimizes inventory levels and supply chain management', 'operations', 'active', 'healthy', '2.7.1',
 '["demand_forecasting", "inventory_optimization", "supply_chain_analysis", "reorder_automation", "cost_optimization"]'::jsonb,
 '{"auto_reorder": true, "demand_sensitivity": 0.8, "cost_optimization": true}'::jsonb,
 '{"forecast_demand": true, "optimize_inventory": true, "analyze_supply_chain": true, "automate_reorders": true}'::jsonb,
 '{"max_items": 5000, "priority_level": "medium", "response_timeout": 60000}'::jsonb),

('content-moderation-agent', 'Content Moderation Assistant', 'Automated content review and moderation with AI-powered filtering', 'content', 'active', 'healthy', '1.9.6',
 '["content_analysis", "sentiment_detection", "policy_enforcement", "automated_moderation", "escalation_management"]'::jsonb,
 '{"auto_moderate": true, "sensitivity_level": "medium", "human_review": true}'::jsonb,
 '{"analyze_content": true, "detect_violations": true, "moderate_automatically": true, "escalate_complex": true}'::jsonb,
 '{"max_content_items": 1000, "priority_level": "high", "response_timeout": 20000}'::jsonb),

('quality-assurance-agent', 'Quality Assurance Coordinator', 'Comprehensive quality testing and assurance automation', 'qa', 'active', 'healthy', '3.6.0',
 '["automated_testing", "quality_metrics", "defect_tracking", "regression_analysis", "performance_monitoring"]'::jsonb,
 '{"continuous_testing": true, "quality_gates": true, "auto_reporting": true}'::jsonb,
 '{"run_tests": true, "track_defects": true, "analyze_performance": true, "generate_reports": true}'::jsonb,
 '{"max_test_suites": 100, "priority_level": "high", "response_timeout": 120000}'::jsonb),

('email-campaign-agent', 'Email Campaign Manager', 'Intelligent email marketing and campaign automation', 'marketing', 'active', 'healthy', '2.2.8',
 '["campaign_automation", "personalization", "a_b_testing", "performance_analytics", "list_management"]'::jsonb,
 '{"auto_personalize": true, "ab_testing": true, "performance_tracking": true}'::jsonb,
 '{"create_campaigns": true, "manage_lists": true, "run_ab_tests": true, "track_performance": true}'::jsonb,
 '{"max_recipients": 50000, "priority_level": "medium", "response_timeout": 45000}'::jsonb)

ON CONFLICT (agent_id) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  description = EXCLUDED.description,
  category = EXCLUDED.category,
  status = EXCLUDED.status,
  health_status = EXCLUDED.health_status,
  version = EXCLUDED.version,
  capabilities = EXCLUDED.capabilities,
  configuration = EXCLUDED.configuration,
  permissions = EXCLUDED.permissions,
  performance_settings = EXCLUDED.performance_settings,
  updated_at = NOW();

-- Create agent groups for organization
INSERT INTO public.agent_groups (group_name, description, group_type, configuration, created_by) VALUES
('Travel Operations', 'All travel-related agents for booking and coordination', 'functional', '{"priority": "high", "coordination": true}'::jsonb, (SELECT id FROM auth.users LIMIT 1)),
('HR & Productivity', 'Human resources and productivity enhancement agents', 'functional', '{"priority": "medium", "automation": true}'::jsonb, (SELECT id FROM auth.users LIMIT 1)),
('Analytics & Intelligence', 'Data analytics and AI-powered intelligence agents', 'functional', '{"priority": "high", "data_access": true}'::jsonb, (SELECT id FROM auth.users LIMIT 1)),
('Operations & Security', 'Operational and security monitoring agents', 'functional', '{"priority": "critical", "monitoring": true}'::jsonb, (SELECT id FROM auth.users LIMIT 1)),
('Marketing & Content', 'Marketing automation and content management agents', 'functional', '{"priority": "medium", "customer_facing": true}'::jsonb, (SELECT id FROM auth.users LIMIT 1))
ON CONFLICT (group_name) DO NOTHING;

-- Add agent group memberships
INSERT INTO public.agent_group_memberships (group_id, agent_id, role, added_by) 
SELECT 
  g.id,
  am.agent_id,
  'member',
  g.created_by
FROM public.agent_groups g
CROSS JOIN public.agent_management am
WHERE 
  (g.group_name = 'Travel Operations' AND am.category IN ('travel')) OR
  (g.group_name = 'HR & Productivity' AND am.category IN ('hr', 'productivity')) OR
  (g.group_name = 'Analytics & Intelligence' AND am.category IN ('analytics', 'qa')) OR
  (g.group_name = 'Operations & Security' AND am.category IN ('operations', 'security', 'finance')) OR
  (g.group_name = 'Marketing & Content' AND am.category IN ('marketing', 'content', 'support'))
ON CONFLICT (group_id, agent_id) DO NOTHING;

-- Seed performance data for realistic dashboard display
INSERT INTO public.agent_performance_metrics (
  agent_id, metric_date, total_tasks, successful_tasks, failed_tasks,
  average_response_time_ms, error_rate, throughput_per_hour,
  user_satisfaction_score, cost_per_task, metadata
)
SELECT 
  am.agent_id,
  CURRENT_DATE - INTERVAL '1 day' * generate_series(0, 6),
  (random() * 100 + 50)::integer,
  (random() * 90 + 45)::integer,
  (random() * 10)::integer,
  (random() * 5000 + 1000)::integer,
  random() * 0.1,
  random() * 50 + 10,
  random() * 2 + 3,
  random() * 0.5 + 0.1,
  jsonb_build_object(
    'peak_hour', (random() * 23)::integer,
    'avg_complexity', random() * 10 + 1,
    'success_trend', case when random() > 0.5 then 'increasing' else 'stable' end
  )
FROM public.agent_management am
CROSS JOIN generate_series(0, 6) day_offset
ON CONFLICT (agent_id, metric_date) DO NOTHING;

-- Create some sample tasks for real-time monitoring
INSERT INTO public.agentic_tasks (
  agent_id, intent, status, params, progress, user_id
)
SELECT 
  am.agent_id,
  CASE am.category
    WHEN 'travel' THEN 'process_booking'
    WHEN 'hr' THEN 'screen_candidate'
    WHEN 'analytics' THEN 'generate_report'
    WHEN 'support' THEN 'handle_inquiry'
    WHEN 'productivity' THEN 'sync_calendar'
    WHEN 'finance' THEN 'reconcile_account'
    WHEN 'security' THEN 'monitor_threats'
    WHEN 'operations' THEN 'optimize_inventory'
    WHEN 'content' THEN 'moderate_content'
    WHEN 'qa' THEN 'run_tests'
    WHEN 'marketing' THEN 'send_campaign'
    ELSE 'general_task'
  END,
  CASE 
    WHEN random() < 0.3 THEN 'completed'
    WHEN random() < 0.6 THEN 'running'
    WHEN random() < 0.8 THEN 'pending'
    ELSE 'failed'
  END,
  jsonb_build_object(
    'priority', (random() * 5 + 1)::integer,
    'estimated_duration', (random() * 60 + 5)::integer,
    'complexity', random() * 10 + 1
  ),
  CASE 
    WHEN random() < 0.3 THEN 100
    WHEN random() < 0.6 THEN (random() * 70 + 20)::integer
    ELSE 0
  END,
  (SELECT id FROM auth.users LIMIT 1)
FROM public.agent_management am
WHERE random() < 0.7 -- Only create tasks for ~70% of agents
LIMIT 25;