import { ToolCall, ToolResult, ToolChainDefinition, ToolChainStep, ToolExecutionContext } from './types';
import { ToolExecutor } from './tool-executor';
import { StandardizedContext } from '../standardized-context';

export class ToolChain {
  private executor: ToolExecutor;
  private definition: ToolChainDefinition;
  private executionHistory: ToolResult[][] = [];

  constructor(definition: ToolChainDefinition, executor?: ToolExecutor) {
    this.definition = definition;
    this.executor = executor || new ToolExecutor();
  }

  async execute(
    initialParams: Record<string, any>,
    context: ToolExecutionContext,
    standardizedContext?: StandardizedContext
  ): Promise<ToolResult[]> {
    const allResults: ToolResult[] = [];
    this.executionHistory = [];

    try {
      for (let i = 0; i < this.definition.steps.length; i++) {
        const step = this.definition.steps[i];
        
        // Check condition if exists
        if (step.condition && !step.condition(allResults)) {
          console.log(`Skipping step ${i + 1}: condition not met`);
          continue;
        }

        // Prepare parameters
        let stepParams = step.parameters;
        if (step.mapPreviousResult && allResults.length > 0) {
          const mappedParams = step.mapPreviousResult(allResults);
          stepParams = { ...stepParams, ...mappedParams };
        }

        // Add initial params to first step or if no mapping function
        if (i === 0 || !step.mapPreviousResult) {
          stepParams = { ...initialParams, ...stepParams };
        }

        // Create tool call
        const toolCall: ToolCall = {
          id: `chain_${this.definition.id}_step_${i + 1}`,
          type: 'function',
          function: {
            name: step.toolName,
            arguments: JSON.stringify(stepParams)
          }
        };

        // Execute step
        const stepResult = await this.executor.execute(toolCall, context, standardizedContext);
        allResults.push(stepResult);
        this.executionHistory.push([stepResult]);

        // If step failed and rollback is enabled, rollback
        if (!stepResult.success && this.definition.rollbackOnFailure) {
          await this.rollback(context, standardizedContext);
          throw new Error(`Chain execution failed at step ${i + 1}: ${stepResult.error}`);
        }

        // Add chain progress to context
        if (standardizedContext) {
          standardizedContext.setSharedData(`chain_${this.definition.id}_progress`, {
            currentStep: i + 1,
            totalSteps: this.definition.steps.length,
            completed: (i + 1) / this.definition.steps.length,
            results: allResults.map(r => ({ success: r.success, error: r.error }))
          });
        }
      }

      return allResults;
    } catch (error) {
      if (this.definition.rollbackOnFailure) {
        await this.rollback(context, standardizedContext);
      }
      throw error;
    }
  }

  private async rollback(
    context: ToolExecutionContext,
    standardizedContext?: StandardizedContext
  ): Promise<void> {
    // Implementation would depend on specific rollback strategies
    // For now, just log the rollback attempt
    console.log(`Rolling back chain ${this.definition.id}`);
    
    if (standardizedContext) {
      standardizedContext.setSharedData(`chain_${this.definition.id}_rollback`, {
        timestamp: new Date().toISOString(),
        steps_rolled_back: this.executionHistory.length
      });
    }
  }

  getProgress(): { current: number; total: number; percentage: number } {
    return {
      current: this.executionHistory.length,
      total: this.definition.steps.length,
      percentage: (this.executionHistory.length / this.definition.steps.length) * 100
    };
  }

  getResults(): ToolResult[] {
    return this.executionHistory.flat();
  }
}

export class ToolChainRegistry {
  private chains = new Map<string, ToolChainDefinition>();

  register(definition: ToolChainDefinition): void {
    this.chains.set(definition.id, definition);
  }

  get(chainId: string): ToolChainDefinition | undefined {
    return this.chains.get(chainId);
  }

  createChain(chainId: string, executor?: ToolExecutor): ToolChain | null {
    const definition = this.get(chainId);
    if (!definition) return null;
    
    return new ToolChain(definition, executor);
  }

  getAllChains(): ToolChainDefinition[] {
    return Array.from(this.chains.values());
  }
}

// Global chain registry
export const globalChainRegistry = new ToolChainRegistry();