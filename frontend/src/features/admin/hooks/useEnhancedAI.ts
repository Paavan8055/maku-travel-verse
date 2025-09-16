import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface AIResponse {
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

interface AIContext {
  adminSection?: string;
  systemHealth?: any;
  recentAlerts?: any[];
  currentUser?: string;
  timestamp?: string;
  [key: string]: any;
}

export const useEnhancedAI = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastResponse, setLastResponse] = useState<AIResponse | null>(null);
  const [conversationHistory, setConversationHistory] = useState<Array<{
    role: 'user' | 'assistant';
    content: string;
    timestamp: string;
  }>>([]);
  const [selectedPromptId, setSelectedPromptId] = useState<string | null>(null);

  const processQuery = useCallback(async (
    query: string, 
    context: AIContext = {},
    type: 'natural_language' | 'troubleshooting' | 'knowledge_search' | 'predictive_analysis' = 'natural_language',
    useExternalPrompt: boolean = false,
    promptId?: string
  ): Promise<AIResponse | null> => {
    if (!query.trim()) return null;

    setIsProcessing(true);
    
    try {
      console.log('Processing AI query:', { query, type, context });

      const { data, error } = await supabase.functions.invoke('ai-assistant', {
        body: {
          query,
          type,
          context: {
            ...context,
            timestamp: new Date().toISOString(),
            conversationHistory: conversationHistory.slice(-3) // Last 3 interactions for context
          },
          conversationHistory: conversationHistory.map(msg => ({
            role: msg.role,
            content: msg.content
          })),
          useExternalPrompt: useExternalPrompt || !!selectedPromptId,
          promptId: promptId || selectedPromptId
        }
      });

      if (error) {
        console.error('AI processing error:', error);
        throw error;
      }

      console.log('AI response received:', data);

      const response: AIResponse = {
        type: data.type || 'ai_response',
        response: data.response || data.message || 'No response generated',
        suggestions: data.suggestions || [],
        confidence: data.confidence || 0.5,
        context_used: data.context_used || false,
        diagnosticSteps: data.diagnosticSteps,
        analysis: data.analysis,
        recommendedActions: data.recommendedActions,
        escalationLevel: data.escalationLevel,
        predictions: data.predictions,
        results: data.results,
        searchQuery: data.searchQuery,
        totalResults: data.totalResults
      };

      setLastResponse(response);
      
      // Add to conversation history
      setConversationHistory(prev => [...prev, 
        {
          role: 'user' as const,
          content: query,
          timestamp: new Date().toISOString()
        },
        {
          role: 'assistant' as const, 
          content: response.response,
          timestamp: new Date().toISOString()
        }
      ].slice(-20)); // Keep last 20 messages

      return response;
      
    } catch (error) {
      console.error('Enhanced AI error:', error);
      
      // Fallback response
      const fallbackResponse: AIResponse = {
        type: 'fallback_response',
        response: 'I encountered an issue processing your request. Please try rephrasing your question or check the system health dashboard.',
        suggestions: [
          'Check system health dashboard',
          'Review recent alerts',
          'Contact technical support if the issue persists'
        ],
        confidence: 0.3,
        context_used: false
      };
      
      setLastResponse(fallbackResponse);
      return fallbackResponse;
      
    } finally {
      setIsProcessing(false);
    }
  }, [conversationHistory]);

  const performTroubleshooting = useCallback(async (issue: string, context: AIContext = {}) => {
    return await processQuery(issue, {
      ...context,
      adminSection: 'troubleshooting'
    }, 'troubleshooting');
  }, [processQuery]);

  const searchKnowledge = useCallback(async (searchQuery: string, context: AIContext = {}) => {
    return await processQuery(searchQuery, {
      ...context,
      adminSection: 'knowledge'
    }, 'knowledge_search');
  }, [processQuery]);

  const getPredictiveInsights = useCallback(async (context: AIContext = {}) => {
    return await processQuery('Analyze system patterns and provide predictive insights', {
      ...context,
      adminSection: 'analytics'
    }, 'predictive_analysis');
  }, [processQuery]);

  const askQuestion = useCallback(async (question: string, context: AIContext = {}) => {
    return await processQuery(question, context, 'natural_language');
  }, [processQuery]);

  const getContextualHelp = useCallback(async (currentSection: string, context: AIContext = {}) => {
    const helpQuery = `I'm currently in the ${currentSection} section. What can I do here and what should I check?`;
    return await processQuery(helpQuery, {
      ...context,
      adminSection: currentSection,
      helpRequest: true
    }, 'natural_language');
  }, [processQuery]);

  const analyzeSystemPatterns = useCallback(async (timeframe: string = '24h', context: AIContext = {}) => {
    const analysisQuery = `Analyze system patterns and performance over the last ${timeframe}`;
    return await processQuery(analysisQuery, {
      ...context,
      timeframe,
      analysisType: 'system_patterns'
    }, 'predictive_analysis');
  }, [processQuery]);

  const generateReport = useCallback(async (reportType: string, context: AIContext = {}) => {
    const reportQuery = `Generate a ${reportType} report with insights and recommendations`;
    return await processQuery(reportQuery, {
      ...context,
      reportType,
      generateReport: true
    }, 'natural_language');
  }, [processQuery]);

  const clearHistory = useCallback(() => {
    setConversationHistory([]);
    setLastResponse(null);
  }, []);

  const getConversationSummary = useCallback(() => {
    if (conversationHistory.length === 0) return null;
    
    const userMessages = conversationHistory.filter(msg => msg.role === 'user');
    
    return {
      totalInteractions: userMessages.length,
      totalMessages: conversationHistory.length,
      lastInteraction: conversationHistory[conversationHistory.length - 1]
    };
  }, [conversationHistory]);

  const setPrompt = (promptId: string | null) => {
    setSelectedPromptId(promptId);
  };

  return {
    // Core functionality
    processQuery,
    performTroubleshooting,
    searchKnowledge,
    getPredictiveInsights,
    askQuestion,
    getContextualHelp,
    
    // Specialized functions
    analyzeSystemPatterns,
    generateReport,
    
    // State management
    clearHistory,
    getConversationSummary,
    setPrompt,
    
    // State
    isProcessing,
    lastResponse,
    conversationHistory,
    selectedPromptId
  };
};