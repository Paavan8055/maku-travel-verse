import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.53.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PredictiveRequest {
  dashboardType: 'user' | 'partner' | 'admin';
  userId?: string;
  analysisTypes: ('revenue' | 'demand' | 'performance' | 'risk' | 'opportunity')[];
}

interface Prediction {
  id: string;
  type: 'revenue' | 'demand' | 'performance' | 'risk' | 'opportunity';
  title: string;
  description: string;
  confidence: number;
  impact: 'low' | 'medium' | 'high' | 'critical';
  timeframe: string;
  trend: 'up' | 'down' | 'stable';
  value: number;
  change: number;
  recommendedActions: string[];
  metadata: any;
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

    const { dashboardType, userId, analysisTypes } = await req.json() as PredictiveRequest;

    // Gather contextual data based on dashboard type
    let contextData = {};
    
    if (dashboardType === 'admin') {
      // Get system metrics and bot performance
      const { data: botResults } = await supabase
        .from('bot_results')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      const { data: systemHealth } = await supabase
        .from('system_health_snapshots')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(10);

      const { data: agentPerformance } = await supabase
        .from('agent_performance_metrics')
        .select('*')
        .order('metric_date', { ascending: false })
        .limit(30);

      contextData = { botResults, systemHealth, agentPerformance };
    } else if (dashboardType === 'partner' && userId) {
      // Get partner performance data
      const { data: partnerAnalytics } = await supabase
        .from('partner_analytics')
        .select('*')
        .eq('partner_id', userId)
        .order('year', { ascending: false })
        .order('month', { ascending: false })
        .limit(12);

      const { data: partnerBookings } = await supabase
        .from('partner_bookings')
        .select('*')
        .eq('partner_id', userId)
        .order('created_at', { ascending: false })
        .limit(100);

      contextData = { partnerAnalytics, partnerBookings };
    } else if (dashboardType === 'user' && userId) {
      // Get user booking and preference data
      const { data: userBookings } = await supabase
        .from('bookings')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(20);

      const { data: userActivity } = await supabase
        .from('user_activity_logs')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(100);

      contextData = { userBookings, userActivity };
    }

    // Generate predictions using AI
    const predictions = await generatePredictions(
      openaiApiKey,
      dashboardType,
      analysisTypes,
      contextData
    );

    return new Response(JSON.stringify({ predictions }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in predictive-analytics function:', error);
    return new Response(
      JSON.stringify({ 
        predictions: [],
        error: error.message 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

async function generatePredictions(
  openaiApiKey: string,
  dashboardType: string,
  analysisTypes: string[],
  contextData: any
): Promise<Prediction[]> {
  const systemPrompt = `You are an advanced predictive analytics AI for MAKU.Travel. Your task is to analyze data and generate accurate, actionable predictions.

Dashboard Type: ${dashboardType.toUpperCase()}
Analysis Types Requested: ${analysisTypes.join(', ')}

Context Data: ${JSON.stringify(contextData, null, 2)}

Generate predictions as a JSON array of objects with this structure:
{
  "id": "unique_prediction_id",
  "type": "revenue|demand|performance|risk|opportunity",
  "title": "Brief prediction title",
  "description": "Detailed explanation of the prediction",
  "confidence": 0-100,
  "impact": "low|medium|high|critical",
  "timeframe": "Specific timeframe (e.g., 'Next 7 days', 'Q4 2024')",
  "trend": "up|down|stable",
  "value": numeric_value,
  "change": percentage_change,
  "recommendedActions": ["action1", "action2", "action3"],
  "metadata": {"additional": "relevant_data"}
}

Guidelines:
- Analyze actual data patterns from the context
- Provide realistic confidence scores based on data quality
- Include specific, actionable recommendations
- Consider seasonal trends and business cycles
- Factor in current market conditions
- Generate 3-5 high-quality predictions per analysis type`;

  const userPrompt = `Based on the provided context data for the ${dashboardType} dashboard, generate predictive insights for: ${analysisTypes.join(', ')}.

Focus on practical, actionable predictions that can help improve business outcomes. Consider both opportunities and risks.`;

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openaiApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      response_format: { type: 'json_object' },
      max_tokens: 2000,
      temperature: 0.3
    }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(`OpenAI API error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`);
  }

  const data = await response.json();
  
  try {
    const result = JSON.parse(data.choices[0].message.content);
    return result.predictions || [];
  } catch (parseError) {
    console.error('Error parsing OpenAI response:', parseError);
    return [];
  }
}