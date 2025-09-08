import { supabase } from '@/integrations/supabase/client';

export interface PlanningStrategy {
  id: string;
  name: string;
  description: string;
  complexity_threshold: number;
  effectiveness_score: number;
  usage_count: number;
  success_rate: number;
}

export interface PlanQuality {
  completeness: number;
  feasibility: number;
  efficiency: number;
  adaptability: number;
  overall_score: number;
}

export interface MetaPlan {
  id: string;
  original_plan: any;
  strategy_used: string;
  quality_assessment: PlanQuality;
  improvement_suggestions: string[];
  adaptation_triggers: string[];
  execution_context: any;
  created_at: string;
}

export class MetaCognitivePlanner {
  private strategies: Map<string, PlanningStrategy> = new Map();
  private planHistory: MetaPlan[] = [];

  constructor() {
    this.initializeStrategies();
  }

  private initializeStrategies(): void {
    const defaultStrategies: PlanningStrategy[] = [
      {
        id: 'sequential',
        name: 'Sequential Planning',
        description: 'Step-by-step linear planning approach',
        complexity_threshold: 3,
        effectiveness_score: 0.7,
        usage_count: 0,
        success_rate: 0.75
      },
      {
        id: 'hierarchical',
        name: 'Hierarchical Decomposition',
        description: 'Break down into sub-goals and sub-plans',
        complexity_threshold: 6,
        effectiveness_score: 0.85,
        usage_count: 0,
        success_rate: 0.82
      },
      {
        id: 'parallel',
        name: 'Parallel Planning',
        description: 'Generate multiple plans simultaneously',
        complexity_threshold: 8,
        effectiveness_score: 0.9,
        usage_count: 0,
        success_rate: 0.88
      },
      {
        id: 'adaptive',
        name: 'Adaptive Planning',
        description: 'Dynamic planning with real-time adjustments',
        complexity_threshold: 10,
        effectiveness_score: 0.95,
        usage_count: 0,
        success_rate: 0.91
      }
    ];

    defaultStrategies.forEach(strategy => {
      this.strategies.set(strategy.id, strategy);
    });
  }

  async selectOptimalStrategy(context: any): Promise<PlanningStrategy> {
    const complexity = this.assessComplexity(context);
    const availableStrategies = Array.from(this.strategies.values())
      .filter(s => s.complexity_threshold <= complexity)
      .sort((a, b) => b.effectiveness_score - a.effectiveness_score);

    if (availableStrategies.length === 0) {
      return this.strategies.get('sequential')!;
    }

    // Consider recent performance
    const strategy = availableStrategies[0];
    strategy.usage_count += 1;
    
    return strategy;
  }

  private assessComplexity(context: any): number {
    let complexity = 1;
    
    // Factor in number of requirements
    if (context.requirements?.length > 5) complexity += 2;
    if (context.requirements?.length > 10) complexity += 3;
    
    // Factor in number of constraints
    if (context.constraints?.length > 3) complexity += 2;
    
    // Factor in multi-step nature
    if (context.multi_step) complexity += 2;
    
    // Factor in uncertainty
    if (context.uncertainty_level > 0.5) complexity += 3;
    
    // Factor in interdependencies
    if (context.dependencies?.length > 2) complexity += 2;
    
    return Math.min(complexity, 15);
  }

  async generateMetaPlan(originalPlan: any, context: any): Promise<MetaPlan> {
    const strategy = await this.selectOptimalStrategy(context);
    const quality = await this.assessPlanQuality(originalPlan, context);
    
    const metaPlan: MetaPlan = {
      id: crypto.randomUUID(),
      original_plan: originalPlan,
      strategy_used: strategy.id,
      quality_assessment: quality,
      improvement_suggestions: await this.generateImprovements(originalPlan, quality),
      adaptation_triggers: this.identifyAdaptationTriggers(context),
      execution_context: context,
      created_at: new Date().toISOString()
    };

    this.planHistory.push(metaPlan);
    await this.logMetaPlan(metaPlan);
    
    return metaPlan;
  }

  private async assessPlanQuality(plan: any, context: any): Promise<PlanQuality> {
    const completeness = this.assessCompleteness(plan, context);
    const feasibility = this.assessFeasibility(plan, context);
    const efficiency = this.assessEfficiency(plan);
    const adaptability = this.assessAdaptability(plan);
    
    return {
      completeness,
      feasibility,
      efficiency,
      adaptability,
      overall_score: (completeness + feasibility + efficiency + adaptability) / 4
    };
  }

  private assessCompleteness(plan: any, context: any): number {
    if (!plan.steps || plan.steps.length === 0) return 0.1;
    
    const requiredElements = context.requirements?.length || 1;
    const coveredElements = plan.steps.filter((step: any) => 
      step.addresses_requirements?.length > 0
    ).length;
    
    return Math.min(coveredElements / requiredElements, 1.0);
  }

  private assessFeasibility(plan: any, context: any): number {
    if (!plan.steps) return 0.5;
    
    let feasibilityScore = 1.0;
    
    // Check resource constraints
    if (context.resource_limits) {
      const resourceUsage = plan.steps.reduce((sum: number, step: any) => 
        sum + (step.resource_cost || 0), 0);
      if (resourceUsage > context.resource_limits) {
        feasibilityScore *= 0.6;
      }
    }
    
    // Check time constraints
    if (context.time_limit) {
      const estimatedTime = plan.steps.reduce((sum: number, step: any) => 
        sum + (step.estimated_duration || 0), 0);
      if (estimatedTime > context.time_limit) {
        feasibilityScore *= 0.7;
      }
    }
    
    return Math.max(feasibilityScore, 0.1);
  }

  private assessEfficiency(plan: any): number {
    if (!plan.steps || plan.steps.length === 0) return 0.1;
    
    // Check for redundant steps
    const uniqueActions = new Set(plan.steps.map((step: any) => step.action_type));
    const redundancyRatio = uniqueActions.size / plan.steps.length;
    
    // Check for parallel opportunities
    const parallelSteps = plan.steps.filter((step: any) => step.can_parallelize);
    const parallelRatio = parallelSteps.length / plan.steps.length;
    
    return (redundancyRatio * 0.6) + (parallelRatio * 0.4);
  }

  private assessAdaptability(plan: any): number {
    if (!plan.steps) return 0.3;
    
    const adaptableSteps = plan.steps.filter((step: any) => 
      step.has_alternatives || step.conditional_execution
    );
    
    return adaptableSteps.length / plan.steps.length;
  }

  private async generateImprovements(plan: any, quality: PlanQuality): Promise<string[]> {
    const improvements: string[] = [];
    
    if (quality.completeness < 0.8) {
      improvements.push('Add missing steps to address all requirements');
    }
    
    if (quality.feasibility < 0.7) {
      improvements.push('Reduce resource usage or extend timeline');
    }
    
    if (quality.efficiency < 0.6) {
      improvements.push('Identify opportunities for parallel execution');
      improvements.push('Remove redundant or unnecessary steps');
    }
    
    if (quality.adaptability < 0.5) {
      improvements.push('Add alternative paths for key decision points');
      improvements.push('Include contingency planning for potential failures');
    }
    
    return improvements;
  }

  private identifyAdaptationTriggers(context: any): string[] {
    const triggers: string[] = [];
    
    if (context.uncertainty_level > 0.3) {
      triggers.push('high_uncertainty_detected');
    }
    
    if (context.constraints?.length > 3) {
      triggers.push('constraint_violation');
    }
    
    if (context.multi_step) {
      triggers.push('intermediate_step_failure');
    }
    
    triggers.push('execution_time_exceeded');
    triggers.push('resource_exhaustion');
    triggers.push('external_dependency_failure');
    
    return triggers;
  }

  async adaptPlan(metaPlan: MetaPlan, trigger: string, newContext: any): Promise<MetaPlan> {
    const adaptedPlan = { ...metaPlan.original_plan };
    
    switch (trigger) {
      case 'execution_time_exceeded':
        // Simplify plan or add parallel execution
        adaptedPlan.steps = adaptedPlan.steps?.map((step: any) => ({
          ...step,
          can_parallelize: true,
          priority: step.priority || 'normal'
        }));
        break;
        
      case 'resource_exhaustion':
        // Reduce resource-intensive steps
        adaptedPlan.steps = adaptedPlan.steps?.filter((step: any) => 
          (step.resource_cost || 0) < newContext.available_resources
        );
        break;
        
      case 'intermediate_step_failure':
        // Add alternative paths
        adaptedPlan.steps = adaptedPlan.steps?.map((step: any) => ({
          ...step,
          alternatives: step.alternatives || [step.action_type + '_alternative']
        }));
        break;
    }
    
    return await this.generateMetaPlan(adaptedPlan, newContext);
  }

  private async logMetaPlan(metaPlan: MetaPlan): Promise<void> {
    try {
      await supabase.from('agentic_memory').insert({
        agent_id: 'meta_cognitive_planner',
        user_id: 'system',
        memory_key: `meta_plan_${metaPlan.id}`,
        memory_data: JSON.parse(JSON.stringify(metaPlan)) as any,
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
      });
    } catch (error) {
      console.error('Error logging meta plan:', error);
    }
  }

  async getStrategyPerformance(): Promise<PlanningStrategy[]> {
    return Array.from(this.strategies.values())
      .sort((a, b) => b.success_rate - a.success_rate);
  }

  async updateStrategyPerformance(strategyId: string, success: boolean): Promise<void> {
    const strategy = this.strategies.get(strategyId);
    if (strategy) {
      const totalExecutions = strategy.usage_count;
      const currentSuccesses = strategy.success_rate * totalExecutions;
      const newSuccesses = success ? currentSuccesses + 1 : currentSuccesses;
      
      strategy.success_rate = newSuccesses / totalExecutions;
      strategy.effectiveness_score = strategy.success_rate * 0.8 + 0.2; // Base effectiveness
    }
  }
}

export const metaCognitivePlanner = new MetaCognitivePlanner();