import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.53.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ConversationRequest {
  message: string;
  dashboardType: 'user' | 'partner' | 'admin';
  userId?: string;
  conversationHistory: Array<{
    role: 'user' | 'assistant';
    content: string;
  }>;
}

interface AIResponse {
  response: string;
  confidence: number;
  intent: string;
  entities: any[];
  action?: string;
  actionParams?: any;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openaiApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { message, dashboardType, userId, conversationHistory } = await req.json() as ConversationRequest;

    // Get context based on dashboard type
    let contextData = {};
    if (dashboardType === 'admin') {
      // Get recent bot results and system health
      const { data: botResults } = await supabase
        .from('bot_results')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);

      const { data: systemHealth } = await supabase
        .from('system_health_snapshots')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(1);

      contextData = { botResults, systemHealth };
    } else if (dashboardType === 'partner' && userId) {
      // Get partner analytics and bookings
      const { data: partnerData } = await supabase
        .from('partner_analytics')
        .select('*')
        .eq('partner_id', userId)
        .order('year', { ascending: false })
        .order('month', { ascending: false })
        .limit(3);

      contextData = { partnerData };
    } else if (dashboardType === 'user' && userId) {
      // Get user bookings and preferences
      const { data: userBookings } = await supabase
        .from('bookings')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(3);

      const { data: userPreferences } = await supabase
        .from('profiles')
        .select('travel_preferences, general_preferences')
        .eq('user_id', userId)
        .single();

      contextData = { userBookings, userPreferences };
    }

    // Build system prompt based on dashboard type
    const systemPrompts = {
      user: `You are MAKU's AI travel assistant. You help users with:
- Travel planning and recommendations
- Booking management and modifications
- Price monitoring and deals
- Travel preferences and personalization
- Trip optimization suggestions

Current user context: ${JSON.stringify(contextData)}

Be helpful, friendly, and focus on travel-related assistance. If asked to perform actions like booking modifications, set the action field in your response.`,

      partner: `You are MAKU's AI business intelligence assistant for travel partners. You help with:
- Revenue optimization and pricing strategies
- Performance analytics and insights
- Customer behavior analysis
- Competitive intelligence
- Property and inventory management

Current partner context: ${JSON.stringify(contextData)}

Be professional, data-driven, and focus on business insights. Provide actionable recommendations based on the data.`,

      admin: `You are MAKU's AI system management assistant for administrators. You help with:
- System monitoring and health analysis
- Bot management and optimization
- Performance analytics and troubleshooting
- Alert management and incident response
- Data analysis and reporting

Current system context: ${JSON.stringify(contextData)}

Be technical, precise, and focus on system operations. Provide clear insights and actionable recommendations for system management.`
    };

    // Prepare conversation context
    const messages = [
      { role: 'system', content: systemPrompts[dashboardType] },
      ...conversationHistory.slice(-8), // Last 8 messages for context
      { role: 'user', content: message }
    ];

    // Call OpenAI with enhanced prompt for structured responses
    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          ...messages,
          {
            role: 'system',
            content: `Respond with a JSON object containing:
{
  "response": "Your helpful response to the user",
  "confidence": 0.95,
  "intent": "travel_planning|booking_management|analytics|system_monitoring|general_inquiry",
  "entities": [{"type": "location|date|price|service", "value": "extracted_value"}],
  "action": "optional_action_type",
  "actionParams": {"optional": "action_parameters"}
}

Only include action/actionParams if the user is requesting a specific action that requires system integration.`
          }
        ],
        response_format: { type: 'json_object' },
        max_tokens: 1000,
        temperature: 0.7
      }),
    });

    if (!openaiResponse.ok) {
      const errorData = await openaiResponse.json();
      throw new Error(`OpenAI API error: ${openaiResponse.status} - ${errorData.error?.message || 'Unknown error'}`);
    }

    const openaiData = await openaiResponse.json();
    let aiResponse: AIResponse;

    try {
      aiResponse = JSON.parse(openaiData.choices[0].message.content);
    } catch (parseError) {
      // Fallback if JSON parsing fails
      aiResponse = {
        response: openaiData.choices[0].message.content,
        confidence: 0.8,
        intent: 'general_inquiry',
        entities: []
      };
    }

    // Log conversation for analytics
    if (userId) {
      await supabase
        .from('conversation_logs')
        .insert({
          user_id: userId,
          dashboard_type: dashboardType,
          user_message: message,
          ai_response: aiResponse.response,
          intent: aiResponse.intent,
          confidence: aiResponse.confidence,
          entities: aiResponse.entities,
          action: aiResponse.action,
          action_params: aiResponse.actionParams
        });
    }

    return new Response(JSON.stringify(aiResponse), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in conversational-ai function:', error);
    return new Response(
      JSON.stringify({ 
        response: 'I apologize, but I encountered an error. Please try again.',
        confidence: 0.0,
        intent: 'error',
        entities: [],
        error: error.message 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});