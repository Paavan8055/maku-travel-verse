import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
const supabaseUrl = Deno.env.get('SUPABASE_URL');
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      query, 
      context, 
      type = 'natural_language',
      conversationHistory = [],
      promptId,
      useExternalPrompt = false
    } = await req.json();
    
    const supabase = createClient(supabaseUrl!, supabaseKey!);
    
    console.log('AI Assistant request:', { 
      query, 
      type, 
      useExternalPrompt, 
      promptId,
      contextKeys: Object.keys(context || {}) 
    });

    // Get system prompt - either from external prompt or built-in
    let systemPrompt = '';
    let promptAnalytics = { promptId: '', responseTime: 0, success: true };
    
    if (useExternalPrompt && promptId) {
      const startTime = Date.now();
      
      try {
        // Fetch external prompt
        const promptResponse = await supabase.functions.invoke('prompt-manager', {
          body: { 
            action: 'fetch', 
            externalId: promptId 
          }
        });
        
        if (promptResponse.data?.success && promptResponse.data?.prompt) {
          systemPrompt = promptResponse.data.prompt.content;
          promptAnalytics.promptId = promptId;
        } else {
          throw new Error('External prompt not found');
        }
      } catch (error) {
        console.error('Failed to fetch external prompt:', error);
        // Fallback to default prompt
        systemPrompt = getDefaultSystemPrompt(type);
        promptAnalytics.success = false;
      }
      
      promptAnalytics.responseTime = Date.now() - startTime;
    } else {
      systemPrompt = getDefaultSystemPrompt(type);
    }

    // Enhanced context gathering
    const enhancedContext = await gatherEnhancedContext(supabase, context);
    
    let response;
    
    if (useExternalPrompt && systemPrompt) {
      response = await processWithExternalPrompt(systemPrompt, query, enhancedContext, conversationHistory);
    } else {
      switch (type) {
        case 'troubleshooting':
          response = await performAdvancedTroubleshooting(query, enhancedContext);
          break;
        case 'knowledge_search':
          response = await searchKnowledgeBase(supabase, query);
          break;
        case 'predictive_analysis':
          response = await performPredictiveAnalysis(supabase, enhancedContext);
          break;
        case 'natural_language':
        default:
          response = await processNaturalLanguageQuery(query, enhancedContext);
          break;
      }
    }

    // Record analytics if external prompt was used
    if (useExternalPrompt && promptId) {
      supabase.functions.invoke('prompt-manager', {
        body: {
          action: 'analytics',
          analyticsData: {
            promptId,
            responseTime: Date.now(),
            success: true,
            context: {
              type,
              queryLength: query.length,
              responseLength: response?.response?.length || 0,
              conversationLength: conversationHistory?.length || 0
            }
          }
        }
      }).catch(error => console.error('Failed to record analytics:', error));
    }

    // Log the interaction for learning
    await logAIInteraction(supabase, query, response, type);

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('AI Assistant error:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to process AI request',
      details: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

function getDefaultSystemPrompt(type: string): string {
  const prompts = {
    troubleshooting: `You are an expert system administrator and troubleshooting specialist for MAKU.Travel.`,
    knowledge_search: `You are a knowledge management expert for MAKU.Travel.`,
    predictive_analysis: `You are a predictive analytics expert for MAKU.Travel.`,
    natural_language: `You are an intelligent AI assistant for MAKU.Travel, a comprehensive travel booking platform.`
  };
  
  return prompts[type as keyof typeof prompts] || prompts.natural_language;
}

async function processWithExternalPrompt(
  systemPrompt: string, 
  query: string, 
  context: any, 
  conversationHistory: any[] = []
) {
  if (!openAIApiKey) {
    return fallbackResponse(query, context);
  }

  try {
    const messages = [
      { role: 'system', content: systemPrompt },
      ...conversationHistory.slice(-10), // Keep last 10 messages for context
      { role: 'user', content: query }
    ];

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4.1-2025-04-14',
        messages,
        temperature: 0.7,
        max_tokens: 1000
      }),
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(`OpenAI API error: ${data.error?.message || 'Unknown error'}`);
    }

    const aiResponse = data.choices[0].message.content;
    
    return {
      type: 'external_prompt_response',
      response: aiResponse,
      suggestions: generateActionSuggestions(query, context),
      confidence: 0.95,
      context_used: true,
      external_prompt: true
    };
    
  } catch (error) {
    console.error('External prompt processing error:', error);
    return fallbackResponse(query, context);
  }
}

async function gatherEnhancedContext(supabase: any, baseContext: any) {
  const enhanced = { ...baseContext };
  
  try {
    // Get recent critical alerts
    const { data: alerts } = await supabase
      .from('critical_alerts')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);
    
    // Get recent system logs
    const { data: logs } = await supabase
      .from('system_logs')
      .select('*')
      .gte('created_at', new Date(Date.now() - 3600000).toISOString()) // Last hour
      .order('created_at', { ascending: false })
      .limit(50);
    
    // Get provider health status
    const { data: providerHealth } = await supabase
      .from('provider_health')
      .select('*')
      .order('last_checked', { ascending: false })
      .limit(10);

    enhanced.recentAlerts = alerts || [];
    enhanced.recentLogs = logs || [];
    enhanced.providerHealth = providerHealth || [];
    enhanced.timestamp = new Date().toISOString();
    
  } catch (error) {
    console.error('Error gathering enhanced context:', error);
  }
  
  return enhanced;
}

async function processNaturalLanguageQuery(query: string, context: any) {
  if (!openAIApiKey) {
    return fallbackResponse(query, context);
  }

  try {
    const systemPrompt = `You are MAKU.Travel's AI Assistant, specialized in helping administrators manage a travel booking platform. You have access to real-time system data and should provide specific, actionable guidance.

System Context:
- Recent Alerts: ${JSON.stringify(context.recentAlerts?.slice(0, 3) || [])}
- Provider Health: ${JSON.stringify(context.providerHealth || [])}
- Current Time: ${context.timestamp}

Your responses should be:
1. Specific and actionable
2. Reference actual system data when relevant
3. Suggest specific admin dashboard sections to visit
4. Provide step-by-step guidance for complex issues
5. Use simple, non-technical language for non-technical admins

Focus on practical solutions and guide users to the right admin tools.`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: query }
        ],
        max_tokens: 800,
        temperature: 0.7,
      }),
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(`OpenAI API error: ${data.error?.message || 'Unknown error'}`);
    }

    const aiResponse = data.choices[0].message.content;
    
    // Enhance response with suggested actions
    const suggestions = generateActionSuggestions(query, context);
    
    return {
      type: 'ai_response',
      response: aiResponse,
      suggestions,
      confidence: 0.9,
      context_used: true
    };
    
  } catch (error) {
    console.error('OpenAI processing error:', error);
    return fallbackResponse(query, context);
  }
}

async function performAdvancedTroubleshooting(query: string, context: any) {
  // Multi-step diagnostic workflow
  const diagnosticSteps = [
    {
      step: 'System Health Check',
      status: assessSystemHealth(context),
      actions: ['Check provider health', 'Review recent alerts', 'Verify system metrics']
    },
    {
      step: 'Issue Correlation',
      status: 'analyzing',
      actions: ['Cross-reference similar issues', 'Check timing patterns', 'Review user impact']
    },
    {
      step: 'Root Cause Analysis',
      status: 'pending',
      actions: ['Identify primary cause', 'Map dependencies', 'Assess blast radius']
    }
  ];

  const analysis = await analyzeIssuePatterns(query, context);
  
  return {
    type: 'advanced_troubleshooting',
    diagnosticSteps,
    analysis,
    recommendedActions: generateTroubleshootingActions(analysis),
    escalationLevel: determineEscalationLevel(analysis)
  };
}

async function searchKnowledgeBase(supabase: any, query: string) {
  // Search existing knowledge entries
  const { data: knowledge } = await supabase
    .from('ai_training_bookings')
    .select('*')
    .textSearch('anonymized_data', query)
    .limit(5);

  // Search system logs for similar patterns
  const { data: similarLogs } = await supabase
    .from('system_logs')
    .select('*')
    .ilike('message', `%${query}%`)
    .limit(10);

  return {
    type: 'knowledge_search',
    results: knowledge || [],
    similarPatterns: similarLogs || [],
    searchQuery: query,
    totalResults: (knowledge?.length || 0) + (similarLogs?.length || 0)
  };
}

async function performPredictiveAnalysis(supabase: any, context: any) {
  // Analyze patterns for predictive insights
  const predictions = {
    systemHealth: predictSystemHealth(context),
    resourceNeeds: predictResourceNeeds(context),
    maintenanceWindows: suggestMaintenanceWindows(context),
    riskAssessment: assessUpcomingRisks(context)
  };

  return {
    type: 'predictive_analysis',
    predictions,
    confidence: 0.75,
    recommendations: generatePredictiveRecommendations(predictions)
  };
}

function fallbackResponse(query: string, context: any) {
  // Pattern-based fallback when OpenAI is unavailable
  const patterns = {
    booking: /booking|reservation|customer/i,
    payment: /payment|transaction|refund/i,
    system: /system|server|down|error/i,
    user: /user|account|login|access/i
  };

  let category = 'general';
  for (const [key, pattern] of Object.entries(patterns)) {
    if (pattern.test(query)) {
      category = key;
      break;
    }
  }

  const responses = {
    booking: 'I can help with booking issues. Check the Bookings tab for recent transactions and their status.',
    payment: 'For payment issues, review the Payments section and check with your payment provider.',
    system: 'System issues should be checked in the System Health dashboard for current status.',
    user: 'User account issues can be managed in the Users section of the admin dashboard.',
    general: 'I can help you navigate the admin dashboard. What specific area would you like assistance with?'
  };

  return {
    type: 'fallback_response',
    response: responses[category as keyof typeof responses],
    suggestions: ['Check system health', 'Review recent alerts', 'Navigate to relevant admin section'],
    confidence: 0.6,
    context_used: false
  };
}

function generateActionSuggestions(query: string, context: any): string[] {
  const suggestions = [];
  
  if (context.recentAlerts?.length > 0) {
    suggestions.push('Review critical alerts');
  }
  
  if (context.providerHealth?.some((p: any) => p.status !== 'healthy')) {
    suggestions.push('Check provider health');
  }
  
  suggestions.push('Navigate to System Health dashboard');
  suggestions.push('Review recent system logs');
  
  return suggestions;
}

function assessSystemHealth(context: any): string {
  const alertCount = context.recentAlerts?.length || 0;
  const unhealthyProviders = context.providerHealth?.filter((p: any) => p.status !== 'healthy').length || 0;
  
  if (alertCount > 5 || unhealthyProviders > 2) return 'critical';
  if (alertCount > 2 || unhealthyProviders > 0) return 'warning';
  return 'healthy';
}

function analyzeIssuePatterns(query: string, context: any) {
  return {
    severity: 'medium',
    category: 'system',
    similarIncidents: context.recentLogs?.filter((log: any) => 
      log.message.toLowerCase().includes(query.toLowerCase())
    ).length || 0,
    timePattern: 'peak_hours',
    userImpact: 'moderate'
  };
}

function generateTroubleshootingActions(analysis: any): string[] {
  const actions = [
    'Check system metrics dashboard',
    'Review provider health status',
    'Examine recent error logs'
  ];
  
  if (analysis.severity === 'critical') {
    actions.unshift('Escalate to technical team immediately');
  }
  
  return actions;
}

function determineEscalationLevel(analysis: any): string {
  if (analysis.severity === 'critical') return 'immediate';
  if (analysis.userImpact === 'high') return 'urgent';
  return 'standard';
}

function predictSystemHealth(context: any) {
  const trends = {
    overall: 'stable',
    providers: 'good',
    capacity: 'adequate',
    nextHours: 'stable'
  };
  
  if (context.recentAlerts?.length > 3) {
    trends.overall = 'declining';
    trends.nextHours = 'at_risk';
  }
  
  return trends;
}

function predictResourceNeeds(context: any) {
  return {
    storage: 'sufficient',
    bandwidth: 'adequate',
    processing: 'good',
    scaling_needed: false
  };
}

function suggestMaintenanceWindows(context: any) {
  return [
    { window: '02:00-04:00 UTC', impact: 'minimal', recommended: true },
    { window: '14:00-16:00 UTC', impact: 'moderate', recommended: false }
  ];
}

function assessUpcomingRisks(context: any) {
  return {
    high: [],
    medium: ['Provider API rate limiting'],
    low: ['Routine maintenance needed']
  };
}

function generatePredictiveRecommendations(predictions: any): string[] {
  const recommendations = [];
  
  if (predictions.systemHealth.overall !== 'stable') {
    recommendations.push('Schedule system health review');
  }
  
  if (predictions.maintenanceWindows.some((w: any) => w.recommended)) {
    recommendations.push('Plan maintenance during recommended windows');
  }
  
  return recommendations;
}

async function logAIInteraction(supabase: any, query: string, response: any, type: string) {
  try {
    await supabase
      .from('system_logs')
      .insert({
        correlation_id: crypto.randomUUID(),
        service_name: 'ai_assistant',
        log_level: 'info',
        level: 'info',
        message: `AI interaction: ${type}`,
        metadata: {
          query: query.substring(0, 200),
          response_type: response.type,
          confidence: response.confidence || 0.5
        }
      });
  } catch (error) {
    console.error('Failed to log AI interaction:', error);
  }
}