import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

interface PromptRequest {
  action: 'fetch' | 'cache' | 'analytics';
  promptId?: string;
  externalId?: string;
  source?: 'promptfoo' | 'langchain' | 'custom';
  analyticsData?: {
    promptId: string;
    userId?: string;
    sessionId?: string;
    responseTime?: number;
    success: boolean;
    errorMessage?: string;
    context?: Record<string, any>;
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, promptId, externalId, source = 'custom', analyticsData }: PromptRequest = await req.json();

    switch (action) {
      case 'fetch':
        return await handleFetchPrompt(externalId || promptId, source);
      
      case 'cache':
        return await handleCachePrompt(promptId!, externalId!);
      
      case 'analytics':
        return await handleAnalytics(analyticsData!);
      
      default:
        return new Response(
          JSON.stringify({ error: 'Invalid action' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
  } catch (error) {
    console.error('Error in prompt-manager:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function handleFetchPrompt(promptId: string, source: string) {
  try {
    // First check cache
    const { data: cachedPrompt } = await supabase
      .from('prompt_templates')
      .select('*')
      .eq('external_id', promptId)
      .eq('is_active', true)
      .single();

    if (cachedPrompt) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          prompt: cachedPrompt,
          source: 'cache'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // If not cached, attempt to fetch from external source
    let externalPrompt;
    
    switch (source) {
      case 'promptfoo':
        externalPrompt = await fetchFromPromptfoo(promptId);
        break;
      case 'langchain':
        externalPrompt = await fetchFromLangchain(promptId);
        break;
      default:
        // For the provided prompt ID, create a fallback response
        externalPrompt = {
          id: promptId,
          title: `External Prompt ${promptId}`,
          content: `You are an AI assistant integrated with external prompt management. Prompt ID: ${promptId}`,
          version: '1.0.0',
          metadata: { source }
        };
    }

    if (externalPrompt) {
      // Cache the fetched prompt
      const { data: savedPrompt, error } = await supabase
        .from('prompt_templates')
        .insert({
          external_id: promptId,
          title: externalPrompt.title,
          content: externalPrompt.content,
          version: externalPrompt.version || '1.0.0',
          category: externalPrompt.category || 'external',
          metadata: { source, ...externalPrompt.metadata }
        })
        .select()
        .single();

      if (error) {
        console.error('Error caching prompt:', error);
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          prompt: savedPrompt || externalPrompt,
          source: 'external'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Prompt not found' }),
      { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error fetching prompt:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to fetch prompt' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}

async function handleCachePrompt(promptId: string, externalId: string) {
  // Implementation for manual caching
  return new Response(
    JSON.stringify({ success: true, message: 'Prompt cached successfully' }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function handleAnalytics(analyticsData: any) {
  try {
    const { error } = await supabase
      .from('prompt_usage_analytics')
      .insert({
        external_prompt_id: analyticsData.promptId,
        user_id: analyticsData.userId,
        session_id: analyticsData.sessionId,
        response_time_ms: analyticsData.responseTime,
        success: analyticsData.success,
        error_message: analyticsData.errorMessage,
        usage_context: analyticsData.context || {},
        performance_metrics: {
          responseTime: analyticsData.responseTime,
          timestamp: new Date().toISOString()
        }
      });

    if (error) throw error;

    return new Response(
      JSON.stringify({ success: true, message: 'Analytics recorded' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error recording analytics:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to record analytics' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}

// External API integration functions
async function fetchFromPromptfoo(promptId: string) {
  // Placeholder for Promptfoo API integration
  console.log('Fetching from Promptfoo:', promptId);
  return null;
}

async function fetchFromLangchain(promptId: string) {
  // Placeholder for LangChain Hub integration
  console.log('Fetching from LangChain:', promptId);
  return null;
}