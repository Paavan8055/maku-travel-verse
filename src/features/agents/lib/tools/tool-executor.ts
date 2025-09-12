import { Tool, ToolCall, ToolResult, ToolExecutionContext } from './types';
import { globalToolRegistry } from './tool-registry';
import { StandardizedContext } from '../standardized-context';

export class ToolExecutor {
  private maxRetries = 3;
  private retryDelay = 1000; // ms

  async execute(
    toolCall: ToolCall,
    context: ToolExecutionContext,
    standardizedContext?: StandardizedContext
  ): Promise<ToolResult> {
    const startTime = Date.now();
    const tool = globalToolRegistry.get(toolCall.function.name);

    if (!tool) {
      const result: ToolResult = {
        id: toolCall.id,
        success: false,
        result: null,
        error: `Tool '${toolCall.function.name}' not found`,
        executionTime: Date.now() - startTime
      };
      
      this.logExecution(toolCall, result, context);
      return result;
    }

    let params: Record<string, any>;
    try {
      params = JSON.parse(toolCall.function.arguments);
    } catch (error) {
      const result: ToolResult = {
        id: toolCall.id,
        success: false,
        result: null,
        error: `Invalid parameters: ${error.message}`,
        executionTime: Date.now() - startTime
      };
      
      this.logExecution(toolCall, result, context);
      return result;
    }

    // Validate parameters if schema exists
    if (tool.validate && !tool.validate(params)) {
      const result: ToolResult = {
        id: toolCall.id,
        success: false,
        result: null,
        error: 'Parameter validation failed',
        executionTime: Date.now() - startTime
      };
      
      this.logExecution(toolCall, result, context);
      return result;
    }

    // Execute with retry logic
    let lastError: any;
    for (let attempt = 0; attempt < this.maxRetries; attempt++) {
      try {
        const result = await tool.execute(params, {
          ...context,
          standardizedContext,
          attempt: attempt + 1
        });

        result.executionTime = Date.now() - startTime;
        
        // Add result to standardized context if provided
        if (standardizedContext) {
          standardizedContext.addToolResult(
            toolCall.id,
            result.result,
            result.success,
            result.error
          );
        }

        this.logExecution(toolCall, result, context);
        globalToolRegistry.updateMetrics(
          toolCall.function.name,
          result.executionTime!,
          result.success,
          result.error
        );

        return result;
      } catch (error) {
        lastError = error;
        if (attempt < this.maxRetries - 1) {
          await this.delay(this.retryDelay * Math.pow(2, attempt));
        }
      }
    }

    const result: ToolResult = {
      id: toolCall.id,
      success: false,
      result: null,
      error: `Tool execution failed after ${this.maxRetries} attempts: ${lastError?.message || 'Unknown error'}`,
      executionTime: Date.now() - startTime
    };

    this.logExecution(toolCall, result, context);
    globalToolRegistry.updateMetrics(
      toolCall.function.name,
      result.executionTime!,
      false,
      result.error
    );

    return result;
  }

  async executeMultiple(
    toolCalls: ToolCall[],
    context: ToolExecutionContext,
    standardizedContext?: StandardizedContext
  ): Promise<ToolResult[]> {
    const promises = toolCalls.map(toolCall => 
      this.execute(toolCall, context, standardizedContext)
    );

    return Promise.all(promises);
  }

  private logExecution(
    toolCall: ToolCall,
    result: ToolResult,
    context: ToolExecutionContext
  ): void {
    console.log(`Tool Execution: ${toolCall.function.name}`, {
      toolCallId: toolCall.id,
      agentId: context.agentId,
      success: result.success,
      executionTime: result.executionTime,
      error: result.error
    });
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Batch execute tools with dependency resolution
  async executeBatch(
    toolCalls: ToolCall[],
    context: ToolExecutionContext,
    standardizedContext?: StandardizedContext
  ): Promise<ToolResult[]> {
    const results: ToolResult[] = [];
    const remaining = [...toolCalls];

    while (remaining.length > 0) {
      const ready: ToolCall[] = [];
      const notReady: ToolCall[] = [];

      for (const toolCall of remaining) {
        const tool = globalToolRegistry.get(toolCall.function.name);
        if (!tool || !tool.definition.dependencies || tool.definition.dependencies.length === 0) {
          ready.push(toolCall);
        } else {
          // Check if dependencies are satisfied
          const dependenciesSatisfied = tool.definition.dependencies.every(dep =>
            results.some(r => r.success && 
              toolCalls.find(tc => tc.id === r.id)?.function.name === dep
            )
          );
          
          if (dependenciesSatisfied) {
            ready.push(toolCall);
          } else {
            notReady.push(toolCall);
          }
        }
      }

      if (ready.length === 0) {
        // Circular dependency or missing dependency
        throw new Error('Circular dependency detected or missing required tools');
      }

      const batchResults = await this.executeMultiple(ready, context, standardizedContext);
      results.push(...batchResults);
      remaining.splice(0, remaining.length, ...notReady);
    }

    return results;
  }
}