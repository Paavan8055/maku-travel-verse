import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.53.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// 70 Agent System Configuration
const AGENT_CONFIGS = {
  // Customer-facing agents
  'trip-planner': { name: 'Trip Planner', category: 'customer', model: 'gpt-5-2025-08-07' },
  'price-monitor': { name: 'Price Monitor', category: 'customer', model: 'gpt-5-mini-2025-08-07' },
  'booking-assistant': { name: 'Booking Assistant', category: 'customer', model: 'gpt-5-2025-08-07' },
  'itinerary-optimizer': { name: 'Itinerary Optimizer', category: 'customer', model: 'gpt-5-2025-08-07' },
  
  // Administrative agents
  'password-reset': { name: 'Password Reset Agent', category: 'admin', model: 'gpt-5-mini-2025-08-07' },
  'booking-modification': { name: 'Booking Modification Agent', category: 'admin', model: 'gpt-5-2025-08-07' },
  'refund-processing': { name: 'Refund Processing Agent', category: 'admin', model: 'gpt-5-2025-08-07' },
  'security-alert': { name: 'Security Alert Agent', category: 'admin', model: 'gpt-5-mini-2025-08-07' },
  'user-support': { name: 'User Support Agent', category: 'admin', model: 'gpt-5-2025-08-07' },
  'fraud-detection': { name: 'Fraud Detection Agent', category: 'admin', model: 'gpt-5-2025-08-07' },
  'compliance-check': { name: 'Compliance Check Agent', category: 'admin', model: 'gpt-5-mini-2025-08-07' },
  'data-validation': { name: 'Data Validation Agent', category: 'admin', model: 'gpt-5-mini-2025-08-07' },
  
  // Monitoring agents
  'system-health': { name: 'System Health Monitor', category: 'monitoring', model: 'gpt-5-nano-2025-08-07' },
  'performance-tracker': { name: 'Performance Tracker', category: 'monitoring', model: 'gpt-5-nano-2025-08-07' },
  'error-detector': { name: 'Error Detection Agent', category: 'monitoring', model: 'gpt-5-mini-2025-08-07' },
  'capacity-planner': { name: 'Capacity Planning Agent', category: 'monitoring', model: 'gpt-5-2025-08-07' },
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

    const url = new URL(req.url);
    const agentId = url.pathname.split('/').pop();
    
    if (!agentId || !AGENT_CONFIGS[agentId]) {
      return new Response(
        JSON.stringify({ error: 'Invalid or unknown agent ID' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { intent, params, userId } = await req.json();
    const agentConfig = AGENT_CONFIGS[agentId];

    // Create task record
    const { data: task, error: taskError } = await supabaseClient
      .from('agentic_tasks')
      .insert({
        user_id: userId,
        agent_id: agentId,
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

    // Build agent-specific prompt
    const systemPrompt = buildAgentPrompt(agentId, agentConfig, intent, params);

    // Call OpenAI with appropriate model
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
    const result = aiResponse.choices[0]?.message?.content || 'Task completed';

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

function buildAgentPrompt(agentId: string, config: any, intent: string, params: any): string {
  const basePrompts = {
    'trip-planner': `You are an expert travel planning agent for Maku Travel. Help users plan comprehensive trips based on their preferences, budget, and travel vertical (Family, Solo, Pet, Spiritual). Provide detailed itineraries, accommodation suggestions, and activity recommendations.`,
    
    'price-monitor': `You are a price monitoring agent. Track and analyze price changes for travel bookings. Alert users to price drops and better deals. Maintain historical price data and suggest optimal booking times.`,
    
    'booking-assistant': `You are a booking assistance agent. Help users complete bookings, handle payment processing, and manage reservation details. Ensure all booking requirements are met and provide confirmation details.`,
    
    'password-reset': `You are an administrative agent for password reset requests. Generate secure password reset instructions and validate user identity. Ensure security protocols are followed.`,
    
    'booking-modification': `You are a booking modification agent. Handle changes to existing reservations including date changes, passenger updates, and upgrade requests. Calculate change fees and process modifications.`,
    
    'refund-processing': `You are a refund processing agent. Handle refund requests according to cancellation policies. Calculate refund amounts, process returns, and generate refund documentation.`,
    
    'security-alert': `You are a security monitoring agent. Detect suspicious activities, generate security alerts, and recommend protective actions. Monitor for fraud patterns and unauthorized access.`,
    
    'system-health': `You are a system health monitoring agent. Monitor system performance, detect anomalies, and generate health reports. Track key metrics and alert on threshold breaches.`
  };

  const agentPrompt = basePrompts[agentId] || `You are a specialized agent for ${config.name}. Execute tasks efficiently and provide detailed responses.`;

  return `${agentPrompt}

CURRENT TASK: ${intent}
PARAMETERS: ${JSON.stringify(params, null, 2)}
TIMESTAMP: ${new Date().toISOString()}

Provide a detailed response that addresses the user's request. Be specific, actionable, and helpful. If this is an administrative task, ensure security and compliance requirements are met.`;
}