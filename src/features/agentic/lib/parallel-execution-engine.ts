import type { SupabaseClient } from '@supabase/supabase-js';

export interface ParallelTask {
  id: string;
  agentId: string;
  taskType: string;
  input: any;
  priority: 'low' | 'medium' | 'high' | 'critical';
  estimatedDuration: number;
  dependencies?: string[];
  resourceRequirements: {
    memory: number;
    cpu: number;
    concurrent_limit: number;
  };
}

export interface TaskResult {
  taskId: string;
  agentId: string;
  success: boolean;
  result: any;
  executionTime: number;
  resourcesUsed: {
    memory: number;
    cpu: number;
  };
  error?: string;
  confidence?: number;
}

export interface ResourcePool {
  available_memory: number;
  available_cpu: number;
  active_tasks: number;
  max_concurrent: number;
  performance_score: number;
}

export interface ExecutionBatch {
  batchId: string;
  tasks: ParallelTask[];
  strategy: 'parallel_all' | 'parallel_optimized' | 'sequential_fallback';
  maxConcurrency: number;
  totalEstimatedTime: number;
}

export class ParallelExecutionEngine {
  private supabase: SupabaseClient;
  private resourcePool: ResourcePool;
  private activeTasks: Map<string, Promise<TaskResult>>;
  private taskQueue: ParallelTask[];
  private executionHistory: TaskResult[];

  constructor(supabase: SupabaseClient) {
    this.supabase = supabase;
    this.resourcePool = {
      available_memory: 1000,
      available_cpu: 100,
      active_tasks: 0,
      max_concurrent: 10,
      performance_score: 1.0
    };
    this.activeTasks = new Map();
    this.taskQueue = [];
    this.executionHistory = [];
  }

  async executeBatch(batch: ExecutionBatch): Promise<TaskResult[]> {
    console.log(`🚀 Starting batch execution: ${batch.batchId} with ${batch.tasks.length} tasks`);
    
    try {
      // Analyze dependencies and optimize execution order
      const optimizedTasks = await this.optimizeTaskExecution(batch.tasks);
      
      // Execute based on strategy
      switch (batch.strategy) {
        case 'parallel_all':
          return await this.executeAllParallel(optimizedTasks);
        case 'parallel_optimized':
          return await this.executeOptimizedParallel(optimizedTasks, batch.maxConcurrency);
        case 'sequential_fallback':
          return await this.executeSequentialFallback(optimizedTasks);
        default:
          return await this.executeOptimizedParallel(optimizedTasks, batch.maxConcurrency);
      }
    } catch (error) {
      console.error('Batch execution failed:', error);
      return batch.tasks.map(task => ({
        taskId: task.id,
        agentId: task.agentId,
        success: false,
        result: null,
        executionTime: 0,
        resourcesUsed: { memory: 0, cpu: 0 },
        error: error instanceof Error ? error.message : 'Unknown error'
      }));
    }
  }

  private async optimizeTaskExecution(tasks: ParallelTask[]): Promise<ParallelTask[]> {
    // Sort tasks by priority and dependencies
    const dependencyGraph = this.buildDependencyGraph(tasks);
    const priorityOrdered = this.sortByPriority(tasks);
    
    // Optimize for resource utilization
    return this.optimizeResourceAllocation(priorityOrdered, dependencyGraph);
  }

  private buildDependencyGraph(tasks: ParallelTask[]): Map<string, string[]> {
    const graph = new Map<string, string[]>();
    
    tasks.forEach(task => {
      graph.set(task.id, task.dependencies || []);
    });
    
    return graph;
  }

  private sortByPriority(tasks: ParallelTask[]): ParallelTask[] {
    const priorityOrder = { 'critical': 4, 'high': 3, 'medium': 2, 'low': 1 };
    
    return [...tasks].sort((a, b) => {
      const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
      if (priorityDiff !== 0) return priorityDiff;
      
      // Secondary sort by estimated duration (shorter first for better throughput)
      return a.estimatedDuration - b.estimatedDuration;
    });
  }

  private optimizeResourceAllocation(
    tasks: ParallelTask[], 
    dependencyGraph: Map<string, string[]>
  ): ParallelTask[] {
    // Calculate optimal batching based on resource constraints
    const optimized: ParallelTask[] = [];
    const remaining = [...tasks];
    
    while (remaining.length > 0) {
      const batch = this.selectOptimalBatch(remaining, dependencyGraph);
      optimized.push(...batch);
      
      // Remove selected tasks from remaining
      batch.forEach(task => {
        const index = remaining.findIndex(t => t.id === task.id);
        if (index >= 0) {
          remaining.splice(index, 1);
        }
      });
    }
    
    return optimized;
  }

  private selectOptimalBatch(
    tasks: ParallelTask[], 
    dependencyGraph: Map<string, string[]>
  ): ParallelTask[] {
    const batch: ParallelTask[] = [];
    let totalMemory = 0;
    let totalCpu = 0;
    
    for (const task of tasks) {
      // Check if dependencies are satisfied
      const deps = dependencyGraph.get(task.id) || [];
      const depsReady = deps.every(depId => 
        this.executionHistory.some(h => h.taskId === depId && h.success)
      );
      
      if (!depsReady) continue;
      
      // Check resource constraints
      if (totalMemory + task.resourceRequirements.memory <= this.resourcePool.available_memory &&
          totalCpu + task.resourceRequirements.cpu <= this.resourcePool.available_cpu &&
          batch.length < this.resourcePool.max_concurrent) {
        
        batch.push(task);
        totalMemory += task.resourceRequirements.memory;
        totalCpu += task.resourceRequirements.cpu;
      }
    }
    
    return batch;
  }

  private async executeAllParallel(tasks: ParallelTask[]): Promise<TaskResult[]> {
    console.log(`⚡ Executing ${tasks.length} tasks in full parallel mode`);
    
    const promises = tasks.map(task => this.executeTask(task));
    const results = await Promise.allSettled(promises);
    
    return results.map((result, index) => {
      if (result.status === 'fulfilled') {
        return result.value;
      } else {
        return {
          taskId: tasks[index].id,
          agentId: tasks[index].agentId,
          success: false,
          result: null,
          executionTime: 0,
          resourcesUsed: { memory: 0, cpu: 0 },
          error: result.reason instanceof Error ? result.reason.message : 'Promise rejected'
        };
      }
    });
  }

  private async executeOptimizedParallel(
    tasks: ParallelTask[], 
    maxConcurrency: number
  ): Promise<TaskResult[]> {
    console.log(`🎯 Executing ${tasks.length} tasks with optimized parallelism (max: ${maxConcurrency})`);
    
    const results: TaskResult[] = [];
    const executing: Promise<TaskResult>[] = [];
    let taskIndex = 0;
    
    while (taskIndex < tasks.length || executing.length > 0) {
      // Fill execution slots up to maxConcurrency
      while (executing.length < maxConcurrency && taskIndex < tasks.length) {
        const task = tasks[taskIndex];
        const promise = this.executeTask(task);
        executing.push(promise);
        taskIndex++;
      }
      
      // Wait for at least one task to complete
      if (executing.length > 0) {
        const completed = await Promise.race(executing);
        results.push(completed);
        
        // Remove completed task from executing array
        const completedIndex = executing.findIndex(p => p === Promise.resolve(completed));
        if (completedIndex >= 0) {
          executing.splice(completedIndex, 1);
        }
      }
    }
    
    return results;
  }

  private async executeSequentialFallback(tasks: ParallelTask[]): Promise<TaskResult[]> {
    console.log(`🔄 Executing ${tasks.length} tasks in sequential fallback mode`);
    
    const results: TaskResult[] = [];
    
    for (const task of tasks) {
      try {
        const result = await this.executeTask(task);
        results.push(result);
        
        // Stop if critical task fails
        if (task.priority === 'critical' && !result.success) {
          console.warn(`Critical task ${task.id} failed, stopping execution`);
          break;
        }
      } catch (error) {
        console.error(`Task ${task.id} failed:`, error);
        results.push({
          taskId: task.id,
          agentId: task.agentId,
          success: false,
          result: null,
          executionTime: 0,
          resourcesUsed: { memory: 0, cpu: 0 },
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
    
    return results;
  }

  private async executeTask(task: ParallelTask): Promise<TaskResult> {
    const startTime = Date.now();
    
    try {
      // Reserve resources
      this.reserveResources(task);
      
      // Execute the actual task via agent
      const { data, error } = await this.supabase.functions.invoke('agents', {
        body: {
          agent_id: task.agentId,
          user_id: 'system',
          intent: task.taskType,
          params: task.input,
          context: {
            parallel_execution: true,
            task_id: task.id,
            priority: task.priority
          }
        }
      });
      
      const executionTime = Date.now() - startTime;
      
      if (error) {
        throw new Error(error.message || 'Agent execution failed');
      }
      
      const result: TaskResult = {
        taskId: task.id,
        agentId: task.agentId,
        success: data?.success || false,
        result: data?.result,
        executionTime,
        resourcesUsed: task.resourceRequirements,
        confidence: data?.confidence
      };
      
      // Store result in history
      this.executionHistory.push(result);
      
      // Log performance metrics
      await this.logTaskMetrics(task, result);
      
      return result;
      
    } catch (error) {
      const executionTime = Date.now() - startTime;
      
      const result: TaskResult = {
        taskId: task.id,
        agentId: task.agentId,
        success: false,
        result: null,
        executionTime,
        resourcesUsed: task.resourceRequirements,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
      
      this.executionHistory.push(result);
      await this.logTaskMetrics(task, result);
      
      return result;
    } finally {
      // Release resources
      this.releaseResources(task);
    }
  }

  private reserveResources(task: ParallelTask): void {
    this.resourcePool.available_memory -= task.resourceRequirements.memory;
    this.resourcePool.available_cpu -= task.resourceRequirements.cpu;
    this.resourcePool.active_tasks += 1;
  }

  private releaseResources(task: ParallelTask): void {
    this.resourcePool.available_memory += task.resourceRequirements.memory;
    this.resourcePool.available_cpu += task.resourceRequirements.cpu;
    this.resourcePool.active_tasks -= 1;
  }

  private async logTaskMetrics(task: ParallelTask, result: TaskResult): Promise<void> {
    try {
      await this.supabase.from('agent_performance_metrics').insert({
        agent_id: task.agentId,
        task_type: task.taskType,
        execution_time_ms: result.executionTime,
        success: result.success,
        resource_usage: result.resourcesUsed,
        priority: task.priority,
        parallel_execution: true,
        metric_date: new Date().toISOString()
      });
    } catch (error) {
      console.error('Failed to log task metrics:', error);
    }
  }

  async getResourceStatus(): Promise<ResourcePool> {
    return { ...this.resourcePool };
  }

  async getExecutionMetrics(): Promise<{
    total_tasks: number;
    success_rate: number;
    average_execution_time: number;
    resource_efficiency: number;
    current_load: number;
  }> {
    const totalTasks = this.executionHistory.length;
    const successfulTasks = this.executionHistory.filter(r => r.success).length;
    const avgExecutionTime = totalTasks > 0 
      ? this.executionHistory.reduce((sum, r) => sum + r.executionTime, 0) / totalTasks 
      : 0;
    
    return {
      total_tasks: totalTasks,
      success_rate: totalTasks > 0 ? successfulTasks / totalTasks : 0,
      average_execution_time: avgExecutionTime,
      resource_efficiency: this.calculateResourceEfficiency(),
      current_load: this.resourcePool.active_tasks / this.resourcePool.max_concurrent
    };
  }

  private calculateResourceEfficiency(): number {
    if (this.executionHistory.length === 0) return 1.0;
    
    const totalResourceTime = this.executionHistory.reduce((sum, result) => {
      return sum + (result.resourcesUsed.memory + result.resourcesUsed.cpu) * result.executionTime;
    }, 0);
    
    const totalRealTime = this.executionHistory.reduce((sum, result) => sum + result.executionTime, 0);
    
    return totalRealTime > 0 ? Math.min(1.0, totalResourceTime / totalRealTime) : 1.0;
  }

  async optimizeResourcePool(): Promise<void> {
    const metrics = await this.getExecutionMetrics();
    
    // Adjust resource pool based on performance
    if (metrics.resource_efficiency < 0.7) {
      this.resourcePool.max_concurrent = Math.max(5, this.resourcePool.max_concurrent - 1);
    } else if (metrics.resource_efficiency > 0.9 && metrics.current_load > 0.8) {
      this.resourcePool.max_concurrent = Math.min(20, this.resourcePool.max_concurrent + 1);
    }
    
    // Update performance score
    this.resourcePool.performance_score = (metrics.success_rate + metrics.resource_efficiency) / 2;
  }
}