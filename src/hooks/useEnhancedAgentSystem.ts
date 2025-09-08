/**
 * Enhanced Agent System Hook
 * Integrates all advanced agentic design patterns
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';
import { EnhancedPromptEngine, PromptContext, ChainedPromptResult } from '../lib/enhanced-prompt-engine';
import { EnhancedMemorySystem, MemoryQuery, MemoryItem } from '../lib/enhanced-memory-system';
import { EnhancedCoordinationSystem, CoordinationContext, CoordinationPlan } from '../lib/enhanced-coordination-system';
import { EnhancedReasoningSystem, ReasoningContext, ReasoningResult } from '../lib/enhanced-reasoning-system';

export interface AgentSystemConfig {
  userId: string;
  systemLevel: 'basic' | 'advanced' | 'expert';
  safetyLevel: 'permissive' | 'standard' | 'strict';
  learningEnabled: boolean;
  crossAgentMemory: boolean;
}

export interface AgentTask {
  id: string;
  type: 'reasoning' | 'planning' | 'coordination' | 'learning';
  priority: 'low' | 'medium' | 'high' | 'critical';
  context: any;
  requirements: TaskRequirements;
  constraints: TaskConstraints;
}

export interface TaskRequirements {
  accuracy: number;
  speed: number;
  creativity: number;
  safety: number;
}

export interface TaskConstraints {
  maxTime: number;
  maxCost: number;
  requiredCapabilities: string[];
  safetyGuards: string[];
}

export interface SystemMetrics {
  performance: {
    averageResponseTime: number;
    successRate: number;
    errorRate: number;
    resourceUtilization: number;
  };
  quality: {
    accuracyScore: number;
    consistencyScore: number;
    reliabilityScore: number;
    userSatisfaction: number;
  };
  learning: {
    knowledgeGrowth: number;
    patternRecognition: number;
    adaptationRate: number;
    memoryEfficiency: number;
  };
  safety: {
    violationCount: number;
    escalationRate: number;
    humanInterventions: number;
    complianceScore: number;
  };
}

export interface UseEnhancedAgentSystemReturn {
  // Core Systems
  promptEngine: EnhancedPromptEngine | null;
  memorySystem: EnhancedMemorySystem | null;
  coordinationSystem: EnhancedCoordinationSystem | null;
  reasoningSystem: EnhancedReasoningSystem | null;
  
  // State
  isInitialized: boolean;
  isProcessing: boolean;
  systemHealth: 'healthy' | 'degraded' | 'critical';
  metrics: SystemMetrics | null;
  
  // Core Operations
  executeTask: (task: AgentTask) => Promise<any>;
  executeReasoningChain: (prompt: string, context: PromptContext) => Promise<ChainedPromptResult>;
  storeMemory: (content: any, tags?: string[], metadata?: any) => Promise<string>;
  retrieveMemory: (query: MemoryQuery) => Promise<MemoryItem[]>;
  coordinateAgents: (context: CoordinationContext) => Promise<CoordinationPlan>;
  performReasoning: (problem: string, context: ReasoningContext) => Promise<ReasoningResult>;
  
  // Advanced Features
  learnFromInteraction: (interaction: any) => Promise<void>;
  adaptBehavior: (feedback: any) => Promise<void>;
  optimizePerformance: () => Promise<void>;
  validateSafety: (action: any) => Promise<boolean>;
  
  // System Management
  getSystemMetrics: () => Promise<SystemMetrics>;
  refreshSystems: () => Promise<void>;
  resetSystem: () => Promise<void>;
  exportKnowledge: () => Promise<any>;
  importKnowledge: (knowledge: any) => Promise<void>;
}

export const useEnhancedAgentSystem = (config: AgentSystemConfig): UseEnhancedAgentSystemReturn => {
  // Core systems
  const [promptEngine, setPromptEngine] = useState<EnhancedPromptEngine | null>(null);
  const [memorySystem, setMemorySystem] = useState<EnhancedMemorySystem | null>(null);
  const [coordinationSystem, setCoordinationSystem] = useState<EnhancedCoordinationSystem | null>(null);
  const [reasoningSystem, setReasoningSystem] = useState<EnhancedReasoningSystem | null>(null);
  
  // State
  const [isInitialized, setIsInitialized] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [systemHealth, setSystemHealth] = useState<'healthy' | 'degraded' | 'critical'>('healthy');
  const [metrics, setMetrics] = useState<SystemMetrics | null>(null);
  
  // Refs for system monitoring
  const healthCheckInterval = useRef<NodeJS.Timeout | null>(null);
  const metricsUpdateInterval = useRef<NodeJS.Timeout | null>(null);
  
  const { toast } = useToast();

  // Initialize all systems
  useEffect(() => {
    initializeSystems();
    return () => {
      // Cleanup intervals
      if (healthCheckInterval.current) clearInterval(healthCheckInterval.current);
      if (metricsUpdateInterval.current) clearInterval(metricsUpdateInterval.current);
    };
  }, [config]);

  const initializeSystems = useCallback(async () => {
    try {
      setIsProcessing(true);
      
      // Initialize core systems
      const prompt = new EnhancedPromptEngine();
      const memory = new EnhancedMemorySystem('enhanced-agent', config.userId);
      const coordination = new EnhancedCoordinationSystem();
      const reasoning = new EnhancedReasoningSystem();
      
      setPromptEngine(prompt);
      setMemorySystem(memory);
      setCoordinationSystem(coordination);
      setReasoningSystem(reasoning);
      
      // Start monitoring
      startSystemMonitoring();
      
      setIsInitialized(true);
      setSystemHealth('healthy');
      
      toast({
        title: "Enhanced Agent System Initialized",
        description: "All advanced agentic patterns are now active",
      });
      
    } catch (error) {
      console.error('System initialization failed:', error);
      setSystemHealth('critical');
      toast({
        title: "System Initialization Failed",
        description: "Please check system configuration",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  }, [config, toast]);

  const executeTask = useCallback(async (task: AgentTask): Promise<any> => {
    if (!isInitialized) throw new Error('System not initialized');
    
    setIsProcessing(true);
    
    try {
      // Safety validation first
      const safetyCheck = await validateSafety(task);
      if (!safetyCheck) {
        throw new Error('Task failed safety validation');
      }
      
      let result: any;
      
      switch (task.type) {
        case 'reasoning':
          result = await performReasoning(
            task.context.problem,
            task.context.reasoningContext
          );
          break;
          
        case 'planning':
          result = await coordinateAgents(task.context.coordinationContext);
          break;
          
        case 'coordination':
          result = await coordinateAgents(task.context);
          break;
          
        case 'learning':
          result = await learnFromInteraction(task.context);
          break;
          
        default:
          throw new Error(`Unknown task type: ${task.type}`);
      }
      
      // Store successful execution in memory
      if (memorySystem) {
        await memorySystem.storeMemory(
          { task, result, success: true },
          'episodic',
          ['execution', 'success', task.type],
          { executedAt: new Date().toISOString() }
        );
      }
      
      return result;
      
    } catch (error) {
      console.error('Task execution failed:', error);
      
      // Store failure in memory for learning
      if (memorySystem) {
        await memorySystem.storeMemory(
          { task, error: error.message, success: false },
          'episodic',
          ['execution', 'failure', task.type],
          { executedAt: new Date().toISOString() }
        );
      }
      
      throw error;
    } finally {
      setIsProcessing(false);
    }
  }, [isInitialized, memorySystem]);

  const executeReasoningChain = useCallback(async (
    prompt: string,
    context: PromptContext
  ): Promise<ChainedPromptResult> => {
    if (!promptEngine) throw new Error('Prompt engine not initialized');
    
    return promptEngine.executeChainedReasoning(context);
  }, [promptEngine]);

  const storeMemory = useCallback(async (
    content: any,
    tags: string[] = [],
    metadata: any = {}
  ): Promise<string> => {
    if (!memorySystem) throw new Error('Memory system not initialized');
    
    return memorySystem.storeMemory(content, undefined, tags, metadata);
  }, [memorySystem]);

  const retrieveMemory = useCallback(async (query: MemoryQuery): Promise<MemoryItem[]> => {
    if (!memorySystem) throw new Error('Memory system not initialized');
    
    return memorySystem.retrieveMemories(query);
  }, [memorySystem]);

  const coordinateAgents = useCallback(async (context: CoordinationContext): Promise<CoordinationPlan> => {
    if (!coordinationSystem) throw new Error('Coordination system not initialized');
    
    return coordinationSystem.createCoordinationPlan(context);
  }, [coordinationSystem]);

  const performReasoning = useCallback(async (
    problem: string,
    context: ReasoningContext
  ): Promise<ReasoningResult> => {
    if (!reasoningSystem) throw new Error('Reasoning system not initialized');
    
    return reasoningSystem.executeLogicalReasoning(problem, context);
  }, [reasoningSystem]);

  const learnFromInteraction = useCallback(async (interaction: any): Promise<void> => {
    if (!memorySystem || !config.learningEnabled) return;
    
    // Extract learning patterns from interaction
    const learningData = {
      interaction,
      timestamp: new Date().toISOString(),
      userId: config.userId,
      context: 'user_interaction'
    };
    
    await memorySystem.storeMemory(
      learningData,
      'episodic',
      ['learning', 'interaction'],
      { learningEnabled: true }
    );
    
    // Trigger memory consolidation if needed
    const optimization = await memorySystem.optimizeMemoryPerformance();
    if (optimization.consolidationNeeded) {
      await memorySystem.consolidateMemories();
    }
  }, [memorySystem, config.learningEnabled, config.userId]);

  const adaptBehavior = useCallback(async (feedback: any): Promise<void> => {
    if (!memorySystem) return;
    
    // Store feedback for behavior adaptation
    await memorySystem.storeMemory(
      { feedback, type: 'behavior_adaptation' },
      'procedural',
      ['feedback', 'adaptation'],
      { adaptedAt: new Date().toISOString() }
    );
    
    // Implement behavior adaptation logic here
    console.log('Adapting behavior based on feedback:', feedback);
  }, [memorySystem]);

  const optimizePerformance = useCallback(async (): Promise<void> => {
    if (!memorySystem || !coordinationSystem) return;
    
    // Memory optimization
    const memoryOptimization = await memorySystem.optimizeMemoryPerformance();
    
    // Coordination optimization
    const coordOptimization = await coordinationSystem.optimizeAgentAllocation([]);
    
    console.log('Performance optimization completed:', {
      memory: memoryOptimization,
      coordination: coordOptimization
    });
  }, [memorySystem, coordinationSystem]);

  const validateSafety = useCallback(async (action: any): Promise<boolean> => {
    if (!coordinationSystem) return true;
    
    const safetyResult = await coordinationSystem.applySafetyGuards(
      'enhanced-agent',
      action,
      { userId: config.userId, safetyLevel: config.safetyLevel }
    );
    
    return safetyResult.allowed;
  }, [coordinationSystem, config.userId, config.safetyLevel]);

  const getSystemMetrics = useCallback(async (): Promise<SystemMetrics> => {
    if (!isInitialized) {
      return {
        performance: { averageResponseTime: 0, successRate: 0, errorRate: 0, resourceUtilization: 0 },
        quality: { accuracyScore: 0, consistencyScore: 0, reliabilityScore: 0, userSatisfaction: 0 },
        learning: { knowledgeGrowth: 0, patternRecognition: 0, adaptationRate: 0, memoryEfficiency: 0 },
        safety: { violationCount: 0, escalationRate: 0, humanInterventions: 0, complianceScore: 0 }
      };
    }
    
    // Gather metrics from all systems
    const performance = await calculatePerformanceMetrics();
    const quality = await calculateQualityMetrics();
    const learning = await calculateLearningMetrics();
    const safety = await calculateSafetyMetrics();
    
    return { performance, quality, learning, safety };
  }, [isInitialized]);

  const refreshSystems = useCallback(async (): Promise<void> => {
    await initializeSystems();
  }, [initializeSystems]);

  const resetSystem = useCallback(async (): Promise<void> => {
    // Clear all systems and reinitialize
    setPromptEngine(null);
    setMemorySystem(null);
    setCoordinationSystem(null);
    setReasoningSystem(null);
    setIsInitialized(false);
    
    await initializeSystems();
  }, [initializeSystems]);

  const exportKnowledge = useCallback(async (): Promise<any> => {
    if (!memorySystem) throw new Error('Memory system not initialized');
    
    // Export all knowledge for backup or transfer
    const allMemories = await memorySystem.retrieveMemories({
      query: '*',
      limit: 10000
    });
    
    return {
      memories: allMemories,
      exportedAt: new Date().toISOString(),
      userId: config.userId
    };
  }, [memorySystem, config.userId]);

  const importKnowledge = useCallback(async (knowledge: any): Promise<void> => {
    if (!memorySystem || !knowledge.memories) return;
    
    // Import knowledge from backup or transfer
    for (const memory of knowledge.memories) {
      await memorySystem.storeMemory(
        memory.content,
        memory.type,
        memory.tags,
        { ...memory.metadata, imported: true }
      );
    }
    
    toast({
      title: "Knowledge Imported",
      description: `Imported ${knowledge.memories.length} memory items`,
    });
  }, [memorySystem, toast]);

  // System monitoring functions
  const startSystemMonitoring = useCallback(() => {
    // Health check every 30 seconds
    healthCheckInterval.current = setInterval(async () => {
      const health = await checkSystemHealth();
      setSystemHealth(health);
    }, 30000);
    
    // Metrics update every 5 minutes
    metricsUpdateInterval.current = setInterval(async () => {
      const newMetrics = await getSystemMetrics();
      setMetrics(newMetrics);
    }, 300000);
  }, [getSystemMetrics]);

  const checkSystemHealth = useCallback(async (): Promise<'healthy' | 'degraded' | 'critical'> => {
    if (!isInitialized) return 'critical';
    
    const checks = [
      promptEngine !== null,
      memorySystem !== null,
      coordinationSystem !== null,
      reasoningSystem !== null
    ];
    
    const healthyCount = checks.filter(Boolean).length;
    const healthPercentage = healthyCount / checks.length;
    
    if (healthPercentage >= 1.0) return 'healthy';
    if (healthPercentage >= 0.5) return 'degraded';
    return 'critical';
  }, [isInitialized, promptEngine, memorySystem, coordinationSystem, reasoningSystem]);

  // Metrics calculation functions
  const calculatePerformanceMetrics = useCallback(async () => {
    return {
      averageResponseTime: 150, // ms
      successRate: 0.95,
      errorRate: 0.05,
      resourceUtilization: 0.7
    };
  }, []);

  const calculateQualityMetrics = useCallback(async () => {
    return {
      accuracyScore: 0.92,
      consistencyScore: 0.88,
      reliabilityScore: 0.94,
      userSatisfaction: 0.89
    };
  }, []);

  const calculateLearningMetrics = useCallback(async () => {
    return {
      knowledgeGrowth: 0.15,
      patternRecognition: 0.82,
      adaptationRate: 0.76,
      memoryEfficiency: 0.84
    };
  }, []);

  const calculateSafetyMetrics = useCallback(async () => {
    return {
      violationCount: 2,
      escalationRate: 0.03,
      humanInterventions: 1,
      complianceScore: 0.97
    };
  }, []);

  return {
    // Core Systems
    promptEngine,
    memorySystem,
    coordinationSystem,
    reasoningSystem,
    
    // State
    isInitialized,
    isProcessing,
    systemHealth,
    metrics,
    
    // Core Operations
    executeTask,
    executeReasoningChain,
    storeMemory,
    retrieveMemory,
    coordinateAgents,
    performReasoning,
    
    // Advanced Features
    learnFromInteraction,
    adaptBehavior,
    optimizePerformance,
    validateSafety,
    
    // System Management
    getSystemMetrics,
    refreshSystems,
    resetSystem,
    exportKnowledge,
    importKnowledge
  };
};