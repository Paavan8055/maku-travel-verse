import type { SupabaseClient } from '@supabase/supabase-js';
import { PromptChainingSystem, type PromptChain, type ChainExecution } from './prompt-chaining-system';
import { DynamicToolSelector, type ToolContext, type ToolSelection } from './dynamic-tool-selector';
import { ParallelExecutionEngine, type ParallelTask, type TaskResult } from './parallel-execution-engine';

export interface ParallelChainRequest {
  chains: ParallelChainConfig[];
  mergeStrategy: 'concatenate' | 'consensus' | 'best_result' | 'weighted_average';
  maxConcurrency: number;
  timeoutMs: number;
  user_id?: string;
  context: Record<string, any>;
}

export interface ParallelChainConfig {
  chainId: string;
  weight: number; // For weighted merge strategies
  priority: 'low' | 'medium' | 'high' | 'critical';
  required: boolean; // Must succeed for overall success
  fallbackChain?: string;
  parameters: Record<string, any>;
}

export interface ChainResult {
  chainId: string;
  success: boolean;
  result: any;
  confidence: number;
  executionTime: number;
  reasoning: string[];
  error?: string;
}

export interface MergedResult {
  success: boolean;
  final_result: any;
  confidence: number;
  individual_results: ChainResult[];
  merge_strategy: string;
  total_execution_time: number;
  consensus_score?: number;
  reasoning: {
    merge_logic: string;
    conflicts_resolved: string[];
    confidence_factors: string[];
  };
}

export class ParallelChainExecutor {
  private supabase: SupabaseClient;
  private promptChaining: PromptChainingSystem;
  private toolSelector: DynamicToolSelector;
  private executionEngine: ParallelExecutionEngine;
  private executionHistory: Map<string, MergedResult>;

  constructor(supabase: SupabaseClient) {
    this.supabase = supabase;
    this.promptChaining = new PromptChainingSystem(supabase);
    this.toolSelector = new DynamicToolSelector(supabase);
    this.executionEngine = new ParallelExecutionEngine(supabase);
    this.executionHistory = new Map();
  }

  async executeParallelChains(request: ParallelChainRequest): Promise<MergedResult> {
    const startTime = Date.now();
    
    console.log(`🔗 Starting parallel chain execution with ${request.chains.length} chains`);
    
    try {
      // Convert chains to parallel tasks
      const tasks = await this.convertChainsToTasks(request);
      
      // Execute chains in parallel
      const taskResults = await this.executionEngine.executeBatch({
        batchId: `parallel_chains_${Date.now()}`,
        tasks,
        strategy: 'parallel_optimized',
        maxConcurrency: request.maxConcurrency,
        totalEstimatedTime: this.estimateTotalTime(tasks)
      });
      
      // Convert task results to chain results
      const chainResults = await this.convertTasksToChainResults(taskResults, request);
      
      // Merge results based on strategy
      const mergedResult = await this.mergeResults(chainResults, request);
      
      // Store execution history
      const executionId = `exec_${Date.now()}`;
      this.executionHistory.set(executionId, mergedResult);
      
      // Log performance metrics
      await this.logExecutionMetrics(request, mergedResult);
      
      return mergedResult;
      
    } catch (error) {
      console.error('Parallel chain execution failed:', error);
      
      return {
        success: false,
        final_result: null,
        confidence: 0,
        individual_results: [],
        merge_strategy: request.mergeStrategy,
        total_execution_time: Date.now() - startTime,
        reasoning: {
          merge_logic: 'Execution failed before merging',
          conflicts_resolved: [],
          confidence_factors: [`Error: ${error instanceof Error ? error.message : 'Unknown error'}`]
        }
      };
    }
  }

  private async convertChainsToTasks(request: ParallelChainRequest): Promise<ParallelTask[]> {
    const tasks: ParallelTask[] = [];
    
    for (const chainConfig of request.chains) {
      // Select optimal tools for this chain
      const toolContext: ToolContext = {
        user_id: request.user_id,
        task_type: 'prompt_chain_execution',
        priority: chainConfig.priority,
        required_capabilities: ['text_analysis', 'reasoning'],
        context_data: {
          chain_id: chainConfig.chainId,
          ...chainConfig.parameters,
          ...request.context
        }
      };
      
      const toolSelection = await this.toolSelector.selectOptimalTool(toolContext);
      
      tasks.push({
        id: `chain_${chainConfig.chainId}_${Date.now()}`,
        agentId: 'prompt_chain_executor',
        taskType: 'execute_chain',
        input: {
          chainId: chainConfig.chainId,
          parameters: chainConfig.parameters,
          context: request.context,
          tool_selection: toolSelection
        },
        priority: chainConfig.priority,
        estimatedDuration: toolSelection.estimated_time,
        resourceRequirements: {
          memory: 100,
          cpu: 80,
          concurrent_limit: 1
        }
      });
    }
    
    return tasks;
  }

  private estimateTotalTime(tasks: ParallelTask[]): number {
    return Math.max(...tasks.map(t => t.estimatedDuration));
  }

  private async convertTasksToChainResults(
    taskResults: TaskResult[], 
    request: ParallelChainRequest
  ): Promise<ChainResult[]> {
    const chainResults: ChainResult[] = [];
    
    for (let i = 0; i < taskResults.length; i++) {
      const taskResult = taskResults[i];
      const chainConfig = request.chains[i];
      
      if (taskResult.success && taskResult.result) {
        chainResults.push({
          chainId: chainConfig.chainId,
          success: true,
          result: taskResult.result.final_result,
          confidence: taskResult.confidence || 0.8,
          executionTime: taskResult.executionTime,
          reasoning: taskResult.result.reasoning || [],
          error: undefined
        });
      } else {
        // Try fallback chain if available
        if (chainConfig.fallbackChain) {
          console.log(`🔄 Attempting fallback chain for ${chainConfig.chainId}`);
          const fallbackResult = await this.executeFallbackChain(chainConfig.fallbackChain, request);
          chainResults.push(fallbackResult);
        } else {
          chainResults.push({
            chainId: chainConfig.chainId,
            success: false,
            result: null,
            confidence: 0,
            executionTime: taskResult.executionTime,
            reasoning: [],
            error: taskResult.error || 'Chain execution failed'
          });
        }
      }
    }
    
    return chainResults;
  }

  private async executeFallbackChain(
    fallbackChainId: string, 
    request: ParallelChainRequest
  ): Promise<ChainResult> {
    try {
      const execution = await this.promptChaining.executePromptChain(
        fallbackChainId,
        request.context,
        request.user_id
      );
      
      return {
        chainId: fallbackChainId,
        success: execution.step_results.every(step => step.success),
        result: execution.final_result,
        confidence: this.calculateChainConfidence(execution),
        executionTime: execution.total_execution_time_ms || 0,
        reasoning: execution.step_results.map(step => step.reasoning)
      };
    } catch (error) {
      return {
        chainId: fallbackChainId,
        success: false,
        result: null,
        confidence: 0,
        executionTime: 0,
        reasoning: [],
        error: `Fallback failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  private calculateChainConfidence(execution: ChainExecution): number {
    if (execution.step_results.length === 0) return 0;
    
    const successfulSteps = execution.step_results.filter(step => step.success).length;
    return successfulSteps / execution.step_results.length;
  }

  private async mergeResults(
    chainResults: ChainResult[], 
    request: ParallelChainRequest
  ): Promise<MergedResult> {
    const startTime = Date.now();
    const successfulResults = chainResults.filter(r => r.success);
    const requiredResults = chainResults.filter((r, i) => request.chains[i].required);
    const requiredSuccessful = requiredResults.filter(r => r.success);
    
    // Check if all required chains succeeded
    const overallSuccess = requiredResults.length === 0 || requiredSuccessful.length === requiredResults.length;
    
    let finalResult: any;
    let confidence: number;
    let consensusScore: number | undefined;
    let mergeLogic: string;
    let conflictsResolved: string[] = [];
    let confidenceFactors: string[] = [];
    
    switch (request.mergeStrategy) {
      case 'concatenate':
        finalResult = this.concatenateResults(successfulResults);
        confidence = this.calculateAverageConfidence(successfulResults);
        mergeLogic = `Concatenated ${successfulResults.length} successful results`;
        break;
        
      case 'consensus':
        const consensusResult = this.findConsensus(successfulResults);
        finalResult = consensusResult.result;
        confidence = consensusResult.confidence;
        consensusScore = consensusResult.consensusScore;
        conflictsResolved = consensusResult.conflicts;
        mergeLogic = `Found consensus among ${consensusResult.agreementCount}/${successfulResults.length} results`;
        break;
        
      case 'best_result':
        const bestResult = this.selectBestResult(successfulResults);
        finalResult = bestResult.result;
        confidence = bestResult.confidence;
        mergeLogic = `Selected best result from chain ${bestResult.chainId} with ${(bestResult.confidence * 100).toFixed(1)}% confidence`;
        break;
        
      case 'weighted_average':
        const weightedResult = this.calculateWeightedAverage(successfulResults, request.chains);
        finalResult = weightedResult.result;
        confidence = weightedResult.confidence;
        mergeLogic = `Calculated weighted average using chain weights`;
        confidenceFactors = weightedResult.factors;
        break;
        
      default:
        finalResult = successfulResults.length > 0 ? successfulResults[0].result : null;
        confidence = successfulResults.length > 0 ? successfulResults[0].confidence : 0;
        mergeLogic = 'Default: used first successful result';
    }
    
    // Add confidence factors
    confidenceFactors.push(`${successfulResults.length}/${chainResults.length} chains succeeded`);
    if (requiredResults.length > 0) {
      confidenceFactors.push(`${requiredSuccessful.length}/${requiredResults.length} required chains succeeded`);
    }
    
    return {
      success: overallSuccess && successfulResults.length > 0,
      final_result: finalResult,
      confidence,
      individual_results: chainResults,
      merge_strategy: request.mergeStrategy,
      total_execution_time: Date.now() - startTime,
      consensus_score: consensusScore,
      reasoning: {
        merge_logic: mergeLogic,
        conflicts_resolved: conflictsResolved,
        confidence_factors: confidenceFactors
      }
    };
  }

  private concatenateResults(results: ChainResult[]): any {
    if (results.length === 0) return null;
    if (results.length === 1) return results[0].result;
    
    // If all results are strings, concatenate them
    if (results.every(r => typeof r.result === 'string')) {
      return results.map(r => r.result).join('\n\n');
    }
    
    // If all results are arrays, concatenate arrays
    if (results.every(r => Array.isArray(r.result))) {
      return results.flatMap(r => r.result);
    }
    
    // If all results are objects, merge them
    if (results.every(r => typeof r.result === 'object' && r.result !== null)) {
      return results.reduce((merged, r) => ({ ...merged, ...r.result }), {});
    }
    
    // Otherwise, return as array
    return results.map(r => r.result);
  }

  private findConsensus(results: ChainResult[]): {
    result: any;
    confidence: number;
    consensusScore: number;
    agreementCount: number;
    conflicts: string[];
  } {
    if (results.length === 0) {
      return { result: null, confidence: 0, consensusScore: 0, agreementCount: 0, conflicts: [] };
    }
    
    if (results.length === 1) {
      return { 
        result: results[0].result, 
        confidence: results[0].confidence, 
        consensusScore: 1.0, 
        agreementCount: 1, 
        conflicts: [] 
      };
    }
    
    // For string results, find most common
    if (results.every(r => typeof r.result === 'string')) {
      const counts = new Map<string, number>();
      results.forEach(r => {
        counts.set(r.result, (counts.get(r.result) || 0) + 1);
      });
      
      const [mostCommon, count] = [...counts.entries()].reduce((a, b) => a[1] > b[1] ? a : b);
      const consensusScore = count / results.length;
      
      return {
        result: mostCommon,
        confidence: this.calculateWeightedConfidence(results.filter(r => r.result === mostCommon)),
        consensusScore,
        agreementCount: count,
        conflicts: results.length > count ? [`${results.length - count} results disagreed`] : []
      };
    }
    
    // For object results, find common properties
    if (results.every(r => typeof r.result === 'object' && r.result !== null)) {
      const allKeys = new Set<string>();
      results.forEach(r => Object.keys(r.result).forEach(key => allKeys.add(key)));
      
      const consensus: any = {};
      const conflicts: string[] = [];
      
      for (const key of allKeys) {
        const values = results
          .filter(r => key in r.result)
          .map(r => r.result[key]);
        
        if (values.length === 0) continue;
        
        const uniqueValues = [...new Set(values)];
        if (uniqueValues.length === 1) {
          consensus[key] = uniqueValues[0];
        } else {
          // Take the value from the most confident result
          const bestResult = results
            .filter(r => key in r.result)
            .reduce((a, b) => a.confidence > b.confidence ? a : b);
          consensus[key] = bestResult.result[key];
          conflicts.push(`Conflict in ${key}: resolved using highest confidence result`);
        }
      }
      
      const agreementCount = results.length - conflicts.length;
      
      return {
        result: consensus,
        confidence: this.calculateAverageConfidence(results),
        consensusScore: agreementCount / results.length,
        agreementCount,
        conflicts
      };
    }
    
    // Default: return highest confidence result
    const bestResult = results.reduce((a, b) => a.confidence > b.confidence ? a : b);
    return {
      result: bestResult.result,
      confidence: bestResult.confidence,
      consensusScore: 1 / results.length,
      agreementCount: 1,
      conflicts: [`Used highest confidence result, ${results.length - 1} others ignored`]
    };
  }

  private selectBestResult(results: ChainResult[]): ChainResult {
    if (results.length === 0) {
      return {
        chainId: 'none',
        success: false,
        result: null,
        confidence: 0,
        executionTime: 0,
        reasoning: []
      };
    }
    
    return results.reduce((best, current) => {
      // Prioritize by confidence, then by execution time (faster is better)
      if (current.confidence > best.confidence) {
        return current;
      } else if (current.confidence === best.confidence && current.executionTime < best.executionTime) {
        return current;
      }
      return best;
    });
  }

  private calculateWeightedAverage(
    results: ChainResult[], 
    chainConfigs: ParallelChainConfig[]
  ): { result: any; confidence: number; factors: string[] } {
    if (results.length === 0) {
      return { result: null, confidence: 0, factors: ['No successful results'] };
    }
    
    const factors: string[] = [];
    
    // For numeric results, calculate weighted average
    if (results.every(r => typeof r.result === 'number')) {
      let weightedSum = 0;
      let totalWeight = 0;
      
      results.forEach(result => {
        const config = chainConfigs.find(c => c.chainId === result.chainId);
        const weight = config ? config.weight : 1;
        weightedSum += result.result * weight * result.confidence;
        totalWeight += weight * result.confidence;
      });
      
      const averageResult = totalWeight > 0 ? weightedSum / totalWeight : 0;
      const averageConfidence = this.calculateWeightedConfidence(results);
      
      factors.push(`Weighted by chain weights and confidence scores`);
      factors.push(`Total weight: ${totalWeight.toFixed(2)}`);
      
      return { result: averageResult, confidence: averageConfidence, factors };
    }
    
    // For other types, use confidence-weighted selection
    const totalConfidence = results.reduce((sum, r) => sum + r.confidence, 0);
    const random = Math.random() * totalConfidence;
    
    let cumulative = 0;
    for (const result of results) {
      cumulative += result.confidence;
      if (random <= cumulative) {
        factors.push(`Selected based on confidence-weighted random sampling`);
        factors.push(`Confidence: ${(result.confidence * 100).toFixed(1)}%`);
        return { result: result.result, confidence: result.confidence, factors };
      }
    }
    
    // Fallback to highest confidence
    const best = results.reduce((a, b) => a.confidence > b.confidence ? a : b);
    factors.push(`Fallback to highest confidence result`);
    return { result: best.result, confidence: best.confidence, factors };
  }

  private calculateAverageConfidence(results: ChainResult[]): number {
    if (results.length === 0) return 0;
    return results.reduce((sum, r) => sum + r.confidence, 0) / results.length;
  }

  private calculateWeightedConfidence(results: ChainResult[]): number {
    if (results.length === 0) return 0;
    
    const totalWeight = results.reduce((sum, r) => sum + r.confidence, 0);
    if (totalWeight === 0) return 0;
    
    return results.reduce((sum, r) => sum + (r.confidence * r.confidence), 0) / totalWeight;
  }

  private async logExecutionMetrics(
    request: ParallelChainRequest, 
    result: MergedResult
  ): Promise<void> {
    try {
      await this.supabase.from('agent_performance_metrics').insert({
        agent_id: 'parallel_chain_executor',
        task_type: 'parallel_chain_execution',
        execution_time_ms: result.total_execution_time,
        success: result.success,
        resource_usage: {
          chains_executed: request.chains.length,
          successful_chains: result.individual_results.filter(r => r.success).length,
          merge_strategy: request.mergeStrategy,
          max_concurrency: request.maxConcurrency
        },
        confidence_score: result.confidence,
        context_data: {
          consensus_score: result.consensus_score,
          conflicts_resolved: result.reasoning.conflicts_resolved.length,
          user_id: request.user_id
        },
        metric_date: new Date().toISOString()
      });
    } catch (error) {
      console.error('Failed to log execution metrics:', error);
    }
  }

  async getExecutionHistory(limit: number = 10): Promise<MergedResult[]> {
    return Array.from(this.executionHistory.values()).slice(-limit);
  }

  async getPerformanceAnalytics(): Promise<{
    total_executions: number;
    success_rate: number;
    average_execution_time: number;
    merge_strategy_performance: Record<string, { success_rate: number; avg_time: number }>;
    chain_reliability: Record<string, number>;
  }> {
    const history = Array.from(this.executionHistory.values());
    const totalExecutions = history.length;
    const successfulExecutions = history.filter(h => h.success).length;
    const avgExecutionTime = totalExecutions > 0 
      ? history.reduce((sum, h) => sum + h.total_execution_time, 0) / totalExecutions 
      : 0;
    
    // Analyze merge strategy performance
    const strategyPerformance: Record<string, { success_rate: number; avg_time: number }> = {};
    const strategies = [...new Set(history.map(h => h.merge_strategy))];
    
    strategies.forEach(strategy => {
      const strategyResults = history.filter(h => h.merge_strategy === strategy);
      const successRate = strategyResults.filter(r => r.success).length / strategyResults.length;
      const avgTime = strategyResults.reduce((sum, r) => sum + r.total_execution_time, 0) / strategyResults.length;
      
      strategyPerformance[strategy] = { success_rate: successRate, avg_time: avgTime };
    });
    
    // Analyze chain reliability
    const chainReliability: Record<string, number> = {};
    history.forEach(execution => {
      execution.individual_results.forEach(result => {
        if (!chainReliability[result.chainId]) {
          chainReliability[result.chainId] = 0;
        }
        chainReliability[result.chainId] += result.success ? 1 : 0;
      });
    });
    
    // Convert to success rates
    Object.keys(chainReliability).forEach(chainId => {
      const totalUses = history.reduce((sum, exec) => 
        sum + exec.individual_results.filter(r => r.chainId === chainId).length, 0
      );
      chainReliability[chainId] = totalUses > 0 ? chainReliability[chainId] / totalUses : 0;
    });
    
    return {
      total_executions: totalExecutions,
      success_rate: totalExecutions > 0 ? successfulExecutions / totalExecutions : 0,
      average_execution_time: avgExecutionTime,
      merge_strategy_performance: strategyPerformance,
      chain_reliability: chainReliability
    };
  }
}
