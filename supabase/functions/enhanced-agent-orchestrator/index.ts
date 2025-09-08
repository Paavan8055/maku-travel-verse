import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.53.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface OrchestrationRequest {
  agentId: string;
  userId?: string;
  intent: string;
  params: Record<string, any>;
  context?: Record<string, any>;
  safetyCheck?: boolean;
  learningMode?: boolean;
}

interface OrchestrationResponse {
  success: boolean;
  result?: any;
  error?: string;
  safetyScore?: number;
  recommendations?: string[];
  executionId: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { agentId, userId, intent, params, context, safetyCheck = true, learningMode = true }: OrchestrationRequest = await req.json();
    const executionId = crypto.randomUUID();

    console.log(`[${executionId}] Enhanced orchestration request:`, { agentId, intent, userId });

    // 1. Safety validation if enabled
    let safetyScore = 1.0;
    if (safetyCheck) {
      const safetyResult = await validateSafety(supabaseClient, {
        agentId,
        requestId: executionId,
        validationType: 'content',
        inputContent: { intent, params, context }
      });
      
      safetyScore = safetyResult.score;
      
      if (!safetyResult.safe) {
        console.log(`[${executionId}] Safety check failed:`, safetyResult);
        return new Response(JSON.stringify({
          success: false,
          error: 'Request failed safety validation',
          safetyScore,
          executionId
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    }

    // 2. Enhanced memory retrieval
    const relevantMemories = await retrieveRelevantMemories(supabaseClient, agentId, userId, intent);
    
    // 3. Agent execution with enhanced context
    const enhancedContext = {
      ...context,
      memories: relevantMemories,
      executionId,
      safetyScore,
      learningMode
    };

    const agentResult = await executeAgent(supabaseClient, agentId, userId, intent, params, enhancedContext);

    // 4. Learning system integration
    if (learningMode && agentResult.success) {
      await recordLearningMetrics(supabaseClient, {
        agentId,
        userId,
        executionId,
        intent,
        result: agentResult.result,
        context: enhancedContext
      });
    }

    // 5. Generate recommendations
    const recommendations = await generateRecommendations(supabaseClient, agentId, userId, agentResult);

    const response: OrchestrationResponse = {
      success: agentResult.success,
      result: agentResult.result,
      error: agentResult.error,
      safetyScore,
      recommendations,
      executionId
    };

    console.log(`[${executionId}] Orchestration completed:`, { success: response.success });

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Enhanced orchestration error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      executionId: crypto.randomUUID()
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

async function validateSafety(supabaseClient: any, request: any) {
  try {
    // Simple safety validation - in production, use more sophisticated checks
    const inputText = JSON.stringify(request.inputContent).toLowerCase();
    
    const prohibitedTerms = ['harmful', 'illegal', 'dangerous', 'hack', 'exploit'];
    const violations = prohibitedTerms.filter(term => inputText.includes(term));
    
    const score = violations.length === 0 ? 1.0 : Math.max(0, 1.0 - (violations.length * 0.3));
    const safe = score >= 0.7;

    // Log safety validation
    await supabaseClient
      .from('agent_safety_logs')
      .insert({
        agent_id: request.agentId,
        request_id: request.requestId,
        validation_type: request.validationType,
        input_content: request.inputContent,
        safety_score: score,
        violations: violations.map(v => ({ type: 'prohibited_content', term: v })),
        action_taken: safe ? 'allow' : 'block'
      });

    return { safe, score, violations };
  } catch (error) {
    console.error('Safety validation error:', error);
    return { safe: false, score: 0, violations: ['validation_error'] };
  }
}

async function retrieveRelevantMemories(supabaseClient: any, agentId: string, userId?: string, intent?: string) {
  try {
    const { data: memories } = await supabaseClient
      .from('enhanced_agent_memory')
      .select('*')
      .eq('agent_id', agentId)
      .eq('user_id', userId || '')
      .gte('importance_score', 0.5)
      .order('importance_score', { ascending: false })
      .limit(10);

    return memories || [];
  } catch (error) {
    console.error('Memory retrieval error:', error);
    return [];
  }
}

async function executeAgent(supabaseClient: any, agentId: string, userId?: string, intent?: string, params?: any, context?: any) {
  try {
    // Call the main agent orchestrator
    const { data, error } = await supabaseClient.functions.invoke('agents', {
      body: {
        intent,
        params: {
          ...params,
          agentId,
          userId,
          enhancedContext: context
        }
      }
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, result: data };
  } catch (error) {
    console.error('Agent execution error:', error);
    return { success: false, error: error.message };
  }
}

async function recordLearningMetrics(supabaseClient: any, data: any) {
  try {
    await supabaseClient
      .from('agent_learning_metrics')
      .insert({
        agent_id: data.agentId,
        user_id: data.userId,
        metric_type: 'execution_success',
        metric_value: 1,
        context: {
          execution_id: data.executionId,
          intent: data.intent,
          result_summary: typeof data.result === 'object' ? 'object_result' : String(data.result).substring(0, 100)
        }
      });
  } catch (error) {
    console.error('Learning metrics error:', error);
  }
}

async function generateRecommendations(supabaseClient: any, agentId: string, userId?: string, result?: any) {
  try {
    const recommendations: string[] = [];

    // Get recent performance data
    const { data: recentMetrics } = await supabaseClient
      .from('agent_learning_metrics')
      .select('metric_value, metric_type')
      .eq('agent_id', agentId)
      .eq('user_id', userId || '')
      .order('created_at', { ascending: false })
      .limit(10);

    if (recentMetrics && recentMetrics.length > 0) {
      const successRate = recentMetrics.filter(m => m.metric_type === 'execution_success').length / recentMetrics.length;
      
      if (successRate < 0.8) {
        recommendations.push('Consider reviewing agent parameters for improved performance');
      }
      
      if (successRate > 0.95) {
        recommendations.push('Excellent performance - consider expanding agent capabilities');
      }
    }

    // Safety-based recommendations
    const { data: safetyLogs } = await supabaseClient
      .from('agent_safety_logs')
      .select('safety_score')
      .eq('agent_id', agentId)
      .order('created_at', { ascending: false })
      .limit(5);

    if (safetyLogs && safetyLogs.length > 0) {
      const avgSafetyScore = safetyLogs.reduce((sum, log) => sum + log.safety_score, 0) / safetyLogs.length;
      
      if (avgSafetyScore < 0.9) {
        recommendations.push('Review content guidelines to improve safety scores');
      }
    }

    return recommendations;
  } catch (error) {
    console.error('Recommendations error:', error);
    return ['Unable to generate recommendations at this time'];
  }
}