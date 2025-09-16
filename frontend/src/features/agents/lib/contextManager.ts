import { supabase } from "@/integrations/supabase/client";
import { StandardizedContext } from './standardized-context';
import { EnhancedContextManager } from './enhanced-context-manager';

// Legacy interface - kept for backward compatibility
export interface ConversationContext {
  id: string;
  userId: string;
  sessionId: string;
  agentId: string;
  context: Record<string, any>;
  interactions: ConversationInteraction[];
  userJourney: UserJourneyStep[];
  createdAt: Date;
  updatedAt: Date;
  expiresAt: Date;
}

export interface ConversationInteraction {
  id: string;
  timestamp: Date;
  agentId: string;
  agentType: 'gpt_bot' | 'internal_agent';
  inputData: any;
  outputData: any;
  executionTime: number;
  success: boolean;
  contextUpdates: Record<string, any>;
}

export interface UserJourneyStep {
  id: string;
  timestamp: Date;
  action: string;
  page: string;
  agentInteraction?: string;
  metadata: Record<string, any>;
}

export interface SharedContext {
  key: string;
  value: any;
  sourceAgentId: string;
  targetAgentIds: string[];
  createdAt: Date;
  expiresAt: Date;
  priority: 'low' | 'medium' | 'high' | 'critical';
}

export class ContextManager {
  private conversationContexts: Map<string, ConversationContext> = new Map();
  private sharedContexts: Map<string, SharedContext> = new Map();
  private userJourneys: Map<string, UserJourneyStep[]> = new Map();
  
  // New standardized context manager
  private enhancedManager: EnhancedContextManager;

  async createConversationContext(
    userId: string,
    sessionId: string,
    agentId: string,
    initialContext: Record<string, any> = {}
  ): Promise<string> {
    const contextId = crypto.randomUUID();
    const now = new Date();
    
    const context: ConversationContext = {
      id: contextId,
      userId,
      sessionId,
      agentId,
      context: {
        ...initialContext,
        startTime: now,
        lastActivity: now
      },
      interactions: [],
      userJourney: this.userJourneys.get(userId) || [],
      createdAt: now,
      updatedAt: now,
      expiresAt: new Date(now.getTime() + 24 * 60 * 60 * 1000) // 24 hours
    };

    this.conversationContexts.set(contextId, context);

    // Store in memory only (database table not available in current schema)
    // await supabase
    //   .from('conversation_contexts')
    //   .insert({
    //     id: contextId,
    //     user_id: userId,
    //     session_id: sessionId,
    //     agent_id: agentId,
    //     context_data: context.context,
    //     expires_at: context.expiresAt.toISOString()
    //   });

    return contextId;
  }

  async getConversationContext(contextId: string): Promise<ConversationContext | null> {
    // Check memory first
    let context = this.conversationContexts.get(contextId);
    
    // Use memory-only storage for now
    // if (!context) {
    //   // Database table not available in current schema
    // }

    return context || null;
  }

  async updateConversationContext(
    contextId: string,
    updates: Partial<Record<string, any>>,
    agentId?: string
  ): Promise<void> {
    const context = await this.getConversationContext(contextId);
    if (!context) return;

    // Update context
    Object.assign(context.context, updates);
    context.updatedAt = new Date();
    context.context.lastActivity = context.updatedAt;
    
    if (agentId) {
      context.context.lastAgentId = agentId;
    }

    // Store in memory only (database table not available)
    // await supabase
    //   .from('conversation_contexts')
    //   .update({
    //     context_data: context.context,
    //     updated_at: context.updatedAt.toISOString()
    //   })
    //   .eq('id', contextId);
  }

  async recordInteraction(
    contextId: string,
    agentId: string,
    agentType: 'gpt_bot' | 'internal_agent',
    inputData: any,
    outputData: any,
    executionTime: number,
    success: boolean,
    contextUpdates: Record<string, any> = {}
  ): Promise<void> {
    const context = await this.getConversationContext(contextId);
    if (!context) return;

    const interaction: ConversationInteraction = {
      id: crypto.randomUUID(),
      timestamp: new Date(),
      agentId,
      agentType,
      inputData,
      outputData,
      executionTime,
      success,
      contextUpdates
    };

    context.interactions.push(interaction);
    
    // Keep only last 50 interactions in memory
    if (context.interactions.length > 50) {
      context.interactions = context.interactions.slice(-50);
    }

    // Update context with any changes from the interaction
    await this.updateConversationContext(contextId, contextUpdates, agentId);

    // Store in memory only (database table not available)
    // await supabase
    //   .from('agent_interactions')
    //   .insert({
    //     context_id: contextId,
    //     agent_id: agentId,
    //     agent_type: agentType,
    //     input_data: inputData,
    //     output_data: outputData,
    //     execution_time_ms: executionTime,
    //     success,
    //     context_updates: contextUpdates
    //   });
  }

  async shareContext(
    key: string,
    value: any,
    sourceAgentId: string,
    targetAgentIds: string[],
    priority: 'low' | 'medium' | 'high' | 'critical' = 'medium',
    ttlMinutes: number = 60
  ): Promise<void> {
    const now = new Date();
    const sharedContext: SharedContext = {
      key,
      value,
      sourceAgentId,
      targetAgentIds,
      createdAt: now,
      expiresAt: new Date(now.getTime() + ttlMinutes * 60 * 1000),
      priority
    };

    this.sharedContexts.set(key, sharedContext);

    // Store notifications in memory only (database table not available)
    // for (const targetAgentId of targetAgentIds) {
    //   await supabase
    //     .from('agent_notifications')
    //     .insert({
    //       agent_id: targetAgentId,
    //       notification_type: 'shared_context',
    //       data: {
    //         contextKey: key,
    //         sourceAgent: sourceAgentId,
    //         priority,
    //         expiresAt: sharedContext.expiresAt.toISOString()
    //       }
    //     });
    // }
  }

  getSharedContext(key: string, agentId: string): any {
    const context = this.sharedContexts.get(key);
    
    if (!context || context.expiresAt < new Date()) {
      return null;
    }

    if (!context.targetAgentIds.includes(agentId)) {
      return null;
    }

    return context.value;
  }

  async trackUserJourney(
    userId: string,
    action: string,
    page: string,
    agentInteraction?: string,
    metadata: Record<string, any> = {}
  ): Promise<void> {
    const step: UserJourneyStep = {
      id: crypto.randomUUID(),
      timestamp: new Date(),
      action,
      page,
      agentInteraction,
      metadata
    };

    const journey = this.userJourneys.get(userId) || [];
    journey.push(step);
    
    // Keep only last 100 steps
    if (journey.length > 100) {
      journey.splice(0, journey.length - 100);
    }
    
    this.userJourneys.set(userId, journey);

    // Store in memory only (database table not available)
    // await supabase
    //   .from('user_journey_steps')
    //   .insert({
    //     user_id: userId,
    //     action,
    //     page,
    //     agent_interaction: agentInteraction,
    //     metadata
    //   });
  }

  getUserJourney(userId: string): UserJourneyStep[] {
    return this.userJourneys.get(userId) || [];
  }

  async getContextualRecommendations(
    userId: string,
    currentContext: Record<string, any>
  ): Promise<string[]> {
    const journey = this.getUserJourney(userId);
    const recommendations: string[] = [];

    // Analyze user patterns
    const recentPages = journey.slice(-10).map(step => step.page);
    const commonActions = journey.slice(-20).map(step => step.action);

    // Simple pattern recognition
    if (recentPages.includes('booking-search') && recentPages.includes('hotel-details')) {
      recommendations.push('Consider offering travel insurance');
      recommendations.push('Suggest similar properties');
    }

    if (commonActions.filter(a => a === 'support-query').length > 2) {
      recommendations.push('Escalate to human agent');
      recommendations.push('Offer callback service');
    }

    if (currentContext.bookingValue > 1000) {
      recommendations.push('Offer VIP treatment');
      recommendations.push('Suggest loyalty program enrollment');
    }

    return recommendations;
  }

  async cleanupExpiredContexts(): Promise<void> {
    const now = new Date();
    
    // Clean up memory
    for (const [id, context] of this.conversationContexts) {
      if (context.expiresAt < now) {
        this.conversationContexts.delete(id);
      }
    }

    for (const [key, context] of this.sharedContexts) {
      if (context.expiresAt < now) {
        this.sharedContexts.delete(key);
      }
    }

    // Database cleanup not available (table doesn't exist)
    // await supabase
    //   .from('conversation_contexts')
    //   .delete()
    //   .lt('expires_at', now.toISOString());
  }

  // Start background cleanup
  private cleanupInterval = setInterval(() => {
    this.cleanupExpiredContexts().catch(console.error);
  }, 5 * 60 * 1000); // Every 5 minutes

  // New standardized context methods
  constructor() {
    this.enhancedManager = new EnhancedContextManager(supabase);
  }

  async createStandardizedContext(
    agentId: string,
    agentType: string,
    userId?: string,
    sessionId?: string
  ): Promise<StandardizedContext> {
    const actualSessionId = sessionId || await this.enhancedManager.createSession(userId);
    return this.enhancedManager.createContext(actualSessionId, agentId, agentType, userId);
  }

  async getStandardizedContext(sessionId: string, agentId: string): Promise<StandardizedContext | null> {
    return this.enhancedManager.getContext(sessionId, agentId);
  }

  async handoffStandardizedContext(
    sessionId: string,
    sourceAgentId: string,
    targetAgentId: string,
    reason: string,
    preserveHistory: boolean = true
  ): Promise<StandardizedContext> {
    return this.enhancedManager.handoffContext(sessionId, {
      sourceAgentId,
      targetAgentId,
      reason,
      preserveHistory
    });
  }

  getEnhancedManager(): EnhancedContextManager {
    return this.enhancedManager;
  }

  destroy(): void {
    clearInterval(this.cleanupInterval);
    this.enhancedManager.destroy();
  }
}

export const contextManager = new ContextManager();
