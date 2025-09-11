import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.53.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface DialogflowCXRequest {
  message?: string;
  sessionId?: string;
  dashboardType?: 'admin' | 'partner' | 'user';
  userId?: string;
  // Dialogflow webhook format
  detectIntentResponseId?: string;
  intentInfo?: {
    lastMatchedIntent?: string;
    displayName?: string;
    confidence?: number;
  };
  pageInfo?: {
    currentPage?: string;
    displayName?: string;
  };
  sessionInfo?: {
    session?: string;
    parameters?: Record<string, any>;
  };
  fulfillmentInfo?: {
    tag?: string;
  };
  text?: string;
  languageCode?: string;
}

interface DialogflowCXResponse {
  fulfillmentResponse?: {
    messages?: Array<{
      text?: {
        text?: string[];
      };
      payload?: any;
    }>;
  };
  sessionInfo?: {
    parameters?: Record<string, any>;
  };
  // Enhanced response for frontend
  content?: string;
  fulfillmentText?: string;
  intent?: string;
  entities?: any[];
  actions?: Array<{
    type: string;
    parameters: Record<string, any>;
  }>;
  richContent?: {
    type: 'card' | 'carousel' | 'quick_replies' | 'list';
    data: any;
  };
  confidence?: number;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const googleCloudProjectId = Deno.env.get('GOOGLE_CLOUD_PROJECT_ID');
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');

    const requestBody = await req.json() as DialogflowCXRequest;
    console.log('Dialogflow CX webhook request:', requestBody);

    // Handle both direct API calls and Dialogflow webhook calls
    const userMessage = requestBody.message || requestBody.text || '';
    const sessionId = requestBody.sessionId || requestBody.sessionInfo?.session || `session_${Date.now()}`;
    const dashboardType = requestBody.dashboardType || 'user';
    const userId = requestBody.userId;

    // If Google Cloud Project is not configured, provide enhanced fallback
    if (!googleCloudProjectId) {
      console.log('Google Cloud Project not configured, using enhanced OpenAI fallback');
      
      if (!openaiApiKey) {
        throw new Error('Neither Google Cloud nor OpenAI is configured');
      }

      // Enhanced travel-specific OpenAI response
      const travelEnhancedResponse = await generateTravelEnhancedResponse(
        userMessage, 
        dashboardType, 
        userId, 
        openaiApiKey,
        supabase
      );

      return new Response(JSON.stringify(travelEnhancedResponse), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // TODO: Implement actual Dialogflow CX integration when project ID is available
    // This is a placeholder for the full Dialogflow CX implementation
    
    // For now, simulate Dialogflow CX structured responses
    const mockDialogflowResponse = await simulateDialogflowCXResponse(
      userMessage,
      requestBody,
      supabase
    );

    // Log the interaction
    await supabase.from('dialogflow_interactions').insert({
      session_id: sessionId,
      user_message: userMessage,
      intent: mockDialogflowResponse.intent,
      confidence: mockDialogflowResponse.confidence,
      dashboard_type: dashboardType,
      user_id: userId,
      response_data: mockDialogflowResponse,
      created_at: new Date().toISOString()
    });

    return new Response(JSON.stringify(mockDialogflowResponse), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error in dialogflow-cx-webhook:', error);
    
    const errorResponse: DialogflowCXResponse = {
      fulfillmentResponse: {
        messages: [{
          text: {
            text: ['I apologize, but I encountered an error processing your travel request. Please try again or contact support.']
          }
        }]
      },
      content: 'I apologize, but I encountered an error processing your travel request. Please try again or contact support.',
      intent: 'error.fallback',
      confidence: 0.1,
      entities: []
    };

    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

async function generateTravelEnhancedResponse(
  message: string,
  dashboardType: string,
  userId: string | undefined,
  openaiApiKey: string,
  supabase: any
): Promise<DialogflowCXResponse> {
  
  // Enhanced system prompt for travel operations
  const travelSystemPrompt = `You are MAKU's advanced travel operations AI assistant. You specialize in:

TRAVEL OPERATIONS:
- Flight booking, modifications, and cancellations
- Hotel reservations and management
- Activity and tour bookings
- Travel itinerary planning and optimization
- Travel policy compliance and recommendations

STRUCTURED RESPONSES:
Always respond with helpful, actionable information about travel operations. 
If the user is requesting a booking operation, provide clear next steps.
If asking about travel policies, provide specific guidance.
For complex requests, break down the process into clear steps.

FORMAT YOUR RESPONSES TO BE:
- Clear and actionable
- Travel-industry professional
- Focused on next steps when booking operations are involved

Current context: ${dashboardType} dashboard
User message: "${message}"

Provide a helpful, professional travel operations response.`;

  const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openaiApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: travelSystemPrompt },
        { role: 'user', content: message }
      ],
      max_tokens: 1000,
      temperature: 0.7
    }),
  });

  const openaiData = await openaiResponse.json();
  const responseText = openaiData.choices[0]?.message?.content || 'I can help you with your travel needs. Please let me know what you\'d like to do.';

  // Enhanced response with travel-specific actions
  const travelActions = extractTravelActions(message);
  const richContent = generateRichTravelContent(message, dashboardType);

  return {
    fulfillmentResponse: {
      messages: [{
        text: {
          text: [responseText]
        }
      }]
    },
    content: responseText,
    fulfillmentText: responseText,
    intent: detectTravelIntent(message),
    entities: extractTravelEntities(message),
    actions: travelActions,
    richContent: richContent,
    confidence: 0.8
  };
}

async function simulateDialogflowCXResponse(
  message: string,
  requestBody: DialogflowCXRequest,
  supabase: any
): Promise<DialogflowCXResponse> {
  
  const intent = detectTravelIntent(message);
  const entities = extractTravelEntities(message);
  const actions = extractTravelActions(message);
  
  let responseText = '';
  let richContent = null;

  // Simulate different travel intents
  switch (intent) {
    case 'booking.flight':
      responseText = `I'd be happy to help you find and book a flight! I can search for flights based on your preferences. What's your departure city, destination, and preferred travel dates?`;
      richContent = {
        type: 'quick_replies',
        data: {
          title: 'Flight Booking Options',
          replies: ['Search Flights', 'My Preferences', 'Flexible Dates', 'Business Travel']
        }
      };
      break;
      
    case 'booking.hotel':
      responseText = `I can help you find the perfect hotel! Let me know your destination, check-in and check-out dates, and any specific preferences you have.`;
      richContent = {
        type: 'quick_replies',
        data: {
          title: 'Hotel Booking Options',
          replies: ['Search Hotels', 'Luxury Options', 'Budget Friendly', 'Family Rooms']
        }
      };
      break;
      
    case 'booking.modify':
      responseText = `I can help you modify your existing booking. Please provide your booking reference number and let me know what changes you'd like to make.`;
      break;
      
    case 'travel.planning':
      responseText = `I'm here to help plan your perfect trip! Tell me about your destination, travel dates, interests, and budget, and I'll create a personalized itinerary for you.`;
      richContent = {
        type: 'card',
        data: {
          title: 'Travel Planning Services',
          subtitle: 'Let me help create your perfect itinerary',
          buttons: [
            { text: 'Start Planning', action: 'start_planning' },
            { text: 'View Templates', action: 'view_templates' }
          ]
        }
      };
      break;
      
    default:
      responseText = `I'm MAKU's travel assistant! I can help you with flights, hotels, activities, and travel planning. What would you like to do today?`;
      richContent = {
        type: 'quick_replies',
        data: {
          title: 'How can I help?',
          replies: ['Book Flight', 'Find Hotel', 'Plan Trip', 'Manage Booking']
        }
      };
  }

  return {
    fulfillmentResponse: {
      messages: [{
        text: { text: [responseText] }
      }]
    },
    content: responseText,
    fulfillmentText: responseText,
    intent,
    entities,
    actions,
    richContent,
    confidence: 0.85
  };
}

function detectTravelIntent(message: string): string {
  const messageLower = message.toLowerCase();
  
  if (messageLower.includes('book') && (messageLower.includes('flight') || messageLower.includes('plane'))) {
    return 'booking.flight';
  }
  if (messageLower.includes('book') && messageLower.includes('hotel')) {
    return 'booking.hotel';
  }
  if (messageLower.includes('modify') || messageLower.includes('change') || messageLower.includes('cancel')) {
    return 'booking.modify';
  }
  if (messageLower.includes('plan') || messageLower.includes('itinerary') || messageLower.includes('trip')) {
    return 'travel.planning';
  }
  if (messageLower.includes('activity') || messageLower.includes('tour') || messageLower.includes('attraction')) {
    return 'booking.activity';
  }
  
  return 'general.inquiry';
}

function extractTravelEntities(message: string): any[] {
  const entities = [];
  const messageLower = message.toLowerCase();
  
  // Simple entity extraction (in real implementation, this would be more sophisticated)
  const dateRegex = /(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})|(\d{4}-\d{2}-\d{2})/g;
  const dates = message.match(dateRegex);
  if (dates) {
    dates.forEach(date => entities.push({ type: 'date', value: date }));
  }
  
  // Common city/airport codes
  const locationRegex = /\b[A-Z]{3}\b/g;
  const locations = message.match(locationRegex);
  if (locations) {
    locations.forEach(loc => entities.push({ type: 'location', value: loc }));
  }
  
  return entities;
}

function extractTravelActions(message: string): Array<{ type: string; parameters: Record<string, any> }> {
  const actions = [];
  const messageLower = message.toLowerCase();
  
  if (messageLower.includes('book')) {
    if (messageLower.includes('flight')) {
      actions.push({
        type: 'flight_search',
        parameters: { action: 'initiate_flight_booking' }
      });
    }
    if (messageLower.includes('hotel')) {
      actions.push({
        type: 'hotel_search',
        parameters: { action: 'initiate_hotel_booking' }
      });
    }
  }
  
  if (messageLower.includes('modify') || messageLower.includes('change')) {
    actions.push({
      type: 'booking_modification',
      parameters: { action: 'start_modification_flow' }
    });
  }
  
  return actions;
}

function generateRichTravelContent(message: string, dashboardType: string): any {
  const messageLower = message.toLowerCase();
  
  if (messageLower.includes('flight') || messageLower.includes('book')) {
    return {
      type: 'quick_replies',
      data: {
        title: 'Flight Booking',
        replies: ['Domestic Flights', 'International', 'Business Class', 'Flexible Dates']
      }
    };
  }
  
  return null;
}