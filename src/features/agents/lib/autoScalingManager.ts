import { supabase } from "@/integrations/supabase/client";
import { UnifiedAgent } from "./unifiedAgentOrchestrator";

interface ScalingMetrics {
  queueDepth: number;
  avgResponseTime: number;
  successRate: number;
  activeSessions: number;
  costPerHour: number;
}

interface ScalingDecision {
  action: 'scale_up' | 'scale_down' | 'hibernate' | 'maintain';
  agentIds: string[];
  reason: string;
  estimatedCostImpact: number;
}

export class AutoScalingManager {
  private agents: Map<string, UnifiedAgent> = new Map();
  private scalingHistory: Array<{ timestamp: Date; decision: ScalingDecision }> = [];
  private isMonitoring = false;
  private monitoringInterval?: number;

  constructor() {
    this.startMonitoring();
  }

  async analyzeScalingNeeds(): Promise<ScalingDecision> {
    const metrics = await this.collectMetrics();
    
    // Queue depth analysis
    if (metrics.queueDepth > 50) {
      return this.scaleUpDecision(metrics, 'High queue depth detected');
    }
    
    // Performance degradation analysis
    if (metrics.avgResponseTime > 5000 && metrics.successRate < 0.8) {
      return this.scaleUpDecision(metrics, 'Performance degradation detected');
    }
    
    // Cost optimization analysis
    if (metrics.queueDepth < 5 && metrics.activeSessions < 10) {
      return this.hibernateDecision(metrics, 'Low utilization detected');
    }
    
    // Smart scaling based on patterns
    const predictedLoad = await this.predictWorkload();
    if (predictedLoad > metrics.queueDepth * 1.5) {
      return this.scaleUpDecision(metrics, 'Predicted load increase');
    }
    
    return {
      action: 'maintain',
      agentIds: [],
      reason: 'System operating within optimal parameters',
      estimatedCostImpact: 0
    };
  }

  private async collectMetrics(): Promise<ScalingMetrics> {
    // Get task queue depth
    const { count: queueDepth } = await supabase
      .from('agentic_tasks')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending');

    // Get performance metrics
    const agents = Array.from(this.agents.values());
    const avgResponseTime = agents.reduce((sum, a) => sum + a.performance_metrics.avg_response_time, 0) / agents.length;
    const successRate = agents.reduce((sum, a) => sum + a.performance_metrics.success_rate, 0) / agents.length;
    
    // Get active sessions
    const { count: activeSessions } = await supabase
      .from('agent_delegations')
      .select('*', { count: 'exact', head: true })
      .eq('delegation_status', 'active')
      .gte('created_at', new Date(Date.now() - 3600000).toISOString()); // Last hour

    // Calculate cost
    const costPerHour = agents.reduce((sum, a) => sum + a.performance_metrics.cost_per_task * 10, 0); // Estimate

    return {
      queueDepth: queueDepth || 0,
      avgResponseTime,
      successRate,
      activeSessions: activeSessions || 0,
      costPerHour
    };
  }

  private scaleUpDecision(metrics: ScalingMetrics, reason: string): ScalingDecision {
    const inactiveAgents = Array.from(this.agents.values())
      .filter(a => a.status === 'inactive')
      .slice(0, Math.min(3, Math.ceil(metrics.queueDepth / 20)))
      .map(a => a.id);

    return {
      action: 'scale_up',
      agentIds: inactiveAgents,
      reason,
      estimatedCostImpact: inactiveAgents.length * 0.05 // $0.05 per hour per agent
    };
  }

  private hibernateDecision(metrics: ScalingMetrics, reason: string): ScalingDecision {
    const activeAgents = Array.from(this.agents.values())
      .filter(a => a.status === 'active' && a.tier > 2) // Only hibernate lower priority agents
      .sort((a, b) => a.performance_metrics.success_rate - b.performance_metrics.success_rate)
      .slice(0, Math.min(2, Math.floor(metrics.activeSessions / 5)))
      .map(a => a.id);

    return {
      action: 'hibernate',
      agentIds: activeAgents,
      reason,
      estimatedCostImpact: -activeAgents.length * 0.05 // Cost savings
    };
  }

  private async predictWorkload(): Promise<number> {
    // Simple prediction based on historical patterns
    const { data: historicalTasks } = await supabase
      .from('agentic_tasks')
      .select('created_at')
      .gte('created_at', new Date(Date.now() - 24 * 3600000).toISOString())
      .order('created_at', { ascending: false });

    if (!historicalTasks || historicalTasks.length === 0) return 0;

    // Calculate tasks per hour for the last 24 hours
    const tasksPerHour = historicalTasks.length / 24;
    
    // Simple prediction: if we're in a high-activity period, expect 20% more
    const currentHour = new Date().getHours();
    const isHighActivity = currentHour >= 9 && currentHour <= 17; // Business hours
    
    return Math.ceil(tasksPerHour * (isHighActivity ? 1.2 : 0.8));
  }

  async executeScalingDecision(decision: ScalingDecision): Promise<void> {
    console.log(`Executing scaling decision: ${decision.action} for agents:`, decision.agentIds);
    
    for (const agentId of decision.agentIds) {
      const agent = this.agents.get(agentId);
      if (!agent) continue;

      switch (decision.action) {
        case 'scale_up':
          await this.activateAgent(agentId);
          break;
        case 'hibernate':
          await this.hibernateAgent(agentId);
          break;
      }
    }

    // Record scaling decision
    this.scalingHistory.push({
      timestamp: new Date(),
      decision
    });

    // Keep only last 100 decisions
    if (this.scalingHistory.length > 100) {
      this.scalingHistory = this.scalingHistory.slice(-100);
    }
  }

  private async activateAgent(agentId: string): Promise<void> {
    const agent = this.agents.get(agentId);
    if (!agent) return;

    agent.status = 'active';
    
    if (agent.type === 'internal_agent') {
      await supabase
        .from('agent_management')
        .update({ status: 'active' })
        .eq('id', agentId);
    }
    // Note: GPT bots table not available in current schema
  }

  private async hibernateAgent(agentId: string): Promise<void> {
    const agent = this.agents.get(agentId);
    if (!agent) return;

    agent.status = 'inactive';
    
    if (agent.type === 'internal_agent') {
      await supabase
        .from('agent_management')
        .update({ status: 'inactive' })
        .eq('id', agentId);
    }
    // Note: GPT bots table not available in current schema
  }

  updateAgents(agents: Map<string, UnifiedAgent>): void {
    this.agents = agents;
  }

  getScalingHistory(): Array<{ timestamp: Date; decision: ScalingDecision }> {
    return this.scalingHistory.slice(-20); // Last 20 decisions
  }

  private startMonitoring(): void {
    if (this.isMonitoring) return;
    
    this.isMonitoring = true;
    this.monitoringInterval = window.setInterval(async () => {
      try {
        const decision = await this.analyzeScalingNeeds();
        if (decision.action !== 'maintain') {
          await this.executeScalingDecision(decision);
        }
      } catch (error) {
        console.error('Auto-scaling monitoring error:', error);
      }
    }, 60000); // Check every minute
  }

  stopMonitoring(): void {
    this.isMonitoring = false;
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = undefined;
    }
  }

  destroy(): void {
    this.stopMonitoring();
  }
}

export const autoScalingManager = new AutoScalingManager();
