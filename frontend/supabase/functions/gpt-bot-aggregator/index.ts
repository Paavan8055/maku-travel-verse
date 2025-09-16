import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.53.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface BotResultInput {
  bot_type: string;
  output_data: any;
  actionability_rating: 'low' | 'medium' | 'high' | 'critical';
  confidence_score: number;
  result_type: string;
  user_id?: string;
  session_id?: string;
  correlation_id?: string;
  metadata?: any;
}

interface AgenticTaskInput {
  agent_id: string;
  intent: string;
  status: string;
  result?: any;
  user_id?: string;
  session_id?: string;
  params?: any;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_ANON_KEY') ?? '',
  );

  try {
    const { action, data } = await req.json();

    switch (action) {
      case 'store_gpt_result':
        return await storeGPTResult(supabaseClient, data as BotResultInput);
      
      case 'store_agentic_result':
        return await storeAgenticResult(supabaseClient, data as AgenticTaskInput);
      
      case 'aggregate_results':
        return await aggregateResults(supabaseClient, data);
      
      case 'get_dashboard_data':
        return await getDashboardData(supabaseClient, data);
        
      default:
        throw new Error(`Unknown action: ${action}`);
    }

  } catch (error) {
    console.error('GPT Bot Aggregator Error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message,
        timestamp: new Date().toISOString()
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

async function storeGPTResult(supabase: any, data: BotResultInput) {
  console.log('Storing GPT result:', data);
  
  const { error } = await supabase
    .from('bot_result_aggregation')
    .insert({
      bot_type: data.bot_type,
      output_data: data.output_data,
      actionability_rating: data.actionability_rating,
      confidence_score: data.confidence_score,
      result_type: data.result_type,
      user_id: data.user_id,
      session_id: data.session_id,
      correlation_id: data.correlation_id,
      metadata: data.metadata || {}
    });

  if (error) {
    throw new Error(`Failed to store GPT result: ${error.message}`);
  }

  return new Response(
    JSON.stringify({ 
      success: true, 
      message: 'GPT result stored successfully',
      timestamp: new Date().toISOString()
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function storeAgenticResult(supabase: any, data: AgenticTaskInput) {
  console.log('Storing agentic task result:', data);
  
  // First store in agentic_tasks if not exists
  const { error: taskError } = await supabase
    .from('agentic_tasks')
    .upsert({
      agent_id: data.agent_id,
      intent: data.intent,
      status: data.status,
      result: data.result,
      user_id: data.user_id,
      session_id: data.session_id,
      params: data.params || {}
    });

  if (taskError) {
    console.warn('Task upsert warning:', taskError);
  }

  // Then aggregate to bot results
  if (data.result && data.status === 'completed') {
    const { error } = await supabase
      .from('bot_result_aggregation')
      .insert({
        bot_type: `agent_${data.agent_id}`,
        output_data: data.result,
        actionability_rating: determineActionability(data.result),
        confidence_score: data.result?.confidence || 0.8,
        result_type: 'agent_task_completion',
        user_id: data.user_id,
        session_id: data.session_id,
        correlation_id: data.session_id,
        metadata: {
          agent_id: data.agent_id,
          intent: data.intent,
          original_params: data.params
        }
      });

    if (error) {
      throw new Error(`Failed to aggregate agentic result: ${error.message}`);
    }
  }

  return new Response(
    JSON.stringify({ 
      success: true, 
      message: 'Agentic result processed successfully',
      timestamp: new Date().toISOString()
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function aggregateResults(supabase: any, data: any) {
  const { timeframe = '24h', user_id, bot_types } = data;
  
  let query = supabase
    .from('bot_result_aggregation')
    .select('*')
    .order('created_at', { ascending: false });

  // Apply filters
  if (timeframe === '24h') {
    query = query.gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());
  } else if (timeframe === '7d') {
    query = query.gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());
  }

  if (user_id) {
    query = query.eq('user_id', user_id);
  }

  if (bot_types && bot_types.length > 0) {
    query = query.in('bot_type', bot_types);
  }

  const { data: results, error } = await query.limit(100);

  if (error) {
    throw new Error(`Failed to aggregate results: ${error.message}`);
  }

  // Calculate aggregated metrics
  const aggregatedMetrics = {
    total_results: results.length,
    high_priority_count: results.filter(r => ['high', 'critical'].includes(r.actionability_rating)).length,
    average_confidence: results.length > 0 ? 
      results.reduce((sum, r) => sum + r.confidence_score, 0) / results.length : 0,
    bot_type_distribution: results.reduce((acc, r) => {
      acc[r.bot_type] = (acc[r.bot_type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>),
    actionability_distribution: results.reduce((acc, r) => {
      acc[r.actionability_rating] = (acc[r.actionability_rating] || 0) + 1;
      return acc;
    }, {} as Record<string, number>)
  };

  return new Response(
    JSON.stringify({ 
      success: true, 
      results,
      metrics: aggregatedMetrics,
      timestamp: new Date().toISOString()
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function getDashboardData(supabase: any, data: any) {
  const { dashboard_type, user_id } = data;
  
  console.log('Getting dashboard data for:', dashboard_type, user_id);

  // Get recent bot results
  let resultsQuery = supabase
    .from('bot_result_aggregation')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(50);

  if (user_id && dashboard_type === 'user') {
    resultsQuery = resultsQuery.eq('user_id', user_id);
  }

  const { data: results, error: resultsError } = await resultsQuery;

  if (resultsError) {
    throw new Error(`Failed to get dashboard data: ${resultsError.message}`);
  }

  // Get dashboard context
  const { data: context, error: contextError } = await supabase
    .from('dashboard_context_store')
    .select('*')
    .eq('dashboard_type', dashboard_type)
    .order('updated_at', { ascending: false })
    .limit(10);

  if (contextError) {
    console.warn('Context fetch warning:', contextError);
  }

  // Get admin commands if admin dashboard
  let adminCommands = [];
  if (dashboard_type === 'admin') {
    const { data: commands, error: commandsError } = await supabase
      .from('admin_bot_commands')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20);

    if (commandsError) {
      console.warn('Admin commands fetch warning:', commandsError);
    } else {
      adminCommands = commands || [];
    }
  }

  return new Response(
    JSON.stringify({ 
      success: true, 
      results: results || [],
      context: context || [],
      adminCommands,
      summary: {
        total_results: results?.length || 0,
        high_priority: results?.filter(r => ['high', 'critical'].includes(r.actionability_rating)).length || 0,
        recent_activity: results?.filter(r => 
          new Date(r.created_at) > new Date(Date.now() - 60 * 60 * 1000)
        ).length || 0
      },
      timestamp: new Date().toISOString()
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

function determineActionability(result: any): 'low' | 'medium' | 'high' | 'critical' {
  if (!result) return 'low';
  
  // Check for error conditions
  if (result.error || result.failed) return 'critical';
  
  // Check for high-value results
  if (result.priority === 'high' || result.urgent === true) return 'high';
  
  // Check for medium importance
  if (result.recommendations && result.recommendations.length > 0) return 'medium';
  
  // Default to low
  return 'low';
}