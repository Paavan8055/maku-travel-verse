import { EnhancedBaseAgent } from '../enhanced-base-agent';
import { StandardizedContext } from '../standardized-context';
import { ToolCall, ToolResult } from '../tools/types';
import { supabase } from '@/integrations/supabase/client';

export interface AgentMetadata {
  id: string;
  type: 'travel-expert' | 'booking-specialist' | 'payment-handler' | 'customer-service' | 'general';
  specialization: string[];
  capabilities: string[];
  workload: number;
  status: 'active' | 'busy' | 'paused' | 'terminated';
  createdAt: Date;
  lastActivity: Date;
}

export interface AgentMessage {
  id: string;
  fromAgentId: string;
  toAgentId: string;
  messageType: 'task-delegation' | 'handoff' | 'data-sharing' | 'status-update';
  payload: any;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  timestamp: Date;
  sessionId: string;
}

export interface TaskDelegation {
  id: string;
  parentTaskId?: string;
  assignedTo: string;
  delegatedBy: string;
  taskType: string;
  parameters: any;
  status: 'pending' | 'in-progress' | 'completed' | 'failed';
  priority: number;
  deadline?: Date;
  dependencies: string[];
  result?: any;
  error?: string;
}

export class AgentOrchestrator {
  private agents: Map<string, EnhancedBaseAgent> = new Map();
  private agentMetadata: Map<string, AgentMetadata> = new Map();
  private messageQueue: AgentMessage[] = [];
  private taskDelegations: Map<string, TaskDelegation> = new Map();
  private contexts: Map<string, StandardizedContext> = new Map();

  constructor() {
    this.startMessageProcessor();
  }

  // Agent Factory & Lifecycle Management
  async createAgent(
    type: AgentMetadata['type'], 
    specialization: string[], 
    sessionId: string, 
    userId?: string
  ): Promise<EnhancedBaseAgent> {
    const agentId = `${type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    // Create agent context
    const context = new StandardizedContext(`conv-${agentId}`, agentId, supabase, { 
      sessionId, 
      userId 
    });
    await context.load();
    this.contexts.set(agentId, context);

    // Create agent instance
    const agent = new EnhancedBaseAgent(supabase, agentId, context);
    this.agents.set(agentId, agent);

    // Create metadata
    const metadata: AgentMetadata = {
      id: agentId,
      type,
      specialization,
      capabilities: this.getCapabilitiesByType(type),
      workload: 0,
      status: 'active',
      createdAt: new Date(),
      lastActivity: new Date()
    };
    this.agentMetadata.set(agentId, metadata);

    // Log creation
    await agent.logActivity(userId || 'system', `Agent ${agentId} created with type ${type}`, {
      specialization,
      capabilities: metadata.capabilities
    });

    return agent;
  }

  async terminateAgent(agentId: string): Promise<void> {
    const metadata = this.agentMetadata.get(agentId);
    if (!metadata) return;

    // Save context before termination
    const context = this.contexts.get(agentId);
    if (context) {
      await context.save();
    }

    // Update status
    metadata.status = 'terminated';
    this.agentMetadata.set(agentId, metadata);

    // Clean up resources
    this.agents.delete(agentId);
    this.contexts.delete(agentId);
  }

  async pauseAgent(agentId: string): Promise<void> {
    const metadata = this.agentMetadata.get(agentId);
    if (metadata) {
      metadata.status = 'paused';
      this.agentMetadata.set(agentId, metadata);
    }
  }

  async resumeAgent(agentId: string): Promise<void> {
    const metadata = this.agentMetadata.get(agentId);
    if (metadata && metadata.status === 'paused') {
      metadata.status = 'active';
      metadata.lastActivity = new Date();
      this.agentMetadata.set(agentId, metadata);
    }
  }

  // Agent Communication & Routing
  async sendMessage(message: Omit<AgentMessage, 'id' | 'timestamp'>): Promise<void> {
    const fullMessage: AgentMessage = {
      ...message,
      id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date()
    };

    this.messageQueue.push(fullMessage);
    await this.processMessage(fullMessage);
  }

  async delegateTask(delegation: Omit<TaskDelegation, 'id' | 'status'>): Promise<string> {
    const taskId = `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const fullDelegation: TaskDelegation = {
      ...delegation,
      id: taskId,
      status: 'pending'
    };

    this.taskDelegations.set(taskId, fullDelegation);

    // Send delegation message
    await this.sendMessage({
      fromAgentId: delegation.delegatedBy,
      toAgentId: delegation.assignedTo,
      messageType: 'task-delegation',
      payload: fullDelegation,
      priority: delegation.priority > 2 ? 'high' : 'normal',
      sessionId: ''
    });

    return taskId;
  }

  async handoffToSpecialist(
    fromAgentId: string, 
    specialization: string, 
    context: any, 
    sessionId: string
  ): Promise<string | null> {
    const specialist = this.findBestSpecialist(specialization);
    if (!specialist) return null;

    // Transfer context
    const fromContext = this.contexts.get(fromAgentId);
    const toContext = this.contexts.get(specialist.id);
    
    if (fromContext && toContext) {
      await this.transferContext(fromContext, toContext, context);
    }

    // Send handoff message
    await this.sendMessage({
      fromAgentId,
      toAgentId: specialist.id,
      messageType: 'handoff',
      payload: { context, specialization },
      priority: 'normal',
      sessionId
    });

    return specialist.id;
  }

  // Agent Discovery & Load Balancing
  findBestSpecialist(specialization: string): AgentMetadata | null {
    const candidates = Array.from(this.agentMetadata.values())
      .filter(agent => 
        agent.status === 'active' && 
        agent.specialization.includes(specialization)
      )
      .sort((a, b) => a.workload - b.workload);

    return candidates[0] || null;
  }

  getAvailableAgents(): AgentMetadata[] {
    return Array.from(this.agentMetadata.values())
      .filter(agent => agent.status === 'active');
  }

  getAgentsByType(type: AgentMetadata['type']): AgentMetadata[] {
    return Array.from(this.agentMetadata.values())
      .filter(agent => agent.type === type && agent.status === 'active');
  }

  // System Health & Monitoring
  getSystemMetrics() {
    const agents = Array.from(this.agentMetadata.values());
    const activeAgents = agents.filter(a => a.status === 'active');
    const busyAgents = agents.filter(a => a.status === 'busy');
    const totalWorkload = agents.reduce((sum, a) => sum + a.workload, 0);
    const avgWorkload = agents.length > 0 ? totalWorkload / agents.length : 0;

    return {
      totalAgents: agents.length,
      activeAgents: activeAgents.length,
      busyAgents: busyAgents.length,
      averageWorkload: avgWorkload,
      queuedMessages: this.messageQueue.length,
      activeTasks: Array.from(this.taskDelegations.values())
        .filter(t => t.status === 'in-progress').length
    };
  }

  // Private Methods
  private async processMessage(message: AgentMessage): Promise<void> {
    const targetAgent = this.agents.get(message.toAgentId);
    if (!targetAgent) return;

    const metadata = this.agentMetadata.get(message.toAgentId);
    if (!metadata || metadata.status !== 'active') return;

    try {
      switch (message.messageType) {
        case 'task-delegation':
          await this.handleTaskDelegation(targetAgent, message);
          break;
        case 'handoff':
          await this.handleHandoff(targetAgent, message);
          break;
        case 'data-sharing':
          await this.handleDataSharing(targetAgent, message);
          break;
        case 'status-update':
          await this.handleStatusUpdate(targetAgent, message);
          break;
      }

      // Update agent activity
      if (metadata) {
        metadata.lastActivity = new Date();
        this.agentMetadata.set(message.toAgentId, metadata);
      }
    } catch (error) {
      console.error(`Error processing message ${message.id}:`, error);
    }
  }

  private async handleTaskDelegation(agent: EnhancedBaseAgent, message: AgentMessage): Promise<void> {
    const delegation = message.payload as TaskDelegation;
    
    // Update task status
    delegation.status = 'in-progress';
    this.taskDelegations.set(delegation.id, delegation);

    // Execute task (simplified - would route to appropriate handler)
    try {
      const result = await agent.executeToolsWithContext(
        [{
          id: `tool-${Date.now()}`,
          type: 'function',
          function: {
            name: delegation.taskType,
            arguments: JSON.stringify(delegation.parameters)
          }
        }],
        delegation.delegatedBy
      );
      
      delegation.status = 'completed';
      delegation.result = result;
    } catch (error) {
      delegation.status = 'failed';
      delegation.error = error instanceof Error ? error.message : 'Unknown error';
    }

    this.taskDelegations.set(delegation.id, delegation);
  }

  private async handleHandoff(agent: EnhancedBaseAgent, message: AgentMessage): Promise<void> {
    // Handle context handoff between agents
    const payload = message.payload;
    await agent.logActivity('system', `Received handoff from ${message.fromAgentId}`, payload);
  }

  private async handleDataSharing(agent: EnhancedBaseAgent, message: AgentMessage): Promise<void> {
    // Handle data sharing between agents
    const context = this.contexts.get(message.toAgentId);
    if (context) {
      context.setSharedData(`shared_${message.fromAgentId}`, message.payload);
      await context.save();
    }
  }

  private async handleStatusUpdate(agent: EnhancedBaseAgent, message: AgentMessage): Promise<void> {
    // Handle status updates between agents
    await agent.logActivity('system', `Status update from ${message.fromAgentId}`, message.payload);
  }

  private async transferContext(from: StandardizedContext, to: StandardizedContext, data: any): Promise<void> {
    // Transfer relevant context between agents
    to.setSharedData('handoff_context', {
      from: from.getState().agentId,
      data,
      timestamp: new Date().toISOString()
    });
    await to.save();
  }

  private getCapabilitiesByType(type: AgentMetadata['type']): string[] {
    const capabilityMap = {
      'travel-expert': ['destination-research', 'itinerary-planning', 'travel-advice', 'cultural-insights'],
      'booking-specialist': ['flight-booking', 'hotel-booking', 'activity-booking', 'package-deals'],
      'payment-handler': ['payment-processing', 'refunds', 'billing-support', 'fraud-detection'],
      'customer-service': ['support-chat', 'issue-resolution', 'feedback-collection', 'escalation'],
      'general': ['basic-chat', 'information-lookup', 'task-routing']
    };
    
    return capabilityMap[type] || ['basic-operations'];
  }

  private startMessageProcessor(): void {
    // Process messages every 100ms
    setInterval(() => {
      if (this.messageQueue.length > 0) {
        const message = this.messageQueue.shift();
        if (message) {
          this.processMessage(message).catch(console.error);
        }
      }
    }, 100);
  }
}