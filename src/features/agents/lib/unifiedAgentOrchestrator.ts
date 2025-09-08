import { supabase } from "@/integrations/supabase/client";

export interface AgentTask {
  id: string;
  type: 'gpt_bot' | 'internal_agent';
  agentId: string;
  intent: string;
  params: Record<string, any>;
  priority: number;
  complexity: 'low' | 'medium' | 'high';
  userId?: string;
  sessionId?: string;
}

export interface AgentCapability {
  name: string;
  description: string;
  complexity_threshold: 'low' | 'medium' | 'high';
  preferred_model?: string;
}

export interface UnifiedAgent {
  id: string;
  type: 'gpt_bot' | 'internal_agent';
  name: string;
  tier: number;
  category: string;
  status: 'active' | 'inactive' | 'busy';
  capabilities: AgentCapability[];
  performance_metrics: {
    success_rate: number;
    avg_response_time: number;
    cost_per_task: number;
  };
}

export class UnifiedAgentOrchestrator {
  private agents: Map<string, UnifiedAgent> = new Map();

  constructor(apiKey?: string) {
    // API key stored for future use if needed
  }

  async initialize() {
    await this.loadAgents();
  }

  private async loadAgents() {
    // Load GPT bots
    const { data: gptBots } = await supabase
      .from('gpt_bot_registry')
      .select('*');

    // Load internal agents
    const { data: internalAgents } = await supabase
      .from('agent_management')
      .select('*');

    // Unify agent representation
    gptBots?.forEach(bot => {
      const capabilities: AgentCapability[] = [];
      this.agents.set(bot.id, {
        id: bot.id,
        type: 'gpt_bot',
        name: bot.bot_name,
        tier: this.mapCategoryToTier(bot.category),
        category: bot.category,
        status: 'active',
        capabilities,
        performance_metrics: {
          success_rate: 0.95,
          avg_response_time: 2000,
          cost_per_task: 0.02
        }
      });
    });

    internalAgents?.forEach(agent => {
      const capabilities: AgentCapability[] = [];
      this.agents.set(agent.agent_id, {
        id: agent.agent_id,
        type: 'internal_agent',
        name: agent.display_name,
        tier: agent.tier || 4,
        category: agent.category,
        status: agent.status as 'active' | 'inactive',
        capabilities,
        performance_metrics: {
          success_rate: 0.98,
          avg_response_time: 1500,
          cost_per_task: 0.01
        }
      });
    });
  }

  private mapCategoryToTier(category: string): number {
    const tierMapping: Record<string, number> = {
      'executive': 1,
      'management': 2,
      'specialist': 3,
      'support': 4,
      'general': 4
    };
    return tierMapping[category] || 4;
  }

  async routeTask(task: AgentTask): Promise<string> {
    const suitableAgents = this.findSuitableAgents(task);
    const bestAgent = this.selectOptimalAgent(suitableAgents, task);
    
    if (!bestAgent) {
      throw new Error(`No suitable agent found for task: ${task.intent}`);
    }

    await this.logTaskAssignment(task, bestAgent.id);
    return bestAgent.id;
  }

  private findSuitableAgents(task: AgentTask): UnifiedAgent[] {
    return Array.from(this.agents.values()).filter(agent => {
      // Check if agent is active
      if (agent.status !== 'active') return false;

      // Check capability match
      const hasCapability = agent.capabilities.some(cap => 
        cap.name.toLowerCase().includes(task.intent.toLowerCase()) ||
        task.intent.toLowerCase().includes(cap.name.toLowerCase())
      );

      // For creative/content tasks, prefer GPT bots
      const isCreativeTask = ['content', 'creative', 'writing', 'analysis'].some(keyword =>
        task.intent.toLowerCase().includes(keyword)
      );

      if (isCreativeTask && agent.type === 'gpt_bot') return true;
      if (!isCreativeTask && agent.type === 'internal_agent') return true;

      return hasCapability;
    });
  }

  private selectOptimalAgent(agents: UnifiedAgent[], task: AgentTask): UnifiedAgent | null {
    if (agents.length === 0) return null;

    // Score agents based on multiple factors
    const scoredAgents = agents.map(agent => {
      let score = 0;

      // Performance weight (40%)
      score += agent.performance_metrics.success_rate * 0.4;

      // Speed weight (30%)
      const speedScore = Math.max(0, 1 - (agent.performance_metrics.avg_response_time / 10000));
      score += speedScore * 0.3;

      // Cost efficiency weight (20%)
      const costScore = Math.max(0, 1 - (agent.performance_metrics.cost_per_task / 0.1));
      score += costScore * 0.2;

      // Priority weight (10%)
      const priorityScore = task.priority / 10;
      score += priorityScore * 0.1;

      return { agent, score };
    });

    // Sort by score and return best agent
    scoredAgents.sort((a, b) => b.score - a.score);
    return scoredAgents[0].agent;
  }

  async executeTask(taskId: string, agentId: string): Promise<any> {
    const agent = this.agents.get(agentId);
    if (!agent) {
      throw new Error(`Agent ${agentId} not found`);
    }

    // Get task details
    const { data: task } = await supabase
      .from('agentic_tasks')
      .select('*')
      .eq('id', taskId)
      .single();

    if (!task) {
      throw new Error(`Task ${taskId} not found`);
    }

    try {
      let result;

      if (agent.type === 'gpt_bot') {
        result = await this.executeGPTBotTask(agent, task);
      } else {
        result = await this.executeInternalAgentTask(agent, task);
      }

      // Update task with result
      await supabase
        .from('agentic_tasks')
        .update({
          status: 'completed',
          result,
          progress: 100,
          updated_at: new Date().toISOString()
        })
        .eq('id', taskId);

      // Log performance metrics
      await this.updateAgentMetrics(agentId, true, Date.now());

      return result;
    } catch (error) {
      // Update task with error
      await supabase
        .from('agentic_tasks')
        .update({
          status: 'failed',
          error_message: error.message,
          updated_at: new Date().toISOString()
        })
        .eq('id', taskId);

      // Log performance metrics
      await this.updateAgentMetrics(agentId, false, Date.now());

      throw error;
    }
  }

  private async executeGPTBotTask(agent: UnifiedAgent, task: any): Promise<any> {
    // Use existing GPT bot connector
    const response = await supabase.functions.invoke('gpt-bot-connector', {
      body: {
        botId: agent.id,
        prompt: task.intent,
        context: task.params,
        userId: task.user_id
      }
    });

    if (response.error) {
      throw new Error(`GPT Bot execution failed: ${response.error.message}`);
    }

    return response.data;
  }

  private async executeInternalAgentTask(agent: UnifiedAgent, task: any): Promise<any> {
    // Execute through existing agent task queue
    const { data, error } = await supabase
      .from('agent_task_queue')
      .insert({
        agent_id: agent.id,
        task_type: task.intent,
        task_data: task.params,
        customer_id: task.user_id,
        priority: task.priority || 1
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Internal agent execution failed: ${error.message}`);
    }

    return { task_id: data.id, status: 'queued' };
  }

  private async logTaskAssignment(task: AgentTask, agentId: string) {
    await supabase
      .from('agent_delegations')
      .insert({
        agent_id: agentId,
        manager_id: 'system',
        task_type: task.intent,
        task_params: task.params,
        user_id: task.userId,
        delegation_status: 'active'
      });
  }

  private async updateAgentMetrics(agentId: string, success: boolean, responseTime: number) {
    const agent = this.agents.get(agentId);
    if (!agent) return;

    // Update in-memory metrics
    const metrics = agent.performance_metrics;
    metrics.success_rate = (metrics.success_rate * 0.9) + (success ? 0.1 : 0);
    metrics.avg_response_time = (metrics.avg_response_time * 0.9) + (responseTime * 0.1);

    // Persist to database
    if (agent.type === 'internal_agent') {
      await supabase
        .from('agent_performance_metrics')
        .upsert({
          agent_id: agentId,
          metric_date: new Date().toISOString().split('T')[0],
          successful_tasks: success ? 1 : 0,
          failed_tasks: success ? 0 : 1,
          average_response_time_ms: responseTime,
          updated_at: new Date().toISOString()
        });
    }
  }

  getAgentStatus(agentId: string): UnifiedAgent | undefined {
    return this.agents.get(agentId);
  }

  getAllAgents(): UnifiedAgent[] {
    return Array.from(this.agents.values());
  }

  getAgentsByTier(tier: number): UnifiedAgent[] {
    return this.getAllAgents().filter(agent => agent.tier === tier);
  }

  getAgentsByCategory(category: string): UnifiedAgent[] {
    return this.getAllAgents().filter(agent => agent.category === category);
  }
}