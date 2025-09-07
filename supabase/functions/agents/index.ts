import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.53.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// 4-TIER AGENT HIERARCHY CONFIGURATION
const AGENT_CONFIGS = {
  // TIER 1: EXECUTIVE MANAGERS - Strategic oversight and high-level coordination
  'risk-management-manager': { name: 'Risk Management Manager', category: 'executive', model: 'gpt-5-2025-08-07' },
  'revenue-management-manager': { name: 'Revenue Management Manager', category: 'executive', model: 'gpt-5-2025-08-07' },
  'customer-relationship-manager': { name: 'Customer Relationship Manager', category: 'executive', model: 'gpt-5-2025-08-07' },
  'financial-transaction-manager': { name: 'Financial Transaction Manager', category: 'executive', model: 'gpt-5-2025-08-07' },
  'content-management-manager': { name: 'Content Management Manager', category: 'executive', model: 'gpt-5-2025-08-07' },

  // TIER 2: OPERATIONAL MANAGERS - Business operations and workflow coordination
  'reservations-manager': { name: 'Reservations Manager', category: 'operational', model: 'gpt-5-2025-08-07' },
  'inventory-management-manager': { name: 'Inventory Management Manager', category: 'operational', model: 'gpt-5-2025-08-07' },
  
  // TIER 3: SPECIALIST MANAGERS - Domain expertise and specific business functions
  'business-travel-manager': { name: 'Business Travel Manager', category: 'specialist', model: 'gpt-5-2025-08-07' },
  'loyalty-program-manager': { name: 'Loyalty Program Manager', category: 'specialist', model: 'gpt-5-2025-08-07' },

  // TIER 4: SUPPORT AGENTS - Specialized tasks and individual user interactions
  'trip-planner': { name: 'Trip Planner', category: 'customer', model: 'gpt-5-2025-08-07' },
  'price-monitor': { name: 'Price Monitor', category: 'customer', model: 'gpt-5-mini-2025-08-07' },
  'booking-assistant': { name: 'Booking Assistant', category: 'customer', model: 'gpt-5-2025-08-07' },
  'itinerary-optimizer': { name: 'Itinerary Optimizer', category: 'customer', model: 'gpt-5-2025-08-07' },
  'destination-guide': { name: 'Destination Guide', category: 'customer', model: 'gpt-5-2025-08-07' },
  'travel-advisor': { name: 'Travel Advisor', category: 'customer', model: 'gpt-5-2025-08-07' },
  'weather-tracker': { name: 'Weather Tracker', category: 'customer', model: 'gpt-5-mini-2025-08-07' },
  'loyalty-manager': { name: 'Loyalty Manager', category: 'customer', model: 'gpt-5-mini-2025-08-07' },
  'payment-helper': { name: 'Payment Helper', category: 'customer', model: 'gpt-5-2025-08-07' },
  'visa-assistant': { name: 'Visa Assistant', category: 'customer', model: 'gpt-5-2025-08-07' },
  'currency-converter': { name: 'Currency Converter', category: 'customer', model: 'gpt-5-mini-2025-08-07' },
  'budget-planner': { name: 'Budget Planner', category: 'customer', model: 'gpt-5-2025-08-07' },
  'activity-finder': { name: 'Activity Finder', category: 'customer', model: 'gpt-5-2025-08-07' },
  'restaurant-guide': { name: 'Restaurant Guide', category: 'customer', model: 'gpt-5-2025-08-07' },
  'transport-advisor': { name: 'Transport Advisor', category: 'customer', model: 'gpt-5-2025-08-07' },
  'hotel-concierge': { name: 'Hotel Concierge', category: 'customer', model: 'gpt-5-2025-08-07' },
  'emergency-helper': { name: 'Emergency Helper', category: 'customer', model: 'gpt-5-2025-08-07' },
  'group-coordinator': { name: 'Group Coordinator', category: 'customer', model: 'gpt-5-2025-08-07' },
  'solo-travel-guide': { name: 'Solo Travel Guide', category: 'customer', model: 'gpt-5-2025-08-07' },
  'family-planner': { name: 'Family Planner', category: 'customer', model: 'gpt-5-2025-08-07' },
  'family-travel-planner': { name: 'Family Travel Planner', category: 'customer', model: 'gpt-5-2025-08-07' },
  'solo-travel-planner': { name: 'Solo Travel Planner', category: 'customer', model: 'gpt-5-2025-08-07' },
  'spiritual-travel-planner': { name: 'Spiritual Travel Planner', category: 'customer', model: 'gpt-5-2025-08-07' },
  'pet-travel-specialist': { name: 'Pet Travel Specialist', category: 'customer', model: 'gpt-5-2025-08-07' },
  
  // Administrative agents (35)
  'password-reset': { name: 'Password Reset Agent', category: 'admin', model: 'gpt-5-mini-2025-08-07' },
  'booking-modification': { name: 'Booking Modification Agent', category: 'admin', model: 'gpt-5-2025-08-07' },
  'refund-processing': { name: 'Refund Processing Agent', category: 'admin', model: 'gpt-5-2025-08-07' },
  'security-alert-handler': { name: 'Security Alert Handler', category: 'admin', model: 'gpt-5-mini-2025-08-07' },
  'guided-workflow-orchestrator': { name: 'Guided Workflow Orchestrator', category: 'admin', model: 'gpt-5-2025-08-07' },
  'admin-dashboard-agent': { name: 'Admin Dashboard Agent', category: 'admin', model: 'gpt-5-2025-08-07' },
  'user-support': { name: 'User Support Agent', category: 'admin', model: 'gpt-5-2025-08-07' },
  // CONSOLIDATED: fraud-detection + advanced-fraud-detection → risk-management-manager (TIER 1)
  'compliance-check': { name: 'Compliance Check Agent', category: 'admin', model: 'gpt-5-mini-2025-08-07' },
  'data-validation': { name: 'Data Validation Agent', category: 'admin', model: 'gpt-5-mini-2025-08-07' },
  'account-verification': { name: 'Account Verification Agent', category: 'admin', model: 'gpt-5-2025-08-07' },
  'dispute-resolution': { name: 'Dispute Resolution Agent', category: 'admin', model: 'gpt-5-2025-08-07' },
  'payment-investigation': { name: 'Payment Investigation Agent', category: 'admin', model: 'gpt-5-2025-08-07' },
  'cancellation-handler': { name: 'Cancellation Handler', category: 'admin', model: 'gpt-5-2025-08-07' },
  'upgrade-processor': { name: 'Upgrade Processor', category: 'admin', model: 'gpt-5-2025-08-07' },
  'special-requests': { name: 'Special Requests Handler', category: 'admin', model: 'gpt-5-2025-08-07' },
  'vip-concierge': { name: 'VIP Concierge Agent', category: 'admin', model: 'gpt-5-2025-08-07' },
  'loyalty-adjuster': { name: 'Loyalty Adjuster', category: 'admin', model: 'gpt-5-mini-2025-08-07' },
  'credit-manager': { name: 'Credit Manager', category: 'admin', model: 'gpt-5-2025-08-07' },
  'insurance-processor': { name: 'Insurance Processor', category: 'admin', model: 'gpt-5-2025-08-07' },
  'documentation-handler': { name: 'Documentation Handler', category: 'admin', model: 'gpt-5-mini-2025-08-07' },
  'policy-enforcer': { name: 'Policy Enforcer', category: 'admin', model: 'gpt-5-2025-08-07' },
  'escalation-manager': { name: 'Escalation Manager', category: 'admin', model: 'gpt-5-2025-08-07' },
  'review-moderator': { name: 'Review Moderator', category: 'admin', model: 'gpt-5-mini-2025-08-07' },
  'content-manager': { name: 'Content Manager', category: 'admin', model: 'gpt-5-2025-08-07' },
  'supplier-liaison': { name: 'Supplier Liaison', category: 'admin', model: 'gpt-5-2025-08-07' },
  'quality-auditor': { name: 'Quality Auditor', category: 'admin', model: 'gpt-5-2025-08-07' },
  'training-coordinator': { name: 'Training Coordinator', category: 'admin', model: 'gpt-5-mini-2025-08-07' },
  'schedule-manager': { name: 'Schedule Manager', category: 'admin', model: 'gpt-5-mini-2025-08-07' },
  'inventory-controller': { name: 'Inventory Controller', category: 'admin', model: 'gpt-5-2025-08-07' },
  'pricing-analyst': { name: 'Pricing Analyst', category: 'admin', model: 'gpt-5-2025-08-07' },
  'commission-calculator': { name: 'Commission Calculator', category: 'admin', model: 'gpt-5-mini-2025-08-07' },
  'tax-processor': { name: 'Tax Processor', category: 'admin', model: 'gpt-5-2025-08-07' },
  'report-generator': { name: 'Report Generator', category: 'admin', model: 'gpt-5-2025-08-07' },
  'backup-coordinator': { name: 'Backup Coordinator', category: 'admin', model: 'gpt-5-mini-2025-08-07' },
  'integration-manager': { name: 'Integration Manager', category: 'admin', model: 'gpt-5-2025-08-07' },
  'api-monitor': { name: 'API Monitor', category: 'admin', model: 'gpt-5-mini-2025-08-07' },
  'calendar-sync-agent': { name: 'Calendar Sync Agent', category: 'operational', model: 'gpt-5-mini-2025-08-07' },
  'group-booking-coordinator': { name: 'Group Booking Coordinator', category: 'operational', model: 'gpt-5-2025-08-07' },
  'predictive-rebooking-agent': { name: 'Predictive Rebooking Agent', category: 'operational', model: 'gpt-5-2025-08-07' },
  
  // Phase 2: Supplier & Partnership Management (4)
  'hotel-partner-manager': { name: 'Hotel Partner Manager', category: 'admin', model: 'gpt-5-2025-08-07' },
  'flight-supplier-manager': { name: 'Flight Supplier Manager', category: 'admin', model: 'gpt-5-2025-08-07' },
  'activity-supplier-manager': { name: 'Activity Supplier Manager', category: 'admin', model: 'gpt-5-2025-08-07' },
  'affiliate-program-manager': { name: 'Affiliate Program Manager', category: 'admin', model: 'gpt-5-2025-08-07' },
  
  // Monitoring agents (15)
  'system-health': { name: 'System Health Monitor', category: 'monitoring', model: 'gpt-5-nano-2025-08-07' },
  'performance-tracker': { name: 'Performance Tracker', category: 'monitoring', model: 'gpt-5-nano-2025-08-07' },
  'error-detector': { name: 'Error Detection Agent', category: 'monitoring', model: 'gpt-5-mini-2025-08-07' },
  'capacity-planner': { name: 'Capacity Planning Agent', category: 'monitoring', model: 'gpt-5-2025-08-07' },
  'uptime-monitor': { name: 'Uptime Monitor', category: 'monitoring', model: 'gpt-5-nano-2025-08-07' },
  'security-scanner': { name: 'Security Scanner', category: 'monitoring', model: 'gpt-5-mini-2025-08-07' },
  'database-monitor': { name: 'Database Monitor', category: 'monitoring', model: 'gpt-5-nano-2025-08-07' },
  'traffic-analyzer': { name: 'Traffic Analyzer', category: 'monitoring', model: 'gpt-5-mini-2025-08-07' },
  'resource-tracker': { name: 'Resource Tracker', category: 'monitoring', model: 'gpt-5-nano-2025-08-07' },
  'compliance-monitor': { name: 'Compliance Monitor', category: 'monitoring', model: 'gpt-5-mini-2025-08-07' },
  'cost-optimizer': { name: 'Cost Optimizer', category: 'monitoring', model: 'gpt-5-2025-08-07' },
  'alert-manager': { name: 'Alert Manager', category: 'monitoring', model: 'gpt-5-nano-2025-08-07' },
  'log-analyzer': { name: 'Log Analyzer', category: 'monitoring', model: 'gpt-5-mini-2025-08-07' },
  'trend-predictor': { name: 'Trend Predictor', category: 'monitoring', model: 'gpt-5-2025-08-07' },
  'anomaly-detector': { name: 'Anomaly Detector', category: 'monitoring', model: 'gpt-5-mini-2025-08-07' },
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    const { agent_id, intent, params } = await req.json();
    
    if (!agent_id || !AGENT_CONFIGS[agent_id]) {
      return new Response(
        JSON.stringify({ error: 'Invalid or unknown agent ID', availableAgents: Object.keys(AGENT_CONFIGS) }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get user ID from auth header
    const authHeader = req.headers.get('authorization');
    const userId = authHeader ? extractUserIdFromAuth(authHeader) : params.userId;
    const agentConfig = AGENT_CONFIGS[agent_id];

    // Import AgentMemoryManager
    const { AgentMemoryManager } = await import('./_shared/memory-utils.ts');
    const memory = new AgentMemoryManager(supabaseClient);

    // Create task record
    const { data: task, error: taskError } = await supabaseClient
      .from('agentic_tasks')
      .insert({
        user_id: userId,
        agent_id: agent_id,
        intent,
        params,
        status: 'running',
        progress: 10
      })
      .select()
      .single();

    if (taskError) {
      console.error('Task creation error:', taskError);
      throw new Error('Failed to create task record');
    }

    // Try to load specialized agent module
    let result;
    try {
      // Check if it's a manager (tier 1-3) or regular module (tier 4)
      const isManager = ['risk-management-manager', 'revenue-management-manager', 'customer-relationship-manager', 
                        'financial-transaction-manager', 'content-management-manager', 'inventory-management-manager',
                        'analytics-reporting-manager', 'marketing-campaign-manager',
                        'business-travel-manager', 'loyalty-program-manager', 'reservations-manager'].includes(agent_id);
      
      const modulePath = isManager ? `./managers/${agent_id}.ts` : `./modules/${agent_id}.ts`;
      const agentModule = await import(modulePath);
      const agentResult = await agentModule.handler(userId, intent, params, supabaseClient, openAIApiKey, memory);
      
      // Handle memory updates
      if (agentResult.memoryUpdates) {
        for (const update of agentResult.memoryUpdates) {
          await memory.setMemory(agent_id, userId, update.key, update.data, undefined, update.expiresAt);
        }
      }
      
      result = agentResult.result;
      
      if (!agentResult.success) {
        throw new Error(agentResult.error);
      }
    } catch (moduleError) {
      console.log(`No specialized module for ${agent_id}, using generic handler:`, moduleError.message);
      
      // Fallback to generic OpenAI handler
      const systemPrompt = buildAgentPrompt(agent_id, agentConfig, intent, params);
      const completion = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openAIApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: agentConfig.model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: `Execute task: ${intent} with parameters: ${JSON.stringify(params)}` }
          ],
          max_completion_tokens: agentConfig.model.includes('nano') ? 500 : 2000
        }),
      });

      const aiResponse = await completion.json();
      result = aiResponse.choices[0]?.message?.content || 'Task completed';
    }

    // Update task with result
    await supabaseClient
      .from('agentic_tasks')
      .update({
        status: 'completed',
        progress: 100,
        result: { output: result, timestamp: new Date().toISOString() }
      })
      .eq('id', task.id);

    return new Response(
      JSON.stringify({
        success: true,
        taskId: task.id,
        agent: agentConfig.name,
        result: result,
        status: 'completed'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Agent execution error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || 'Internal server error' 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

function extractUserIdFromAuth(authHeader: string): string | null {
  try {
    // Extract user ID from JWT token (simplified)
    const token = authHeader.replace('Bearer ', '');
    // In a real implementation, you'd properly decode the JWT
    return token.length > 10 ? 'authenticated-user' : null;
  } catch {
    return null;
  }
}

function buildAgentPrompt(agentId: string, config: any, intent: string, params: any): string {
  const basePrompts = {
    'trip-planner': `You are an expert travel planning agent for Maku Travel. Help users plan comprehensive trips based on their preferences, budget, and travel vertical (Family, Solo, Pet, Spiritual). Provide detailed itineraries, accommodation suggestions, and activity recommendations.`,
    
    'price-monitor': `You are a price monitoring agent. Track and analyze price changes for travel bookings. Alert users to price drops and better deals. Maintain historical price data and suggest optimal booking times.`,
    
    'booking-assistant': `You are a booking assistance agent. Help users complete bookings, handle payment processing, and manage reservation details. Ensure all booking requirements are met and provide confirmation details.`,
    
    'password-reset': `You are an administrative agent for password reset requests. Generate secure password reset instructions and validate user identity. Ensure security protocols are followed.`,
    
    'booking-modification': `You are a booking modification agent. Handle changes to existing reservations including date changes, passenger updates, and upgrade requests. Calculate change fees and process modifications.`,
    
    'refund-processing': `You are a refund processing agent. Handle refund requests according to cancellation policies. Calculate refund amounts, process returns, and generate refund documentation.`,
    
    'security-alert-handler': `You are a security alert handler agent. Process security threats, implement protective measures, and coordinate incident response. Monitor for suspicious activities and enforce security policies.`,
    
  'guided-workflow-orchestrator': `You are a workflow orchestration agent. Guide complex customer support processes through multi-step workflows. Route cases to appropriate agents, track progress, and ensure successful resolution.`,
  
  'calendar-sync-agent': `You are a calendar synchronization agent. Sync travel bookings with personal calendars, handle time zones, and manage automated reminders.`,
  
  'group-booking-coordinator': `You are a group booking coordination agent. Manage complex multi-traveler bookings, balance preferences, and coordinate group payments.`,
  
  'predictive-rebooking-agent': `You are a predictive rebooking agent. Monitor for travel disruptions and proactively rebook customers with minimal impact.`,
    
    'admin-dashboard-agent': `You are an admin dashboard agent. Generate comprehensive administrative reports, aggregate system metrics, and provide executive insights. Analyze business performance and system health data.`,
    
    'system-health': `You are a system health monitoring agent. Monitor system performance, detect anomalies, and generate health reports. Track key metrics and alert on threshold breaches.`
  };

  const agentPrompt = basePrompts[agentId] || `You are a specialized agent for ${config.name}. Execute tasks efficiently and provide detailed responses.`;

  return `${agentPrompt}

CURRENT TASK: ${intent}
PARAMETERS: ${JSON.stringify(params, null, 2)}
TIMESTAMP: ${new Date().toISOString()}

Provide a detailed response that addresses the user's request. Be specific, actionable, and helpful. If this is an administrative task, ensure security and compliance requirements are met.`;
}