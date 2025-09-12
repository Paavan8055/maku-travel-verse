import { SupabaseClient } from '@supabase/supabase-js';
import { StandardizedContext } from './standardized-context';
import { ContextBuilderFactory, ContextBuilderConfig } from './context-builders';

export interface ContextHandoffRequest {
  sourceAgentId: string;
  targetAgentId: string;
  reason: string;
  preserveHistory: boolean;
  sharedKeys?: string[];
  metadata?: Record<string, any>;
}

export interface ContextSession {
  sessionId: string;
  userId?: string;
  contexts: Map<string, StandardizedContext>;
  activeAgentId?: string;
  createdAt: Date;
  lastActivity: Date;
}

export class EnhancedContextManager {
  private supabase: SupabaseClient;
  private sessions: Map<string, ContextSession> = new Map();
  private autoSaveInterval: number = 30000; // 30 seconds
  private sessionTimeout: number = 3600000; // 1 hour
  private cleanupInterval: NodeJS.Timeout;

  constructor(supabase: SupabaseClient) {
    this.supabase = supabase;
    this.startPeriodicCleanup();
  }

  // Session management
  async createSession(userId?: string): Promise<string> {
    const sessionId = crypto.randomUUID();
    const session: ContextSession = {
      sessionId,
      userId,
      contexts: new Map(),
      createdAt: new Date(),
      lastActivity: new Date()
    };

    this.sessions.set(sessionId, session);
    return sessionId;
  }

  async getOrCreateSession(sessionId?: string, userId?: string): Promise<string> {
    if (sessionId && this.sessions.has(sessionId)) {
      const session = this.sessions.get(sessionId)!;
      session.lastActivity = new Date();
      return sessionId;
    }
    return this.createSession(userId);
  }

  // Context creation with builders
  async createContext(
    sessionId: string,
    agentId: string,
    agentType: string,
    userId?: string
  ): Promise<StandardizedContext> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }

    const conversationId = crypto.randomUUID();
    const config: ContextBuilderConfig = {
      conversationId,
      agentId,
      userId: userId || session.userId,
      supabase: this.supabase
    };

    const builder = ContextBuilderFactory.create(agentType, config);
    const context = await builder.build();

    // Try to load existing context
    await context.load();

    session.contexts.set(agentId, context);
    session.lastActivity = new Date();

    // Auto-save context periodically
    this.scheduleAutoSave(context);

    return context;
  }

  // Context retrieval
  getContext(sessionId: string, agentId: string): StandardizedContext | null {
    const session = this.sessions.get(sessionId);
    if (!session) return null;

    session.lastActivity = new Date();
    return session.contexts.get(agentId) || null;
  }

  // Agent handoff implementation
  async handoffContext(
    sessionId: string,
    request: ContextHandoffRequest
  ): Promise<StandardizedContext> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }

    const sourceContext = session.contexts.get(request.sourceAgentId);
    if (!sourceContext) {
      throw new Error(`Source context for agent ${request.sourceAgentId} not found`);
    }

    // Create or get target context
    let targetContext = session.contexts.get(request.targetAgentId);
    if (!targetContext) {
      // Determine agent type from agent ID or use general
      const agentType = this.inferAgentType(request.targetAgentId);
      targetContext = await this.createContext(
        sessionId,
        request.targetAgentId,
        agentType,
        session.userId
      );
    }

    // Share context data
    if (request.sharedKeys) {
      await sourceContext.shareContext(request.targetAgentId, request.sharedKeys);
    } else {
      await sourceContext.shareContext(request.targetAgentId);
    }

    // Receive shared context in target
    await targetContext.receiveSharedContext(request.sourceAgentId);

    // Preserve conversation history if requested
    if (request.preserveHistory) {
      const sourceMessages = sourceContext.getMessages();
      // Add handoff message to target context
      targetContext.addMessage({
        role: 'system',
        content: `Context handed off from ${request.sourceAgentId}. Reason: ${request.reason}`,
        metadata: {
          handoff: true,
          sourceAgent: request.sourceAgentId,
          reason: request.reason,
          timestamp: new Date().toISOString(),
          ...request.metadata
        }
      });

      // Optionally include recent messages
      const recentMessages = sourceMessages.slice(-5); // Last 5 messages
      recentMessages.forEach(msg => {
        if (msg.role !== 'system') {
          targetContext!.addMessage({
            ...msg,
            metadata: {
              ...msg.metadata,
              transferredFrom: request.sourceAgentId
            }
          });
        }
      });
    }

    // Log the handoff
    await this.logHandoff(sessionId, request);

    // Update active agent
    session.activeAgentId = request.targetAgentId;
    session.lastActivity = new Date();

    // Save both contexts
    await Promise.all([
      sourceContext.save(),
      targetContext.save()
    ]);

    return targetContext;
  }

  // Context collaboration - multiple agents working together
  async createCollaborativeContext(
    sessionId: string,
    agentIds: string[],
    coordinatorAgentId: string
  ): Promise<StandardizedContext> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }

    const coordinatorContext = session.contexts.get(coordinatorAgentId);
    if (!coordinatorContext) {
      throw new Error(`Coordinator context not found`);
    }

    // Set up collaborative context
    coordinatorContext.setSharedData('collaborativeMode', true);
    coordinatorContext.setSharedData('collaboratingAgents', agentIds);
    coordinatorContext.setSharedData('coordinator', coordinatorAgentId);

    // Share context with all collaborating agents
    for (const agentId of agentIds) {
      if (agentId !== coordinatorAgentId) {
        await coordinatorContext.shareContext(agentId, ['collaborativeMode', 'collaboratingAgents']);
      }
    }

    return coordinatorContext;
  }

  // Context persistence and recovery
  async saveAllContexts(sessionId: string): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (!session) return;

    const savePromises = Array.from(session.contexts.values()).map(context => context.save());
    await Promise.all(savePromises);
  }

  async loadSessionContexts(sessionId: string, userId?: string): Promise<void> {
    const { data } = await this.supabase
      .from('agent_context_memory')
      .select('agent_id, context_data')
      .eq('session_id', sessionId)
      .eq('user_id', userId)
      .eq('context_type', 'conversation_state');

    if (!data) return;

    const session = this.sessions.get(sessionId);
    if (!session) return;

    for (const record of data) {
      try {
        const context = StandardizedContext.deserialize(
          JSON.stringify(record.context_data),
          this.supabase
        );
        session.contexts.set(record.agent_id, context);
      } catch (error) {
        console.error(`Failed to deserialize context for agent ${record.agent_id}:`, error);
      }
    }
  }

  // Utility methods
  private inferAgentType(agentId: string): string {
    const agentTypeMappings: Record<string, string> = {
      'flight': 'travel',
      'hotel': 'travel', 
      'activity': 'travel',
      'travel': 'travel',
      'loyalty': 'loyalty',
      'admin': 'admin',
      'system': 'admin',
      'general': 'general'
    };

    for (const [key, type] of Object.entries(agentTypeMappings)) {
      if (agentId.toLowerCase().includes(key)) {
        return type;
      }
    }
    return 'general';
  }

  private scheduleAutoSave(context: StandardizedContext): void {
    setInterval(async () => {
      try {
        await context.save();
      } catch (error) {
        console.error('Auto-save failed:', error);
      }
    }, this.autoSaveInterval);
  }

  private async logHandoff(sessionId: string, request: ContextHandoffRequest): Promise<void> {
    try {
      await this.supabase
        .from('agent_audit_logs')
        .insert({
          agent_id: request.targetAgentId,
          action_type: 'context_handoff',
          action_description: `Context handed off from ${request.sourceAgentId} to ${request.targetAgentId}`,
          resource_type: 'context',
          resource_id: sessionId,
          session_id: sessionId,
          old_values: { sourceAgent: request.sourceAgentId },
          new_values: { 
            targetAgent: request.targetAgentId,
            reason: request.reason,
            preserveHistory: request.preserveHistory
          }
        });
    } catch (error) {
      console.error('Failed to log handoff:', error);
    }
  }

  private startPeriodicCleanup(): void {
    this.cleanupInterval = setInterval(() => {
      this.cleanupExpiredSessions();
    }, 300000); // Clean up every 5 minutes
  }

  private cleanupExpiredSessions(): void {
    const now = new Date();
    for (const [sessionId, session] of this.sessions.entries()) {
      if (now.getTime() - session.lastActivity.getTime() > this.sessionTimeout) {
        // Auto-save before cleanup
        this.saveAllContexts(sessionId).then(() => {
          this.sessions.delete(sessionId);
        });
      }
    }
  }

  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
  }
}