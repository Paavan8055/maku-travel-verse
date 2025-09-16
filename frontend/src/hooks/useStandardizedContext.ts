import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { StandardizedContext } from '@/features/agents/lib/standardized-context';
import { EnhancedContextManager } from '@/features/agents/lib/enhanced-context-manager';
import { toast } from 'sonner';

interface UseStandardizedContextOptions {
  agentId: string;
  agentType: string;
  userId?: string;
  sessionId?: string;
  autoSave?: boolean;
}

interface UseStandardizedContextReturn {
  context: StandardizedContext | null;
  contextManager: EnhancedContextManager;
  isLoading: boolean;
  error: string | null;
  
  // Context operations
  addUserMessage: (content: string, metadata?: Record<string, any>) => Promise<string>;
  addAssistantMessage: (content: string, metadata?: Record<string, any>) => Promise<string>;
  addToolResult: (toolCallId: string, result: any, success?: boolean, error?: string) => Promise<string>;
  
  // Context data
  setSharedData: (key: string, value: any) => void;
  getSharedData: (key: string) => any;
  setAgentContext: (key: string, value: any) => void;
  getAgentContext: (key: string) => any;
  
  // Task management
  setCurrentTask: (task: any) => void;
  updateTaskProgress: (progress: number, status?: string) => void;
  
  // Travel context
  setTravelContext: (context: any) => void;
  getTravelContext: () => any;
  
  // Context sharing and handoff
  handoffTo: (targetAgentId: string, reason: string, preserveHistory?: boolean) => Promise<StandardizedContext>;
  shareWith: (targetAgentId: string, keys?: string[]) => Promise<void>;
  
  // Persistence
  save: () => Promise<void>;
  refresh: () => Promise<void>;
}

export function useStandardizedContext(
  options: UseStandardizedContextOptions
): UseStandardizedContextReturn {
  const [context, setContext] = useState<StandardizedContext | null>(null);
  const [contextManager] = useState(() => new EnhancedContextManager(supabase));
  const [sessionId, setSessionId] = useState<string | null>(options.sessionId || null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Initialize context
  const initializeContext = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Create or get session
      const currentSessionId = await contextManager.getOrCreateSession(
        sessionId || undefined, 
        options.userId
      );
      setSessionId(currentSessionId);

      // Load existing context or create new one
      let existingContext = contextManager.getContext(currentSessionId, options.agentId);
      
      if (!existingContext) {
        existingContext = await contextManager.createContext(
          currentSessionId,
          options.agentId,
          options.agentType,
          options.userId
        );
      }

      setContext(existingContext);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to initialize context';
      setError(errorMsg);
      toast.error('Context initialization failed', {
        description: errorMsg
      });
    } finally {
      setIsLoading(false);
    }
  }, [contextManager, sessionId, options.agentId, options.agentType, options.userId]);

  useEffect(() => {
    initializeContext();
  }, [initializeContext]);

  // Auto-save context if enabled
  useEffect(() => {
    if (!options.autoSave || !context) return;

    const interval = setInterval(async () => {
      try {
        await context.save();
      } catch (err) {
        console.error('Auto-save failed:', err);
      }
    }, 30000); // Save every 30 seconds

    return () => clearInterval(interval);
  }, [context, options.autoSave]);

  // Context operations
  const addUserMessage = useCallback(async (content: string, metadata?: Record<string, any>) => {
    if (!context) throw new Error('Context not initialized');
    const messageId = context.addUserMessage(content, metadata);
    if (options.autoSave) await context.save();
    return messageId;
  }, [context, options.autoSave]);

  const addAssistantMessage = useCallback(async (content: string, metadata?: Record<string, any>) => {
    if (!context) throw new Error('Context not initialized');
    const messageId = context.addAssistantMessage(content, undefined, metadata);
    if (options.autoSave) await context.save();
    return messageId;
  }, [context, options.autoSave]);

  const addToolResult = useCallback(async (toolCallId: string, result: any, success = true, error?: string) => {
    if (!context) throw new Error('Context not initialized');
    const messageId = context.addToolResult(toolCallId, result, success, error);
    if (options.autoSave) await context.save();
    return messageId;
  }, [context, options.autoSave]);

  // Context data operations
  const setSharedData = useCallback((key: string, value: any) => {
    if (!context) return;
    context.setSharedData(key, value);
  }, [context]);

  const getSharedData = useCallback((key: string) => {
    if (!context) return undefined;
    return context.getSharedData(key);
  }, [context]);

  const setAgentContext = useCallback((key: string, value: any) => {
    if (!context) return;
    context.setAgentContext(key, value);
  }, [context]);

  const getAgentContext = useCallback((key: string) => {
    if (!context) return undefined;
    return context.getAgentContext(key);
  }, [context]);

  // Task management
  const setCurrentTask = useCallback((task: any) => {
    if (!context) return;
    context.setCurrentTask(task);
  }, [context]);

  const updateTaskProgress = useCallback((progress: number, status?: string) => {
    if (!context) return;
    context.updateTaskProgress(progress, status);
  }, [context]);

  // Travel context
  const setTravelContext = useCallback((travelContext: any) => {
    if (!context) return;
    context.setTravelContext(travelContext);
  }, [context]);

  const getTravelContext = useCallback(() => {
    if (!context) return {};
    return context.getTravelContext();
  }, [context]);

  // Context sharing and handoff
  const handoffTo = useCallback(async (targetAgentId: string, reason: string, preserveHistory = true) => {
    if (!context || !sessionId) throw new Error('Context not initialized');
    
    const targetContext = await contextManager.handoffContext(sessionId, {
      sourceAgentId: options.agentId,
      targetAgentId,
      reason,
      preserveHistory
    });

    toast.success(`Context handed off to ${targetAgentId}`, {
      description: reason
    });

    return targetContext;
  }, [context, contextManager, sessionId, options.agentId]);

  const shareWith = useCallback(async (targetAgentId: string, keys?: string[]) => {
    if (!context) throw new Error('Context not initialized');
    await context.shareContext(targetAgentId, keys);
    
    toast.success(`Context shared with ${targetAgentId}`);
  }, [context]);

  // Persistence
  const save = useCallback(async () => {
    if (!context) throw new Error('Context not initialized');
    await context.save();
  }, [context]);

  const refresh = useCallback(async () => {
    await initializeContext();
  }, [initializeContext]);

  return {
    context,
    contextManager,
    isLoading,
    error,
    
    // Operations
    addUserMessage,
    addAssistantMessage,
    addToolResult,
    
    // Data
    setSharedData,
    getSharedData,
    setAgentContext,
    getAgentContext,
    
    // Tasks
    setCurrentTask,
    updateTaskProgress,
    
    // Travel
    setTravelContext,
    getTravelContext,
    
    // Sharing
    handoffTo,
    shareWith,
    
    // Persistence
    save,
    refresh
  };
}