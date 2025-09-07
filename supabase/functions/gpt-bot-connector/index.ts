import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.53.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface GPTBotRequest {
  botId: string;
  prompt: string;
  sessionId?: string;
  context?: Record<string, any>;
}

interface GPTBotResponse {
  success: boolean;
  data?: any;
  error?: string;
  executionTime?: number;
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
    
    const { botId, prompt, sessionId, context = {} }: GPTBotRequest = await req.json();
    
    if (!botId || !prompt) {
      return new Response(
        JSON.stringify({ success: false, error: 'botId and prompt are required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const startTime = Date.now();
    
    // Get bot details from registry
    const { data: bot, error: botError } = await supabase
      .from('gpt_bot_registry')
      .select('*')
      .eq('id', botId)
      .eq('integration_status', 'active')
      .single();

    if (botError || !bot) {
      console.error('Bot not found or inactive:', botError);
      return new Response(
        JSON.stringify({ success: false, error: 'Bot not found or inactive' }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // For now, we'll simulate the GPT bot interaction
    // In a real implementation, you would integrate with the actual ChatGPT API
    const simulatedResponse = {
      botName: bot.bot_name,
      response: `Hello! I'm ${bot.bot_name}, a ${bot.bot_type} specialized in ${bot.category.toLowerCase()}. You asked: "${prompt}". Based on my capabilities in ${bot.capabilities.join(', ')}, I would provide specialized assistance for this request.`,
      capabilities: bot.capabilities,
      metadata: {
        sessionId,
        context,
        timestamp: new Date().toISOString()
      }
    };

    const executionTime = Date.now() - startTime;

    // Log usage
    const { error: logError } = await supabase
      .from('gpt_bot_usage_logs')
      .insert({
        bot_id: botId,
        user_id: context.userId || null,
        session_id: sessionId,
        request_data: { prompt, context },
        response_data: simulatedResponse,
        execution_time_ms: executionTime,
        success: true
      });

    if (logError) {
      console.error('Error logging usage:', logError);
    }

    // Update usage metrics
    const currentMetrics = bot.usage_metrics || {};
    const updatedMetrics = {
      ...currentMetrics,
      totalRequests: (currentMetrics.totalRequests || 0) + 1,
      avgResponseTime: currentMetrics.avgResponseTime 
        ? Math.round((currentMetrics.avgResponseTime + executionTime) / 2)
        : executionTime,
      lastUsed: new Date().toISOString()
    };

    await supabase
      .from('gpt_bot_registry')
      .update({ usage_metrics: updatedMetrics })
      .eq('id', botId);

    const response: GPTBotResponse = {
      success: true,
      data: simulatedResponse,
      executionTime
    };

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in gpt-bot-connector:', error);
    
    const errorResponse: GPTBotResponse = {
      success: false,
      error: error.message || 'Internal server error'
    };

    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});