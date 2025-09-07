import { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.53.0';
import { BaseAgent, AgentMemoryManager } from './memory-utils.ts';

export interface ManagerCapability {
  name: string;
  description: string;
  requiredParams: string[];
  delegateAgents?: string[];
}

export interface ManagerHierarchy {
  tier: 1 | 2 | 3 | 4;
  reportsTo?: string;
  supervises: string[];
}

export class BaseManagerAgent extends BaseAgent {
  protected managerId: string;
  protected capabilities: ManagerCapability[];
  protected hierarchy: ManagerHierarchy;
  
  constructor(
    supabase: SupabaseClient, 
    managerId: string, 
    capabilities: ManagerCapability[],
    hierarchy: ManagerHierarchy
  ) {
    super(supabase, managerId);
    this.managerId = managerId;
    this.capabilities = capabilities;
    this.hierarchy = hierarchy;
  }

  async delegateTask(
    userId: string,
    targetAgentId: string,
    intent: string,
    params: any,
    openAiClient: string,
    memory: AgentMemoryManager
  ): Promise<any> {
    // Log delegation
    await this.logActivity(userId, 'task_delegation', {
      manager_id: this.managerId,
      delegate_to: targetAgentId,
      intent,
      delegated_at: new Date().toISOString()
    });

    // Store delegation context in memory
    await memory.setMemory(this.managerId, userId, `delegation_${targetAgentId}`, {
      delegated_at: new Date().toISOString(),
      intent,
      params,
      status: 'delegated'
    });

    return {
      success: true,
      delegated_to: targetAgentId,
      delegation_id: crypto.randomUUID()
    };
  }

  async coordinateMultiAgentTask(
    userId: string,
    agentIds: string[],
    intent: string,
    params: any,
    openAiClient: string,
    memory: AgentMemoryManager
  ): Promise<any> {
    const coordinationId = crypto.randomUUID();
    
    // Log coordination start
    await this.logActivity(userId, 'multi_agent_coordination', {
      manager_id: this.managerId,
      coordination_id: coordinationId,
      involved_agents: agentIds,
      intent,
      started_at: new Date().toISOString()
    });

    // Store coordination context
    await memory.setMemory(this.managerId, userId, `coordination_${coordinationId}`, {
      agents: agentIds,
      intent,
      params,
      status: 'coordinating',
      started_at: new Date().toISOString()
    });

    return {
      success: true,
      coordination_id: coordinationId,
      agents_involved: agentIds,
      status: 'coordinating'
    };
  }

  async getManagerMetrics(userId: string): Promise<any> {
    try {
      const { data: metrics } = await this.supabase
        .from('agent_performance_metrics')
        .select('*')
        .eq('agent_id', this.managerId)
        .order('metric_date', { ascending: false })
        .limit(30);

      const { data: tasks } = await this.supabase
        .from('agent_task_queue')
        .select('*')
        .eq('agent_id', this.managerId)
        .order('created_at', { ascending: false })
        .limit(100);

      return {
        performance_metrics: metrics || [],
        recent_tasks: tasks || [],
        tier: this.hierarchy.tier,
        supervises: this.hierarchy.supervises,
        capabilities: this.capabilities.map(c => c.name)
      };
    } catch (error) {
      console.error('Error fetching manager metrics:', error);
      return null;
    }
  }

  async escalateToSupervisor(
    userId: string,
    issue: string,
    context: any,
    severity: 'low' | 'medium' | 'high' | 'critical' = 'medium'
  ): Promise<void> {
    if (this.hierarchy.reportsTo) {
      await this.createAlert(
        userId,
        'manager_escalation',
        `Escalation from ${this.managerId}: ${issue}`,
        severity,
        {
          escalated_from: this.managerId,
          escalated_to: this.hierarchy.reportsTo,
          issue,
          context,
          tier: this.hierarchy.tier
        }
      );
    }
  }
}