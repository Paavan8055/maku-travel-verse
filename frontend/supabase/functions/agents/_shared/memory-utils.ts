import { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.53.0';
import { StandardizedContext } from './standardized-context.ts';

export interface AgentHandler {
  (
    userId: string,
    intent: string,
    params: any,
    supabaseClient: SupabaseClient,
    openAiClient: string,
    memory: AgentMemoryManager,
    context?: StandardizedContext
  ): Promise<{
    success: boolean;
    result?: any;
    error?: string;
    memoryUpdates?: Array<{
      key: string;
      data: any;
      expiresAt?: string;
    }>;
    contextUpdates?: {
      sharedData?: Record<string, any>;
      agentContext?: Record<string, any>;
      taskProgress?: { progress: number; status?: string };
    };
  }>;
}

export class AgentMemoryManager {
  constructor(private supabase: SupabaseClient) {}

  async getMemory(agentId: string, userId: string, key: string): Promise<any | null> {
    try {
      const { data, error } = await this.supabase
        .from('agentic_memory')
        .select('memory_data')
        .eq('agent_id', agentId)
        .eq('user_id', userId)
        .eq('memory_key', key)
        .gt('expires_at', new Date().toISOString())
        .single();

      if (error || !data) return null;
      return data.memory_data;
    } catch (error) {
      console.error('Memory retrieval error:', error);
      return null;
    }
  }

  async setMemory(
    agentId: string,
    userId: string,
    key: string,
    data: any,
    sessionId?: string,
    expiresAt?: string
  ): Promise<boolean> {
    try {
      const expires = expiresAt || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
      
      const { error } = await this.supabase
        .from('agentic_memory')
        .upsert({
          agent_id: agentId,
          user_id: userId,
          memory_key: key,
          memory_data: data,
          session_id: sessionId,
          expires_at: expires
        });

      return !error;
    } catch (error) {
      console.error('Memory storage error:', error);
      return false;
    }
  }

  async clearMemory(agentId: string, userId: string, key?: string): Promise<boolean> {
    try {
      let query = this.supabase
        .from('agentic_memory')
        .delete()
        .eq('agent_id', agentId)
        .eq('user_id', userId);

      if (key) {
        query = query.eq('memory_key', key);
      }

      const { error } = await query;
      return !error;
    } catch (error) {
      console.error('Memory cleanup error:', error);
      return false;
    }
  }
}

export class BaseAgent {
  protected agentId: string;
  protected context?: StandardizedContext;
  
  constructor(private supabase: SupabaseClient, agentId: string, context?: StandardizedContext) {
    this.agentId = agentId;
    this.context = context;
  }

  setContext(context: StandardizedContext): void {
    this.context = context;
  }

  getContext(): StandardizedContext | undefined {
    return this.context;
  }

  async getUserPreferences(userId: string): Promise<any> {
    try {
      const { data } = await this.supabase
        .from('profiles')
        .select('travel_preferences, user_preferences')
        .eq('user_id', userId)
        .single();

      return {
        ...data?.travel_preferences,
        ...data?.user_preferences
      };
    } catch (error) {
      console.error('Error fetching user preferences:', error);
      return {};
    }
  }

  async logActivity(userId: string, activityType: string, metadata: any = {}): Promise<void> {
    try {
      await this.supabase
        .from('user_activity_logs')
        .insert({
          user_id: userId,
          activity_type: activityType,
          item_type: this.agentId,
          item_data: metadata,
          session_id: crypto.randomUUID()
        });
    } catch (error) {
      console.error('Activity logging error:', error);
    }
  }

  async createAlert(
    userId: string,
    alertType: string,
    message: string,
    severity: 'low' | 'medium' | 'high' = 'medium',
    metadata: any = {}
  ): Promise<void> {
    try {
      await this.supabase
        .from('critical_alerts')
        .insert({
          alert_type: alertType,
          message,
          severity,
          metadata: {
            ...metadata,
            agent_id: this.agentId,
            user_id: userId
          }
        });
    } catch (error) {
      console.error('Alert creation error:', error);
    }
  }
}

export class StructuredLogger {
  static log(level: 'info' | 'warn' | 'error', message: string, metadata: any = {}) {
    console.log(JSON.stringify({
      timestamp: new Date().toISOString(),
      level,
      message,
      metadata,
      service: 'agentic-system'
    }));
  }

  static info(message: string, metadata: any = {}) {
    this.log('info', message, metadata);
  }

  static warn(message: string, metadata: any = {}) {
    this.log('warn', message, metadata);
  }

  static error(message: string, metadata: any = {}) {
    this.log('error', message, metadata);
  }
}