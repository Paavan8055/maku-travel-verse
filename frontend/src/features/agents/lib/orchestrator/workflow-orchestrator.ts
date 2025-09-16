import { ToolCall, ToolResult } from '../tools/types';
import { EnhancedBaseAgent } from '../enhanced-base-agent';

export interface ChainStep {
  id: string;
  toolName: string;
  parameters: Record<string, any>;
  description: string;
}

export interface ConditionalStep extends ChainStep {
  condition?: {
    type: 'user-preference' | 'data-validation' | 'business-rule' | 'external-api';
    expression: string;
    parameters: Record<string, any>;
  };
  branches?: {
    true?: ChainStep[];
    false?: ChainStep[];
  };
}

export interface ParallelExecution {
  id: string;
  steps: ChainStep[];
  syncPoint: string; // Step ID to wait for all parallel tasks
  timeout?: number; // milliseconds
}

export interface WorkflowTemplate {
  id: string;
  name: string;
  description: string;
  category: 'travel-booking' | 'customer-service' | 'research' | 'planning';
  steps: ConditionalStep[];
  parallelExecutions: ParallelExecution[];
  failureHandling: {
    retryPolicy: {
      maxRetries: number;
      backoffStrategy: 'linear' | 'exponential';
      baseDelay: number;
    };
    rollbackSteps: string[]; // Step IDs to rollback on failure
    alternativeChain?: string; // Alternative workflow ID
  };
  metadata: {
    estimatedDuration: number; // minutes
    requiredAgentTypes: string[];
    complexity: 'simple' | 'medium' | 'complex';
    tags: string[];
  };
}

export interface WorkflowExecution {
  id: string;
  templateId: string;
  status: 'pending' | 'running' | 'paused' | 'completed' | 'failed' | 'rolled-back';
  currentStep: number;
  parallelTasks: Map<string, 'pending' | 'running' | 'completed' | 'failed'>;
  startedAt: Date;
  completedAt?: Date;
  results: Record<string, any>;
  context: Record<string, any>;
  assignedAgents: string[];
  errorHistory: Array<{
    step: number;
    error: string;
    timestamp: Date;
    retryCount: number;
  }>;
}

export class WorkflowOrchestrator {
  private templates: Map<string, WorkflowTemplate> = new Map();
  private executions: Map<string, WorkflowExecution> = new Map();
  private agents: Map<string, EnhancedBaseAgent> = new Map();

  constructor() {
    this.initializeDefaultTemplates();
  }

  // Template Management
  registerTemplate(template: WorkflowTemplate): void {
    this.templates.set(template.id, template);
  }

  getTemplate(id: string): WorkflowTemplate | undefined {
    return this.templates.get(id);
  }

  getAllTemplates(): WorkflowTemplate[] {
    return Array.from(this.templates.values());
  }

  getTemplatesByCategory(category: WorkflowTemplate['category']): WorkflowTemplate[] {
    return Array.from(this.templates.values())
      .filter(t => t.category === category);
  }

  // Workflow Execution
  async executeWorkflow(
    templateId: string, 
    initialContext: Record<string, any>,
    assignedAgents: string[]
  ): Promise<string> {
    const template = this.templates.get(templateId);
    if (!template) {
      throw new Error(`Workflow template ${templateId} not found`);
    }

    const executionId = `exec-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const execution: WorkflowExecution = {
      id: executionId,
      templateId,
      status: 'pending',
      currentStep: 0,
      parallelTasks: new Map(),
      startedAt: new Date(),
      results: {},
      context: { ...initialContext },
      assignedAgents,
      errorHistory: []
    };

    this.executions.set(executionId, execution);

    // Start execution
    this.runWorkflow(executionId).catch(error => {
      console.error(`Workflow ${executionId} failed:`, error);
      execution.status = 'failed';
      execution.completedAt = new Date();
    });

    return executionId;
  }

  async pauseWorkflow(executionId: string): Promise<void> {
    const execution = this.executions.get(executionId);
    if (execution && execution.status === 'running') {
      execution.status = 'paused';
    }
  }

  async resumeWorkflow(executionId: string): Promise<void> {
    const execution = this.executions.get(executionId);
    if (execution && execution.status === 'paused') {
      execution.status = 'running';
      await this.runWorkflow(executionId);
    }
  }

  async cancelWorkflow(executionId: string): Promise<void> {
    const execution = this.executions.get(executionId);
    if (execution && ['pending', 'running', 'paused'].includes(execution.status)) {
      await this.rollbackWorkflow(executionId);
      execution.status = 'rolled-back';
      execution.completedAt = new Date();
    }
  }

  getExecution(executionId: string): WorkflowExecution | undefined {
    return this.executions.get(executionId);
  }

  // Private Methods
  private async runWorkflow(executionId: string): Promise<void> {
    const execution = this.executions.get(executionId);
    const template = execution ? this.templates.get(execution.templateId) : undefined;
    
    if (!execution || !template) return;

    execution.status = 'running';

    try {
      for (let i = execution.currentStep; i < template.steps.length; i++) {
        if (execution.status !== 'running') break;

        const step = template.steps[i];
        execution.currentStep = i;

        // Check condition if present
        if (step.condition && !await this.evaluateCondition(step.condition, execution.context)) {
          if (step.branches?.false) {
            await this.executeSteps(step.branches.false, execution);
          }
          continue;
        }

        // Execute step or true branch
        const stepsToExecute = step.branches?.true || [step];
        await this.executeSteps(stepsToExecute, execution);

        // Handle parallel executions
        const parallelExecution = template.parallelExecutions.find(pe => 
          pe.syncPoint === step.id
        );
        
        if (parallelExecution) {
          await this.executeParallelSteps(parallelExecution, execution);
        }
      }

      if (execution.status === 'running') {
        execution.status = 'completed';
        execution.completedAt = new Date();
      }
    } catch (error) {
      await this.handleWorkflowError(execution, template, error as Error);
    }
  }

  private async executeSteps(steps: ChainStep[], execution: WorkflowExecution): Promise<void> {
    for (const step of steps) {
      const agent = this.agents.get(execution.assignedAgents[0]); // Simplified agent selection
      if (!agent) continue;

      try {
        const toolCall: ToolCall = {
          id: `call-${Date.now()}`,
          type: 'function',
          function: {
            name: step.toolName,
            arguments: JSON.stringify({
              ...step.parameters,
              ...this.resolveParameters(step.parameters, execution.context)
            })
          }
        };

        const results = await agent.executeToolsWithContext([toolCall]);
        
        if (results[0]?.success) {
          execution.results[step.id] = results[0].result;
          execution.context = { ...execution.context, ...results[0].result };
        } else {
          throw new Error(results[0]?.error || 'Tool execution failed');
        }
      } catch (error) {
        throw new Error(`Step ${step.id} failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
  }

  private async executeParallelSteps(
    parallelExecution: ParallelExecution, 
    execution: WorkflowExecution
  ): Promise<void> {
    const tasks = parallelExecution.steps.map(async (step) => {
      execution.parallelTasks.set(step.id, 'running');
      
      try {
        await this.executeSteps([step], execution);
        execution.parallelTasks.set(step.id, 'completed');
      } catch (error) {
        execution.parallelTasks.set(step.id, 'failed');
        throw error;
      }
    });

    // Wait for all parallel tasks with timeout
    const timeout = parallelExecution.timeout || 300000; // 5 minutes default
    await Promise.race([
      Promise.all(tasks),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Parallel execution timeout')), timeout))
    ]);
  }

  private async evaluateCondition(
    condition: NonNullable<ConditionalStep['condition']>, 
    context: Record<string, any>
  ): Promise<boolean> {
    switch (condition.type) {
      case 'user-preference':
        return this.evaluateUserPreference(condition.expression, context, condition.parameters);
      case 'data-validation':
        return this.evaluateDataValidation(condition.expression, context, condition.parameters);
      case 'business-rule':
        return this.evaluateBusinessRule(condition.expression, context, condition.parameters);
      case 'external-api':
        return await this.evaluateExternalAPI(condition.expression, context, condition.parameters);
      default:
        return true;
    }
  }

  private evaluateUserPreference(expression: string, context: Record<string, any>, params: Record<string, any>): boolean {
    // Simplified preference evaluation
    const userPrefs = context.userPreferences || {};
    const [key, operator, value] = expression.split(' ');
    const prefValue = userPrefs[key];

    switch (operator) {
      case '==': return prefValue === value;
      case '!=': return prefValue !== value;
      case '>': return Number(prefValue) > Number(value);
      case '<': return Number(prefValue) < Number(value);
      case 'includes': return Array.isArray(prefValue) && prefValue.includes(value);
      default: return true;
    }
  }

  private evaluateDataValidation(expression: string, context: Record<string, any>, params: Record<string, any>): boolean {
    // Simplified data validation
    try {
      return new Function('context', 'params', `return ${expression}`)(context, params);
    } catch {
      return false;
    }
  }

  private evaluateBusinessRule(expression: string, context: Record<string, any>, params: Record<string, any>): boolean {
    // Business rule evaluation (price thresholds, availability, etc.)
    const rules = {
      'budget_check': () => (context.totalPrice || 0) <= (params.maxBudget || Infinity),
      'availability_check': () => context.availability === true,
      'time_constraint': () => {
        const now = new Date();
        const deadline = new Date(params.deadline);
        return now < deadline;
      }
    };

    return rules[expression as keyof typeof rules]?.() || true;
  }

  private async evaluateExternalAPI(expression: string, context: Record<string, any>, params: Record<string, any>): Promise<boolean> {
    // External API calls for real-time data
    try {
      // This would make actual API calls based on expression
      // For now, return true
      return true;
    } catch {
      return false;
    }
  }

  private resolveParameters(params: Record<string, any>, context: Record<string, any>): Record<string, any> {
    const resolved: Record<string, any> = {};
    
    for (const [key, value] of Object.entries(params)) {
      if (typeof value === 'string' && value.startsWith('${') && value.endsWith('}')) {
        // Context variable reference
        const varName = value.slice(2, -1);
        resolved[key] = context[varName];
      } else {
        resolved[key] = value;
      }
    }
    
    return resolved;
  }

  private async handleWorkflowError(
    execution: WorkflowExecution, 
    template: WorkflowTemplate, 
    error: Error
  ): Promise<void> {
    const currentStep = execution.currentStep;
    const retryCount = execution.errorHistory.filter(e => e.step === currentStep).length;

    execution.errorHistory.push({
      step: currentStep,
      error: error.message,
      timestamp: new Date(),
      retryCount
    });

    // Check retry policy
    if (retryCount < template.failureHandling.retryPolicy.maxRetries) {
      const delay = this.calculateRetryDelay(
        retryCount, 
        template.failureHandling.retryPolicy
      );
      
      setTimeout(() => {
        this.runWorkflow(execution.id).catch(console.error);
      }, delay);
      
      return;
    }

    // Execute rollback if max retries exceeded
    if (template.failureHandling.rollbackSteps.length > 0) {
      await this.rollbackWorkflow(execution.id);
      execution.status = 'rolled-back';
    } else {
      execution.status = 'failed';
    }

    execution.completedAt = new Date();

    // Try alternative chain if available
    if (template.failureHandling.alternativeChain) {
      await this.executeWorkflow(
        template.failureHandling.alternativeChain,
        execution.context,
        execution.assignedAgents
      );
    }
  }

  private calculateRetryDelay(retryCount: number, policy: WorkflowTemplate['failureHandling']['retryPolicy']): number {
    switch (policy.backoffStrategy) {
      case 'linear':
        return policy.baseDelay * (retryCount + 1);
      case 'exponential':
        return policy.baseDelay * Math.pow(2, retryCount);
      default:
        return policy.baseDelay;
    }
  }

  private async rollbackWorkflow(executionId: string): Promise<void> {
    const execution = this.executions.get(executionId);
    const template = execution ? this.templates.get(execution.templateId) : undefined;
    
    if (!execution || !template) return;

    // Execute rollback steps in reverse order
    const rollbackSteps = template.failureHandling.rollbackSteps.reverse();
    
    for (const stepId of rollbackSteps) {
      const agent = this.agents.get(execution.assignedAgents[0]);
      if (!agent) continue;

      try {
        const toolCall: ToolCall = {
          id: `rollback-${Date.now()}`,
          type: 'function',
          function: {
            name: 'rollback_action',
            arguments: JSON.stringify({ stepId, context: execution.context })
          }
        };

        await agent.executeToolsWithContext([toolCall]);
      } catch (error) {
        console.error(`Rollback failed for step ${stepId}:`, error);
      }
    }
  }

  private initializeDefaultTemplates(): void {
    // Comprehensive Travel Booking Template
    this.registerTemplate({
      id: 'comprehensive-travel-booking',
      name: 'Comprehensive Travel Booking',
      description: 'End-to-end travel booking with flights, hotels, and activities',
      category: 'travel-booking',
      steps: [
        {
          id: 'analyze-requirements',
          toolName: 'analyze_travel_requirements',
          parameters: { 
            destination: '${destination}',
            dates: '${dates}',
            budget: '${budget}',
            preferences: '${userPreferences}'
          },
          description: 'Analyze user travel requirements'
        },
        {
          id: 'search-flights',
          toolName: 'search_flights',
          parameters: { 
            origin: '${origin}',
            destination: '${destination}',
            dates: '${dates}',
            passengers: '${passengers}'
          },
          description: 'Search for available flights',
          condition: {
            type: 'user-preference',
            expression: 'includeFlights == true',
            parameters: {}
          }
        },
        {
          id: 'search-hotels',
          toolName: 'search_hotels',
          parameters: { 
            destination: '${destination}',
            checkIn: '${checkIn}',
            checkOut: '${checkOut}',
            guests: '${guests}'
          },
          description: 'Search for available hotels'
        },
        {
          id: 'validate-budget',
          toolName: 'validate_total_cost',
          parameters: { 
            flightCost: '${flightResults.totalPrice}',
            hotelCost: '${hotelResults.totalPrice}',
            maxBudget: '${budget}'
          },
          description: 'Validate total cost against budget',
          condition: {
            type: 'business-rule',
            expression: 'budget_check',
            parameters: { maxBudget: '${budget}' }
          },
          branches: {
            true: [],
            false: [
              {
                id: 'suggest-alternatives',
                toolName: 'suggest_budget_alternatives',
                parameters: { 
                  currentTotal: '${totalCost}',
                  targetBudget: '${budget}'
                },
                description: 'Suggest budget-friendly alternatives'
              }
            ]
          }
        }
      ],
      parallelExecutions: [
        {
          id: 'parallel-search',
          steps: [
            {
              id: 'search-activities',
              toolName: 'search_activities',
              parameters: { 
                destination: '${destination}',
                dates: '${dates}',
                interests: '${userPreferences.interests}'
              },
              description: 'Search for activities and tours'
            },
            {
              id: 'check-weather',
              toolName: 'get_weather_forecast',
              parameters: { 
                destination: '${destination}',
                dates: '${dates}'
              },
              description: 'Get weather forecast for destination'
            }
          ],
          syncPoint: 'validate-budget',
          timeout: 30000
        }
      ],
      failureHandling: {
        retryPolicy: {
          maxRetries: 3,
          backoffStrategy: 'exponential',
          baseDelay: 1000
        },
        rollbackSteps: [],
        alternativeChain: 'simple-travel-booking'
      },
      metadata: {
        estimatedDuration: 15,
        requiredAgentTypes: ['travel-expert', 'booking-specialist'],
        complexity: 'complex',
        tags: ['booking', 'flights', 'hotels', 'activities']
      }
    });

    // Customer Support Resolution Template
    this.registerTemplate({
      id: 'customer-support-resolution',
      name: 'Customer Support Issue Resolution',
      description: 'Systematic approach to resolving customer support issues',
      category: 'customer-service',
      steps: [
        {
          id: 'categorize-issue',
          toolName: 'categorize_support_issue',
          parameters: { 
            description: '${issueDescription}',
            urgency: '${urgency}'
          },
          description: 'Categorize and prioritize the support issue'
        },
        {
          id: 'gather-context',
          toolName: 'gather_user_context',
          parameters: { 
            userId: '${userId}',
            bookingHistory: true,
            preferences: true
          },
          description: 'Gather relevant user context and history'
        },
        {
          id: 'attempt-resolution',
          toolName: 'attempt_automatic_resolution',
          parameters: { 
            issueCategory: '${issueCategory}',
            userContext: '${userContext}'
          },
          description: 'Attempt automatic resolution',
          condition: {
            type: 'business-rule',
            expression: 'context.issueCategory !== "complex"',
            parameters: {}
          },
          branches: {
            true: [],
            false: [
              {
                id: 'escalate-to-human',
                toolName: 'escalate_to_human_agent',
                parameters: { 
                  issue: '${issueDescription}',
                  context: '${userContext}',
                  priority: 'high'
                },
                description: 'Escalate complex issues to human agents'
              }
            ]
          }
        }
      ],
      parallelExecutions: [],
      failureHandling: {
        retryPolicy: {
          maxRetries: 2,
          backoffStrategy: 'linear',
          baseDelay: 2000
        },
        rollbackSteps: [],
        alternativeChain: 'human-handoff'
      },
      metadata: {
        estimatedDuration: 10,
        requiredAgentTypes: ['customer-service'],
        complexity: 'medium',
        tags: ['support', 'resolution', 'escalation']
      }
    });
  }
}