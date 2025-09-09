import React, { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react';

export interface AIInteraction {
  id: string;
  type: 'chat' | 'task' | 'command' | 'widget_opened' | 'widget_closed';
  dashboardType: 'admin' | 'partner' | 'user';
  aiType: 'maku' | 'agentic' | 'master';
  timestamp: Date;
  context: UniversalAIContext;
  duration?: number;
  success?: boolean;
  userSatisfaction?: number;
  metadata?: Record<string, any>;
}

export interface UniversalAIContext {
  currentDashboard: 'admin' | 'partner' | 'user';
  userRole: string;
  userVertical: 'Family' | 'Solo' | 'Pet' | 'Spiritual';
  sessionId: string;
  preferences: {
    preferredAI: 'maku' | 'agentic' | 'auto';
    responseStyle: 'concise' | 'detailed' | 'technical';
    notificationsEnabled: boolean;
    crossDashboardSharing: boolean;
  };
  recentActions: string[];
  currentTask?: string;
}

export interface UsagePattern {
  dashboardType: 'admin' | 'partner' | 'user';
  aiType: 'maku' | 'agentic' | 'master';
  frequency: number;
  averageSessionDuration: number;
  successRate: number;
  commonQueries: string[];
  timeOfDay: number[];
}

interface UniversalAIContextType {
  currentContext: UniversalAIContext;
  aiInteractions: AIInteraction[];
  usagePatterns: UsagePattern[];
  setDashboardContext: (dashboard: 'admin' | 'partner' | 'user') => void;
  setUserVertical: (vertical: 'Family' | 'Solo' | 'Pet' | 'Spiritual') => void;
  trackInteraction: (interaction: Omit<AIInteraction, 'id'>) => void;
  updatePreferences: (preferences: Partial<UniversalAIContext['preferences']>) => void;
  getCrossDashboardInsights: (dashboardType: 'admin' | 'partner' | 'user') => string[];
  getPersonalizationData: () => {
    preferredAIType: string;
    commonTasks: string[];
    optimalTimes: number[];
    successFactors: Record<string, number>;
  };
  analyzeUsagePatterns: () => {
    totalInteractions: number;
    averageSuccessRate: number;
    mostUsedDashboard: string;
    peakUsageHours: number[];
    improvementAreas: string[];
  };
  clearInteractionHistory: () => void;
}

const UniversalAIContext = createContext<UniversalAIContextType | undefined>(undefined);

interface UniversalAIProviderProps {
  children: ReactNode;
}

export const UniversalAIProvider: React.FC<UniversalAIProviderProps> = ({ children }) => {
  const [currentContext, setCurrentContext] = useState<UniversalAIContext>({
    currentDashboard: 'user',
    userRole: 'user',
    userVertical: 'Solo',
    sessionId: generateSessionId(),
    preferences: {
      preferredAI: 'auto',
      responseStyle: 'detailed',
      notificationsEnabled: true,
      crossDashboardSharing: true,
    },
    recentActions: [],
    currentTask: undefined,
  });

  const [aiInteractions, setAIInteractions] = useState<AIInteraction[]>([]);
  const [usagePatterns, setUsagePatterns] = useState<UsagePattern[]>([]);

  // Load saved data from localStorage on mount
  useEffect(() => {
    const savedContext = localStorage.getItem('universal-ai-context');
    const savedInteractions = localStorage.getItem('universal-ai-interactions');
    
    if (savedContext) {
      try {
        const parsed = JSON.parse(savedContext);
        setCurrentContext(prev => ({ ...prev, ...parsed, sessionId: generateSessionId() }));
      } catch (error) {
        console.warn('Failed to load AI context from localStorage:', error);
      }
    }
    
    if (savedInteractions) {
      try {
        const parsed = JSON.parse(savedInteractions);
        setAIInteractions(parsed.map((i: any) => ({ ...i, timestamp: new Date(i.timestamp) })));
      } catch (error) {
        console.warn('Failed to load AI interactions from localStorage:', error);
      }
    }
  }, []);

  // Save to localStorage when context or interactions change
  useEffect(() => {
    localStorage.setItem('universal-ai-context', JSON.stringify({
      ...currentContext,
      sessionId: undefined // Don't persist session ID
    }));
  }, [currentContext]);

  useEffect(() => {
    localStorage.setItem('universal-ai-interactions', JSON.stringify(aiInteractions));
    updateUsagePatterns();
  }, [aiInteractions]);

  const setDashboardContext = useCallback((dashboard: 'admin' | 'partner' | 'user') => {
    setCurrentContext(prev => ({
      ...prev,
      currentDashboard: dashboard,
      userRole: dashboard === 'admin' ? 'admin' : dashboard === 'partner' ? 'partner' : 'user',
      recentActions: [...prev.recentActions, `switched_to_${dashboard}`].slice(-10)
    }));
  }, []);

  const setUserVertical = useCallback((vertical: 'Family' | 'Solo' | 'Pet' | 'Spiritual') => {
    setCurrentContext(prev => ({
      ...prev,
      userVertical: vertical,
      recentActions: [...prev.recentActions, `changed_vertical_${vertical}`].slice(-10)
    }));
  }, []);

  const trackInteraction = useCallback((interaction: Omit<AIInteraction, 'id'>) => {
    const newInteraction: AIInteraction = {
      ...interaction,
      id: generateInteractionId(),
      context: currentContext,
    };
    
    setAIInteractions(prev => [newInteraction, ...prev].slice(0, 1000)); // Keep last 1000 interactions
  }, [currentContext]);

  const updatePreferences = useCallback((preferences: Partial<UniversalAIContext['preferences']>) => {
    setCurrentContext(prev => ({
      ...prev,
      preferences: { ...prev.preferences, ...preferences }
    }));
  }, []);

  const getCrossDashboardInsights = useCallback((dashboardType: 'admin' | 'partner' | 'user'): string[] => {
    const insights: string[] = [];
    const recentInteractions = aiInteractions.slice(0, 50);
    
    // Analyze cross-dashboard patterns
    const otherDashboards = recentInteractions.filter(i => i.dashboardType !== dashboardType);
    
    if (otherDashboards.length > 0) {
      insights.push(`You've been active on ${otherDashboards[0].dashboardType} dashboard recently`);
    }
    
    // Success rate insights
    const successfulInteractions = recentInteractions.filter(i => i.success === true);
    if (successfulInteractions.length / recentInteractions.length > 0.9) {
      insights.push('Your AI interactions have been highly successful');
    }
    
    // Time-based insights
    const currentHour = new Date().getHours();
    const sameTimeInteractions = recentInteractions.filter(i => 
      new Date(i.timestamp).getHours() === currentHour
    );
    if (sameTimeInteractions.length > 3) {
      insights.push(`Peak activity time - you're ${20}% more productive now`);
    }
    
    // Vertical-specific insights
    if (dashboardType === 'user') {
      insights.push(`Optimized for ${currentContext.userVertical} travel preferences`);
    }
    
    return insights.slice(0, 3);
  }, [aiInteractions, currentContext]);

  const getPersonalizationData = useCallback(() => {
    const interactions = aiInteractions.slice(0, 200);
    
    // Determine preferred AI type
    const aiTypeCounts = interactions.reduce((acc, i) => {
      acc[i.aiType] = (acc[i.aiType] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const preferredAIType = Object.keys(aiTypeCounts).reduce((a, b) => 
      aiTypeCounts[a] > aiTypeCounts[b] ? a : b
    ) || 'maku';
    
    // Extract common tasks
    const taskTypes = interactions.map(i => i.type);
    const commonTasks = [...new Set(taskTypes)].slice(0, 5);
    
    // Optimal usage times
    const hours = interactions.map(i => new Date(i.timestamp).getHours());
    const hourCounts = hours.reduce((acc, hour) => {
      acc[hour] = (acc[hour] || 0) + 1;
      return acc;
    }, {} as Record<number, number>);
    
    const optimalTimes = Object.keys(hourCounts)
      .sort((a, b) => hourCounts[parseInt(b)] - hourCounts[parseInt(a)])
      .slice(0, 3)
      .map(Number);
    
    // Success factors
    const successFactors: Record<string, number> = {
      morningUsage: interactions.filter(i => new Date(i.timestamp).getHours() < 12 && i.success).length / interactions.filter(i => new Date(i.timestamp).getHours() < 12).length || 0,
      conciseQueries: interactions.filter(i => i.metadata?.queryLength && i.metadata.queryLength < 50 && i.success).length / interactions.filter(i => i.metadata?.queryLength && i.metadata.queryLength < 50).length || 0,
      followUpRate: interactions.filter(i => i.metadata?.hasFollowUp && i.success).length / interactions.filter(i => i.metadata?.hasFollowUp).length || 0,
    };
    
    return {
      preferredAIType,
      commonTasks,
      optimalTimes,
      successFactors,
    };
  }, [aiInteractions]);

  const analyzeUsagePatterns = useCallback(() => {
    const totalInteractions = aiInteractions.length;
    const successfulInteractions = aiInteractions.filter(i => i.success === true);
    const averageSuccessRate = successfulInteractions.length / totalInteractions || 0;
    
    // Most used dashboard
    const dashboardCounts = aiInteractions.reduce((acc, i) => {
      acc[i.dashboardType] = (acc[i.dashboardType] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const mostUsedDashboard = Object.keys(dashboardCounts).reduce((a, b) => 
      dashboardCounts[a] > dashboardCounts[b] ? a : b
    ) || 'user';
    
    // Peak usage hours
    const hourCounts = aiInteractions.reduce((acc, i) => {
      const hour = new Date(i.timestamp).getHours();
      acc[hour] = (acc[hour] || 0) + 1;
      return acc;
    }, {} as Record<number, number>);
    
    const peakUsageHours = Object.keys(hourCounts)
      .sort((a, b) => hourCounts[parseInt(b)] - hourCounts[parseInt(a)])
      .slice(0, 3)
      .map(Number);
    
    // Improvement areas
    const improvementAreas: string[] = [];
    
    if (averageSuccessRate < 0.8) {
      improvementAreas.push('Response accuracy could be improved');
    }
    
    const avgResponseTime = aiInteractions
      .filter(i => i.duration)
      .reduce((sum, i) => sum + (i.duration || 0), 0) / aiInteractions.filter(i => i.duration).length || 0;
    
    if (avgResponseTime > 3000) {
      improvementAreas.push('Response times could be faster');
    }
    
    const recentInteractions = aiInteractions.slice(0, 10);
    if (recentInteractions.filter(i => i.userSatisfaction && i.userSatisfaction < 4).length > 2) {
      improvementAreas.push('User satisfaction could be higher');
    }
    
    return {
      totalInteractions,
      averageSuccessRate,
      mostUsedDashboard,
      peakUsageHours,
      improvementAreas,
    };
  }, [aiInteractions]);

  const updateUsagePatterns = useCallback(() => {
    const patterns: UsagePattern[] = [];
    const dashboards: Array<'admin' | 'partner' | 'user'> = ['admin', 'partner', 'user'];
    const aiTypes: Array<'maku' | 'agentic' | 'master'> = ['maku', 'agentic', 'master'];
    
    dashboards.forEach(dashboard => {
      aiTypes.forEach(aiType => {
        const interactions = aiInteractions.filter(i => 
          i.dashboardType === dashboard && i.aiType === aiType
        );
        
        if (interactions.length > 0) {
          const avgDuration = interactions
            .filter(i => i.duration)
            .reduce((sum, i) => sum + (i.duration || 0), 0) / interactions.filter(i => i.duration).length || 0;
          
          const successRate = interactions.filter(i => i.success === true).length / interactions.length;
          
          const timeDistribution = interactions.reduce((acc, i) => {
            const hour = new Date(i.timestamp).getHours();
            acc[hour] = (acc[hour] || 0) + 1;
            return acc;
          }, {} as Record<number, number>);
          
          patterns.push({
            dashboardType: dashboard,
            aiType,
            frequency: interactions.length,
            averageSessionDuration: avgDuration,
            successRate,
            commonQueries: [], // Would extract from interaction metadata
            timeOfDay: Object.keys(timeDistribution).map(Number),
          });
        }
      });
    });
    
    setUsagePatterns(patterns);
  }, [aiInteractions]);

  const clearInteractionHistory = useCallback(() => {
    setAIInteractions([]);
    setUsagePatterns([]);
    localStorage.removeItem('universal-ai-interactions');
  }, []);

  const value: UniversalAIContextType = {
    currentContext,
    aiInteractions,
    usagePatterns,
    setDashboardContext,
    setUserVertical,
    trackInteraction,
    updatePreferences,
    getCrossDashboardInsights,
    getPersonalizationData,
    analyzeUsagePatterns,
    clearInteractionHistory,
  };

  return (
    <UniversalAIContext.Provider value={value}>
      {children}
    </UniversalAIContext.Provider>
  );
};

export const useUniversalAI = (): UniversalAIContextType => {
  const context = useContext(UniversalAIContext);
  if (!context) {
    throw new Error('useUniversalAI must be used within a UniversalAIProvider');
  }
  return context;
};

// Utility functions
function generateSessionId(): string {
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

function generateInteractionId(): string {
  return `interaction_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}