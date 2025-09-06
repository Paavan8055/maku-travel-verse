// Memory utilities for agent context management
export interface AgentMemory {
  id?: string;
  agentId: string;
  userId: string;
  sessionId?: string;
  memoryKey: string;
  memoryData: any;
  expiresAt?: string;
}

export class AgentMemoryManager {
  constructor(private supabaseClient: any) {}

  async getMemory(agentId: string, userId: string, memoryKey: string): Promise<any> {
    const { data, error } = await this.supabaseClient
      .from('agentic_memory')
      .select('memory_data')
      .eq('agent_id', agentId)
      .eq('user_id', userId)
      .eq('memory_key', memoryKey)
      .maybeSingle();

    if (error) {
      console.error('Error fetching agent memory:', error);
      return null;
    }

    return data?.memory_data || null;
  }

  async setMemory(
    agentId: string, 
    userId: string, 
    memoryKey: string, 
    memoryData: any,
    sessionId?: string,
    expiresAt?: string
  ): Promise<boolean> {
    const { error } = await this.supabaseClient
      .from('agentic_memory')
      .upsert({
        agent_id: agentId,
        user_id: userId,
        session_id: sessionId,
        memory_key: memoryKey,
        memory_data: memoryData,
        expires_at: expiresAt,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'agent_id,user_id,memory_key'
      });

    if (error) {
      console.error('Error setting agent memory:', error);
      return false;
    }

    return true;
  }

  async clearMemory(agentId: string, userId: string, memoryKey?: string): Promise<boolean> {
    let query = this.supabaseClient
      .from('agentic_memory')
      .delete()
      .eq('agent_id', agentId)
      .eq('user_id', userId);

    if (memoryKey) {
      query = query.eq('memory_key', memoryKey);
    }

    const { error } = await query;

    if (error) {
      console.error('Error clearing agent memory:', error);
      return false;
    }

    return true;
  }

  async getSessionMemory(agentId: string, sessionId: string): Promise<any[]> {
    const { data, error } = await this.supabaseClient
      .from('agentic_memory')
      .select('*')
      .eq('agent_id', agentId)
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching session memory:', error);
      return [];
    }

    return data || [];
  }
}

// Agent handler interface
export interface AgentHandler {
  (
    userId: string,
    intent: string,
    params: any,
    supabaseClient: any,
    openAiClient?: any,
    memory?: AgentMemoryManager
  ): Promise<{
    success: boolean;
    result?: any;
    error?: string;
    memoryUpdates?: { key: string; data: any; expiresAt?: string }[];
  }>;
}

// Base agent class for common functionality
export class BaseAgent {
  protected memory: AgentMemoryManager;

  constructor(protected supabaseClient: any, protected agentId: string) {
    this.memory = new AgentMemoryManager(supabaseClient);
  }

  protected async getUserPreferences(userId: string): Promise<any> {
    const { data } = await this.supabaseClient
      .from('communication_preferences')
      .select('preferences')
      .eq('user_id', userId)
      .maybeSingle();

    return data?.preferences || {};
  }

  protected async logActivity(userId: string, action: string, details: any): Promise<void> {
    await this.supabaseClient
      .from('user_activity_logs')
      .insert({
        user_id: userId,
        activity_type: 'agent_action',
        item_type: this.agentId,
        item_id: action,
        item_data: details,
        session_id: crypto.randomUUID()
      });
  }

  protected generateSessionId(): string {
    return `${this.agentId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}