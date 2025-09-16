import { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.53.0';

// OpenAI-style Context Management for Edge Functions
export interface ContextMessage {
  id: string;
  role: 'user' | 'assistant' | 'system' | 'tool';
  content: string;
  timestamp: Date;
  metadata?: Record<string, any>;
  toolCalls?: ToolCall[];
  toolResults?: ToolResult[];
}

export interface ToolCall {
  id: string;
  name: string;
  parameters: Record<string, any>;
}

export interface ToolResult {
  id: string;
  toolCallId: string;
  result: any;
  success: boolean;
  error?: string;
}

export interface ContextState {
  conversationId: string;
  userId?: string;
  sessionId: string;
  agentId: string;
  
  // Core conversation data
  messages: ContextMessage[];
  
  // Shared context between agents
  sharedData: Record<string, any>;
  
  // Agent-specific context
  agentContext: Record<string, any>;
  
  // User preferences and profile
  userProfile: Record<string, any>;
  
  // Current task/intent context
  currentTask?: {
    type: string;
    parameters: Record<string, any>;
    progress?: number;
    status?: 'pending' | 'active' | 'completed' | 'failed';
  };
  
  // Travel-specific context
  travelContext?: {
    searchHistory?: any[];
    bookingHistory?: any[];
    preferences?: any;
    currentSearch?: any;
  };
  
  metadata: {
    createdAt: Date;
    updatedAt: Date;
    expiresAt?: Date;
    version: number;
  };
}

export class StandardizedContext {
  private state: ContextState;
  private supabase: SupabaseClient;
  private isDirty: boolean = false;

  constructor(
    conversationId: string,
    agentId: string,
    supabase: SupabaseClient,
    initialState?: Partial<ContextState>
  ) {
    this.supabase = supabase;
    this.state = {
      conversationId,
      agentId,
      sessionId: crypto.randomUUID(),
      messages: [],
      sharedData: {},
      agentContext: {},
      userProfile: {},
      metadata: {
        createdAt: new Date(),
        updatedAt: new Date(),
        version: 1
      },
      ...initialState
    };
  }

  // Message management following OpenAI patterns
  addMessage(message: Omit<ContextMessage, 'id' | 'timestamp'>): string {
    const id = crypto.randomUUID();
    const contextMessage: ContextMessage = {
      id,
      timestamp: new Date(),
      ...message
    };
    
    this.state.messages.push(contextMessage);
    this.markDirty();
    return id;
  }

  addUserMessage(content: string, metadata?: Record<string, any>): string {
    return this.addMessage({
      role: 'user',
      content,
      metadata
    });
  }

  addAssistantMessage(content: string, toolCalls?: ToolCall[], metadata?: Record<string, any>): string {
    return this.addMessage({
      role: 'assistant',
      content,
      toolCalls,
      metadata
    });
  }

  addToolResult(toolCallId: string, result: any, success: boolean = true, error?: string): string {
    const toolResult: ToolResult = {
      id: crypto.randomUUID(),
      toolCallId,
      result,
      success,
      error
    };

    return this.addMessage({
      role: 'tool',
      content: success ? JSON.stringify(result) : `Error: ${error}`,
      toolResults: [toolResult]
    });
  }

  getMessages(): ContextMessage[] {
    return [...this.state.messages];
  }

  getMessagesForLLM(): Array<{role: string; content: string}> {
    return this.state.messages.map(msg => ({
      role: msg.role,
      content: msg.content
    }));
  }

  // Context data management
  setSharedData(key: string, value: any): void {
    this.state.sharedData[key] = value;
    this.markDirty();
  }

  getSharedData(key: string): any {
    return this.state.sharedData[key];
  }

  setAgentContext(key: string, value: any): void {
    this.state.agentContext[key] = value;
    this.markDirty();
  }

  getAgentContext(key: string): any {
    return this.state.agentContext[key];
  }

  setUserProfile(profile: Record<string, any>): void {
    this.state.userProfile = { ...this.state.userProfile, ...profile };
    this.markDirty();
  }

  getUserProfile(): Record<string, any> {
    return { ...this.state.userProfile };
  }

  // Task management
  setCurrentTask(task: ContextState['currentTask']): void {
    this.state.currentTask = task;
    this.markDirty();
  }

  getCurrentTask(): ContextState['currentTask'] {
    return this.state.currentTask;
  }

  updateTaskProgress(progress: number, status?: string): void {
    if (this.state.currentTask) {
      this.state.currentTask.progress = progress;
      if (status) this.state.currentTask.status = status as any;
      this.markDirty();
    }
  }

  // Travel-specific context
  setTravelContext(context: Partial<NonNullable<ContextState['travelContext']>>): void {
    this.state.travelContext = { 
      ...this.state.travelContext, 
      ...context 
    };
    this.markDirty();
  }

  getTravelContext(): NonNullable<ContextState['travelContext']> {
    return this.state.travelContext || {};
  }

  // Context sharing and handoff
  async shareContext(targetAgentId: string, keys?: string[]): Promise<void> {
    const sharedContext = keys 
      ? Object.fromEntries(keys.map(key => [key, this.state.sharedData[key]]))
      : this.state.sharedData;

    await this.supabase
      .from('agent_context_memory')
      .upsert({
        agent_id: targetAgentId,
        user_id: this.state.userId,
        session_id: this.state.sessionId,
        context_type: 'shared_handoff',
        context_data: {
          sourceAgentId: this.state.agentId,
          sharedContext,
          handoffTimestamp: new Date().toISOString(),
          conversationId: this.state.conversationId
        }
      });
  }

  async receiveSharedContext(sourceAgentId: string): Promise<void> {
    const { data } = await this.supabase
      .from('agent_context_memory')
      .select('context_data')
      .eq('agent_id', this.state.agentId)
      .eq('user_id', this.state.userId)
      .eq('context_type', 'shared_handoff')
      .order('created_at', { ascending: false })
      .limit(1);

    if (data && data[0]) {
      const { sharedContext } = data[0].context_data;
      this.state.sharedData = { ...this.state.sharedData, ...sharedContext };
      this.markDirty();
    }
  }

  // Persistence
  private markDirty(): void {
    this.isDirty = true;
    this.state.metadata.updatedAt = new Date();
    this.state.metadata.version++;
  }

  async save(): Promise<void> {
    if (!this.isDirty) return;

    await this.supabase
      .from('agent_context_memory')
      .upsert({
        agent_id: this.state.agentId,
        user_id: this.state.userId,
        session_id: this.state.sessionId,
        context_type: 'conversation_state',
        context_data: this.state,
        expires_at: this.state.metadata.expiresAt?.toISOString()
      });

    this.isDirty = false;
  }

  async load(): Promise<boolean> {
    const { data } = await this.supabase
      .from('agent_context_memory')
      .select('context_data')
      .eq('agent_id', this.state.agentId)
      .eq('user_id', this.state.userId)
      .eq('session_id', this.state.sessionId)
      .eq('context_type', 'conversation_state')
      .order('created_at', { ascending: false })
      .limit(1);

    if (data && data[0]) {
      this.state = {
        ...data[0].context_data,
        metadata: {
          ...data[0].context_data.metadata,
          createdAt: new Date(data[0].context_data.metadata.createdAt),
          updatedAt: new Date(data[0].context_data.metadata.updatedAt),
          expiresAt: data[0].context_data.metadata.expiresAt 
            ? new Date(data[0].context_data.metadata.expiresAt)
            : undefined
        }
      };
      this.isDirty = false;
      return true;
    }
    return false;
  }

  // Context serialization for handoffs
  serialize(): string {
    return JSON.stringify(this.state);
  }

  static deserialize(serialized: string, supabase: SupabaseClient): StandardizedContext {
    const state = JSON.parse(serialized);
    const context = new StandardizedContext(
      state.conversationId,
      state.agentId,
      supabase,
      state
    );
    return context;
  }

  // Utility methods
  getState(): Readonly<ContextState> {
    return Object.freeze({ ...this.state });
  }

  clone(): StandardizedContext {
    const cloned = new StandardizedContext(
      this.state.conversationId,
      this.state.agentId,
      this.supabase,
      JSON.parse(JSON.stringify(this.state))
    );
    return cloned;
  }
}