import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.53.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface WorkflowRequest {
  action: 'start' | 'status' | 'cancel';
  workflowId?: string;
  workflowSteps?: any[];
  prompt?: string;
  userId?: string;
  sessionId?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);
    
    const { action, workflowId, workflowSteps, prompt, userId, sessionId }: WorkflowRequest = await req.json();

    if (action === 'start' && workflowSteps && prompt) {
      // Start new workflow execution
      const { data: execution, error: execError } = await supabase
        .from('gpt_bot_workflow_executions')
        .insert({
          workflow_id: workflowId,
          user_id: userId,
          session_id: sessionId,
          status: 'running',
          current_step: 0,
          metadata: { originalPrompt: prompt }
        })
        .select()
        .single();

      if (execError) {
        throw new Error(`Failed to start workflow: ${execError.message}`);
      }

      // Execute workflow steps sequentially
      let previousOutput = prompt;
      const stepResults = [];

      for (let i = 0; i < workflowSteps.length; i++) {
        const step = workflowSteps[i];
        
        // Update current step
        await supabase
          .from('gpt_bot_workflow_executions')
          .update({ current_step: i + 1 })
          .eq('id', execution.id);

        try {
          // Call bot connector for each step
          const botResponse = await supabase.functions.invoke('gpt-bot-connector', {
            body: {
              botId: step.bot_id,
              prompt: previousOutput,
              sessionId: sessionId,
              workflowId: execution.id,
              previousBotOutput: i > 0 ? stepResults[i - 1]?.response : undefined,
              context: { 
                userId,
                workflowStep: i + 1,
                stepName: step.step_name,
                stepDescription: step.description
              }
            }
          });

          if (botResponse.error) {
            throw new Error(`Bot ${step.bot_id} failed: ${botResponse.error.message}`);
          }

          const stepResult = {
            stepNumber: i + 1,
            botId: step.bot_id,
            stepName: step.step_name,
            response: botResponse.data?.data?.response || '',
            executionTime: botResponse.data?.executionTime || 0,
            timestamp: new Date().toISOString()
          };

          stepResults.push(stepResult);
          previousOutput = stepResult.response;

        } catch (stepError) {
          // Handle step failure
          await supabase
            .from('gpt_bot_workflow_executions')
            .update({
              status: 'failed',
              error_message: stepError.message,
              step_results: stepResults,
              completed_at: new Date().toISOString()
            })
            .eq('id', execution.id);

          return new Response(JSON.stringify({
            success: false,
            error: stepError.message,
            executionId: execution.id,
            completedSteps: stepResults
          }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }
      }

      // Mark workflow as completed
      const totalTime = stepResults.reduce((sum, step) => sum + step.executionTime, 0);
      
      await supabase
        .from('gpt_bot_workflow_executions')
        .update({
          status: 'completed',
          step_results: stepResults,
          completed_at: new Date().toISOString(),
          total_execution_time_ms: totalTime
        })
        .eq('id', execution.id);

      return new Response(JSON.stringify({
        success: true,
        executionId: execution.id,
        results: stepResults,
        totalExecutionTime: totalTime,
        finalOutput: previousOutput
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });

    } else if (action === 'status' && workflowId) {
      // Get workflow execution status
      const { data: execution, error } = await supabase
        .from('gpt_bot_workflow_executions')
        .select('*')
        .eq('id', workflowId)
        .single();

      if (error) {
        throw new Error(`Workflow not found: ${error.message}`);
      }

      return new Response(JSON.stringify({
        success: true,
        execution
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });

    } else if (action === 'cancel' && workflowId) {
      // Cancel workflow execution
      await supabase
        .from('gpt_bot_workflow_executions')
        .update({
          status: 'cancelled',
          completed_at: new Date().toISOString()
        })
        .eq('id', workflowId);

      return new Response(JSON.stringify({
        success: true,
        message: 'Workflow cancelled'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });

    } else {
      return new Response(JSON.stringify({
        success: false,
        error: 'Invalid action or missing parameters'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

  } catch (error) {
    console.error('Error in workflow orchestrator:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message || 'Internal server error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});