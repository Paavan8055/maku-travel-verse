import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

export interface AIInteraction {
  id: string;
  type: 'widget_opened' | 'conversation_started' | 'task_executed' | 'voice_activated';
  dashboardType: 'admin' | 'partner' | 'user';
  aiType: 'maku' | 'agentic' | 'dialogflow' | 'universal';
  timestamp: Date;
  context?: Record<string, any>;
  duration?: number;
  success?: boolean;
}

interface AICapability {
  id: string;
  name: string;
  description: string;
  supportedContexts: ('admin' | 'partner' | 'user')[];
  isEnabled: boolean;
}

interface UniversalAIState {
  currentContext: 'admin' | 'partner' | 'user' | null;
  activeAI: 'maku' | 'agentic' | 'dialogflow' | 'universal' | null;
  aiInteractions: AIInteraction[];
  capabilities: AICapability[];
  conversationMode: 'chat' | 'voice' | 'hybrid';
  isVoiceEnabled: boolean;
}

interface UniversalAIContextType {
  state: UniversalAIState;
  currentContext: UniversalAIState['currentContext'];
  aiInteractions: AIInteraction[];
  setDashboardContext: (context: 'admin' | 'partner' | 'user') => void;
  setActiveAI: (ai: UniversalAIState['activeAI']) => void;
  trackInteraction: (interaction: Omit<AIInteraction, 'id'>) => void;
  getCrossDashboardInsights: (dashboardType: string) => any;
  toggleVoiceMode: () => void;
  setConversationMode: (mode: 'chat' | 'voice' | 'hybrid') => void;
  getAvailableCapabilities: (context: 'admin' | 'partner' | 'user') => AICapability[];
}

const UniversalAIContext = createContext<UniversalAIContextType | undefined>(undefined);

const defaultCapabilities: AICapability[] = [
  {
    id: 'travel-planning',
    name: 'Travel Planning',
    description: 'AI-powered travel recommendations and itinerary planning',
    supportedContexts: ['user'],
    isEnabled: true
  },
  {
    id: 'system-monitoring',
    name: 'System Monitoring',
    description: 'Automated system health analysis and alerting',
    supportedContexts: ['admin'],
    isEnabled: true
  },
  {
    id: 'business-analytics',
    name: 'Business Analytics',
    description: 'Revenue optimization and performance insights',
    supportedContexts: ['partner', 'admin'],
    isEnabled: true
  },
  {
    id: 'task-automation',
    name: 'Task Automation',
    description: 'Automated booking and workflow management',
    supportedContexts: ['admin', 'partner', 'user'],
    isEnabled: true
  },
  {
    id: 'voice-interaction',
    name: 'Voice Interaction',
    description: 'Speech-to-text and text-to-speech capabilities',
    supportedContexts: ['admin', 'partner', 'user'],
    isEnabled: true
  }
];

interface UniversalAIProviderProps {
  children: ReactNode;
}

export const UniversalAIProvider: React.FC<UniversalAIProviderProps> = ({ children }) => {
  const [state, setState] = useState<UniversalAIState>({
    currentContext: null,
    activeAI: null,
    aiInteractions: [],
    capabilities: defaultCapabilities,
    conversationMode: 'chat',
    isVoiceEnabled: false
  });

  const setDashboardContext = useCallback((context: 'admin' | 'partner' | 'user') => {
    setState(prev => ({ ...prev, currentContext: context }));
  }, []);

  const setActiveAI = useCallback((ai: UniversalAIState['activeAI']) => {
    setState(prev => ({ ...prev, activeAI: ai }));
  }, []);

  const trackInteraction = useCallback((interaction: Omit<AIInteraction, 'id'>) => {
    const newInteraction: AIInteraction = {
      ...interaction,
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    };
    
    setState(prev => ({
      ...prev,
      aiInteractions: [...prev.aiInteractions.slice(-49), newInteraction] // Keep last 50
    }));
  }, []);

  const getCrossDashboardInsights = useCallback((dashboardType: string) => {
    const recentInteractions = state.aiInteractions
      .filter(interaction => 
        new Date(interaction.timestamp) > new Date(Date.now() - 24 * 60 * 60 * 1000)
      );

    return {
      totalInteractions: recentInteractions.length,
      successRate: recentInteractions.filter(i => i.success !== false).length / recentInteractions.length,
      averageResponseTime: 1200, // Mock data - would be calculated from real metrics
      mostUsedFeatures: ['travel-planning', 'system-monitoring', 'business-analytics']
    };
  }, [state.aiInteractions]);

  const toggleVoiceMode = useCallback(() => {
    setState(prev => ({
      ...prev,
      isVoiceEnabled: !prev.isVoiceEnabled,
      conversationMode: !prev.isVoiceEnabled ? 'voice' : 'chat'
    }));
  }, []);

  const setConversationMode = useCallback((mode: 'chat' | 'voice' | 'hybrid') => {
    setState(prev => ({
      ...prev,
      conversationMode: mode,
      isVoiceEnabled: mode === 'voice' || mode === 'hybrid'
    }));
  }, []);

  const getAvailableCapabilities = useCallback((context: 'admin' | 'partner' | 'user') => {
    return state.capabilities.filter(capability => 
      capability.supportedContexts.includes(context) && capability.isEnabled
    );
  }, [state.capabilities]);

  const value: UniversalAIContextType = {
    state,
    currentContext: state.currentContext,
    aiInteractions: state.aiInteractions,
    setDashboardContext,
    setActiveAI,
    trackInteraction,
    getCrossDashboardInsights,
    toggleVoiceMode,
    setConversationMode,
    getAvailableCapabilities
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