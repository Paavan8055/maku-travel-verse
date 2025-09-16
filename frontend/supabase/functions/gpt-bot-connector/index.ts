import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.53.0';

// OpenAI Service Wrapper
interface OpenAIRequest {
  systemPrompt: string;
  userPrompt: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  responseFormat?: 'text' | 'json';
}

interface OpenAIResponse {
  content: string;
  success: boolean;
  error?: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

class OpenAIServiceWrapper {
  private apiKey: string;
  private defaultModel: string;

  constructor(apiKey: string, defaultModel: string = 'gpt-5-2025-08-07') {
    this.apiKey = apiKey;
    this.defaultModel = defaultModel;
  }

  private isNewerModel(model: string): boolean {
    const newerModels = [
      'gpt-5-2025-08-07',
      'gpt-5-mini-2025-08-07', 
      'gpt-5-nano-2025-08-07',
      'gpt-4.1-2025-04-14',
      'gpt-4.1-mini-2025-04-14',
      'o3-2025-04-16',
      'o4-mini-2025-04-16'
    ];
    return newerModels.includes(model);
  }

  async chat(request: OpenAIRequest): Promise<OpenAIResponse> {
    try {
      const model = request.model || this.defaultModel;
      const isNewer = this.isNewerModel(model);

      const requestBody: any = {
        model,
        messages: [
          { role: 'system', content: request.systemPrompt },
          { role: 'user', content: request.userPrompt }
        ],
      };

      if (request.maxTokens) {
        if (isNewer) {
          requestBody.max_completion_tokens = request.maxTokens;
        } else {
          requestBody.max_tokens = request.maxTokens;
        }
      }

      if (request.temperature !== undefined && !isNewer) {
        requestBody.temperature = request.temperature;
      }

      if (request.responseFormat === 'json') {
        requestBody.response_format = { type: 'json_object' };
      }

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`OpenAI API error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`);
      }

      const data = await response.json();
      const content = data.choices[0]?.message?.content || '';

      return {
        content,
        success: true,
        usage: data.usage
      };

    } catch (error) {
      console.error('OpenAI Service Error:', error);
      return {
        content: '',
        success: false,
        error: error.message
      };
    }
  }
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface GPTBotRequest {
  botId: string;
  prompt: string;
  sessionId?: string;
  context?: Record<string, any>;
  workflowId?: string;
  previousBotOutput?: string;
}

interface GPTBotResponse {
  success: boolean;
  data?: any;
  error?: string;
  executionTime?: number;
  botInfo?: {
    name: string;
    category: string;
    capabilities: string[];
  };
  suggestions?: {
    nextBots: string[];
    relatedWorkflows: string[];
  };
}

// Bot specialization prompts
const getBotSpecializationPrompt = (bot: any, userPrompt: string, previousOutput?: string): string => {
  const basePrompt = `You are ${bot.bot_name}, a specialized ${bot.bot_type} expert in ${bot.category}.

Your core capabilities: ${bot.capabilities.join(', ')}
Your expertise: ${bot.description}

IMPORTANT: You must respond as this specific bot with your specialized knowledge and personality.
${previousOutput ? `\nPrevious context from workflow: ${previousOutput}` : ''}

User Request: ${userPrompt}

Provide a specialized response that leverages your specific expertise in ${bot.category}.`;

  return basePrompt;
};

// Intelligent bot routing
const getRelatedBots = (currentBot: any, allBots: any[]): string[] => {
  const related = allBots
    .filter(bot => 
      bot.id !== currentBot.id && 
      (bot.category === currentBot.category || 
       bot.capabilities.some((cap: string) => currentBot.capabilities.includes(cap)))
    )
    .slice(0, 3)
    .map(bot => bot.id);
  
  return related;
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);
    const openai = new OpenAIServiceWrapper(openaiApiKey);
    
    const { botId, prompt, sessionId, context = {}, workflowId, previousBotOutput }: GPTBotRequest = await req.json();
    
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

    // Get all bots for relationship mapping
    const { data: allBots } = await supabase
      .from('gpt_bot_registry')
      .select('id, bot_name, category, capabilities')
      .eq('integration_status', 'active');

    // Create specialized prompt for this bot
    const specializationPrompt = getBotSpecializationPrompt(bot, prompt, previousBotOutput);
    
    // Use OpenAI to generate specialized response
    const openaiResponse = await openai.chat({
      systemPrompt: specializationPrompt,
      userPrompt: prompt,
      model: 'gpt-5-mini-2025-08-07',
      maxTokens: 2000
    });

    if (!openaiResponse.success) {
      throw new Error(`OpenAI API error: ${openaiResponse.error}`);
    }

    // Get related bots for suggestions
    const relatedBots = getRelatedBots(bot, allBots || []);
    
    const botResponse = {
      botName: bot.bot_name,
      response: openaiResponse.content,
      capabilities: bot.capabilities,
      usage: openaiResponse.usage,
      metadata: {
        sessionId,
        context,
        workflowId,
        timestamp: new Date().toISOString(),
        model: 'gpt-5-mini-2025-08-07'
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
        request_data: { prompt, context, previousBotOutput, workflowId },
        response_data: botResponse,
        execution_time_ms: executionTime,
        success: true,
        token_usage: openaiResponse.usage
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
      data: botResponse,
      executionTime,
      botInfo: {
        name: bot.bot_name,
        category: bot.category,
        capabilities: bot.capabilities
      },
      suggestions: {
        nextBots: relatedBots,
        relatedWorkflows: [] // Will be populated when workflow templates are implemented
      }
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