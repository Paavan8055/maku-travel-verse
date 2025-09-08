import type { SupabaseClient } from '@supabase/supabase-js';

export interface PromptTemplate {
  id: string;
  name: string;
  category: string;
  template: string;
  variables: string[];
  example_usage: Record<string, any>;
  complexity_level: 'basic' | 'intermediate' | 'advanced';
  reasoning_type: 'analytical' | 'creative' | 'problem_solving' | 'decision_making';
}

export interface PromptChain {
  id: string;
  name: string;
  description: string;
  templates: PromptTemplate[];
  chain_logic: 'sequential' | 'parallel' | 'conditional' | 'iterative';
  success_criteria: Record<string, any>;
  max_iterations?: number;
}

export interface ChainExecution {
  chain_id: string;
  execution_id: string;
  status: 'running' | 'completed' | 'failed' | 'paused';
  current_step: number;
  step_results: Array<{
    template_id: string;
    input: Record<string, any>;
    output: any;
    execution_time_ms: number;
    success: boolean;
    reasoning: string;
  }>;
  final_result: any;
  total_execution_time_ms: number;
  created_at: Date;
  completed_at?: Date;
}

export class PromptChainingSystem {
  private supabase: SupabaseClient;
  private templates: Map<string, PromptTemplate> = new Map();
  private chains: Map<string, PromptChain> = new Map();

  constructor(supabase: SupabaseClient) {
    this.supabase = supabase;
    this.initializeDefaultTemplates();
    this.initializeDefaultChains();
  }

  private initializeDefaultTemplates(): void {
    const templates: PromptTemplate[] = [
      {
        id: 'travel_analysis',
        name: 'Travel Requirements Analysis',
        category: 'travel',
        template: `Analyze the following travel requirements:
        
Destination: {destination}
Travel Dates: {travel_dates}
Budget: {budget}
Travelers: {traveler_count}
Preferences: {preferences}

Provide a structured analysis covering:
1. Feasibility assessment
2. Budget breakdown recommendations
3. Seasonal considerations
4. Key constraints and opportunities
5. Risk factors to consider

Format your response as a JSON object with clear sections.`,
        variables: ['destination', 'travel_dates', 'budget', 'traveler_count', 'preferences'],
        example_usage: {
          destination: 'Japan',
          travel_dates: '2024-03-15 to 2024-03-25',
          budget: 3000,
          traveler_count: 2,
          preferences: 'Cultural experiences, food tours'
        },
        complexity_level: 'intermediate',
        reasoning_type: 'analytical'
      },
      {
        id: 'itinerary_optimization',
        name: 'Itinerary Optimization',
        category: 'travel',
        template: `Given the travel analysis: {analysis_result}

Create an optimized itinerary that:
1. Maximizes value within budget constraints
2. Considers travel times and logistics
3. Balances must-see attractions with local experiences
4. Accounts for rest and flexibility
5. Provides contingency options

Current constraints:
- Budget: {budget}
- Duration: {duration}
- Transportation: {transport_preferences}
- Accommodation: {accommodation_type}

Provide a day-by-day breakdown with alternatives for each major decision.`,
        variables: ['analysis_result', 'budget', 'duration', 'transport_preferences', 'accommodation_type'],
        example_usage: {
          budget: 3000,
          duration: '10 days',
          transport_preferences: 'Public transport preferred',
          accommodation_type: 'Mid-range hotels'
        },
        complexity_level: 'advanced',
        reasoning_type: 'problem_solving'
      },
      {
        id: 'booking_strategy',
        name: 'Booking Strategy Optimization',
        category: 'booking',
        template: `Based on the itinerary: {itinerary}

Develop a booking strategy that optimizes:
1. Cost savings through timing
2. Cancellation flexibility
3. Reward program benefits
4. Package deals vs individual bookings
5. Risk mitigation

Current market conditions:
- Peak/Off-peak timing: {seasonality}
- Current promotions: {available_deals}
- User loyalty status: {loyalty_tiers}

Provide specific booking recommendations with timing and priority order.`,
        variables: ['itinerary', 'seasonality', 'available_deals', 'loyalty_tiers'],
        example_usage: {
          seasonality: 'Shoulder season',
          available_deals: 'Early bird flight discounts',
          loyalty_tiers: 'Gold member with airline'
        },
        complexity_level: 'advanced',
        reasoning_type: 'decision_making'
      },
      {
        id: 'problem_decomposition',
        name: 'Complex Problem Decomposition',
        category: 'general',
        template: `Break down this complex problem into manageable components:

Problem: {problem_statement}
Context: {context}
Constraints: {constraints}
Success Criteria: {success_criteria}

Provide:
1. Problem hierarchy (main problem → sub-problems → tasks)
2. Dependencies between components
3. Priority ranking with reasoning
4. Resource requirements for each component
5. Risk assessment for each pathway

Use a structured approach that enables systematic problem solving.`,
        variables: ['problem_statement', 'context', 'constraints', 'success_criteria'],
        example_usage: {
          problem_statement: 'Plan a multi-city business trip with family extension',
          context: 'Business meetings in 3 cities, family wants to join for vacation portion',
          constraints: 'Limited budget, school holiday timing',
          success_criteria: 'Successful meetings + family satisfaction + budget adherence'
        },
        complexity_level: 'advanced',
        reasoning_type: 'analytical'
      },
      {
        id: 'creative_solution',
        name: 'Creative Solution Generation',
        category: 'general',
        template: `Generate creative solutions for: {challenge}

Given constraints: {constraints}
Available resources: {resources}
Stakeholders: {stakeholders}

Use creative thinking techniques:
1. Alternative perspectives (how would X approach this?)
2. Constraint relaxation (what if we removed Y?)
3. Analogical thinking (similar problems solved elsewhere?)
4. Combination approaches (mixing different strategies)
5. Future-back thinking (ideal outcome, work backwards)

Provide 3-5 innovative solutions with implementation feasibility scores.`,
        variables: ['challenge', 'constraints', 'resources', 'stakeholders'],
        example_usage: {
          challenge: 'Customer wants luxury experience on budget trip',
          constraints: 'Limited budget, peak season pricing',
          resources: 'Loyalty points, partner networks, local contacts',
          stakeholders: 'Customer, travel partners, local providers'
        },
        complexity_level: 'advanced',
        reasoning_type: 'creative'
      }
    ];

    templates.forEach(template => this.templates.set(template.id, template));
  }

  private initializeDefaultChains(): void {
    const chains: PromptChain[] = [
      {
        id: 'comprehensive_travel_planning',
        name: 'Comprehensive Travel Planning Chain',
        description: 'End-to-end travel planning with optimization',
        templates: [
          this.templates.get('travel_analysis')!,
          this.templates.get('itinerary_optimization')!,
          this.templates.get('booking_strategy')!
        ],
        chain_logic: 'sequential',
        success_criteria: {
          analysis_confidence: 0.8,
          itinerary_feasibility: 0.9,
          booking_savings: 0.15
        }
      },
      {
        id: 'complex_problem_solving',
        name: 'Complex Problem Solving Chain',
        description: 'Systematic approach to complex problem resolution',
        templates: [
          this.templates.get('problem_decomposition')!,
          this.templates.get('creative_solution')!
        ],
        chain_logic: 'sequential',
        success_criteria: {
          problem_clarity: 0.9,
          solution_innovation: 0.7,
          implementation_feasibility: 0.8
        }
      }
    ];

    chains.forEach(chain => this.chains.set(chain.id, chain));
  }

  async executePromptChain(
    chainId: string,
    initialInput: Record<string, any>,
    userId?: string
  ): Promise<ChainExecution> {
    const chain = this.chains.get(chainId);
    if (!chain) {
      throw new Error(`Prompt chain not found: ${chainId}`);
    }

    const executionId = `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const startTime = Date.now();

    const execution: ChainExecution = {
      chain_id: chainId,
      execution_id: executionId,
      status: 'running',
      current_step: 0,
      step_results: [],
      final_result: null,
      total_execution_time_ms: 0,
      created_at: new Date()
    };

    try {
      let currentInput = { ...initialInput };

      for (let i = 0; i < chain.templates.length; i++) {
        const template = chain.templates[i];
        execution.current_step = i + 1;

        const stepStartTime = Date.now();
        const stepResult = await this.executePromptTemplate(template, currentInput);
        const stepEndTime = Date.now();

        const stepExecution = {
          template_id: template.id,
          input: { ...currentInput },
          output: stepResult.output,
          execution_time_ms: stepEndTime - stepStartTime,
          success: stepResult.success,
          reasoning: stepResult.reasoning
        };

        execution.step_results.push(stepExecution);

        if (!stepResult.success) {
          execution.status = 'failed';
          break;
        }

        // Prepare input for next step
        currentInput = {
          ...currentInput,
          [`${template.id}_result`]: stepResult.output,
          previous_step_output: stepResult.output
        };

        // Check success criteria after each step
        if (!this.evaluateSuccessCriteria(chain.success_criteria, execution.step_results)) {
          console.warn(`Success criteria not met after step ${i + 1}`);
        }
      }

      execution.final_result = execution.step_results[execution.step_results.length - 1]?.output;
      execution.status = execution.status === 'running' ? 'completed' : execution.status;
      execution.total_execution_time_ms = Date.now() - startTime;
      execution.completed_at = new Date();

      // Store execution for learning
      await this.storeExecution(execution, userId);

      return execution;

    } catch (error) {
      console.error('Prompt chain execution failed:', error);
      execution.status = 'failed';
      execution.total_execution_time_ms = Date.now() - startTime;
      execution.completed_at = new Date();
      return execution;
    }
  }

  private async executePromptTemplate(
    template: PromptTemplate,
    input: Record<string, any>
  ): Promise<{ output: any; success: boolean; reasoning: string }> {
    try {
      // Replace template variables with actual values
      let processedPrompt = template.template;
      
      for (const variable of template.variables) {
        const placeholder = `{${variable}}`;
        const value = input[variable] || `[${variable} not provided]`;
        processedPrompt = processedPrompt.replace(new RegExp(placeholder, 'g'), String(value));
      }

      // This would integrate with OpenAI in a real implementation
      // For now, simulate intelligent processing based on template type
      const output = await this.simulateTemplateExecution(template, input, processedPrompt);

      return {
        output,
        success: true,
        reasoning: `Executed ${template.name} with ${template.complexity_level} complexity for ${template.reasoning_type} reasoning`
      };

    } catch (error) {
      return {
        output: null,
        success: false,
        reasoning: `Template execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  private async simulateTemplateExecution(
    template: PromptTemplate,
    input: Record<string, any>,
    processedPrompt: string
  ): Promise<any> {
    // Simulate different outputs based on template category and type
    switch (template.category) {
      case 'travel':
        return this.simulateTravelOutput(template, input);
      case 'booking':
        return this.simulateBookingOutput(template, input);
      case 'general':
        return this.simulateGeneralOutput(template, input);
      default:
        return {
          summary: `Processed prompt for ${template.name}`,
          analysis: 'Detailed analysis would be generated here',
          recommendations: ['Recommendation 1', 'Recommendation 2'],
          confidence: 0.85
        };
    }
  }

  private simulateTravelOutput(template: PromptTemplate, input: Record<string, any>): any {
    if (template.id === 'travel_analysis') {
      return {
        feasibility: {
          score: 0.9,
          factors: ['Good season for travel', 'Budget adequate', 'Popular destination']
        },
        budget_breakdown: {
          flights: input.budget * 0.4,
          accommodation: input.budget * 0.3,
          activities: input.budget * 0.2,
          meals: input.budget * 0.1
        },
        seasonal_considerations: ['Cherry blossom season', 'Mild weather', 'Moderate crowds'],
        constraints: ['Peak season pricing', 'Popular destination booking challenges'],
        opportunities: ['Cultural festivals', 'Seasonal cuisine', 'Photography opportunities']
      };
    }

    if (template.id === 'itinerary_optimization') {
      return {
        daily_schedule: [
          { day: 1, activities: ['Arrival', 'Local orientation'], budget: 100 },
          { day: 2, activities: ['Main attractions', 'Cultural site'], budget: 150 },
          { day: 3, activities: ['Day trip', 'Local experiences'], budget: 200 }
        ],
        optimization_factors: ['Travel time minimized', 'Cost per experience optimized'],
        alternatives: ['Indoor alternatives for weather', 'Budget-friendly substitutions'],
        flexibility_buffer: '20% time and budget reserve'
      };
    }

    return { processed: true, template_id: template.id };
  }

  private simulateBookingOutput(template: PromptTemplate, input: Record<string, any>): any {
    return {
      booking_timeline: [
        { item: 'Flights', timing: '6-8 weeks before', reason: 'Price stability window' },
        { item: 'Accommodation', timing: '4-6 weeks before', reason: 'Cancellation flexibility' },
        { item: 'Activities', timing: '2-3 weeks before', reason: 'Weather/schedule adjustment' }
      ],
      cost_optimization: {
        estimated_savings: '15-20%',
        techniques: ['Flexible dates', 'Package deals', 'Loyalty rewards']
      },
      risk_mitigation: ['Travel insurance', 'Refundable bookings', 'Alternative options']
    };
  }

  private simulateGeneralOutput(template: PromptTemplate, input: Record<string, any>): any {
    if (template.reasoning_type === 'creative') {
      return {
        creative_solutions: [
          {
            solution: 'Leverage off-peak luxury timing',
            feasibility: 0.8,
            innovation: 0.9,
            implementation: 'Book luxury accommodations during weekdays'
          },
          {
            solution: 'Experience layering approach',
            feasibility: 0.7,
            innovation: 0.8,
            implementation: 'Combine multiple smaller luxury touches'
          }
        ],
        thinking_approaches: ['Constraint relaxation', 'Resource recombination', 'Timing optimization']
      };
    }

    return {
      problem_breakdown: ['Component 1', 'Component 2', 'Component 3'],
      dependencies: ['A requires B', 'C can be parallel to A'],
      priority_ranking: [
        { component: 'Component 1', priority: 'High', reasoning: 'Foundation requirement' }
      ]
    };
  }

  private evaluateSuccessCriteria(
    criteria: Record<string, any>,
    stepResults: ChainExecution['step_results']
  ): boolean {
    // Evaluate whether the execution meets the defined success criteria
    return stepResults.length > 0 && stepResults.every(step => step.success);
  }

  private async storeExecution(execution: ChainExecution, userId?: string): Promise<void> {
    try {
      await this.supabase.from('agent_context_memory').insert({
        agent_id: 'prompt_chaining_system',
        user_id: userId,
        context_type: 'prompt_chain_execution',
        context_data: {
          execution_id: execution.execution_id,
          chain_id: execution.chain_id,
          status: execution.status,
          steps_completed: execution.step_results.length,
          total_execution_time_ms: execution.total_execution_time_ms,
          success_rate: execution.step_results.filter(s => s.success).length / execution.step_results.length,
          final_result: execution.final_result
        },
        reasoning_summary: `Prompt chain execution: ${execution.chain_id}, ${execution.step_results.length} steps completed`,
        confidence_score: execution.step_results.filter(s => s.success).length / execution.step_results.length,
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
      });
    } catch (error) {
      console.error('Failed to store prompt chain execution:', error);
    }
  }

  async getAvailableChains(): Promise<PromptChain[]> {
    return Array.from(this.chains.values());
  }

  async getChainHistory(
    userId?: string,
    chainId?: string,
    limit: number = 10
  ): Promise<ChainExecution[]> {
    try {
      let query = this.supabase
        .from('agent_context_memory')
        .select('*')
        .eq('agent_id', 'prompt_chaining_system')
        .eq('context_type', 'prompt_chain_execution')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (userId) {
        query = query.eq('user_id', userId);
      }

      if (chainId) {
        query = query.eq('context_data->chain_id', chainId);
      }

      const { data, error } = await query;
      if (error) throw error;

      return data?.map(record => ({
        chain_id: record.context_data.chain_id,
        execution_id: record.context_data.execution_id,
        status: record.context_data.status,
        current_step: record.context_data.steps_completed,
        step_results: [],
        final_result: record.context_data.final_result,
        total_execution_time_ms: record.context_data.total_execution_time_ms,
        created_at: new Date(record.created_at),
        completed_at: record.context_data.status === 'completed' ? new Date(record.updated_at) : undefined
      })) || [];
    } catch (error) {
      console.error('Failed to get chain history:', error);
      return [];
    }
  }

  async createCustomChain(
    name: string,
    description: string,
    templateIds: string[],
    chainLogic: PromptChain['chain_logic'] = 'sequential',
    successCriteria: Record<string, any> = {}
  ): Promise<PromptChain> {
    const chainId = `custom_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const templates = templateIds
      .map(id => this.templates.get(id))
      .filter((template): template is PromptTemplate => template !== undefined);

    const customChain: PromptChain = {
      id: chainId,
      name,
      description,
      templates,
      chain_logic: chainLogic,
      success_criteria: successCriteria
    };

    this.chains.set(chainId, customChain);
    return customChain;
  }
}