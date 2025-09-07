-- Insert comprehensive workflow templates
INSERT INTO public.orchestration_workflows (name, description, category, workflow_data) VALUES

-- Customer Journey Templates
('Advanced Customer Onboarding', 'Multi-step onboarding with document verification and personalization', 'customer_journey', '{
  "nodes": [
    {"id": "start", "type": "trigger", "position": {"x": 100, "y": 100}, "data": {"label": "New Customer Signup", "triggerType": "user_registration"}},
    {"id": "welcome", "type": "agent", "position": {"x": 300, "y": 100}, "data": {"label": "Welcome Email Agent", "agentType": "communication", "config": {"template": "welcome_email"}}},
    {"id": "verify", "type": "agent", "position": {"x": 500, "y": 100}, "data": {"label": "Document Verification", "agentType": "verification", "config": {"documents": ["passport", "id"]}}},
    {"id": "preference", "type": "agent", "position": {"x": 700, "y": 100}, "data": {"label": "Preference Collection", "agentType": "data_collection", "config": {"fields": ["travel_style", "budget", "destinations"]}}},
    {"id": "personalize", "type": "agent", "position": {"x": 900, "y": 100}, "data": {"label": "Profile Personalization", "agentType": "personalization", "config": {"recommendations": true}}}
  ],
  "edges": [
    {"id": "e1", "source": "start", "target": "welcome"},
    {"id": "e2", "source": "welcome", "target": "verify"},
    {"id": "e3", "source": "verify", "target": "preference"},
    {"id": "e4", "source": "preference", "target": "personalize"}
  ]
}'),

('Customer Retention Campaign', 'Automated retention workflow for at-risk customers', 'customer_journey', '{
  "nodes": [
    {"id": "trigger", "type": "trigger", "position": {"x": 100, "y": 100}, "data": {"label": "Churn Risk Detection", "triggerType": "analytics_alert"}},
    {"id": "analyze", "type": "agent", "position": {"x": 300, "y": 100}, "data": {"label": "Risk Analysis Agent", "agentType": "analytics", "config": {"metrics": ["booking_frequency", "engagement_score"]}}},
    {"id": "segment", "type": "conditional", "position": {"x": 500, "y": 100}, "data": {"label": "Risk Level", "condition": "risk_score >= 0.7"}},
    {"id": "high_touch", "type": "agent", "position": {"x": 700, "y": 50}, "data": {"label": "Personal Outreach", "agentType": "communication", "config": {"channel": "phone_call"}}},
    {"id": "low_touch", "type": "agent", "position": {"x": 700, "y": 150}, "data": {"label": "Email Campaign", "agentType": "communication", "config": {"template": "retention_offer"}}}
  ],
  "edges": [
    {"id": "e1", "source": "trigger", "target": "analyze"},
    {"id": "e2", "source": "analyze", "target": "segment"},
    {"id": "e3", "source": "segment", "target": "high_touch", "label": "High Risk"},
    {"id": "e4", "source": "segment", "target": "low_touch", "label": "Medium Risk"}
  ]
}'),

-- Operations Templates
('Complex Booking Process', 'End-to-end booking with payment and confirmation', 'operations', '{
  "nodes": [
    {"id": "search", "type": "agent", "position": {"x": 100, "y": 100}, "data": {"label": "Search Agent", "agentType": "search", "config": {"providers": ["amadeus", "sabre"]}}},
    {"id": "pricing", "type": "agent", "position": {"x": 300, "y": 100}, "data": {"label": "Dynamic Pricing", "agentType": "pricing", "config": {"rules": ["demand_based", "competitor_analysis"]}}},
    {"id": "availability", "type": "agent", "position": {"x": 500, "y": 100}, "data": {"label": "Real-time Availability", "agentType": "inventory", "config": {"refresh_interval": 30}}},
    {"id": "payment", "type": "agent", "position": {"x": 700, "y": 100}, "data": {"label": "Payment Processing", "agentType": "payment", "config": {"gateway": "stripe", "fraud_check": true}}},
    {"id": "confirmation", "type": "agent", "position": {"x": 900, "y": 100}, "data": {"label": "Booking Confirmation", "agentType": "confirmation", "config": {"send_email": true, "generate_tickets": true}}}
  ],
  "edges": [
    {"id": "e1", "source": "search", "target": "pricing"},
    {"id": "e2", "source": "pricing", "target": "availability"},
    {"id": "e3", "source": "availability", "target": "payment"},
    {"id": "e4", "source": "payment", "target": "confirmation"}
  ]
}'),

('Intelligent Refund Processing', 'Automated refund workflow with fraud detection', 'operations', '{
  "nodes": [
    {"id": "request", "type": "trigger", "position": {"x": 100, "y": 100}, "data": {"label": "Refund Request", "triggerType": "user_action"}},
    {"id": "validate", "type": "agent", "position": {"x": 300, "y": 100}, "data": {"label": "Request Validation", "agentType": "validation", "config": {"check_policy": true, "verify_booking": true}}},
    {"id": "fraud_check", "type": "agent", "position": {"x": 500, "y": 100}, "data": {"label": "Fraud Detection", "agentType": "fraud_detection", "config": {"ml_model": "refund_fraud_v2"}}},
    {"id": "decision", "type": "conditional", "position": {"x": 700, "y": 100}, "data": {"label": "Auto-approve?", "condition": "fraud_score < 0.3 AND policy_compliant"}},
    {"id": "auto_process", "type": "agent", "position": {"x": 900, "y": 50}, "data": {"label": "Auto Process", "agentType": "payment", "config": {"method": "refund"}}},
    {"id": "manual_review", "type": "agent", "position": {"x": 900, "y": 150}, "data": {"label": "Manual Review Queue", "agentType": "workflow", "config": {"assign_to": "refund_team"}}}
  ],
  "edges": [
    {"id": "e1", "source": "request", "target": "validate"},
    {"id": "e2", "source": "validate", "target": "fraud_check"},
    {"id": "e3", "source": "fraud_check", "target": "decision"},
    {"id": "e4", "source": "decision", "target": "auto_process", "label": "Approve"},
    {"id": "e5", "source": "decision", "target": "manual_review", "label": "Review"}
  ]
}'),

-- Support & Quality Templates
('Dynamic Support Routing', 'Intelligent ticket routing based on expertise and workload', 'support_quality', '{
  "nodes": [
    {"id": "ticket", "type": "trigger", "position": {"x": 100, "y": 100}, "data": {"label": "Support Ticket", "triggerType": "support_request"}},
    {"id": "classify", "type": "agent", "position": {"x": 300, "y": 100}, "data": {"label": "Ticket Classification", "agentType": "nlp", "config": {"model": "ticket_classifier_v3"}}},
    {"id": "priority", "type": "agent", "position": {"x": 500, "y": 100}, "data": {"label": "Priority Assessment", "agentType": "analytics", "config": {"factors": ["customer_tier", "issue_type", "urgency"]}}},
    {"id": "route", "type": "conditional", "position": {"x": 700, "y": 100}, "data": {"label": "Route Decision", "condition": "priority === high OR customer_tier === vip"}},
    {"id": "specialist", "type": "agent", "position": {"x": 900, "y": 50}, "data": {"label": "Specialist Queue", "agentType": "routing", "config": {"queue": "tier_2"}}},
    {"id": "general", "type": "agent", "position": {"x": 900, "y": 150}, "data": {"label": "General Queue", "agentType": "routing", "config": {"queue": "tier_1"}}}
  ],
  "edges": [
    {"id": "e1", "source": "ticket", "target": "classify"},
    {"id": "e2", "source": "classify", "target": "priority"},
    {"id": "e3", "source": "priority", "target": "route"},
    {"id": "e4", "source": "route", "target": "specialist", "label": "High Priority"},
    {"id": "e5", "source": "route", "target": "general", "label": "Standard"}
  ]
}'),

('Quality Assurance Monitor', 'Continuous quality monitoring with automated feedback', 'support_quality', '{
  "nodes": [
    {"id": "monitor", "type": "trigger", "position": {"x": 100, "y": 100}, "data": {"label": "Service Monitor", "triggerType": "continuous"}},
    {"id": "metrics", "type": "agent", "position": {"x": 300, "y": 100}, "data": {"label": "Metrics Collection", "agentType": "analytics", "config": {"metrics": ["response_time", "resolution_rate", "satisfaction"]}}},
    {"id": "analyze", "type": "agent", "position": {"x": 500, "y": 100}, "data": {"label": "Performance Analysis", "agentType": "analytics", "config": {"threshold_check": true}}},
    {"id": "threshold", "type": "conditional", "position": {"x": 700, "y": 100}, "data": {"label": "Quality Check", "condition": "satisfaction_score < 4.0 OR response_time > 300"}},
    {"id": "alert", "type": "agent", "position": {"x": 900, "y": 50}, "data": {"label": "Quality Alert", "agentType": "notification", "config": {"recipients": ["qa_team", "managers"]}}},
    {"id": "report", "type": "agent", "position": {"x": 900, "y": 150}, "data": {"label": "Performance Report", "agentType": "reporting", "config": {"frequency": "daily"}}}
  ],
  "edges": [
    {"id": "e1", "source": "monitor", "target": "metrics"},
    {"id": "e2", "source": "metrics", "target": "analyze"},
    {"id": "e3", "source": "analyze", "target": "threshold"},
    {"id": "e4", "source": "threshold", "target": "alert", "label": "Issue Detected"},
    {"id": "e5", "source": "threshold", "target": "report", "label": "Normal"}
  ]
}'),

-- Marketing Templates
('Personalized Campaign Engine', 'AI-driven personalized marketing campaigns', 'marketing', '{
  "nodes": [
    {"id": "trigger", "type": "trigger", "position": {"x": 100, "y": 100}, "data": {"label": "Campaign Trigger", "triggerType": "scheduled"}},
    {"id": "segment", "type": "agent", "position": {"x": 300, "y": 100}, "data": {"label": "Customer Segmentation", "agentType": "ml", "config": {"model": "customer_segments_v4"}}},
    {"id": "personalize", "type": "agent", "position": {"x": 500, "y": 100}, "data": {"label": "Content Personalization", "agentType": "content", "config": {"dynamic_content": true}}},
    {"id": "timing", "type": "agent", "position": {"x": 700, "y": 100}, "data": {"label": "Optimal Timing", "agentType": "ml", "config": {"model": "send_time_optimization"}}},
    {"id": "send", "type": "agent", "position": {"x": 900, "y": 100}, "data": {"label": "Campaign Delivery", "agentType": "communication", "config": {"channels": ["email", "sms", "push"]}}}
  ],
  "edges": [
    {"id": "e1", "source": "trigger", "target": "segment"},
    {"id": "e2", "source": "segment", "target": "personalize"},
    {"id": "e3", "source": "personalize", "target": "timing"},
    {"id": "e4", "source": "timing", "target": "send"}
  ]
}'),

-- Analytics Templates
('Performance Monitoring Dashboard', 'Real-time system performance tracking', 'analytics', '{
  "nodes": [
    {"id": "collect", "type": "trigger", "position": {"x": 100, "y": 100}, "data": {"label": "Metrics Collection", "triggerType": "real_time"}},
    {"id": "process", "type": "agent", "position": {"x": 300, "y": 100}, "data": {"label": "Data Processing", "agentType": "data", "config": {"aggregation": "real_time"}}},
    {"id": "anomaly", "type": "agent", "position": {"x": 500, "y": 100}, "data": {"label": "Anomaly Detection", "agentType": "ml", "config": {"model": "anomaly_detector_v2"}}},
    {"id": "alert_check", "type": "conditional", "position": {"x": 700, "y": 100}, "data": {"label": "Alert Threshold", "condition": "anomaly_score > 0.8"}},
    {"id": "immediate", "type": "agent", "position": {"x": 900, "y": 50}, "data": {"label": "Immediate Alert", "agentType": "notification", "config": {"urgency": "critical"}}},
    {"id": "dashboard", "type": "agent", "position": {"x": 900, "y": 150}, "data": {"label": "Dashboard Update", "agentType": "visualization", "config": {"real_time": true}}}
  ],
  "edges": [
    {"id": "e1", "source": "collect", "target": "process"},
    {"id": "e2", "source": "process", "target": "anomaly"},
    {"id": "e3", "source": "anomaly", "target": "alert_check"},
    {"id": "e4", "source": "alert_check", "target": "immediate", "label": "Critical"},
    {"id": "e5", "source": "alert_check", "target": "dashboard", "label": "Normal"}
  ]
}'),

-- Compliance Templates
('Data Privacy Compliance', 'Automated GDPR and privacy compliance monitoring', 'compliance', '{
  "nodes": [
    {"id": "monitor", "type": "trigger", "position": {"x": 100, "y": 100}, "data": {"label": "Privacy Monitor", "triggerType": "data_access"}},
    {"id": "classify", "type": "agent", "position": {"x": 300, "y": 100}, "data": {"label": "Data Classification", "agentType": "compliance", "config": {"standards": ["GDPR", "CCPA"]}}},
    {"id": "consent", "type": "agent", "position": {"x": 500, "y": 100}, "data": {"label": "Consent Verification", "agentType": "compliance", "config": {"check_consent": true}}},
    {"id": "compliance_check", "type": "conditional", "position": {"x": 700, "y": 100}, "data": {"label": "Compliance Status", "condition": "consent_valid AND purpose_legitimate"}},
    {"id": "allow", "type": "agent", "position": {"x": 900, "y": 50}, "data": {"label": "Allow Access", "agentType": "access_control", "config": {"log": true}}},
    {"id": "block", "type": "agent", "position": {"x": 900, "y": 150}, "data": {"label": "Block & Log", "agentType": "access_control", "config": {"block": true, "audit_log": true}}}
  ],
  "edges": [
    {"id": "e1", "source": "monitor", "target": "classify"},
    {"id": "e2", "source": "classify", "target": "consent"},
    {"id": "e3", "source": "consent", "target": "compliance_check"},
    {"id": "e4", "source": "compliance_check", "target": "allow", "label": "Compliant"},
    {"id": "e5", "source": "compliance_check", "target": "block", "label": "Non-compliant"}
  ]
}');