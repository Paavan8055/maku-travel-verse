import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.53.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AgentRequest {
  action: 'create' | 'handoff' | 'terminate' | 'getMetrics' | 'executeWorkflow';
  agentId?: string;
  specialization?: string;
  targetAgent?: string;
  workflowId?: string;
  params?: Record<string, any>;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        auth: {
          persistSession: false,
        },
      }
    );

    const { action, agentId, specialization, targetAgent, workflowId, params }: AgentRequest = await req.json();

    console.log(`Agent orchestration request: ${action}`, { agentId, specialization, targetAgent, workflowId });

    switch (action) {
      case 'create':
        return await createSpecializedAgent(supabaseClient, specialization!, params);
        
      case 'handoff':
        return await handoffToSpecialist(supabaseClient, agentId!, targetAgent!, params);
        
      case 'terminate':
        return await terminateAgent(supabaseClient, agentId!);
        
      case 'getMetrics':
        return await getSystemMetrics(supabaseClient);
        
      case 'executeWorkflow':
        return await executeWorkflow(supabaseClient, workflowId!, params);
        
      default:
        throw new Error(`Unknown action: ${action}`);
    }
  } catch (error) {
    console.error('Agent orchestration error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

async function createSpecializedAgent(supabase: any, specialization: string, params: Record<string, any> = {}) {
  const agentId = `agent_${specialization}_${Date.now()}`;
  
  // Store agent in database
  const { data, error } = await supabase
    .from('agent_tasks_consolidated')
    .insert({
      agent_id: agentId,
      task_type: 'agent_creation',
      params: {
        specialization,
        created_at: new Date().toISOString(),
        capabilities: getAgentCapabilities(specialization),
        ...params
      },
      status: 'active',
      priority: 1
    });

  if (error) {
    throw new Error(`Failed to create agent: ${error.message}`);
  }

  console.log(`Created specialized agent: ${agentId} (${specialization})`);

  return new Response(
    JSON.stringify({
      success: true,
      agentId,
      specialization,
      capabilities: getAgentCapabilities(specialization)
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function handoffToSpecialist(supabase: any, fromAgent: string, toAgent: string, context: Record<string, any> = {}) {
  // Log handoff event
  const { error } = await supabase
    .from('agent_tasks_consolidated')
    .insert({
      agent_id: toAgent,
      task_type: 'agent_handoff',
      params: {
        from: fromAgent,
        to: toAgent,
        context,
        handoff_at: new Date().toISOString()
      },
      status: 'active',
      priority: 2
    });

  if (error) {
    throw new Error(`Failed to handoff: ${error.message}`);
  }

  console.log(`Agent handoff: ${fromAgent} -> ${toAgent}`);

  return new Response(
    JSON.stringify({
      success: true,
      from: fromAgent,
      to: toAgent,
      status: 'handoff_complete'
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function terminateAgent(supabase: any, agentId: string) {
  const { error } = await supabase
    .from('agent_tasks_consolidated')
    .update({ status: 'terminated' })
    .eq('agent_id', agentId);

  if (error) {
    throw new Error(`Failed to terminate agent: ${error.message}`);
  }

  console.log(`Terminated agent: ${agentId}`);

  return new Response(
    JSON.stringify({
      success: true,
      agentId,
      status: 'terminated'
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function getSystemMetrics(supabase: any) {
  // Get agent metrics
  const { data: agents, error: agentsError } = await supabase
    .from('agent_tasks_consolidated')
    .select('agent_id, status, task_type, created_at')
    .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

  if (agentsError) {
    throw new Error(`Failed to get metrics: ${agentsError.message}`);
  }

  const activeAgents = agents.filter((a: any) => a.status === 'active').length;
  const completedTasks = agents.filter((a: any) => a.status === 'completed').length;
  const failedTasks = agents.filter((a: any) => a.status === 'failed').length;

  const metrics = {
    activeAgents,
    completedTasks,
    failedTasks,
    totalAgents: agents.length,
    successRate: completedTasks > 0 ? (completedTasks / (completedTasks + failedTasks)) * 100 : 0,
    specializations: getActiveSpecializations(agents),
    performance: {
      averageResponseTime: 1200, // ms
      throughput: completedTasks / 24, // tasks per hour
      systemLoad: Math.min(100, (activeAgents / 10) * 100) // percentage
    }
  };

  return new Response(
    JSON.stringify(metrics),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function executeWorkflow(supabase: any, workflowId: string, params: Record<string, any> = {}) {
  const workflowDefinitions = {
    'travel_booking_complete': {
      steps: ['search', 'select', 'payment', 'confirmation'],
      agents: ['search-agent', 'booking-agent', 'payment-agent']
    },
    'multi_provider_search': {
      steps: ['amadeus_search', 'sabre_search', 'comparison', 'selection'],
      agents: ['amadeus-agent', 'sabre-agent', 'comparison-agent']
    },
    'customer_support_escalation': {
      steps: ['analyze', 'categorize', 'route', 'resolve'],
      agents: ['analysis-agent', 'routing-agent', 'support-agent']
    }
  };

  const workflow = workflowDefinitions[workflowId as keyof typeof workflowDefinitions];
  if (!workflow) {
    throw new Error(`Unknown workflow: ${workflowId}`);
  }

  // Create workflow execution record
  const { data, error } = await supabase
    .from('agent_tasks_consolidated')
    .insert({
      agent_id: `workflow_${workflowId}_${Date.now()}`,
      task_type: 'workflow_execution',
      params: {
        workflowId,
        steps: workflow.steps,
        agents: workflow.agents,
        input: params,
        started_at: new Date().toISOString()
      },
      status: 'active',
      priority: 1
    });

  if (error) {
    throw new Error(`Failed to start workflow: ${error.message}`);
  }

  console.log(`Started workflow: ${workflowId}`);

  return new Response(
    JSON.stringify({
      success: true,
      workflowId,
      steps: workflow.steps,
      status: 'started'
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

function getAgentCapabilities(specialization: string): string[] {
  const capabilities = {
    'flight-expert': ['flight_search', 'amadeus_integration', 'pricing_analysis', 'schedule_optimization'],
    'hotel-specialist': ['hotel_search', 'hotelbeds_integration', 'amenity_matching', 'location_analysis'],
    'booking-coordinator': ['payment_processing', 'confirmation_handling', 'customer_communication'],
    'travel-planner': ['itinerary_creation', 'multi_service_coordination', 'optimization'],
    'customer-support': ['issue_resolution', 'escalation_handling', 'communication'],
    'analytics-agent': ['performance_monitoring', 'conversion_analysis', 'reporting']
  };

  return capabilities[specialization as keyof typeof capabilities] || ['general_assistance'];
}

function getActiveSpecializations(agents: any[]): Record<string, number> {
  const specializations: Record<string, number> = {};
  
  agents.forEach(agent => {
    const spec = agent.params?.specialization || 'general';
    specializations[spec] = (specializations[spec] || 0) + 1;
  });

  return specializations;
}