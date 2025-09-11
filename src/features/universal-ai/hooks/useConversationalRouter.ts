import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface ConversationContext {
  dashboardType: 'admin' | 'partner' | 'user';
  userId?: string;
  sessionId?: string;
  conversationHistory: Array<{
    role: 'user' | 'assistant';
    content: string;
    timestamp: string;
    aiSystem?: 'openai' | 'dialogflow' | 'hybrid';
  }>;
}

export interface RoutingDecision {
  aiSystem: 'openai' | 'dialogflow' | 'hybrid';
  confidence: number;
  reasoning: string;
  intentCategory: 'travel_operation' | 'general_chat' | 'system_admin' | 'business_analytics';
  requiresHandoff?: boolean;
  fallbackSystem?: 'openai' | 'dialogflow';
}

export interface EnhancedResponse {
  content: string;
  aiSystem: 'openai' | 'dialogflow' | 'hybrid';
  confidence: number;
  intent: string;
  entities: any[];
  actions?: Array<{
    type: string;
    parameters: Record<string, any>;
  }>;
  richContent?: {
    type: 'card' | 'carousel' | 'quick_replies' | 'list';
    data: any;
  };
  voiceResponse?: {
    ssml?: string;
    audioUrl?: string;
  };
}

export const useConversationalRouter = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentSession, setCurrentSession] = useState<string | null>(null);

  const analyzeIntent = useCallback((message: string, context: ConversationContext): RoutingDecision => {
    const travelKeywords = [
      'book', 'flight', 'hotel', 'trip', 'travel', 'destination', 'itinerary',
      'reservation', 'cancel booking', 'check-in', 'baggage', 'seat selection',
      'change flight', 'refund', 'travel insurance', 'visa', 'passport'
    ];
    
    const systemKeywords = [
      'system', 'health', 'monitoring', 'alert', 'performance', 'metrics',
      'dashboard', 'error', 'logs', 'database', 'API', 'server', 'deployment'
    ];

    const businessKeywords = [
      'revenue', 'analytics', 'performance', 'booking trends', 'conversion',
      'profit', 'commission', 'partner', 'revenue optimization', 'pricing'
    ];

    const messageLower = message.toLowerCase();
    const hasTravelIntent = travelKeywords.some(keyword => messageLower.includes(keyword));
    const hasSystemIntent = systemKeywords.some(keyword => messageLower.includes(keyword));
    const hasBusinessIntent = businessKeywords.some(keyword => messageLower.includes(keyword));

    // Complex travel operations should go to Dialogflow CX
    if (hasTravelIntent && (
      messageLower.includes('book') || 
      messageLower.includes('change') || 
      messageLower.includes('cancel') ||
      messageLower.includes('modify')
    )) {
      return {
        aiSystem: 'dialogflow',
        confidence: 0.9,
        reasoning: 'Travel operation detected requiring structured workflow',
        intentCategory: 'travel_operation',
        fallbackSystem: 'openai'
      };
    }

    // System administration queries for admin dashboard
    if (context.dashboardType === 'admin' && hasSystemIntent) {
      return {
        aiSystem: 'openai',
        confidence: 0.85,
        reasoning: 'System administration query best handled by OpenAI with context',
        intentCategory: 'system_admin'
      };
    }

    // Business analytics for partner dashboard
    if (context.dashboardType === 'partner' && hasBusinessIntent) {
      return {
        aiSystem: 'openai',
        confidence: 0.8,
        reasoning: 'Business analytics query with contextual data analysis',
        intentCategory: 'business_analytics'
      };
    }

    // General travel questions - use hybrid approach
    if (hasTravelIntent) {
      return {
        aiSystem: 'hybrid',
        confidence: 0.7,
        reasoning: 'Travel-related inquiry benefits from both systems',
        intentCategory: 'travel_operation',
        requiresHandoff: true
      };
    }

    // Default to OpenAI for general conversation
    return {
      aiSystem: 'openai',
      confidence: 0.6,
      reasoning: 'General conversation best handled by OpenAI',
      intentCategory: 'general_chat'
    };
  }, []);

  const routeConversation = useCallback(async (
    message: string,
    context: ConversationContext
  ): Promise<EnhancedResponse> => {
    setIsProcessing(true);

    try {
      const routingDecision = analyzeIntent(message, context);
      
      // Generate session ID if not exists
      const sessionId = context.sessionId || `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      setCurrentSession(sessionId);

      let response: EnhancedResponse;

      switch (routingDecision.aiSystem) {
        case 'dialogflow':
          response = await callDialogflowCX(message, { ...context, sessionId }, routingDecision);
          break;
        
        case 'hybrid':
          response = await callHybridSystem(message, { ...context, sessionId }, routingDecision);
          break;
        
        case 'openai':
        default:
          response = await callOpenAI(message, { ...context, sessionId }, routingDecision);
          break;
      }

      // Log the conversation routing for analytics (simplified for now)
      console.log('Conversation routing:', { 
        sessionId, 
        aiSystem: response.aiSystem, 
        confidence: response.confidence 
      });

      return response;

    } catch (error) {
      console.error('Error in conversation routing:', error);
      
      // Fallback to basic OpenAI
      return {
        content: "I apologize, but I'm experiencing some technical difficulties. Let me try to help you with a simpler approach.",
        aiSystem: 'openai',
        confidence: 0.3,
        intent: 'error_fallback',
        entities: []
      };
    } finally {
      setIsProcessing(false);
    }
  }, [analyzeIntent]);

  const callOpenAI = useCallback(async (
    message: string,
    context: ConversationContext,
    routingDecision: RoutingDecision
  ): Promise<EnhancedResponse> => {
    const { data, error } = await supabase.functions.invoke('conversational-ai', {
      body: {
        message,
        dashboardType: context.dashboardType,
        userId: context.userId,
        conversationHistory: context.conversationHistory
      }
    });

    if (error) throw error;

    return {
      content: data.response,
      aiSystem: 'openai',
      confidence: data.confidence,
      intent: data.intent,
      entities: data.entities || [],
      actions: data.action ? [{ type: data.action, parameters: data.actionParams || {} }] : []
    };
  }, []);

  const callDialogflowCX = useCallback(async (
    message: string,
    context: ConversationContext,
    routingDecision: RoutingDecision
  ): Promise<EnhancedResponse> => {
    try {
      const { data, error } = await supabase.functions.invoke('dialogflow-cx-webhook', {
        body: {
          message,
          sessionId: context.sessionId,
          dashboardType: context.dashboardType,
          userId: context.userId
        }
      });

      if (error) {
        console.warn('Dialogflow CX not available, falling back to OpenAI');
        return callOpenAI(message, context, routingDecision);
      }

      return {
        content: data.fulfillmentText || data.content,
        aiSystem: 'dialogflow',
        confidence: 0.9,
        intent: data.intent || 'travel_operation',
        entities: data.entities || [],
        actions: data.actions || [],
        richContent: data.richContent
      };
    } catch (error) {
      console.warn('Dialogflow CX error, falling back to OpenAI:', error);
      return callOpenAI(message, context, routingDecision);
    }
  }, [callOpenAI]);

  const callHybridSystem = useCallback(async (
    message: string,
    context: ConversationContext,
    routingDecision: RoutingDecision
  ): Promise<EnhancedResponse> => {
    // Try Dialogflow first for structured response
    try {
      const dialogflowResponse = await callDialogflowCX(message, context, routingDecision);
      
      // If Dialogflow confidence is low, enhance with OpenAI
      if (dialogflowResponse.confidence < 0.7) {
        const openaiResponse = await callOpenAI(message, context, routingDecision);
        
        return {
          content: `${dialogflowResponse.content}\n\nAdditional assistance: ${openaiResponse.content}`,
          aiSystem: 'hybrid',
          confidence: Math.max(dialogflowResponse.confidence, openaiResponse.confidence),
          intent: dialogflowResponse.intent,
          entities: [...(dialogflowResponse.entities || []), ...(openaiResponse.entities || [])],
          actions: [...(dialogflowResponse.actions || []), ...(openaiResponse.actions || [])],
          richContent: dialogflowResponse.richContent
        };
      }

      return { ...dialogflowResponse, aiSystem: 'hybrid' };
    } catch (error) {
      // Fallback to OpenAI only
      return callOpenAI(message, context, routingDecision);
    }
  }, [callDialogflowCX, callOpenAI]);

  return {
    routeConversation,
    analyzeIntent,
    isProcessing,
    currentSession
  };
};