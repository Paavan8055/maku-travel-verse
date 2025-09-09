import { useState, useCallback, useEffect } from 'react';
import { useUniversalAI } from '../context/UniversalAIContext';
import { useMakuBot } from '@/features/makuBot/context/MakuBotContext';
import { useAgenticBot } from '@/features/agenticBot/context/AgenticBotContext';

interface BotCapability {
  id: string;
  name: string;
  aiType: 'maku' | 'agentic' | 'master';
  specialties: string[];
  complexityRange: [number, number]; // 1-10 scale
  dashboardOptimized: ('admin' | 'partner' | 'user')[];
  responseTime: number; // average ms
  accuracyRate: number; // 0-1
}

interface QueryAnalysis {
  complexity: number;
  category: 'travel_planning' | 'booking_assistance' | 'system_administration' | 'analytics' | 'troubleshooting' | 'general';
  urgency: 'low' | 'medium' | 'high' | 'critical';
  requiresPersonalization: boolean;
  expectedDuration: number;
  suggestedBots: string[];
}

interface BotRecommendation {
  botId: string;
  aiType: 'maku' | 'agentic' | 'master';
  confidence: number;
  estimatedAccuracy: number;
  estimatedResponseTime: number;
  reasoning: string[];
}

interface OrchestrationResult {
  primaryBot: BotRecommendation;
  fallbackBots: BotRecommendation[];
  collaborativeBots?: BotRecommendation[];
  orchestrationStrategy: 'single' | 'sequential' | 'parallel' | 'collaborative';
}

const BOT_CAPABILITIES: BotCapability[] = [
  {
    id: 'maku-general',
    name: 'Maku General Assistant',
    aiType: 'maku',
    specialties: ['travel_planning', 'booking_assistance', 'recommendations'],
    complexityRange: [1, 6],
    dashboardOptimized: ['user'],
    responseTime: 1200,
    accuracyRate: 0.88
  },
  {
    id: 'maku-family',
    name: 'Maku Family Travel Expert',
    aiType: 'maku',
    specialties: ['family_travel', 'kid_friendly', 'group_booking'],
    complexityRange: [2, 7],
    dashboardOptimized: ['user'],
    responseTime: 1400,
    accuracyRate: 0.92
  },
  {
    id: 'maku-solo',
    name: 'Maku Solo Travel Specialist',
    aiType: 'maku',
    specialties: ['solo_travel', 'safety', 'budget_travel'],
    complexityRange: [1, 6],
    dashboardOptimized: ['user'],
    responseTime: 1100,
    accuracyRate: 0.89
  },
  {
    id: 'maku-pet',
    name: 'Maku Pet Travel Assistant',
    aiType: 'maku',
    specialties: ['pet_travel', 'pet_friendly', 'regulations'],
    complexityRange: [3, 8],
    dashboardOptimized: ['user'],
    responseTime: 1600,
    accuracyRate: 0.91
  },
  {
    id: 'maku-spiritual',
    name: 'Maku Spiritual Journey Guide',
    aiType: 'maku',
    specialties: ['spiritual_travel', 'retreats', 'meditation'],
    complexityRange: [2, 7],
    dashboardOptimized: ['user'],
    responseTime: 1500,
    accuracyRate: 0.87
  },
  {
    id: 'agentic-booking',
    name: 'Autonomous Booking Agent',
    aiType: 'agentic',
    specialties: ['automated_booking', 'price_monitoring', 'reservation_management'],
    complexityRange: [4, 9],
    dashboardOptimized: ['user', 'partner'],
    responseTime: 2500,
    accuracyRate: 0.94
  },
  {
    id: 'agentic-admin',
    name: 'Administrative Task Agent',
    aiType: 'agentic',
    specialties: ['system_administration', 'data_analysis', 'reporting'],
    complexityRange: [5, 10],
    dashboardOptimized: ['admin'],
    responseTime: 3200,
    accuracyRate: 0.96
  },
  {
    id: 'master-analyst',
    name: 'Master AI Analyst',
    aiType: 'master',
    specialties: ['complex_analysis', 'multi_system_integration', 'strategic_insights'],
    complexityRange: [7, 10],
    dashboardOptimized: ['admin', 'partner'],
    responseTime: 4500,
    accuracyRate: 0.97
  }
];

export const useIntelligentBotOrchestration = () => {
  const { currentContext, trackInteraction } = useUniversalAI();
  const { state: makuState } = useMakuBot();
  const { state: agenticState } = useAgenticBot();
  
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [lastAnalysis, setLastAnalysis] = useState<QueryAnalysis | null>(null);
  const [lastRecommendation, setLastRecommendation] = useState<OrchestrationResult | null>(null);

  const analyzeQuery = useCallback(async (query: string, context?: Record<string, any>): Promise<QueryAnalysis> => {
    setIsAnalyzing(true);
    
    // Simulate AI-powered query analysis
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const words = query.toLowerCase().split(' ');
    const queryLength = query.length;
    
    // Determine complexity based on various factors
    let complexity = Math.min(Math.max(Math.floor(queryLength / 20) + 1, 1), 10);
    
    // Keywords that increase complexity
    const complexKeywords = ['analyze', 'optimize', 'integrate', 'troubleshoot', 'predict', 'configure'];
    const simpleKeywords = ['book', 'find', 'show', 'help', 'what', 'where'];
    
    if (complexKeywords.some(keyword => words.includes(keyword))) {
      complexity = Math.min(complexity + 3, 10);
    }
    if (simpleKeywords.some(keyword => words.includes(keyword))) {
      complexity = Math.max(complexity - 1, 1);
    }
    
    // Determine category
    let category: QueryAnalysis['category'] = 'general';
    if (words.some(w => ['book', 'reserve', 'hotel', 'flight', 'trip'].includes(w))) {
      category = 'travel_planning';
    } else if (words.some(w => ['booking', 'reservation', 'confirm', 'cancel'].includes(w))) {
      category = 'booking_assistance';
    } else if (words.some(w => ['admin', 'system', 'user', 'manage', 'configure'].includes(w))) {
      category = 'system_administration';
    } else if (words.some(w => ['analyze', 'report', 'data', 'metrics', 'performance'].includes(w))) {
      category = 'analytics';
    } else if (words.some(w => ['fix', 'error', 'problem', 'troubleshoot', 'debug'].includes(w))) {
      category = 'troubleshooting';
    }
    
    // Determine urgency
    let urgency: QueryAnalysis['urgency'] = 'medium';
    if (words.some(w => ['urgent', 'emergency', 'critical', 'asap', 'now'].includes(w))) {
      urgency = 'critical';
    } else if (words.some(w => ['soon', 'quickly', 'fast', 'immediately'].includes(w))) {
      urgency = 'high';
    } else if (words.some(w => ['later', 'eventually', 'sometime', 'when possible'].includes(w))) {
      urgency = 'low';
    }
    
    const requiresPersonalization = words.some(w => 
      ['my', 'personal', 'preference', 'recommend', 'suggest', 'best for me'].includes(w)
    ) || currentContext.userVertical !== 'Solo';
    
    const expectedDuration = Math.max(complexity * 500, 1000);
    
    // Suggest appropriate bots based on analysis
    const suggestedBots = BOT_CAPABILITIES
      .filter(bot => 
        bot.complexityRange[0] <= complexity && 
        bot.complexityRange[1] >= complexity &&
        bot.dashboardOptimized.includes(currentContext.currentDashboard)
      )
      .map(bot => bot.id);
    
    const analysis: QueryAnalysis = {
      complexity,
      category,
      urgency,
      requiresPersonalization,
      expectedDuration,
      suggestedBots
    };
    
    setLastAnalysis(analysis);
    setIsAnalyzing(false);
    
    trackInteraction({
      type: 'command',
      dashboardType: currentContext.currentDashboard,
      aiType: 'master',
      timestamp: new Date(),
      context: currentContext,
      metadata: { queryAnalysis: analysis }
    });
    
    return analysis;
  }, [currentContext, trackInteraction]);

  const recommendBotOrchestration = useCallback((analysis: QueryAnalysis): OrchestrationResult => {
    const availableBots = BOT_CAPABILITIES.filter(bot =>
      analysis.suggestedBots.includes(bot.id)
    );
    
    // Score bots based on multiple factors
    const scoredBots = availableBots.map(bot => {
      let score = bot.accuracyRate;
      
      // Dashboard optimization bonus
      if (bot.dashboardOptimized.includes(currentContext.currentDashboard)) {
        score += 0.1;
      }
      
      // Personalization bonus for user dashboard
      if (analysis.requiresPersonalization && bot.aiType === 'maku') {
        score += 0.05;
      }
      
      // Urgency penalty for slow bots
      if (analysis.urgency === 'critical' && bot.responseTime > 2000) {
        score -= 0.1;
      }
      
      // Complexity match bonus
      const complexityMatch = 1 - Math.abs(analysis.complexity - (bot.complexityRange[0] + bot.complexityRange[1]) / 2) / 10;
      score += complexityMatch * 0.15;
      
      // Specialty match bonus
      const hasSpecialtyMatch = bot.specialties.some(specialty => 
        analysis.category.includes(specialty.replace(/_/g, '_'))
      );
      if (hasSpecialtyMatch) {
        score += 0.2;
      }
      
      const reasoning: string[] = [];
      if (bot.dashboardOptimized.includes(currentContext.currentDashboard)) {
        reasoning.push(`Optimized for ${currentContext.currentDashboard} dashboard`);
      }
      if (hasSpecialtyMatch) {
        reasoning.push(`Specialized in ${analysis.category}`);
      }
      if (complexityMatch > 0.7) {
        reasoning.push(`Well-suited for complexity level ${analysis.complexity}`);
      }
      
      return {
        botId: bot.id,
        aiType: bot.aiType,
        confidence: Math.min(score, 1),
        estimatedAccuracy: bot.accuracyRate,
        estimatedResponseTime: bot.responseTime,
        reasoning
      };
    }).sort((a, b) => b.confidence - a.confidence);
    
    const primaryBot = scoredBots[0];
    const fallbackBots = scoredBots.slice(1, 3);
    
    // Determine orchestration strategy
    let orchestrationStrategy: OrchestrationResult['orchestrationStrategy'] = 'single';
    
    if (analysis.complexity >= 8) {
      orchestrationStrategy = 'collaborative';
    } else if (analysis.complexity >= 6) {
      orchestrationStrategy = 'sequential';
    } else if (analysis.urgency === 'critical') {
      orchestrationStrategy = 'parallel';
    }
    
    // For collaborative strategy, suggest additional bots
    const collaborativeBots = orchestrationStrategy === 'collaborative' 
      ? scoredBots.slice(1, 4).filter(bot => bot.confidence > 0.7)
      : undefined;
    
    const result: OrchestrationResult = {
      primaryBot,
      fallbackBots,
      collaborativeBots,
      orchestrationStrategy
    };
    
    setLastRecommendation(result);
    return result;
  }, [currentContext]);

  const executeOrchestration = useCallback(async (
    query: string, 
    orchestration: OrchestrationResult,
    onProgress?: (progress: number, status: string) => void
  ): Promise<{
    success: boolean;
    response: string;
    executionTime: number;
    botUsed: string;
    strategy: string;
  }> => {
    const startTime = Date.now();
    onProgress?.(10, 'Initializing orchestration...');
    
    try {
      let response = '';
      let botUsed = orchestration.primaryBot.botId;
      
      onProgress?.(30, `Executing with ${orchestration.primaryBot.aiType} bot...`);
      
      // Simulate bot execution based on strategy
      switch (orchestration.orchestrationStrategy) {
        case 'single':
          await new Promise(resolve => setTimeout(resolve, orchestration.primaryBot.estimatedResponseTime));
          response = `Response from ${orchestration.primaryBot.botId}: Executed successfully with single bot strategy.`;
          break;
          
        case 'sequential':
          onProgress?.(50, 'Sequential execution in progress...');
          await new Promise(resolve => setTimeout(resolve, orchestration.primaryBot.estimatedResponseTime));
          if (orchestration.fallbackBots.length > 0) {
            onProgress?.(70, 'Executing fallback verification...');
            await new Promise(resolve => setTimeout(resolve, orchestration.fallbackBots[0].estimatedResponseTime / 2));
          }
          response = `Sequential response: Primary bot completed, verified by fallback bot.`;
          break;
          
        case 'parallel':
          onProgress?.(50, 'Parallel execution across multiple bots...');
          const parallelPromises = [orchestration.primaryBot, ...orchestration.fallbackBots.slice(0, 2)]
            .map(bot => new Promise(resolve => setTimeout(resolve, bot.estimatedResponseTime)));
          await Promise.all(parallelPromises);
          response = `Parallel response: Best result selected from multiple bot execution.`;
          break;
          
        case 'collaborative':
          onProgress?.(40, 'Collaborative analysis starting...');
          await new Promise(resolve => setTimeout(resolve, orchestration.primaryBot.estimatedResponseTime));
          if (orchestration.collaborativeBots?.length) {
            onProgress?.(70, 'Collaborative refinement...');
            await Promise.all(orchestration.collaborativeBots.map(bot => 
              new Promise(resolve => setTimeout(resolve, bot.estimatedResponseTime / 2))
            ));
          }
          response = `Collaborative response: Multiple expert bots contributed to comprehensive analysis.`;
          break;
      }
      
      onProgress?.(90, 'Finalizing response...');
      const executionTime = Date.now() - startTime;
      onProgress?.(100, 'Execution completed successfully');
      
      // Track successful orchestration
      trackInteraction({
        type: 'command',
        dashboardType: currentContext.currentDashboard,
        aiType: orchestration.primaryBot.aiType,
        timestamp: new Date(),
        context: currentContext,
        duration: executionTime,
        success: true,
        metadata: {
          orchestrationStrategy: orchestration.orchestrationStrategy,
          botUsed,
          confidence: orchestration.primaryBot.confidence
        }
      });
      
      return {
        success: true,
        response,
        executionTime,
        botUsed,
        strategy: orchestration.orchestrationStrategy
      };
      
    } catch (error) {
      const executionTime = Date.now() - startTime;
      
      trackInteraction({
        type: 'command',
        dashboardType: currentContext.currentDashboard,
        aiType: orchestration.primaryBot.aiType,
        timestamp: new Date(),
        context: currentContext,
        duration: executionTime,
        success: false,
        metadata: { error: error instanceof Error ? error.message : 'Unknown error' }
      });
      
      return {
        success: false,
        response: 'Orchestration failed. Falling back to simple bot execution.',
        executionTime,
        botUsed: 'fallback',
        strategy: 'error_fallback'
      };
    }
  }, [currentContext, trackInteraction]);

  const getOptimalBot = useCallback((query: string, context?: Record<string, any>) => {
    // Quick bot recommendation without full analysis
    const words = query.toLowerCase().split(' ');
    
    // User dashboard - prioritize Maku bots
    if (currentContext.currentDashboard === 'user') {
      if (currentContext.userVertical === 'Family') return 'maku-family';
      if (currentContext.userVertical === 'Pet') return 'maku-pet';
      if (currentContext.userVertical === 'Spiritual') return 'maku-spiritual';
      return 'maku-solo';
    }
    
    // Admin dashboard - complex queries go to master, simple ones to agentic
    if (currentContext.currentDashboard === 'admin') {
      const isComplex = words.some(w => ['analyze', 'optimize', 'integrate', 'predict'].includes(w));
      return isComplex ? 'master-analyst' : 'agentic-admin';
    }
    
    // Partner dashboard - business-focused
    if (currentContext.currentDashboard === 'partner') {
      const isBookingRelated = words.some(w => ['booking', 'reservation', 'revenue'].includes(w));
      return isBookingRelated ? 'agentic-booking' : 'master-analyst';
    }
    
    return 'maku-general';
  }, [currentContext]);

  return {
    analyzeQuery,
    recommendBotOrchestration,
    executeOrchestration,
    getOptimalBot,
    isAnalyzing,
    lastAnalysis,
    lastRecommendation,
    availableBots: BOT_CAPABILITIES
  };
};