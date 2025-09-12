import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { EnhancedBaseAgent } from '@/features/agents/lib/enhanced-base-agent';
import { StandardizedContext } from '@/features/agents/lib/standardized-context';
import { ToolCall, ToolResult } from '@/features/agents/lib/tools/types';
import { globalToolRegistry, globalChainRegistry } from '@/features/agents/lib/tools';

export interface AgentSystemConfig {
  toolsEnabled: boolean;
  workflowsEnabled: boolean;
  userId?: string;
}

export interface SystemMetrics {
  totalTools: number;
  totalWorkflows: number;
  executionCount: number;
  performance: {
    totalRequests: number;
    avgResponseTime: number;
    successRate: number;
    errorRate: number;
  };
  quality: {
    accuracy: number;
    relevance: number;
    completeness: number;
    consistency: number;
  };
  safety: {
    violations: number;
  };
  learning: {
    dataPoints: number;
    improvements: number;
    adaptations: number;
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
  getSystemMetrics: () => SystemMetrics;
  refreshSystems: () => Promise<void>;
  resetSystem: () => Promise<void>;
  exportKnowledge: () => Promise<any>;
  importKnowledge: (data: any) => Promise<void>;
  optimizePerformance: () => Promise<void>;
}

export function useEnhancedAgentSystem(): UseEnhancedAgentSystemReturn {
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

  const getSystemMetrics = (): SystemMetrics => ({
    totalTools: globalToolRegistry.getAllDefinitions().length,
    totalWorkflows: globalChainRegistry.getAllChains().length,
    executionCount: 0,
    performance: {
      totalRequests: 0,
      avgResponseTime: 0,
      successRate: 100,
      errorRate: 0
    },
    quality: {
      accuracy: 95,
      relevance: 90,
      completeness: 85,
      consistency: 88
    },
    safety: {
      violations: 0
    },
    learning: {
      dataPoints: 0,
      improvements: 0,
      adaptations: 0
    }
  });

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
    metrics: getSystemMetrics(),
    getSystemMetrics,
    refreshSystems: async () => {},
    resetSystem: async () => {},
    exportKnowledge: async () => ({}),
    importKnowledge: async () => {},
    optimizePerformance: async () => {}
  };
}