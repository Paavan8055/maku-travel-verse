import { BaseAgent, AgentHandler } from '../_shared/memory-utils.ts';

export const handler: AgentHandler = async (userId, intent, params, supabaseClient, openAiClient, memory) => {
  const agent = new BaseAgent(supabaseClient, 'agent-registration-manager');
  
  try {
    const { 
      operation = 'register_all',
      agentModules = [],
      forceUpdate = false,
      healthCheck = true,
      performanceBaseline = true
    } = params;

    const userPrefs = await agent.getUserPreferences(userId);
    
    // List of all agent modules to register
    const allAgentModules = [
      // Executive Managers (Tier 1)
      'risk-management-manager', 'revenue-management-manager', 'customer-relationship-manager',
      'financial-transaction-manager', 'content-management-manager',
      // Operational Managers (Tier 2)
      'reservations-manager', 'inventory-management-manager',
      // Specialist Managers (Tier 3)  
      'business-travel-manager', 'loyalty-program-manager',
      // Support Agents (Tier 4)
      'visa-assistant', 'multi-language-translator', 'weather-travel-advisor',
      'travel-insurance-coordinator', 'agent-performance-monitor', 'currency-converter',
      'calendar-sync-agent', 'price-monitor', 'itinerary-optimizer', 'cruise-specialist',
      'luxury-travel-curator', 'payment-reconciliation-agent', 'digital-nomad-coordinator',
      'compliance-check', 'user-support', 'real-time-notification-dispatcher',
      'last-minute-specialist', 'intelligent-search-optimizer', 'cultural-immersion-guide',
      'educational-tour-coordinator', 'fraud-detection', 'family-travel-planner',
      'pet-travel-specialist', 'account-verification', 'data-validation',
      'dispute-resolution', 'payment-investigation', 'emergency-helper'
    ];

    const modulesToProcess = agentModules.length > 0 ? agentModules : allAgentModules;

    let registeredCount = 0;
    let updatedCount = 0;
    let errors = [];

    for (const moduleId of modulesToProcess) {
      try {
        // Check if agent already exists
        const { data: existing } = await supabaseClient
          .from('agent_management')
          .select('id, status')
          .eq('agent_id', moduleId)
          .single();

        if (existing && !forceUpdate) {
          continue; // Skip if already registered and not forcing update
        }

        const agentConfig = {
          agent_id: moduleId,
          display_name: moduleId.split('-').map(word => 
            word.charAt(0).toUpperCase() + word.slice(1)
          ).join(' '),
          description: `AI agent for ${moduleId.replace(/-/g, ' ')} functionality`,
          category: getCategoryForAgent(moduleId),
          status: 'active',
          capabilities: getCapabilitiesForAgent(moduleId),
          configuration: {
            version: '1.0.0',
            priority: 1,
            timeout: 30000,
            retries: 3
          },
          performance_settings: {
            maxConcurrentTasks: 10,
            averageResponseTime: 2000,
            successRateThreshold: 0.95
          },
          permissions: {
            read: ['agentic_memory', 'agentic_tasks'],
            write: ['agentic_memory', 'agentic_tasks'],
            execute: ['user_interactions', 'data_processing']
          },
          created_by: userId,
          updated_by: userId
        };

        if (existing) {
          // Update existing agent
          const { error: updateError } = await supabaseClient
            .from('agent_management')
            .update(agentConfig)
            .eq('id', existing.id);

          if (updateError) throw updateError;
          updatedCount++;
        } else {
          // Insert new agent
          const { error: insertError } = await supabaseClient
            .from('agent_management')
            .insert(agentConfig);

          if (insertError) throw insertError;
          registeredCount++;
        }

        // Initialize performance baseline if requested
        if (performanceBaseline) {
          await supabaseClient
            .from('agent_performance_metrics')
            .insert({
              agent_id: moduleId,
              metric_date: new Date().toISOString().split('T')[0],
              total_tasks: 0,
              successful_tasks: 0,
              failed_tasks: 0,
              average_response_time_ms: 0,
              throughput_per_hour: 0,
              error_rate: 0,
              metadata: { baseline: true, registered_at: new Date().toISOString() }
            });
        }

      } catch (error) {
        console.error(`Failed to register agent ${moduleId}:`, error);
        errors.push({ moduleId, error: error.message });
      }
    }

    await agent.logActivity(userId, 'agent_registration', {
      operation,
      registered: registeredCount,
      updated: updatedCount,
      errors: errors.length,
      totalProcessed: modulesToProcess.length
    });

    return {
      success: true,
      operation,
      agentsRegistered: registeredCount,
      agentsUpdated: updatedCount,
      totalProcessed: modulesToProcess.length,
      errors,
      healthCheckEnabled: healthCheck,
      performanceBaselineSet: performanceBaseline
    };
  } catch (error) {
    console.error('Error in agent-registration-manager:', error);
    return {
      success: false,
      error: 'Failed to manage agent registration'
    };
  }
};

function getCategoryForAgent(agentId: string): string {
  const categoryMap: Record<string, string> = {
    'reservations-manager': 'travel_operations',
    'visa-assistant': 'travel_services',
    'multi-language-translator': 'communication',
    'weather-travel-advisor': 'travel_optimization',
    'travel-insurance-coordinator': 'risk_management',
    'loyalty-program-manager': 'customer_retention',
    'risk-management-manager': 'executive',
    'revenue-management-manager': 'executive',
    'customer-relationship-manager': 'executive',
    'financial-transaction-manager': 'executive',
    'content-management-manager': 'executive',
    'inventory-management-manager': 'operational',
    'agent-performance-monitor': 'system_monitoring',
    'currency-converter': 'financial_services',
    'business-travel-manager': 'corporate_travel',
    'fraud-detection': 'security',
    'user-support': 'customer_service',
    'compliance-check': 'regulatory',
    'emergency-helper': 'emergency_services'
  };
  
  return categoryMap[agentId] || 'general';
}

function getCapabilitiesForAgent(agentId: string): string[] {
  const capabilityMap: Record<string, string[]> = {
    'reservations-manager': ['reservation_orchestration', 'multi_service_booking', 'status_management', 'modification_handling', 'payment_coordination', 'document_generation', 'exception_recovery'],
    'visa-assistant': ['document_analysis', 'regulatory_compliance', 'travel_planning'],
    'multi-language-translator': ['natural_language_processing', 'cultural_adaptation', 'real_time_translation'],
    'weather-travel-advisor': ['weather_analysis', 'activity_planning', 'risk_assessment'],
    'travel-insurance-coordinator': ['risk_assessment', 'policy_analysis', 'claims_assistance'],
    'loyalty-program-manager': ['points_optimization', 'status_tracking', 'reward_analysis'],
    'risk-management-manager': ['fraud_detection', 'risk_assessment', 'security_monitoring', 'compliance_validation'],
    'revenue-management-manager': ['dynamic_pricing', 'yield_optimization', 'revenue_forecasting', 'market_analysis'],
    'customer-relationship-manager': ['customer_segmentation', 'loyalty_management', 'personalization_engine'],
    'financial-transaction-manager': ['payment_orchestration', 'billing_management', 'financial_reporting'],
    'content-management-manager': ['content_lifecycle', 'marketing_coordination', 'policy_updates'],
    'inventory-management-manager': ['dynamic_allocation', 'availability_optimization', 'supply_chain_coordination'],
    'agent-performance-monitor': ['metrics_analysis', 'performance_optimization', 'alerting'],
    'user-support': ['customer_service', 'issue_resolution', 'knowledge_base'],
    'fraud-detection': ['transaction_analysis', 'anomaly_detection', 'security_monitoring']
  };
  
  return capabilityMap[agentId] || ['general_assistance', 'data_processing'];
}