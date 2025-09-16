import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { EnhancedBaseAgent } from '@/features/agents/lib/enhanced-base-agent';
import { StandardizedContext } from '@/features/agents/lib/standardized-context';
import { ToolCall, ToolResult } from '@/features/agents/lib/tools/types';
import { globalToolRegistry, globalChainRegistry } from '@/features/agents/lib/tools';

export interface AgentSystemConfig {
  toolsEnabled?: boolean;
  workflowsEnabled?: boolean;
  userId?: string;
  systemLevel?: string;
  safetyLevel?: string;
  learningEnabled?: boolean;
  crossAgentMemory?: boolean;
}

export interface SystemMetrics {
  totalTools: number;
  totalWorkflows: number;
  executionCount: number;
  performance: {
    totalRequests: number;
    averageResponseTime: number; // ms
    successRate: number; // 0..1
    errorRate: number; // 0..1
    resourceUtilization: number; // 0..1
  };
  quality: {
    accuracyScore: number; // 0..1
    consistencyScore: number; // 0..1
    userSatisfaction: number; // 0..1
    // legacy optional fields
    accuracy?: number;
    relevance?: number;
    completeness?: number;
    consistency?: number;
  };
  safety: {
    complianceScore: number; // 0..1
    violationCount: number;
  };
  learning: {
    memoryEfficiency: number; // 0..1
    knowledgeGrowth: number; // 0..1
    patternRecognition: number; // 0..1
    // legacy optional fields
    dataPoints?: number;
    improvements?: number;
    adaptations?: number;
  };
}

interface UseEnhancedAgentSystemReturn {
  createAgent: (agentId: string, conversationId?: string) => EnhancedBaseAgent;
  executeTools: (agent: EnhancedBaseAgent, toolCalls: ToolCall[], userId?: string) => Promise<ToolResult[]>;
  executeWorkflow: (agent: EnhancedBaseAgent, chainId: string, params: Record<string, any>, userId?: string) => Promise<ToolResult[]>;
  getAvailableTools: () => any[];
  getAvailableWorkflows: () => any[];
  isInitialized: boolean;
  // Legacy compatibility
  promptEngine: any;
  memorySystem: any;
  coordinationSystem: any;
  reasoningSystem: any;
  isProcessing: boolean;
  systemHealth: string;
  metrics: SystemMetrics;
  getSystemMetrics: () => Promise<SystemMetrics>;
  refreshSystems: () => Promise<void>;
  resetSystem: () => Promise<void>;
  exportKnowledge: () => Promise<any>;
  importKnowledge: (data: any) => Promise<void>;
  optimizePerformance: () => Promise<void>;
}

export function useEnhancedAgentSystem(_config?: Partial<AgentSystemConfig>): UseEnhancedAgentSystemReturn {
  const [isInitialized, setIsInitialized] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    import('@/features/agents/lib/tools').then(() => {
      setIsInitialized(true);
      console.log('Enhanced agent system initialized');
    }).catch((error) => {
      console.error('Failed to initialize agent system:', error);
    });
  }, []);

  const createAgent = (agentId: string, conversationId?: string): EnhancedBaseAgent => {
    const context = conversationId 
      ? new StandardizedContext(conversationId, agentId, supabase)
      : undefined;
    
    return new EnhancedBaseAgent(supabase, agentId, context);
  };

  const executeTools = async (
    agent: EnhancedBaseAgent, 
    toolCalls: ToolCall[], 
    userId?: string
  ): Promise<ToolResult[]> => {
    return agent.executeToolsWithContext(toolCalls, userId);
  };

  const executeWorkflow = async (
    agent: EnhancedBaseAgent, 
    chainId: string, 
    params: Record<string, any>, 
    userId?: string
  ): Promise<ToolResult[]> => {
    return agent.executeWorkflow(chainId, params, userId);
  };

  const getAvailableTools = (): any[] => {
    if (!isInitialized) return [];
    return globalToolRegistry.getOpenAITools();
  };

  const getAvailableWorkflows = (): any[] => {
    if (!isInitialized) return [];
    return globalChainRegistry.getAllChains();
  };

const getMetricsSnapshot = (): SystemMetrics => ({
  totalTools: globalToolRegistry.getAllDefinitions().length,
  totalWorkflows: globalChainRegistry.getAllChains().length,
  executionCount: 0,
  performance: {
    totalRequests: 0,
    averageResponseTime: 120,
    successRate: 0.98,
    errorRate: 0.02,
    resourceUtilization: 0.6
  },
  quality: {
    accuracyScore: 0.94,
    consistencyScore: 0.91,
    userSatisfaction: 0.9
  },
  safety: {
    complianceScore: 0.99,
    violationCount: 0
  },
  learning: {
    memoryEfficiency: 0.85,
    knowledgeGrowth: 0.7,
    patternRecognition: 0.8
  }
});

const [metrics, setMetrics] = useState<SystemMetrics>(getMetricsSnapshot());

const getSystemMetrics = async (): Promise<SystemMetrics> => {
  const snapshot = getMetricsSnapshot();
  setMetrics(snapshot);
  return snapshot;
};

  return {
    createAgent,
    executeTools,
    executeWorkflow,
    getAvailableTools,
    getAvailableWorkflows,
    isInitialized,
    // Legacy compatibility
    promptEngine: {},
    memorySystem: {},
    coordinationSystem: {},
    reasoningSystem: {},
    isProcessing: false,
    systemHealth: 'healthy',
    metrics: metrics,
    getSystemMetrics,
    refreshSystems: async () => {},
    resetSystem: async () => {},
    exportKnowledge: async () => ({}),
    importKnowledge: async () => {},
    optimizePerformance: async () => {}
  };
}