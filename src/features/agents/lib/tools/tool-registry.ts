import { Tool, ToolDefinition, ToolMetrics } from './types';

export class ToolRegistry {
  private tools = new Map<string, Tool>();
  private metrics = new Map<string, ToolMetrics>();
  private categories = new Map<string, string[]>();

  register(tool: Tool): void {
    this.tools.set(tool.definition.name, tool);
    
    // Initialize metrics
    this.metrics.set(tool.definition.name, {
      toolName: tool.definition.name,
      executionCount: 0,
      averageExecutionTime: 0,
      successRate: 1,
      lastExecuted: new Date(),
      errorCounts: {}
    });

    // Register category
    const category = tool.definition.category || 'general';
    if (!this.categories.has(category)) {
      this.categories.set(category, []);
    }
    this.categories.get(category)!.push(tool.definition.name);
  }

  unregister(toolName: string): boolean {
    return this.tools.delete(toolName);
  }

  get(toolName: string): Tool | undefined {
    return this.tools.get(toolName);
  }

  getByCategory(category: string): Tool[] {
    const toolNames = this.categories.get(category) || [];
    return toolNames.map(name => this.tools.get(name)!).filter(Boolean);
  }

  getAllDefinitions(): ToolDefinition[] {
    return Array.from(this.tools.values()).map(tool => tool.definition);
  }

  getAvailableTools(agentId?: string): ToolDefinition[] {
    // Future: filter by agent permissions or capabilities
    return this.getAllDefinitions();
  }

  updateMetrics(toolName: string, executionTime: number, success: boolean, error?: string): void {
    const metrics = this.metrics.get(toolName);
    if (!metrics) return;

    metrics.executionCount++;
    metrics.averageExecutionTime = 
      (metrics.averageExecutionTime * (metrics.executionCount - 1) + executionTime) / metrics.executionCount;
    metrics.successRate = 
      (metrics.successRate * (metrics.executionCount - 1) + (success ? 1 : 0)) / metrics.executionCount;
    metrics.lastExecuted = new Date();

    if (!success && error) {
      metrics.errorCounts[error] = (metrics.errorCounts[error] || 0) + 1;
    }
  }

  getMetrics(toolName?: string): ToolMetrics | ToolMetrics[] {
    if (toolName) {
      return this.metrics.get(toolName) || this.createEmptyMetrics(toolName);
    }
    return Array.from(this.metrics.values());
  }

  private createEmptyMetrics(toolName: string): ToolMetrics {
    return {
      toolName,
      executionCount: 0,
      averageExecutionTime: 0,
      successRate: 0,
      lastExecuted: new Date(0),
      errorCounts: {}
    };
  }

  // Generate OpenAI-compatible tool definitions
  getOpenAITools(): any[] {
    return this.getAllDefinitions().map(def => ({
      type: 'function',
      function: {
        name: def.name,
        description: def.description,
        parameters: def.parameters
      }
    }));
  }
}

// Global tool registry instance
export const globalToolRegistry = new ToolRegistry();