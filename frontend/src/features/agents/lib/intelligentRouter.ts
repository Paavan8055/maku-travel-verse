import { supabase } from "@/integrations/supabase/client";

export interface RoutingDecision {
  agentId: string;
  agentType: 'gpt_bot' | 'internal_agent';
  confidence: number;
  reasoning: string;
  estimatedCost: number;
  estimatedDuration: number;
}

export interface TaskContext {
  intent: string;
  complexity: 'low' | 'medium' | 'high';
  domain: string;
  urgency: 'low' | 'medium' | 'high';
  userTier: 'free' | 'premium' | 'enterprise';
  previousInteractions?: any[];
}

// Simplified agent type to avoid deep type instantiation
interface SimpleAgent {
  id: string;
  name: string;
  type: 'gpt_bot' | 'internal_agent';
  category?: string;
  capabilities?: any;
  status?: string;
}

export class IntelligentRouter {
  private routingRules: Map<string, any> = new Map();
  private performanceHistory: Map<string, any[]> = new Map();

  constructor() {
    this.initializeRoutingRules();
  }

  private initializeRoutingRules() {
    // Define intelligent routing rules
    this.routingRules.set('creative_tasks', {
      preferredType: 'gpt_bot',
      models: {
        low: 'gpt-5-nano-2025-08-07',
        medium: 'gpt-5-mini-2025-08-07',
        high: 'gpt-5-2025-08-07'
      },
      weight: 0.8
    });

    this.routingRules.set('analytical_tasks', {
      preferredType: 'gpt_bot',
      models: {
        low: 'gpt-5-mini-2025-08-07',
        medium: 'gpt-5-2025-08-07',
        high: 'o3-2025-04-16'
      },
      weight: 0.9
    });

    this.routingRules.set('operational_tasks', {
      preferredType: 'internal_agent',
      fallbackType: 'gpt_bot',
      weight: 0.7
    });

    this.routingRules.set('customer_service', {
      preferredType: 'internal_agent',
      escalationPath: ['support', 'specialist', 'management'],
      weight: 0.6
    });
  }

  async route(context: TaskContext): Promise<RoutingDecision> {
    // Analyze task characteristics
    const taskCategory = this.categorizeTask(context.intent);
    const routingRule = this.routingRules.get(taskCategory);
    
    if (!routingRule) {
      return this.defaultRouting(context);
    }

    // Get available agents
    const availableAgents = await this.getAvailableAgents(routingRule.preferredType);
    
    if (availableAgents.length === 0 && routingRule.fallbackType) {
      const fallbackAgents = await this.getAvailableAgents(routingRule.fallbackType);
      return this.selectBestAgent(fallbackAgents, context, routingRule.fallbackType);
    }

    return this.selectBestAgent(availableAgents, context, routingRule.preferredType);
  }

  private categorizeTask(intent: string): string {
    const intentLower = intent.toLowerCase();
    
    // Creative tasks
    if (['write', 'create', 'generate', 'design', 'compose'].some(word => intentLower.includes(word))) {
      return 'creative_tasks';
    }
    
    // Analytical tasks
    if (['analyze', 'research', 'calculate', 'evaluate', 'assess'].some(word => intentLower.includes(word))) {
      return 'analytical_tasks';
    }
    
    // Customer service
    if (['help', 'support', 'assist', 'question', 'issue'].some(word => intentLower.includes(word))) {
      return 'customer_service';
    }
    
    // Default to operational
    return 'operational_tasks';
  }

  private async getAvailableAgents(type: 'gpt_bot' | 'internal_agent'): Promise<SimpleAgent[]> {
    if (type === 'gpt_bot') {
      const { data } = await supabase
        .from('gpt_bot_registry')
        .select('id, bot_name, category, capabilities');
      
      return data?.map(bot => ({
        id: bot.id,
        name: bot.bot_name,
        type: 'gpt_bot' as const,
        category: bot.category,
        capabilities: bot.capabilities
      })) || [];
    } else {
      const { data } = await supabase
        .from('agent_management')
        .select('agent_id, display_name, category, capabilities, status')
        .eq('status', 'active');
      
      return data?.map(agent => ({
        id: agent.agent_id,
        name: agent.display_name,
        type: 'internal_agent' as const,
        category: agent.category,
        capabilities: agent.capabilities,
        status: agent.status
      })) || [];
    }
  }

  private async selectBestAgent(agents: SimpleAgent[], context: TaskContext, type: 'gpt_bot' | 'internal_agent'): Promise<RoutingDecision> {
    if (agents.length === 0) {
      throw new Error('No available agents for routing');
    }

    // Score each agent
    const scoredAgents = await Promise.all(
      agents.map(async (agent) => {
        const score = await this.scoreAgent(agent, context, type);
        return { agent, score };
      })
    );

    // Sort by score and select best
    scoredAgents.sort((a, b) => b.score.total - a.score.total);
    const bestAgent = scoredAgents[0];

    return {
      agentId: bestAgent.agent.id,
      agentType: type,
      confidence: bestAgent.score.confidence,
      reasoning: bestAgent.score.reasoning,
      estimatedCost: bestAgent.score.estimatedCost,
      estimatedDuration: bestAgent.score.estimatedDuration
    };
  }

  private async scoreAgent(agent: SimpleAgent, context: TaskContext, type: 'gpt_bot' | 'internal_agent') {
    let score = 0;
    let reasoning = [];

    // Performance score (40%)
    const successRate = type === 'gpt_bot' ? 0.95 : 0.98;
    score += successRate * 0.4;
    reasoning.push(`Success rate: ${(successRate * 100).toFixed(1)}%`);

    // Capability match (30%)
    const capabilities = agent.capabilities || [];
    const capabilityMatch = this.calculateCapabilityMatch(capabilities, context.intent);
    score += capabilityMatch * 0.3;
    reasoning.push(`Capability match: ${(capabilityMatch * 100).toFixed(1)}%`);

    // Load balancing (20%)
    const currentLoad = await this.getAgentLoad(agent.id);
    const loadScore = Math.max(0, 1 - currentLoad);
    score += loadScore * 0.2;
    reasoning.push(`Load factor: ${(loadScore * 100).toFixed(1)}%`);

    // Cost efficiency (10%)
    const costScore = this.calculateCostEfficiency(agent, context);
    score += costScore * 0.1;
    reasoning.push(`Cost efficiency: ${(costScore * 100).toFixed(1)}%`);

    // Model selection for GPT bots
    let selectedModel = 'gpt-5-mini-2025-08-07';
    if (type === 'gpt_bot') {
      selectedModel = this.selectOptimalModel(context.complexity, context.userTier);
    }

    return {
      total: score,
      confidence: Math.min(0.95, score),
      reasoning: reasoning.join(', '),
      estimatedCost: this.estimateCost(selectedModel, context),
      estimatedDuration: this.estimateDuration(agent, context)
    };
  }

  private calculateCapabilityMatch(capabilities: any, intent: string): number {
    if (!capabilities) return 0.5; // Default moderate match
    
    const intentWords = intent.toLowerCase().split(' ');
    let maxMatch = 0;

    if (Array.isArray(capabilities)) {
      capabilities.forEach(cap => {
        const capName = typeof cap === 'string' ? cap : cap?.name || '';
        const capWords = capName.toLowerCase().split(' ');
        const overlap = intentWords.filter(word => 
          capWords.some(capWord => capWord.includes(word) || word.includes(capWord))
        ).length;
        const match = overlap / Math.max(intentWords.length, capWords.length);
        maxMatch = Math.max(maxMatch, match);
      });
    }

    return maxMatch;
  }

  private async getAgentLoad(agentId: string): Promise<number> {
    // Check current task queue for agent
    const { data } = await supabase
      .from('agent_task_queue')
      .select('id')
      .eq('agent_id', agentId)
      .in('status', ['queued', 'processing']);

    const currentTasks = data?.length || 0;
    return Math.min(1, currentTasks / 10); // Normalize to 0-1 scale
  }

  private calculateCostEfficiency(agent: SimpleAgent, context: TaskContext): number {
    // For premium/enterprise users, prioritize quality over cost
    if (context.userTier === 'enterprise') return 1;
    if (context.userTier === 'premium') return 0.8;
    
    // For free users, prioritize cost efficiency
    const baseCost = 0.02; // Default cost
    return Math.max(0, 1 - (baseCost / 0.1)); // Normalize against max expected cost
  }

  private selectOptimalModel(complexity: string, userTier: string): string {
    // Model selection based on complexity and user tier
    if (userTier === 'enterprise') {
      return {
        low: 'gpt-5-mini-2025-08-07',
        medium: 'gpt-5-2025-08-07',
        high: 'o3-2025-04-16'
      }[complexity] || 'gpt-5-2025-08-07';
    }
    
    if (userTier === 'premium') {
      return {
        low: 'gpt-5-nano-2025-08-07',
        medium: 'gpt-5-mini-2025-08-07',
        high: 'gpt-5-2025-08-07'
      }[complexity] || 'gpt-5-mini-2025-08-07';
    }
    
    // Free tier
    return {
      low: 'gpt-5-nano-2025-08-07',
      medium: 'gpt-5-nano-2025-08-07',
      high: 'gpt-5-mini-2025-08-07'
    }[complexity] || 'gpt-5-nano-2025-08-07';
  }

  private estimateCost(model: string, context: TaskContext): number {
    const baseCosts = {
      'gpt-5-nano-2025-08-07': 0.005,
      'gpt-5-mini-2025-08-07': 0.015,
      'gpt-5-2025-08-07': 0.05,
      'o3-2025-04-16': 0.1
    };
    
    const baseCost = baseCosts[model as keyof typeof baseCosts] || 0.02;
    
    // Adjust for complexity
    const complexityMultiplier = {
      low: 1,
      medium: 1.5,
      high: 2.5
    }[context.complexity] || 1;
    
    return baseCost * complexityMultiplier;
  }

  private estimateDuration(agent: SimpleAgent, context: TaskContext): number {
    const baseTime = 2000; // milliseconds
    
    const complexityMultiplier = {
      low: 1,
      medium: 2,
      high: 4
    }[context.complexity] || 1;
    
    return baseTime * complexityMultiplier;
  }

  private async defaultRouting(context: TaskContext): Promise<RoutingDecision> {
    // Fallback to first available agent
    const agents = await this.getAvailableAgents('internal_agent');
    
    if (agents.length === 0) {
      throw new Error('No agents available for routing');
    }
    
    return {
      agentId: agents[0].id,
      agentType: 'internal_agent',
      confidence: 0.5,
      reasoning: 'Default routing - no specific rules matched',
      estimatedCost: 0.01,
      estimatedDuration: 3000
    };
  }
}