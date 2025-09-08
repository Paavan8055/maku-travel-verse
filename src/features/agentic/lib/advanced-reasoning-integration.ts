import type { SupabaseClient } from '@supabase/supabase-js';
import { ReasoningEngine, type ReasoningChain, type ChainOfThoughtConfig } from './reasoning-engine';
import { PromptChainingSystem, type PromptChain, type ChainExecution } from './prompt-chaining-system';
import { TravelReasoningModules, type TravelConstraint, type ItineraryOptimization } from './travel-reasoning-modules';
import { EnhancedMemorySystem } from './enhanced-memory-system';
import { LearningSystem } from './learning-system';

export interface ReasoningRequest {
  type: 'chain_of_thought' | 'prompt_chain' | 'travel_optimization' | 'decision_tree';
  problem: string;
  context: Record<string, any>;
  constraints?: TravelConstraint[];
  objectives?: string[];
  config?: Partial<ChainOfThoughtConfig>;
  user_id?: string;
  session_id?: string;
}

export interface ReasoningResponse {
  success: boolean;
  reasoning_type: string;
  result: any;
  confidence: number;
  execution_time_ms: number;
  reasoning_trace: Array<{
    step: string;
    input: any;
    output: any;
    reasoning: string;
    confidence: number;
  }>;
  improvements_suggested: string[];
  learning_insights?: any;
}

export interface ReasoningMetrics {
  total_executions: number;
  success_rate: number;
  average_confidence: number;
  average_execution_time: number;
  problem_type_breakdown: Record<string, number>;
  user_satisfaction_trend: number[];
  improvement_suggestions: string[];
}

export class AdvancedReasoningIntegration {
  private supabase: SupabaseClient;
  private reasoningEngine: ReasoningEngine;
  private promptChaining: PromptChainingSystem;
  private travelModules: TravelReasoningModules;
  private memorySystem: EnhancedMemorySystem;
  private learningSystem: LearningSystem;

  constructor(supabase: SupabaseClient) {
    this.supabase = supabase;
    this.reasoningEngine = new ReasoningEngine(supabase);
    this.promptChaining = new PromptChainingSystem(supabase);
    this.travelModules = new TravelReasoningModules(supabase);
    this.memorySystem = new EnhancedMemorySystem('advanced_reasoning', 'system');
    this.learningSystem = new LearningSystem();
  }

  async executeReasoning(request: ReasoningRequest): Promise<ReasoningResponse> {
    const startTime = Date.now();
    
    try {
      // Enhance context with memory and learning insights
      const enhancedContext = await this.enhanceContextWithMemory(request);
      
      let result: any;
      let reasoningTrace: ReasoningResponse['reasoning_trace'] = [];
      let confidence = 0;

      switch (request.type) {
        case 'chain_of_thought':
          const chainResult = await this.executeChainOfThought(enhancedContext);
          result = chainResult.final_conclusion;
          confidence = chainResult.overall_confidence;
          reasoningTrace = this.convertChainToTrace(chainResult);
          break;

        case 'prompt_chain':
          const promptResult = await this.executePromptChain(enhancedContext);
          result = promptResult.final_result;
          confidence = this.calculatePromptChainConfidence(promptResult);
          reasoningTrace = this.convertPromptChainToTrace(promptResult);
          break;

        case 'travel_optimization':
          const optimizationResult = await this.executeTravelOptimization(enhancedContext);
          result = optimizationResult;
          confidence = optimizationResult.optimization_score;
          reasoningTrace = this.convertOptimizationToTrace(optimizationResult);
          break;

        case 'decision_tree':
          const decisionResult = await this.executeDecisionTree(enhancedContext);
          result = decisionResult;
          confidence = decisionResult.confidence;
          reasoningTrace = this.convertDecisionToTrace(decisionResult);
          break;

        default:
          throw new Error(`Unsupported reasoning type: ${request.type}`);
      }

      const executionTime = Date.now() - startTime;

      // Record learning metrics
      if (request.user_id) {
        await this.learningSystem.recordMetric({
          agentId: 'advanced_reasoning',
          userId: request.user_id!,
          metricType: 'reasoning_execution',
          metricValue: confidence,
          context: {
            reasoning_type: request.type,
            execution_time_ms: executionTime,
            problem_complexity: this.assessProblemComplexity(request.problem),
            success: confidence > 0.7
          }
        });
      }

      // Store reasoning results in memory
      await this.storeReasoningInMemory(request, result, confidence, executionTime);

      // Generate improvement suggestions
      const improvements = await this.generateImprovementSuggestions(request, result, confidence);

      return {
        success: true,
        reasoning_type: request.type,
        result,
        confidence,
        execution_time_ms: executionTime,
        reasoning_trace: reasoningTrace,
        improvements_suggested: improvements,
        learning_insights: await this.getLearningInsights(request.user_id)
      };

    } catch (error) {
      console.error('Advanced reasoning execution failed:', error);
      
      return {
        success: false,
        reasoning_type: request.type,
        result: null,
        confidence: 0,
        execution_time_ms: Date.now() - startTime,
        reasoning_trace: [],
        improvements_suggested: ['Check input parameters', 'Verify system connectivity', 'Review problem complexity'],
        learning_insights: null
      };
    }
  }

  private async enhanceContextWithMemory(request: ReasoningRequest): Promise<ReasoningRequest> {
    try {
      // Retrieve relevant memories
      const memories = await this.memorySystem.retrieveMemories({
        query: request.problem,
        limit: 10,
        threshold: 0.6
      });

      // Extract insights from memories
      const memoryInsights = memories.map(m => ({
        type: m.type,
        content: m.content,
        confidence: m.relevanceScore || 0,
        relevance: m.accessCount
      }));

      return {
        ...request,
        context: {
          ...request.context,
          memory_insights: memoryInsights,
          similar_problems: memories.filter(m => m.type === 'episodic'),
          past_successes: memories.filter(m => (m.relevanceScore || 0) > 0.8)
        }
      };
    } catch (error) {
      console.error('Failed to enhance context with memory:', error);
      return request;
    }
  }

  private async executeChainOfThought(request: ReasoningRequest): Promise<ReasoningChain> {
    return this.reasoningEngine.executeChainOfThought(
      request.problem,
      this.inferProblemType(request.problem),
      request.context,
      request.user_id
    );
  }

  private async executePromptChain(request: ReasoningRequest): Promise<ChainExecution> {
    // Determine appropriate chain based on problem type
    const chainId = this.selectOptimalChain(request.problem, request.context);
    
    return this.promptChaining.executePromptChain(
      chainId,
      {
        problem: request.problem,
        ...request.context
      },
      request.user_id
    );
  }

  private async executeTravelOptimization(request: ReasoningRequest): Promise<ItineraryOptimization> {
    const constraints = request.constraints || this.inferConstraints(request.context);
    const objectives = request.objectives || ['cost', 'time', 'satisfaction'];

    return this.travelModules.optimizeItinerary(
      request.context.itinerary || this.createBaseItinerary(request.context),
      constraints,
      objectives
    );
  }

  private async executeDecisionTree(request: ReasoningRequest): Promise<any> {
    const problemType = this.inferDecisionProblemType(request.problem);
    
    return this.travelModules.createDecisionTree(
      problemType,
      request.context
    );
  }

  private inferProblemType(problem: string): string {
    const keywords = problem.toLowerCase();
    
    if (keywords.includes('travel') || keywords.includes('trip') || keywords.includes('vacation')) {
      return 'travel_planning';
    }
    if (keywords.includes('book') || keywords.includes('reservation') || keywords.includes('price')) {
      return 'booking_optimization';
    }
    if (keywords.includes('help') || keywords.includes('support') || keywords.includes('issue')) {
      return 'customer_support';
    }
    
    return 'general';
  }

  private selectOptimalChain(problem: string, context: Record<string, any>): string {
    if (problem.toLowerCase().includes('travel') && context.destination) {
      return 'comprehensive_travel_planning';
    }
    
    return 'complex_problem_solving';
  }

  private inferConstraints(context: Record<string, any>): TravelConstraint[] {
    const constraints: TravelConstraint[] = [];

    if (context.budget) {
      constraints.push({
        type: 'budget',
        value: context.budget,
        priority: 'high',
        flexibility: 0.1,
        impact_score: 0.8
      });
    }

    if (context.time_limit || context.duration) {
      constraints.push({
        type: 'time',
        value: context.time_limit || context.duration,
        priority: 'medium',
        flexibility: 0.2,
        impact_score: 0.6
      });
    }

    if (context.preferences) {
      constraints.push({
        type: 'preferences',
        value: context.preferences,
        priority: 'medium',
        flexibility: 0.5,
        impact_score: 0.5
      });
    }

    return constraints;
  }

  private createBaseItinerary(context: Record<string, any>): any {
    return {
      destination: context.destination || 'Unknown',
      duration: context.duration || 7,
      budget: context.budget || 2000,
      activities: context.activities || [],
      accommodation: context.accommodation || {},
      transportation: context.transportation || {}
    };
  }

  private inferDecisionProblemType(problem: string): 'booking_conflict' | 'budget_overflow' | 'timing_issue' | 'preference_conflict' {
    const keywords = problem.toLowerCase();
    
    if (keywords.includes('conflict') || keywords.includes('unavailable')) {
      return 'booking_conflict';
    }
    if (keywords.includes('budget') || keywords.includes('expensive') || keywords.includes('cost')) {
      return 'budget_overflow';
    }
    if (keywords.includes('time') || keywords.includes('schedule') || keywords.includes('late')) {
      return 'timing_issue';
    }
    
    return 'preference_conflict';
  }

  private convertChainToTrace(chain: ReasoningChain): ReasoningResponse['reasoning_trace'] {
    return chain.steps.map(step => ({
      step: step.description,
      input: step.input,
      output: step.output,
      reasoning: step.reasoning,
      confidence: step.confidence
    }));
  }

  private convertPromptChainToTrace(execution: ChainExecution): ReasoningResponse['reasoning_trace'] {
    return execution.step_results.map((step, index) => ({
      step: `Prompt Chain Step ${index + 1}`,
      input: step.input,
      output: step.output,
      reasoning: step.reasoning,
      confidence: step.success ? 0.8 : 0.3
    }));
  }

  private convertOptimizationToTrace(optimization: ItineraryOptimization): ReasoningResponse['reasoning_trace'] {
    return optimization.improvements.map(improvement => ({
      step: improvement.type,
      input: optimization.original_plan,
      output: improvement.description,
      reasoning: `${improvement.type}: ${improvement.description}`,
      confidence: improvement.impact
    }));
  }

  private convertDecisionToTrace(decision: any): ReasoningResponse['reasoning_trace'] {
    return [{
      step: 'Decision Analysis',
      input: decision.options,
      output: decision.selected_option || decision.options[0],
      reasoning: decision.reasoning,
      confidence: decision.confidence
    }];
  }

  private calculatePromptChainConfidence(execution: ChainExecution): number {
    if (execution.step_results.length === 0) return 0;
    
    const successRate = execution.step_results.filter(s => s.success).length / execution.step_results.length;
    return successRate;
  }

  private assessProblemComplexity(problem: string): 'low' | 'medium' | 'high' {
    const wordCount = problem.split(' ').length;
    const complexity_indicators = ['constraint', 'multiple', 'optimize', 'conflict', 'complex'];
    const indicatorCount = complexity_indicators.filter(indicator => 
      problem.toLowerCase().includes(indicator)
    ).length;

    if (wordCount > 50 || indicatorCount > 2) return 'high';
    if (wordCount > 20 || indicatorCount > 0) return 'medium';
    return 'low';
  }

  private extractKeywords(text: string): string[] {
    const stopWords = ['a', 'an', 'the', 'is', 'are', 'was', 'were', 'i', 'me', 'my', 'we', 'us', 'our'];
    return text
      .toLowerCase()
      .split(/\W+/)
      .filter(word => word.length > 2 && !stopWords.includes(word))
      .slice(0, 10);
  }

  private async storeReasoningInMemory(
    request: ReasoningRequest,
    result: any,
    confidence: number,
    executionTime: number
  ): Promise<void> {
    try {
      await this.memorySystem.storeMemory(
        {
          request,
          result,
          performance: {
            confidence,
            execution_time_ms: executionTime,
            success: confidence > 0.7
          }
        },
        'episodic',
        [
          'reasoning_execution',
          request.type,
          this.inferProblemType(request.problem),
          this.assessProblemComplexity(request.problem)
        ],
        {
          confidence_score: confidence
        }
      );
    } catch (error) {
      console.error('Failed to store reasoning in memory:', error);
    }
  }

  private async generateImprovementSuggestions(
    request: ReasoningRequest,
    result: any,
    confidence: number
  ): Promise<string[]> {
    const suggestions: string[] = [];

    if (confidence < 0.7) {
      suggestions.push('Consider providing more detailed context for better reasoning');
      suggestions.push('Break down complex problems into smaller components');
    }

    if (request.type === 'travel_optimization' && result.optimization_score < 0.5) {
      suggestions.push('Review budget and time constraints for more realistic planning');
      suggestions.push('Consider more flexible travel dates for better options');
    }

    if (!request.constraints && request.type === 'travel_optimization') {
      suggestions.push('Provide explicit constraints for more targeted optimization');
    }

    if (suggestions.length === 0) {
      suggestions.push('Excellent reasoning execution - no improvements needed');
    }

    return suggestions;
  }

  private async getLearningInsights(userId?: string): Promise<any> {
    if (!userId) return null;

    try {
      return await this.learningSystem.getLearningInsights('advanced_reasoning', userId);
    } catch (error) {
      console.error('Failed to get learning insights:', error);
      return null;
    }
  }

  async getReasoningMetrics(
    userId?: string,
    timeframe: 'day' | 'week' | 'month' = 'week'
  ): Promise<ReasoningMetrics> {
    try {
      const timeLimit = new Date();
      switch (timeframe) {
        case 'day':
          timeLimit.setDate(timeLimit.getDate() - 1);
          break;
        case 'week':
          timeLimit.setDate(timeLimit.getDate() - 7);
          break;
        case 'month':
          timeLimit.setMonth(timeLimit.getMonth() - 1);
          break;
      }

      let query = this.supabase
        .from('agent_context_memory')
        .select('*')
        .eq('agent_id', 'advanced_reasoning')
        .eq('context_type', 'reasoning_execution')
        .gte('created_at', timeLimit.toISOString());

      if (userId) {
        query = query.eq('user_id', userId);
      }

      const { data, error } = await query;
      if (error) throw error;

      const executions = data || [];
      const total = executions.length;
      const successful = executions.filter(e => e.context_data.performance?.success).length;
      const avgConfidence = executions.reduce((sum, e) => sum + (e.confidence_score || 0), 0) / total || 0;
      const avgTime = executions.reduce((sum, e) => sum + (e.context_data.performance?.execution_time_ms || 0), 0) / total || 0;

      const problemTypes: Record<string, number> = {};
      executions.forEach(e => {
        const type = e.context_data.request?.type || 'unknown';
        problemTypes[type] = (problemTypes[type] || 0) + 1;
      });

      return {
        total_executions: total,
        success_rate: successful / total || 0,
        average_confidence: avgConfidence,
        average_execution_time: avgTime,
        problem_type_breakdown: problemTypes,
        user_satisfaction_trend: [0.8, 0.82, 0.85, 0.83, 0.87], // Simulated trend
        improvement_suggestions: [
          'Continue leveraging memory insights for better context',
          'Consider implementing more specialized reasoning chains',
          'Explore user feedback integration for continuous improvement'
        ]
      };

    } catch (error) {
      console.error('Failed to get reasoning metrics:', error);
      return {
        total_executions: 0,
        success_rate: 0,
        average_confidence: 0,
        average_execution_time: 0,
        problem_type_breakdown: {},
        user_satisfaction_trend: [],
        improvement_suggestions: ['Check system connectivity', 'Verify data access permissions']
      };
    }
  }
}