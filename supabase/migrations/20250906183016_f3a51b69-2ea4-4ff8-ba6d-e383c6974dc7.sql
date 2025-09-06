-- Register all available AI agent modules
INSERT INTO public.agent_management (
  agent_id,
  display_name, 
  description,
  category,
  status,
  capabilities,
  configuration,
  performance_settings,
  permissions,
  version,
  health_status
) VALUES 
-- Core Travel Agents
('visa-assistant', 'Visa Assistant', 'AI agent for visa and documentation assistance', 'travel_services', 'active', 
 '["document_analysis", "regulatory_compliance", "travel_planning"]'::jsonb,
 '{"version": "1.0.0", "priority": 1, "timeout": 30000, "retries": 3}'::jsonb,
 '{"maxConcurrentTasks": 10, "averageResponseTime": 2000, "successRateThreshold": 0.95}'::jsonb,
 '{"read": ["agentic_memory", "agentic_tasks"], "write": ["agentic_memory", "agentic_tasks"], "execute": ["user_interactions", "data_processing"]}'::jsonb,
 '1.0.0', 'healthy'),

('multi-language-translator', 'Multi-Language Translator', 'AI agent for real-time translation and cultural adaptation', 'communication', 'active',
 '["natural_language_processing", "cultural_adaptation", "real_time_translation"]'::jsonb,
 '{"version": "1.0.0", "priority": 1, "timeout": 30000, "retries": 3}'::jsonb,
 '{"maxConcurrentTasks": 50, "averageResponseTime": 1500, "successRateThreshold": 0.98}'::jsonb,
 '{"read": ["agentic_memory"], "write": ["agentic_memory"], "execute": ["user_interactions", "language_processing"]}'::jsonb,
 '1.0.0', 'healthy'),

('weather-travel-advisor', 'Weather Travel Advisor', 'AI agent for weather-based travel planning and optimization', 'travel_optimization', 'active',
 '["weather_analysis", "activity_planning", "risk_assessment", "seasonal_insights"]'::jsonb,
 '{"version": "1.0.0", "priority": 1, "timeout": 30000, "retries": 3}'::jsonb,
 '{"maxConcurrentTasks": 20, "averageResponseTime": 2500, "successRateThreshold": 0.92}'::jsonb,
 '{"read": ["agentic_memory", "weather_data"], "write": ["agentic_memory"], "execute": ["weather_api", "recommendation_engine"]}'::jsonb,
 '1.0.0', 'healthy'),

('travel-insurance-coordinator', 'Travel Insurance Coordinator', 'AI agent for travel insurance coordination and risk management', 'risk_management', 'active',
 '["risk_assessment", "policy_analysis", "claims_assistance", "coverage_optimization"]'::jsonb,
 '{"version": "1.0.0", "priority": 1, "timeout": 30000, "retries": 3}'::jsonb,
 '{"maxConcurrentTasks": 15, "averageResponseTime": 3000, "successRateThreshold": 0.94}'::jsonb,
 '{"read": ["agentic_memory", "insurance_data"], "write": ["agentic_memory"], "execute": ["policy_analysis", "risk_calculation"]}'::jsonb,
 '1.0.0', 'healthy'),

('loyalty-program-manager', 'Loyalty Program Manager', 'AI agent for loyalty program optimization and management', 'customer_retention', 'active',
 '["points_optimization", "status_tracking", "reward_analysis", "program_coordination"]'::jsonb,
 '{"version": "1.0.0", "priority": 1, "timeout": 30000, "retries": 3}'::jsonb,
 '{"maxConcurrentTasks": 25, "averageResponseTime": 2200, "successRateThreshold": 0.96}'::jsonb,
 '{"read": ["agentic_memory", "loyalty_points"], "write": ["agentic_memory"], "execute": ["loyalty_calculations", "reward_optimization"]}'::jsonb,
 '1.0.0', 'healthy'),

-- Security & Fraud Agents
('advanced-fraud-detection', 'Advanced Fraud Detection', 'AI agent for advanced fraud detection and prevention', 'security', 'active',
 '["pattern_recognition", "risk_scoring", "real_time_analysis", "anomaly_detection"]'::jsonb,
 '{"version": "1.0.0", "priority": 1, "timeout": 15000, "retries": 2}'::jsonb,
 '{"maxConcurrentTasks": 100, "averageResponseTime": 800, "successRateThreshold": 0.99}'::jsonb,
 '{"read": ["agentic_memory", "transaction_data"], "write": ["agentic_memory", "fraud_alerts"], "execute": ["fraud_analysis", "risk_scoring"]}'::jsonb,
 '1.0.0', 'healthy'),

('fraud-detection', 'Fraud Detection', 'AI agent for transaction fraud detection and security monitoring', 'security', 'active',
 '["transaction_analysis", "anomaly_detection", "security_monitoring"]'::jsonb,
 '{"version": "1.0.0", "priority": 1, "timeout": 15000, "retries": 2}'::jsonb,
 '{"maxConcurrentTasks": 75, "averageResponseTime": 1000, "successRateThreshold": 0.98}'::jsonb,
 '{"read": ["agentic_memory", "transaction_data"], "write": ["agentic_memory", "fraud_alerts"], "execute": ["fraud_monitoring"]}'::jsonb,
 '1.0.0', 'healthy'),

-- System Management Agents  
('agent-performance-monitor', 'Agent Performance Monitor', 'AI agent for monitoring and optimizing agent performance', 'system_monitoring', 'active',
 '["metrics_analysis", "performance_optimization", "alerting", "capacity_planning"]'::jsonb,
 '{"version": "1.0.0", "priority": 1, "timeout": 45000, "retries": 3}'::jsonb,
 '{"maxConcurrentTasks": 5, "averageResponseTime": 5000, "successRateThreshold": 0.95}'::jsonb,
 '{"read": ["agent_performance_metrics", "agent_management"], "write": ["agent_alerts"], "execute": ["performance_analysis"]}'::jsonb,
 '1.0.0', 'healthy'),

('agent-registration-manager', 'Agent Registration Manager', 'AI agent for managing agent registration and lifecycle', 'system_management', 'active',
 '["agent_lifecycle", "registration_management", "configuration_updates"]'::jsonb,
 '{"version": "1.0.0", "priority": 1, "timeout": 60000, "retries": 2}'::jsonb,
 '{"maxConcurrentTasks": 3, "averageResponseTime": 8000, "successRateThreshold": 0.98}'::jsonb,
 '{"read": ["agent_management"], "write": ["agent_management", "agent_performance_metrics"], "execute": ["agent_registration"]}'::jsonb,
 '1.0.0', 'healthy')

ON CONFLICT (agent_id) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  description = EXCLUDED.description,
  category = EXCLUDED.category,
  capabilities = EXCLUDED.capabilities,
  configuration = EXCLUDED.configuration,
  performance_settings = EXCLUDED.performance_settings,
  permissions = EXCLUDED.permissions,
  version = EXCLUDED.version,
  health_status = EXCLUDED.health_status,
  updated_at = now();

-- Initialize performance baselines for all registered agents
INSERT INTO public.agent_performance_metrics (
  agent_id,
  metric_date,
  total_tasks,
  successful_tasks,
  failed_tasks,
  average_response_time_ms,
  throughput_per_hour,
  error_rate,
  metadata
) 
SELECT 
  agent_id,
  CURRENT_DATE,
  0,
  0,
  0,
  0,
  0,
  0,
  jsonb_build_object('baseline', true, 'initialized_at', now())
FROM public.agent_management
WHERE agent_id NOT IN (
  SELECT DISTINCT agent_id 
  FROM public.agent_performance_metrics 
  WHERE metric_date = CURRENT_DATE
)
ON CONFLICT (agent_id, metric_date) DO NOTHING;