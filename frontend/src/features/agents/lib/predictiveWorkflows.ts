import { supabase } from "@/integrations/supabase/client";
import { WorkflowTemplate } from "./workflowTemplates";
import { contextManager } from "./contextManager";

export interface PredictiveAlert {
  id: string;
  type: 'escalation' | 'issue_detection' | 'optimization' | 'proactive_support';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  recommendedActions: string[];
  affectedUsers?: string[];
  estimatedImpact: string;
  confidence: number; // 0-1
  triggeredAt: Date;
  data: Record<string, any>;
}

export interface EscalationRule {
  id: string;
  name: string;
  conditions: EscalationCondition[];
  actions: EscalationAction[];
  cooldownMinutes: number;
  isActive: boolean;
}

export interface EscalationCondition {
  metric: string;
  operator: '>' | '<' | '=' | '>=' | '<=' | 'contains' | 'pattern';
  value: any;
  timeWindowMinutes?: number;
}

export interface EscalationAction {
  type: 'notify_human' | 'escalate_tier' | 'trigger_workflow' | 'alert_admin';
  parameters: Record<string, any>;
}

export class PredictiveWorkflowManager {
  private escalationRules: Map<string, EscalationRule> = new Map();
  private recentAlerts: Map<string, Date> = new Map();
  private isMonitoring = false;
  private monitoringInterval?: number;

  constructor() {
    this.initializeDefaultRules();
    this.startMonitoring();
  }

  private initializeDefaultRules(): void {
    // Customer service escalation rules
    this.escalationRules.set('high_response_time', {
      id: 'high_response_time',
      name: 'High Response Time Escalation',
      conditions: [
        { metric: 'avg_response_time', operator: '>', value: 30000, timeWindowMinutes: 15 }
      ],
      actions: [
        { type: 'escalate_tier', parameters: { targetTier: 1 } },
        { type: 'notify_human', parameters: { department: 'customer_service' } }
      ],
      cooldownMinutes: 30,
      isActive: true
    });

    this.escalationRules.set('booking_failure_spike', {
      id: 'booking_failure_spike',
      name: 'Booking Failure Spike Detection',
      conditions: [
        { metric: 'booking_failure_rate', operator: '>', value: 0.15, timeWindowMinutes: 10 }
      ],
      actions: [
        { type: 'alert_admin', parameters: { priority: 'high' } },
        { type: 'trigger_workflow', parameters: { workflowId: 'system_health_check' } }
      ],
      cooldownMinutes: 15,
      isActive: true
    });

    this.escalationRules.set('user_frustration_pattern', {
      id: 'user_frustration_pattern',
      name: 'User Frustration Pattern Detection',
      conditions: [
        { metric: 'support_queries_per_session', operator: '>', value: 3, timeWindowMinutes: 20 },
        { metric: 'page_bounces', operator: '>', value: 5, timeWindowMinutes: 10 }
      ],
      actions: [
        { type: 'notify_human', parameters: { priority: 'high', department: 'support' } },
        { type: 'trigger_workflow', parameters: { workflowId: 'proactive_customer_outreach' } }
      ],
      cooldownMinutes: 60,
      isActive: true
    });
  }

  async analyzeSystemHealth(): Promise<PredictiveAlert[]> {
    const alerts: PredictiveAlert[] = [];
    const metrics = await this.collectSystemMetrics();

    // Check each escalation rule
    for (const rule of this.escalationRules.values()) {
      if (!rule.isActive) continue;

      const ruleKey = `rule_${rule.id}`;
      const lastAlert = this.recentAlerts.get(ruleKey);
      
      // Check cooldown
      if (lastAlert && (Date.now() - lastAlert.getTime()) < rule.cooldownMinutes * 60 * 1000) {
        continue;
      }

      const isTriggered = await this.evaluateRule(rule, metrics);
      if (isTriggered) {
        const alert = await this.createAlert(rule, metrics);
        alerts.push(alert);
        
        this.recentAlerts.set(ruleKey, new Date());
        await this.executeRuleActions(rule, alert);
      }
    }

    // Proactive issue detection
    const proactiveAlerts = await this.detectProactiveIssues(metrics);
    alerts.push(...proactiveAlerts);

    return alerts;
  }

  private async collectSystemMetrics(): Promise<Record<string, any>> {
    const metrics: Record<string, any> = {};

    // Agent performance metrics
    const { data: agentMetrics } = await supabase
      .from('agent_performance_metrics')
      .select('*')
      .gte('created_at', new Date(Date.now() - 60 * 60 * 1000).toISOString()); // Last hour

    if (agentMetrics) {
      metrics.avg_response_time = agentMetrics.reduce((sum, m) => sum + m.average_response_time_ms, 0) / agentMetrics.length;
      metrics.success_rate = agentMetrics.reduce((sum, m) => sum + (m.successful_tasks / (m.successful_tasks + m.failed_tasks)), 0) / agentMetrics.length;
    }

    // Booking metrics
    const { data: recentBookings } = await supabase
      .from('bookings')
      .select('status, created_at')
      .gte('created_at', new Date(Date.now() - 60 * 60 * 1000).toISOString());

    if (recentBookings) {
      const totalBookings = recentBookings.length;
      const failedBookings = recentBookings.filter(b => b.status === 'failed').length;
      metrics.booking_failure_rate = totalBookings > 0 ? failedBookings / totalBookings : 0;
    }

    // Task queue metrics
    const { count: pendingTasks } = await supabase
      .from('agentic_tasks')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending');

    metrics.queue_depth = pendingTasks || 0;

    return metrics;
  }

  private async evaluateRule(rule: EscalationRule, metrics: Record<string, any>): Promise<boolean> {
    for (const condition of rule.conditions) {
      const metricValue = metrics[condition.metric];
      if (metricValue === undefined) continue;

      let conditionMet = false;
      switch (condition.operator) {
        case '>':
          conditionMet = metricValue > condition.value;
          break;
        case '<':
          conditionMet = metricValue < condition.value;
          break;
        case '>=':
          conditionMet = metricValue >= condition.value;
          break;
        case '<=':
          conditionMet = metricValue <= condition.value;
          break;
        case '=':
          conditionMet = metricValue === condition.value;
          break;
        case 'contains':
          conditionMet = String(metricValue).includes(String(condition.value));
          break;
      }

      if (!conditionMet) return false;
    }

    return true;
  }

  private async createAlert(rule: EscalationRule, metrics: Record<string, any>): Promise<PredictiveAlert> {
    const severity = this.determineSeverity(rule, metrics);
    
    return {
      id: crypto.randomUUID(),
      type: 'escalation',
      severity,
      title: `${rule.name} Triggered`,
      description: `System condition matched escalation rule: ${rule.name}`,
      recommendedActions: rule.actions.map(a => `${a.type}: ${JSON.stringify(a.parameters)}`),
      estimatedImpact: this.estimateImpact(rule, metrics),
      confidence: 0.85,
      triggeredAt: new Date(),
      data: { rule: rule.id, metrics }
    };
  }

  private determineSeverity(rule: EscalationRule, metrics: Record<string, any>): 'low' | 'medium' | 'high' | 'critical' {
    // Simple heuristic based on rule type and metric values
    if (rule.id.includes('failure') || rule.id.includes('critical')) return 'critical';
    if (rule.id.includes('high') || metrics.avg_response_time > 60000) return 'high';
    if (rule.id.includes('frustration') || metrics.booking_failure_rate > 0.1) return 'medium';
    return 'low';
  }

  private estimateImpact(rule: EscalationRule, metrics: Record<string, any>): string {
    const queueDepth = metrics.queue_depth || 0;
    const failureRate = metrics.booking_failure_rate || 0;
    
    if (queueDepth > 100 || failureRate > 0.2) {
      return 'High - Multiple users affected, potential revenue impact';
    } else if (queueDepth > 50 || failureRate > 0.1) {
      return 'Medium - Several users may experience delays';
    } else {
      return 'Low - Limited user impact expected';
    }
  }

  private async executeRuleActions(rule: EscalationRule, alert: PredictiveAlert): Promise<void> {
    for (const action of rule.actions) {
      try {
        switch (action.type) {
          case 'notify_human':
            await this.notifyHuman(action.parameters, alert);
            break;
          case 'escalate_tier':
            await this.escalateTier(action.parameters, alert);
            break;
          case 'trigger_workflow':
            await this.triggerWorkflow(action.parameters, alert);
            break;
          case 'alert_admin':
            await this.alertAdmin(action.parameters, alert);
            break;
        }
      } catch (error) {
        console.error(`Failed to execute action ${action.type}:`, error);
      }
    }
  }

  private async notifyHuman(parameters: Record<string, any>, alert: PredictiveAlert): Promise<void> {
    // Log notification (database table not available in current schema)
    console.log('Human notification:', {
      department: parameters.department || 'support',
      priority: parameters.priority || alert.severity,
      title: alert.title,
      description: alert.description,
      alert_data: alert.data
    });
  }

  private async escalateTier(parameters: Record<string, any>, alert: PredictiveAlert): Promise<void> {
    // Find agents in target tier and reassign pending tasks
    const targetTier = parameters.targetTier || 1;
    
    const { data: tierAgents } = await supabase
      .from('agent_management')
      .select('id')
      .eq('tier', targetTier)
      .eq('status', 'active');

    if (tierAgents && tierAgents.length > 0) {
      // Log tier escalation (database schema limitation)
      console.log('Escalating tasks to tier', targetTier, 'for agents:', tierAgents.map(a => a.id));
    }
  }

  private async triggerWorkflow(parameters: Record<string, any>, alert: PredictiveAlert): Promise<void> {
    const workflowId = parameters.workflowId;
    
    // Log workflow trigger (database table not available)
    console.log('Workflow triggered:', {
      workflow_id: workflowId,
      trigger_type: 'predictive_alert',
      context: {
        alertId: alert.id,
        alertType: alert.type,
        triggerData: alert.data
      },
      status: 'pending'
    });
  }

  private async alertAdmin(parameters: Record<string, any>, alert: PredictiveAlert): Promise<void> {
    // Log admin alert (database table not available)
    console.log('Admin alert:', {
      priority: parameters.priority || alert.severity,
      title: `Predictive Alert: ${alert.title}`,
      description: alert.description,
      category: 'predictive_system',
      data: alert.data
    });
  }

  private async detectProactiveIssues(metrics: Record<string, any>): Promise<PredictiveAlert[]> {
    const alerts: PredictiveAlert[] = [];

    // Capacity planning alert
    if (metrics.queue_depth > 80) {
      alerts.push({
        id: crypto.randomUUID(),
        type: 'optimization',
        severity: 'medium',
        title: 'Capacity Planning Alert',
        description: 'System approaching capacity limits, consider scaling up',
        recommendedActions: [
          'Activate additional agents',
          'Enable GPT-5-mini for cost optimization',
          'Implement request prioritization'
        ],
        estimatedImpact: 'Medium - User experience may degrade',
        confidence: 0.75,
        triggeredAt: new Date(),
        data: { currentQueue: metrics.queue_depth, threshold: 80 }
      });
    }

    // Performance optimization opportunity
    if (metrics.avg_response_time > 15000 && metrics.success_rate > 0.9) {
      alerts.push({
        id: crypto.randomUUID(),
        type: 'optimization',
        severity: 'low',
        title: 'Performance Optimization Opportunity',
        description: 'Response times can be improved while maintaining high success rate',
        recommendedActions: [
          'Optimize agent routing',
          'Implement response caching',
          'Consider model optimization'
        ],
        estimatedImpact: 'Low - Optimization opportunity',
        confidence: 0.65,
        triggeredAt: new Date(),
        data: { responseTime: metrics.avg_response_time, successRate: metrics.success_rate }
      });
    }

    return alerts;
  }

  addEscalationRule(rule: EscalationRule): void {
    this.escalationRules.set(rule.id, rule);
  }

  removeEscalationRule(ruleId: string): boolean {
    return this.escalationRules.delete(ruleId);
  }

  getEscalationRules(): EscalationRule[] {
    return Array.from(this.escalationRules.values());
  }

  private startMonitoring(): void {
    if (this.isMonitoring) return;
    
    this.isMonitoring = true;
    this.monitoringInterval = window.setInterval(async () => {
      try {
        const alerts = await this.analyzeSystemHealth();
        if (alerts.length > 0) {
          console.log('Predictive alerts generated:', alerts);
          // Log alerts (database table not available)
          for (const alert of alerts) {
            console.log('Predictive alert stored:', {
              alert_type: alert.type,
              severity: alert.severity,
              title: alert.title,
              description: alert.description,
              recommended_actions: alert.recommendedActions,
              estimated_impact: alert.estimatedImpact,
              confidence: alert.confidence,
              alert_data: alert.data
            });
          }
        }
      } catch (error) {
        console.error('Predictive monitoring error:', error);
      }
    }, 2 * 60 * 1000); // Check every 2 minutes
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

export const predictiveWorkflowManager = new PredictiveWorkflowManager();