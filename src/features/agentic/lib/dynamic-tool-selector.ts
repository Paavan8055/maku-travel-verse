import type { SupabaseClient } from '@supabase/supabase-js';

export interface Tool {
  id: string;
  name: string;
  description: string;
  category: 'search' | 'booking' | 'analysis' | 'communication' | 'utility';
  cost_score: number; // 0-1, lower is cheaper
  speed_score: number; // 0-1, higher is faster
  accuracy_score: number; // 0-1, higher is more accurate
  reliability_score: number; // 0-1, higher is more reliable
  capabilities: string[];
  resource_requirements: {
    memory: number;
    cpu: number;
    api_calls: number;
  };
  success_rate: number;
  average_response_time: number;
  last_used: Date;
  usage_count: number;
}

export interface ToolContext {
  user_id?: string;
  task_type: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  budget_limit?: number;
  time_limit?: number;
  accuracy_requirement?: number;
  required_capabilities: string[];
  context_data: Record<string, any>;
}

export interface ToolSelection {
  primary_tool: Tool;
  fallback_tools: Tool[];
  confidence: number;
  reasoning: string;
  estimated_cost: number;
  estimated_time: number;
  risk_assessment: {
    failure_probability: number;
    mitigation_strategies: string[];
  };
}

export interface ToolPerformance {
  tool_id: string;
  task_type: string;
  success: boolean;
  execution_time: number;
  cost: number;
  user_satisfaction?: number;
  error_type?: string;
  context_similarity: number;
}

export class DynamicToolSelector {
  private supabase: SupabaseClient;
  private tools: Map<string, Tool>;
  private performanceHistory: ToolPerformance[];
  private contextPatterns: Map<string, ToolSelection[]>;

  constructor(supabase: SupabaseClient) {
    this.supabase = supabase;
    this.tools = new Map();
    this.performanceHistory = [];
    this.contextPatterns = new Map();
    this.initializeTools();
  }

  private initializeTools(): void {
    const defaultTools: Tool[] = [
      {
        id: 'amadeus_flight_search',
        name: 'Amadeus Flight Search',
        description: 'Search flights using Amadeus API',
        category: 'search',
        cost_score: 0.7,
        speed_score: 0.8,
        accuracy_score: 0.9,
        reliability_score: 0.85,
        capabilities: ['flight_search', 'price_comparison', 'schedule_lookup'],
        resource_requirements: { memory: 50, cpu: 30, api_calls: 1 },
        success_rate: 0.92,
        average_response_time: 1200,
        last_used: new Date(),
        usage_count: 0
      },
      {
        id: 'sabre_flight_search',
        name: 'Sabre Flight Search',
        description: 'Search flights using Sabre API',
        category: 'search',
        cost_score: 0.6,
        speed_score: 0.7,
        accuracy_score: 0.85,
        reliability_score: 0.8,
        capabilities: ['flight_search', 'price_comparison'],
        resource_requirements: { memory: 45, cpu: 25, api_calls: 1 },
        success_rate: 0.88,
        average_response_time: 1500,
        last_used: new Date(),
        usage_count: 0
      },
      {
        id: 'hotelbeds_search',
        name: 'HotelBeds Search',
        description: 'Search hotels using HotelBeds API',
        category: 'search',
        cost_score: 0.5,
        speed_score: 0.9,
        accuracy_score: 0.8,
        reliability_score: 0.9,
        capabilities: ['hotel_search', 'availability_check', 'room_details'],
        resource_requirements: { memory: 40, cpu: 20, api_calls: 1 },
        success_rate: 0.94,
        average_response_time: 800,
        last_used: new Date(),
        usage_count: 0
      },
      {
        id: 'openai_gpt5',
        name: 'OpenAI GPT-5',
        description: 'Advanced AI reasoning and analysis',
        category: 'analysis',
        cost_score: 0.9,
        speed_score: 0.6,
        accuracy_score: 0.95,
        reliability_score: 0.9,
        capabilities: ['text_analysis', 'reasoning', 'recommendation', 'language_processing'],
        resource_requirements: { memory: 100, cpu: 80, api_calls: 1 },
        success_rate: 0.96,
        average_response_time: 2000,
        last_used: new Date(),
        usage_count: 0
      },
      {
        id: 'stripe_payment',
        name: 'Stripe Payment Processing',
        description: 'Process payments securely',
        category: 'booking',
        cost_score: 0.3,
        speed_score: 0.95,
        accuracy_score: 0.99,
        reliability_score: 0.99,
        capabilities: ['payment_processing', 'refunds', 'subscription_management'],
        resource_requirements: { memory: 30, cpu: 20, api_calls: 1 },
        success_rate: 0.995,
        average_response_time: 500,
        last_used: new Date(),
        usage_count: 0
      }
    ];

    defaultTools.forEach(tool => {
      this.tools.set(tool.id, tool);
    });
  }

  async selectOptimalTool(context: ToolContext): Promise<ToolSelection> {
    // Filter tools based on required capabilities
    const compatibleTools = this.getCompatibleTools(context.required_capabilities);
    
    if (compatibleTools.length === 0) {
      throw new Error(`No tools found with required capabilities: ${context.required_capabilities.join(', ')}`);
    }

    // Score tools based on context
    const scoredTools = await this.scoreTools(compatibleTools, context);
    
    // Sort by composite score
    scoredTools.sort((a, b) => b.score - a.score);
    
    const primaryTool = scoredTools[0].tool;
    const fallbackTools = scoredTools.slice(1, 4).map(s => s.tool);
    
    // Calculate risk assessment
    const riskAssessment = await this.assessRisk(primaryTool, context);
    
    // Generate reasoning
    const reasoning = this.generateSelectionReasoning(primaryTool, context, scoredTools[0].score);
    
    // Estimate cost and time
    const estimatedCost = this.estimateCost(primaryTool, context);
    const estimatedTime = this.estimateTime(primaryTool, context);
    
    const selection: ToolSelection = {
      primary_tool: primaryTool,
      fallback_tools: fallbackTools,
      confidence: scoredTools[0].score,
      reasoning,
      estimated_cost: estimatedCost,
      estimated_time: estimatedTime,
      risk_assessment: riskAssessment
    };

    // Store selection pattern for learning
    await this.storeSelectionPattern(context, selection);
    
    return selection;
  }

  private getCompatibleTools(requiredCapabilities: string[]): Tool[] {
    const compatible: Tool[] = [];
    
    for (const tool of this.tools.values()) {
      const hasAllCapabilities = requiredCapabilities.every(capability =>
        tool.capabilities.includes(capability)
      );
      
      if (hasAllCapabilities) {
        compatible.push(tool);
      }
    }
    
    return compatible;
  }

  private async scoreTools(
    tools: Tool[], 
    context: ToolContext
  ): Promise<Array<{ tool: Tool; score: number }>> {
    const scoredTools: Array<{ tool: Tool; score: number }> = [];
    
    for (const tool of tools) {
      let score = 0;
      
      // Base performance scores
      score += tool.success_rate * 0.3;
      score += tool.reliability_score * 0.2;
      score += tool.accuracy_score * 0.15;
      score += tool.speed_score * 0.1;
      score += (1 - tool.cost_score) * 0.1; // Lower cost is better
      
      // Context-specific adjustments
      if (context.priority === 'critical') {
        score += tool.reliability_score * 0.1;
        score += tool.accuracy_score * 0.1;
      } else if (context.priority === 'low') {
        score += (1 - tool.cost_score) * 0.15; // Prefer cheaper tools
      }
      
      if (context.time_limit) {
        const timeScore = Math.max(0, 1 - (tool.average_response_time / context.time_limit));
        score += timeScore * 0.15;
      }
      
      if (context.accuracy_requirement) {
        if (tool.accuracy_score >= context.accuracy_requirement) {
          score += 0.1;
        } else {
          score -= 0.2; // Penalize tools that don't meet accuracy requirements
        }
      }
      
      // Historical performance adjustment
      const historicalScore = await this.getHistoricalPerformance(tool.id, context.task_type);
      score += historicalScore * 0.1;
      
      // Recency bonus (prefer recently successful tools)
      const recencyScore = this.calculateRecencyScore(tool);
      score += recencyScore * 0.05;
      
      scoredTools.push({ tool, score: Math.max(0, Math.min(1, score)) });
    }
    
    return scoredTools;
  }

  private async getHistoricalPerformance(toolId: string, taskType: string): Promise<number> {
    const relevantHistory = this.performanceHistory.filter(
      p => p.tool_id === toolId && p.task_type === taskType
    );
    
    if (relevantHistory.length === 0) return 0.5; // Neutral score for new tools
    
    const recentHistory = relevantHistory.slice(-10); // Last 10 uses
    const successRate = recentHistory.filter(p => p.success).length / recentHistory.length;
    const avgSatisfaction = recentHistory
      .filter(p => p.user_satisfaction !== undefined)
      .reduce((sum, p) => sum + (p.user_satisfaction || 0), 0) / recentHistory.length || 0.5;
    
    return (successRate + avgSatisfaction) / 2;
  }

  private calculateRecencyScore(tool: Tool): number {
    const daysSinceLastUse = (Date.now() - tool.last_used.getTime()) / (1000 * 60 * 60 * 24);
    
    if (daysSinceLastUse < 1) return 1.0;
    if (daysSinceLastUse < 7) return 0.8;
    if (daysSinceLastUse < 30) return 0.5;
    return 0.2;
  }

  private async assessRisk(tool: Tool, context: ToolContext): Promise<{
    failure_probability: number;
    mitigation_strategies: string[];
  }> {
    const failureProbability = 1 - tool.success_rate;
    const mitigationStrategies: string[] = [];
    
    if (failureProbability > 0.1) {
      mitigationStrategies.push('Use fallback tool if primary fails');
    }
    
    if (tool.average_response_time > (context.time_limit || 5000)) {
      mitigationStrategies.push('Implement timeout with retry logic');
    }
    
    if (tool.cost_score > 0.8) {
      mitigationStrategies.push('Monitor usage and implement cost controls');
    }
    
    if (tool.reliability_score < 0.8) {
      mitigationStrategies.push('Implement circuit breaker pattern');
    }
    
    return {
      failure_probability: failureProbability,
      mitigation_strategies: mitigationStrategies
    };
  }

  private generateSelectionReasoning(tool: Tool, context: ToolContext, score: number): string {
    const reasons: string[] = [];
    
    reasons.push(`Selected ${tool.name} with confidence score ${(score * 100).toFixed(1)}%`);
    
    if (tool.success_rate > 0.9) {
      reasons.push(`High success rate (${(tool.success_rate * 100).toFixed(1)}%)`);
    }
    
    if (context.priority === 'critical' && tool.reliability_score > 0.8) {
      reasons.push('High reliability required for critical task');
    }
    
    if (context.time_limit && tool.average_response_time < context.time_limit) {
      reasons.push(`Fast response time (${tool.average_response_time}ms) meets deadline`);
    }
    
    if (tool.capabilities.length > context.required_capabilities.length) {
      reasons.push('Additional capabilities available for complex scenarios');
    }
    
    return reasons.join('. ') + '.';
  }

  private estimateCost(tool: Tool, context: ToolContext): number {
    const baseCost = tool.cost_score * 10; // Base cost in credits
    const resourceMultiplier = (tool.resource_requirements.memory + tool.resource_requirements.cpu) / 100;
    const complexityMultiplier = Object.keys(context.context_data).length / 10 + 1;
    
    return baseCost * resourceMultiplier * complexityMultiplier;
  }

  private estimateTime(tool: Tool, context: ToolContext): number {
    const baseTime = tool.average_response_time;
    const complexityMultiplier = Object.keys(context.context_data).length / 10 + 1;
    
    return Math.round(baseTime * complexityMultiplier);
  }

  private async storeSelectionPattern(context: ToolContext, selection: ToolSelection): Promise<void> {
    const patternKey = `${context.task_type}_${context.priority}`;
    
    if (!this.contextPatterns.has(patternKey)) {
      this.contextPatterns.set(patternKey, []);
    }
    
    const patterns = this.contextPatterns.get(patternKey)!;
    patterns.push(selection);
    
    // Keep only last 50 patterns per context
    if (patterns.length > 50) {
      patterns.splice(0, patterns.length - 50);
    }
  }

  async recordToolPerformance(performance: ToolPerformance): Promise<void> {
    // Add to history
    this.performanceHistory.push(performance);
    
    // Keep only last 1000 records
    if (this.performanceHistory.length > 1000) {
      this.performanceHistory.splice(0, this.performanceHistory.length - 1000);
    }
    
    // Update tool metrics
    const tool = this.tools.get(performance.tool_id);
    if (tool) {
      // Update success rate (weighted average)
      const weight = 0.1; // New performance has 10% weight
      tool.success_rate = tool.success_rate * (1 - weight) + (performance.success ? 1 : 0) * weight;
      
      // Update average response time
      tool.average_response_time = tool.average_response_time * (1 - weight) + performance.execution_time * weight;
      
      // Update usage stats
      tool.usage_count += 1;
      tool.last_used = new Date();
      
      // Store in database
      await this.supabase.from('agent_performance_metrics').insert({
        agent_id: 'dynamic_tool_selector',
        task_type: performance.task_type,
        tool_id: performance.tool_id,
        success: performance.success,
        execution_time_ms: performance.execution_time,
        cost: performance.cost,
        user_satisfaction: performance.user_satisfaction,
        error_type: performance.error_type,
        context_similarity: performance.context_similarity,
        metric_date: new Date().toISOString()
      });
    }
  }

  async getToolAnalytics(): Promise<{
    total_selections: number;
    tool_usage_distribution: Record<string, number>;
    average_success_rate: number;
    cost_efficiency: number;
    performance_trends: Record<string, number[]>;
  }> {
    const toolUsage: Record<string, number> = {};
    let totalSuccesses = 0;
    let totalCost = 0;
    let totalSelections = 0;
    
    this.performanceHistory.forEach(perf => {
      toolUsage[perf.tool_id] = (toolUsage[perf.tool_id] || 0) + 1;
      if (perf.success) totalSuccesses++;
      totalCost += perf.cost;
      totalSelections++;
    });
    
    const performanceTrends: Record<string, number[]> = {};
    for (const tool of this.tools.values()) {
      const recentPerf = this.performanceHistory
        .filter(p => p.tool_id === tool.id)
        .slice(-10)
        .map(p => p.success ? 1 : 0);
      performanceTrends[tool.id] = recentPerf;
    }
    
    return {
      total_selections: totalSelections,
      tool_usage_distribution: toolUsage,
      average_success_rate: totalSelections > 0 ? totalSuccesses / totalSelections : 0,
      cost_efficiency: totalSelections > 0 ? totalSuccesses / totalCost : 0,
      performance_trends: performanceTrends
    };
  }

  async optimizeToolConfiguration(): Promise<void> {
    // Analyze performance data and adjust tool configurations
    for (const tool of this.tools.values()) {
      const recentPerformance = this.performanceHistory
        .filter(p => p.tool_id === tool.id)
        .slice(-20);
      
      if (recentPerformance.length > 10) {
        const avgTime = recentPerformance.reduce((sum, p) => sum + p.execution_time, 0) / recentPerformance.length;
        const successRate = recentPerformance.filter(p => p.success).length / recentPerformance.length;
        
        // Update tool metrics based on recent performance
        tool.average_response_time = avgTime;
        tool.success_rate = successRate;
        
        // Adjust scores based on performance trends
        if (successRate > 0.95) {
          tool.reliability_score = Math.min(1.0, tool.reliability_score + 0.05);
        } else if (successRate < 0.8) {
          tool.reliability_score = Math.max(0.1, tool.reliability_score - 0.05);
        }
      }
    }
  }
}
