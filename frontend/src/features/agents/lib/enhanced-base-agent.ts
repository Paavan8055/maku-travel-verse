import { SupabaseClient } from '@supabase/supabase-js';
import { StandardizedContext } from './standardized-context';
import { ToolExecutor, globalToolRegistry } from './tools';
import { globalChainRegistry } from './tools/tool-chain';
import { ToolCall, ToolResult, ToolExecutionContext } from './tools/types';

// Base class with agent functionality
class BaseAgentCore {
  protected supabase: SupabaseClient;
  protected agentId: string;
  protected context?: StandardizedContext;

  constructor(supabase: SupabaseClient, agentId: string, context?: StandardizedContext) {
    this.supabase = supabase;
    this.agentId = agentId;
    this.context = context;
  }

  async logActivity(userId: string, activityType: string, metadata: any = {}): Promise<void> {
    try {
      await this.supabase
        .from('user_activity_logs')
        .insert({
          user_id: userId,
          activity_type: activityType,
          item_type: 'agent_action',
          item_id: this.agentId,
          item_data: metadata,
          session_id: crypto.randomUUID()
        });
    } catch (error) {
      console.error('Failed to log activity:', error);
    }
  }
}

export class EnhancedBaseAgent extends BaseAgentCore {
  private toolExecutor: ToolExecutor;

  constructor(supabase: SupabaseClient, agentId: string, context?: StandardizedContext) {
    super(supabase, agentId, context);
    this.toolExecutor = new ToolExecutor();
  }

  // Enhanced tool execution with full context integration
  async executeToolsWithContext(
    toolCalls: ToolCall[], 
    userId?: string,
    metadata?: Record<string, any>
  ): Promise<ToolResult[]> {
    const executionContext: ToolExecutionContext = {
      userId,
      agentId: this.agentId,
      conversationId: this.context?.getState().conversationId || crypto.randomUUID(),
      sessionId: crypto.randomUUID(),
      metadata
    };

    // Execute tools and automatically integrate results into context
    const results = await this.toolExecutor.executeMultiple(
      toolCalls, 
      executionContext, 
      this.context
    );

    // Log activity for each tool execution
    for (const result of results) {
      await this.logActivity(userId || 'system', 'tool_execution', {
        toolName: toolCalls.find(tc => tc.id === result.id)?.function.name,
        success: result.success,
        executionTime: result.executionTime,
        error: result.error
      });
    }

    return results;
  }

  // Execute a predefined tool chain
  async executeWorkflow(
    chainId: string, 
    initialParams: Record<string, any>, 
    userId?: string
  ): Promise<ToolResult[]> {
    const chain = globalChainRegistry.createChain(chainId, this.toolExecutor);
    if (!chain) {
      throw new Error(`Workflow '${chainId}' not found`);
    }

    const executionContext: ToolExecutionContext = {
      userId,
      agentId: this.agentId,
      conversationId: this.context?.getState().conversationId || crypto.randomUUID(),
      sessionId: crypto.randomUUID()
    };

    const results = await chain.execute(initialParams, executionContext, this.context);

    // Log workflow execution
    await this.logActivity(userId || 'system', 'workflow_execution', {
      chainId,
      success: results.every(r => r.success),
      totalSteps: results.length,
      failedSteps: results.filter(r => !r.success).length
    });

    return results;
  }

  // Get agent capabilities including available tools
  async getCapabilities(): Promise<{
    tools: any[];
    workflows: any[];
    metrics: any;
  }> {
    const tools = globalToolRegistry.getAvailableTools(this.agentId);
    const workflows = globalChainRegistry.getAllChains();
    const metrics = globalToolRegistry.getMetrics();

    return {
      tools: tools.map(tool => ({
        name: tool.name,
        description: tool.description,
        category: tool.category,
        parameters: tool.parameters
      })),
      workflows: workflows.map(workflow => ({
        id: workflow.id,
        name: workflow.name,
        description: workflow.description,
        stepCount: workflow.steps.length
      })),
      metrics: Array.isArray(metrics) ? metrics : [metrics]
    };
  }

  // Smart tool recommendation based on context
  async recommendTools(intent: string, context?: Record<string, any>): Promise<string[]> {
    const allTools = globalToolRegistry.getAllDefinitions();
    const recommended: string[] = [];

    // Simple keyword-based recommendation (can be enhanced with ML)
    const intentLower = intent.toLowerCase();
    
    if (intentLower.includes('flight') || intentLower.includes('fly')) {
      recommended.push('search_flights');
    }
    
    if (intentLower.includes('hotel') || intentLower.includes('accommodation')) {
      recommended.push('search_hotels');
    }
    
    if (intentLower.includes('activity') || intentLower.includes('experience')) {
      recommended.push('search_activities');
    }
    
    if (intentLower.includes('booking') || intentLower.includes('reservation')) {
      recommended.push('get_booking_status');
    }

    // Add tools based on context
    if (context?.travelType === 'business') {
      recommended.push('search_flights'); // Prioritize flights for business
    }

    return recommended;
  }

  // Validate tool parameters before execution
  async validateToolCall(toolCall: ToolCall): Promise<{ valid: boolean; errors: string[] }> {
    const tool = globalToolRegistry.get(toolCall.function.name);
    if (!tool) {
      return { valid: false, errors: [`Tool '${toolCall.function.name}' not found`] };
    }

    try {
      const params = JSON.parse(toolCall.function.arguments);
      
      if (tool.schema) {
        const result = tool.schema.safeParse(params);
        if (!result.success) {
          return { 
            valid: false, 
            errors: result.error.errors.map(e => `${e.path.join('.')}: ${e.message}`)
          };
        }
      }

      if (tool.validate && !tool.validate(params)) {
        return { valid: false, errors: ['Custom validation failed'] };
      }

      return { valid: true, errors: [] };
    } catch (error) {
      return { valid: false, errors: [`Invalid JSON parameters: ${error.message}`] };
    }
  }
}