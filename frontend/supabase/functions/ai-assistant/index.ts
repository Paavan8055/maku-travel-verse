import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.53.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AIAssistantRequest {
  query: string;
  type: 'natural_language' | 'troubleshooting' | 'knowledge_search' | 'predictive_analysis';
  context: any;
  conversationHistory?: Array<{
    role: 'user' | 'assistant';
    content: string;
  }>;
  useExternalPrompt?: boolean;
  promptId?: string;
}

interface AIAssistantResponse {
  type: string;
  response: string;
  suggestions?: string[];
  confidence: number;
  context_used: boolean;
  diagnosticSteps?: any[];
  analysis?: any;
  recommendedActions?: string[];
  escalationLevel?: string;
  predictions?: any;
  results?: any[];
  searchQuery?: string;
  totalResults?: number;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('AI Assistant request received');
    
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get OpenAI API key
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      throw new Error('OpenAI API key not found');
    }

    // Parse request
    const { query, type, context, conversationHistory, useExternalPrompt, promptId }: AIAssistantRequest = await req.json();
    console.log('Processing AI query:', query, 'type:', type);

    // Get Master AI Analyst bot configuration
    const { data: botData, error: botError } = await supabase
      .from('gpt_bot_registry')
      .select('*')
      .eq('bot_name', 'master-ai-analyst')
      .eq('integration_status', 'active')
      .maybeSingle();

    if (botError) {
      console.error('Bot registry error:', botError);
    }

    // Use bot configuration or fallback
    const botConfig = botData?.configuration || {};
    const model = botConfig.model || 'gpt-5-2025-08-07';
    const systemPrompt = botConfig.system_prompt || getDefaultSystemPrompt(type);

    // Build enhanced system prompt
    const enhancedPrompt = systemPrompt + `

Context Information:
- Query Type: ${type}
- Admin Section: ${context.adminSection || 'general'}
- System Health: ${context.systemHealth ? 'Available' : 'Not available'}
- User: ${context.currentUser || 'Unknown'}
- Timestamp: ${context.timestamp || new Date().toISOString()}

Instructions:
- Provide comprehensive analysis with actionable insights
- Include confidence ratings (0-1) for your recommendations
- Structure responses with clear sections: Analysis, Recommendations, Actions
- For troubleshooting: provide diagnostic steps and escalation levels
- For predictions: include trend analysis and risk assessment
- Always be specific and data-driven when possible`;

    // Build conversation messages
    const messages = [
      {
        role: 'system',
        content: enhancedPrompt
      },
      ...(conversationHistory?.slice(-5) || []),
      {
        role: 'user',
        content: `${query}\n\nAdditional Context: ${JSON.stringify(context, null, 2)}`
      }
    ];

    console.log('Calling OpenAI with model:', model);

    // Call OpenAI API
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: model,
        messages: messages,
        max_completion_tokens: botConfig.max_tokens || 2000,
        // Note: temperature not supported for GPT-5 models
        ...(model.includes('gpt-4') ? { temperature: botConfig.temperature || 0.7 } : {})
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('OpenAI API error:', response.status, errorData);
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    console.log('OpenAI response received');

    const aiResponse = data.choices[0].message.content;

    // Parse structured response if possible
    const structuredResponse = parseAIResponse(aiResponse, type);

    // Generate contextual suggestions
    const suggestions = generateSuggestions(type, context);

    // Log usage to registry if bot exists
    if (botData) {
      const currentMetrics = botData.usage_metrics || {};
      const updatedMetrics = {
        ...currentMetrics,
        total_requests: (currentMetrics.total_requests || 0) + 1,
        last_used: new Date().toISOString(),
        tokens_used: (currentMetrics.tokens_used || 0) + (data.usage?.total_tokens || 0)
      };

      await supabase
        .from('gpt_bot_registry')
        .update({ 
          usage_metrics: updatedMetrics,
          updated_at: new Date().toISOString()
        })
        .eq('id', botData.id);
    }

    const assistantResponse: AIAssistantResponse = {
      type: `ai_${type}`,
      response: aiResponse,
      suggestions,
      confidence: structuredResponse.confidence || 0.8,
      context_used: true,
      ...structuredResponse
    };

    console.log('AI Assistant response ready');

    return new Response(JSON.stringify(assistantResponse), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in AI Assistant function:', error);
    
    const errorResponse: AIAssistantResponse = {
      type: 'error_response',
      response: 'I encountered an issue processing your request. Please try rephrasing your question or check the system health dashboard.',
      suggestions: [
        'Check system health dashboard',
        'Review recent alerts',
        'Contact technical support if the issue persists'
      ],
      confidence: 0.3,
      context_used: false
    };

    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

function getDefaultSystemPrompt(type: string): string {
  const prompts = {
    troubleshooting: "You are the Master AI Analyst for MAKU Travel specializing in system troubleshooting. Analyze issues systematically, provide diagnostic steps, and recommend solutions with confidence ratings.",
    knowledge_search: "You are the Master AI Analyst for MAKU Travel with access to comprehensive system knowledge. Search and provide relevant information with clear explanations and actionable insights.",
    predictive_analysis: "You are the Master AI Analyst for MAKU Travel specializing in predictive analytics. Analyze patterns, trends, and provide forecasts with risk assessments and strategic recommendations.",
    natural_language: "You are the Master AI Analyst for MAKU Travel. You provide comprehensive system analysis, troubleshoot issues, and deliver actionable insights with confidence ratings and structured recommendations."
  };
  
  return prompts[type] || prompts.natural_language;
}

function parseAIResponse(response: string, type: string): any {
  // Try to extract structured information from the AI response
  const result: any = {};
  
  // Extract confidence if mentioned
  const confidenceMatch = response.match(/confidence[:\s]+([0-9.]+)/i);
  if (confidenceMatch) {
    result.confidence = parseFloat(confidenceMatch[1]);
  }
  
  // Extract recommendations
  const recommendationMatches = response.match(/(?:recommendations?|actions?)[:\n](.*?)(?:\n\n|\n[A-Z]|$)/is);
  if (recommendationMatches) {
    const recommendations = recommendationMatches[1]
      .split(/\n[-•*]|\n\d+\./)
      .map(r => r.trim())
      .filter(r => r.length > 0)
      .slice(0, 5);
    
    if (recommendations.length > 0) {
      result.recommendedActions = recommendations;
    }
  }
  
  // Type-specific parsing
  if (type === 'troubleshooting') {
    result.escalationLevel = response.toLowerCase().includes('critical') ? 'high' : 
                            response.toLowerCase().includes('urgent') ? 'medium' : 'low';
  }
  
  return result;
}

function generateSuggestions(type: string, context: any): string[] {
  const baseSuggestions = {
    troubleshooting: [
      "Check system health metrics",
      "Review error logs",
      "Analyze performance trends",
      "Generate diagnostic report"
    ],
    knowledge_search: [
      "Search system documentation",
      "Find best practices",
      "Get configuration examples",
      "Review API endpoints"
    ],
    predictive_analysis: [
      "Analyze booking trends",
      "Predict system load",
      "Forecast revenue patterns",
      "Risk assessment report"
    ],
    natural_language: [
      "System performance overview",
      "Recent alerts summary",
      "Generate insights report",
      "Optimization recommendations"
    ]
  };

  return baseSuggestions[type] || baseSuggestions.natural_language;
}