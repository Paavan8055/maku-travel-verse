import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.53.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface MakuBotContext {
  vertical: 'Family' | 'Solo' | 'Pet' | 'Spiritual';
  recentMessages?: Array<{
    text: string;
    from: 'user' | 'bot';
  }>;
  userLocation?: string;
  searchContext?: {
    destination?: string;
    dates?: string;
    travelers?: number;
  };
}

interface MakuBotRequest {
  message: string;
  context: MakuBotContext;
  timestamp: string;
}

interface MakuBotResponse {
  reply: string;
  suggestions?: string[];
  error?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Maku Bot request received');
    
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
    const { message, context, timestamp }: MakuBotRequest = await req.json();
    console.log('Processing message:', message, 'for vertical:', context.vertical);

    // Get bot configuration from registry
    const botName = context.vertical ? `maku-bot-${context.vertical.toLowerCase()}` : 'maku-bot';
    const { data: botData, error: botError } = await supabase
      .from('gpt_bot_registry')
      .select('*')
      .eq('bot_name', botName)
      .eq('integration_status', 'active')
      .maybeSingle();

    if (botError) {
      console.error('Bot registry error:', botError);
    }

    // Use bot configuration or fallback
    const botConfig = botData?.configuration || {};
    const systemPrompt = botConfig.system_prompt || getDefaultSystemPrompt(context.vertical);
    const model = botConfig.model || 'gpt-5-2025-08-07';

    // Build conversation history
    const messages = [
      {
        role: 'system',
        content: systemPrompt + `\n\nCurrent context: User is interested in ${context.vertical} travel.` +
          (context.searchContext ? ` They are looking at destinations like ${context.searchContext.destination} for ${context.searchContext.travelers || 1} travelers.` : '') +
          (context.userLocation ? ` User is located in ${context.userLocation}.` : '')
      },
      ...( context.recentMessages?.slice(-3).map(msg => ({
        role: msg.from === 'user' ? 'user' : 'assistant',
        content: msg.text
      })) || []),
      {
        role: 'user',
        content: message
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
        max_completion_tokens: botConfig.max_tokens || 1500,
        // Note: temperature not supported for GPT-5 models
        ...(model.includes('gpt-4') ? { temperature: botConfig.temperature || 0.8 } : {})
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('OpenAI API error:', response.status, errorData);
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    console.log('OpenAI response received');

    const reply = data.choices[0].message.content;

    // Generate contextual suggestions
    const suggestions = generateSuggestions(context.vertical, context.searchContext);

    // Log usage to registry if bot exists
    if (botData) {
      const currentMetrics = botData.usage_metrics || {};
      const updatedMetrics = {
        ...currentMetrics,
        total_requests: (currentMetrics.total_requests || 0) + 1,
        last_used: timestamp,
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

    const makuBotResponse: MakuBotResponse = {
      reply,
      suggestions
    };

    console.log('Maku Bot response ready');

    return new Response(JSON.stringify(makuBotResponse), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in Maku Bot function:', error);
    
    const errorResponse: MakuBotResponse = {
      reply: "I'm having trouble connecting right now, but I'm here to help with your travel planning! Please try again in a moment.",
      error: error.message
    };

    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

function getDefaultSystemPrompt(vertical: string): string {
  const prompts = {
    Family: "You are MAKU Bot specializing in Family Travel. You help families plan memorable trips with kid-friendly destinations, family accommodations, and engaging activities for all ages. Focus on safety, convenience, and creating lasting memories for the whole family.",
    Solo: "You are MAKU Bot specializing in Solo Travel. You help solo travelers discover amazing destinations, ensure safety, and find unique experiences perfect for independent exploration. Focus on safety tips, social opportunities, and personal growth experiences.",
    Pet: "You are MAKU Bot specializing in Pet Travel. You help pet owners plan trips with their furry companions, finding pet-friendly accommodations, activities, and ensuring comfortable travel for pets. Focus on pet safety, regulations, and pet-friendly venues.",
    Spiritual: "You are MAKU Bot specializing in Spiritual Travel. You help travelers find transformative spiritual experiences, wellness retreats, meditation centers, and sacred destinations for personal growth. Focus on mindfulness, inner peace, and meaningful connections."
  };
  
  return prompts[vertical] || "You are MAKU Bot, an intelligent travel assistant specializing in personalized travel experiences. You help users plan amazing trips based on their travel preferences with expert recommendations.";
}

function generateSuggestions(vertical: string, searchContext?: any): string[] {
  const baseSuggestions = {
    Family: [
      "Show me family-friendly hotels",
      "What activities are good for kids?",
      "Find destinations with theme parks",
      "Safe family travel tips"
    ],
    Solo: [
      "Best solo travel destinations",
      "Safety tips for solo travelers",
      "How to meet people while traveling",
      "Solo-friendly accommodations"
    ],
    Pet: [
      "Pet-friendly hotels near me",
      "Flying with pets guide",
      "Dog parks and pet activities",
      "Pet travel documentation"
    ],
    Spiritual: [
      "Find meditation retreats",
      "Sacred sites and temples",
      "Wellness travel packages",
      "Spiritual journey planning"
    ]
  };

  return baseSuggestions[vertical] || [
    "Help me plan a trip",
    "Show me travel deals",
    "What's the best time to visit?",
    "Find accommodations"
  ];
}