import { supabase } from "@/integrations/supabase/client";

export interface WorkflowStep {
  id: string;
  name: string;
  agentType: 'gpt_bot' | 'internal_agent';
  agentRole: string;
  prompt: string;
  dependencies?: string[];
  timeout?: number;
  retryCount?: number;
  requiredCapabilities?: string[];
}

export interface WorkflowTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  steps: WorkflowStep[];
  estimatedDuration: number;
  estimatedCost: number;
  businessValue: string;
  prerequisites?: string[];
}

export class WorkflowTemplateManager {
  private templates: Map<string, WorkflowTemplate> = new Map();

  constructor() {
    this.initializeTemplates();
  }

  private initializeTemplates() {
    // Customer Onboarding Workflow
    this.templates.set('customer_onboarding', {
      id: 'customer_onboarding',
      name: 'Customer Onboarding',
      description: 'Complete customer onboarding process with personalized welcome and setup',
      category: 'customer_service',
      estimatedDuration: 300000, // 5 minutes
      estimatedCost: 0.15,
      businessValue: 'Improved customer satisfaction and reduced time-to-value',
      steps: [
        {
          id: 'welcome_analysis',
          name: 'Welcome Message Generation',
          agentType: 'gpt_bot',
          agentRole: 'content_creator',
          prompt: 'Create a personalized welcome message for new customer: {customer_name}, industry: {industry}, company_size: {company_size}',
          requiredCapabilities: ['content_generation', 'personalization']
        },
        {
          id: 'account_setup',
          name: 'Account Configuration',
          agentType: 'internal_agent',
          agentRole: 'system_administrator',
          prompt: 'Configure account settings for {customer_id} with preferences: {preferences}',
          dependencies: ['welcome_analysis'],
          requiredCapabilities: ['account_management', 'system_configuration']
        },
        {
          id: 'training_plan',
          name: 'Training Plan Creation',
          agentType: 'gpt_bot',
          agentRole: 'training_specialist',
          prompt: 'Create a training plan for {customer_name} based on their role: {role} and experience: {experience_level}',
          dependencies: ['account_setup'],
          requiredCapabilities: ['training_design', 'content_creation']
        },
        {
          id: 'followup_schedule',
          name: 'Follow-up Scheduling',
          agentType: 'internal_agent',
          agentRole: 'customer_success',
          prompt: 'Schedule follow-up touchpoints for {customer_id} based on onboarding plan',
          dependencies: ['training_plan'],
          requiredCapabilities: ['scheduling', 'customer_success']
        }
      ]
    });

    // Travel Booking Workflow
    this.templates.set('travel_booking_assistance', {
      id: 'travel_booking_assistance',
      name: 'Travel Booking Assistance',
      description: 'Comprehensive travel booking support from search to confirmation',
      category: 'travel_services',
      estimatedDuration: 600000, // 10 minutes
      estimatedCost: 0.25,
      businessValue: 'Enhanced booking experience and reduced abandonment rate',
      steps: [
        {
          id: 'requirements_analysis',
          name: 'Travel Requirements Analysis',
          agentType: 'gpt_bot',
          agentRole: 'travel_consultant',
          prompt: 'Analyze travel requirements: {destination}, {dates}, {budget}, {preferences} and provide recommendations',
          requiredCapabilities: ['travel_expertise', 'recommendation_engine']
        },
        {
          id: 'option_search',
          name: 'Travel Options Search',
          agentType: 'internal_agent',
          agentRole: 'search_engine',
          prompt: 'Search for travel options based on analyzed requirements: {requirements}',
          dependencies: ['requirements_analysis'],
          requiredCapabilities: ['api_integration', 'data_aggregation']
        },
        {
          id: 'comparison_analysis',
          name: 'Options Comparison',
          agentType: 'gpt_bot',
          agentRole: 'analyst',
          prompt: 'Compare travel options {options} and provide detailed analysis with pros/cons',
          dependencies: ['option_search'],
          requiredCapabilities: ['analytical_thinking', 'comparison_analysis']
        },
        {
          id: 'booking_assistance',
          name: 'Booking Process Support',
          agentType: 'internal_agent',
          agentRole: 'booking_specialist',
          prompt: 'Assist with booking process for selected option: {selected_option}',
          dependencies: ['comparison_analysis'],
          requiredCapabilities: ['booking_systems', 'payment_processing']
        },
        {
          id: 'confirmation_docs',
          name: 'Confirmation Documentation',
          agentType: 'gpt_bot',
          agentRole: 'document_generator',
          prompt: 'Generate confirmation documents and travel itinerary for booking: {booking_id}',
          dependencies: ['booking_assistance'],
          requiredCapabilities: ['document_generation', 'formatting']
        }
      ]
    });

    // Content Marketing Campaign Workflow
    this.templates.set('content_marketing_campaign', {
      id: 'content_marketing_campaign',
      name: 'Content Marketing Campaign',
      description: 'End-to-end content marketing campaign creation and execution',
      category: 'marketing',
      estimatedDuration: 1800000, // 30 minutes
      estimatedCost: 0.45,
      businessValue: 'Automated content creation and improved marketing efficiency',
      steps: [
        {
          id: 'market_research',
          name: 'Market Research & Analysis',
          agentType: 'gpt_bot',
          agentRole: 'market_researcher',
          prompt: 'Conduct market research for {industry} targeting {audience} with focus on {topics}',
          requiredCapabilities: ['research', 'market_analysis']
        },
        {
          id: 'content_strategy',
          name: 'Content Strategy Development',
          agentType: 'gpt_bot',
          agentRole: 'content_strategist',
          prompt: 'Develop content strategy based on research: {research_findings} for {campaign_goals}',
          dependencies: ['market_research'],
          requiredCapabilities: ['strategy_development', 'content_planning']
        },
        {
          id: 'content_creation',
          name: 'Content Creation',
          agentType: 'gpt_bot',
          agentRole: 'content_creator',
          prompt: 'Create content pieces according to strategy: {strategy} for platforms: {platforms}',
          dependencies: ['content_strategy'],
          requiredCapabilities: ['copywriting', 'content_creation']
        },
        {
          id: 'asset_optimization',
          name: 'Asset Optimization',
          agentType: 'internal_agent',
          agentRole: 'digital_optimizer',
          prompt: 'Optimize content assets for SEO and performance: {content_assets}',
          dependencies: ['content_creation'],
          requiredCapabilities: ['seo_optimization', 'performance_tuning']
        },
        {
          id: 'campaign_scheduling',
          name: 'Campaign Scheduling',
          agentType: 'internal_agent',
          agentRole: 'campaign_manager',
          prompt: 'Schedule campaign deployment across platforms: {platforms} with timeline: {timeline}',
          dependencies: ['asset_optimization'],
          requiredCapabilities: ['campaign_management', 'scheduling']
        }
      ]
    });

    // Crisis Management Workflow
    this.templates.set('crisis_management', {
      id: 'crisis_management',
      name: 'Crisis Management Response',
      description: 'Rapid response workflow for crisis situations',
      category: 'emergency',
      estimatedDuration: 900000, // 15 minutes
      estimatedCost: 0.35,
      businessValue: 'Rapid crisis response and stakeholder communication',
      steps: [
        {
          id: 'situation_assessment',
          name: 'Crisis Situation Assessment',
          agentType: 'gpt_bot',
          agentRole: 'crisis_analyst',
          prompt: 'Assess crisis situation: {incident_details} and determine severity, impact, and required actions',
          requiredCapabilities: ['crisis_analysis', 'risk_assessment'],
          timeout: 60000 // 1 minute
        },
        {
          id: 'stakeholder_identification',
          name: 'Stakeholder Identification',
          agentType: 'internal_agent',
          agentRole: 'stakeholder_manager',
          prompt: 'Identify and prioritize stakeholders to notify based on crisis assessment: {assessment}',
          dependencies: ['situation_assessment'],
          requiredCapabilities: ['stakeholder_management', 'prioritization']
        },
        {
          id: 'communication_drafting',
          name: 'Crisis Communication Drafting',
          agentType: 'gpt_bot',
          agentRole: 'communications_specialist',
          prompt: 'Draft appropriate crisis communications for stakeholders: {stakeholders} regarding: {crisis_summary}',
          dependencies: ['stakeholder_identification'],
          requiredCapabilities: ['crisis_communication', 'messaging']
        },
        {
          id: 'response_coordination',
          name: 'Response Coordination',
          agentType: 'internal_agent',
          agentRole: 'incident_commander',
          prompt: 'Coordinate crisis response actions: {response_plan} and deploy communications: {communications}',
          dependencies: ['communication_drafting'],
          requiredCapabilities: ['incident_management', 'coordination']
        }
      ]
    });
  }

  async executeWorkflow(templateId: string, context: Record<string, any>, userId?: string): Promise<string> {
    const template = this.templates.get(templateId);
    if (!template) {
      throw new Error(`Workflow template ${templateId} not found`);
    }

    // Create workflow execution record using existing workflow table
    const { data: execution, error } = await supabase
      .from('gpt_bot_workflows')
      .insert({
        workflow_name: `${templateId}_execution_${Date.now()}`,
        workflow_steps: template.steps,
        description: `Execution of ${template.name}`,
        category: template.category,
        created_by: userId || 'system',
        is_template: false
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create workflow execution: ${error.message}`);
    }

    // Start workflow orchestration
    const { error: orchestratorError } = await supabase.functions.invoke('gpt-workflow-orchestrator', {
      body: {
        action: 'start',
        workflowSteps: template.steps.map(step => ({
          ...step,
          botId: this.mapRoleToBot(step.agentRole),
          prompt: this.interpolatePrompt(step.prompt, context)
        })),
        executionId: execution.id,
        context
      }
    });

    if (orchestratorError) {
      throw new Error(`Failed to start workflow: ${orchestratorError.message}`);
    }

    return execution.id;
  }

  private mapRoleToBot(role: string): string {
    // Map agent roles to specific bot IDs
    const roleMapping: Record<string, string> = {
      'content_creator': 'content-bot',
      'travel_consultant': 'travel-advisor',
      'analyst': 'data-analyst',
      'market_researcher': 'research-bot',
      'content_strategist': 'strategy-bot',
      'crisis_analyst': 'crisis-bot',
      'communications_specialist': 'comms-bot'
    };

    return roleMapping[role] || 'general-assistant';
  }

  private interpolatePrompt(prompt: string, context: Record<string, any>): string {
    let interpolated = prompt;
    
    // Replace {variable} with context values
    Object.keys(context).forEach(key => {
      const regex = new RegExp(`{${key}}`, 'g');
      interpolated = interpolated.replace(regex, String(context[key] || ''));
    });

    return interpolated;
  }

  getTemplate(templateId: string): WorkflowTemplate | undefined {
    return this.templates.get(templateId);
  }

  getAllTemplates(): WorkflowTemplate[] {
    return Array.from(this.templates.values());
  }

  getTemplatesByCategory(category: string): WorkflowTemplate[] {
    return this.getAllTemplates().filter(template => template.category === category);
  }

  async createCustomTemplate(template: Omit<WorkflowTemplate, 'id'>, userId: string): Promise<string> {
    const templateId = `custom_${Date.now()}`;
    const fullTemplate: WorkflowTemplate = {
      ...template,
      id: templateId
    };

    // Store in database
    const { error } = await supabase
      .from('gpt_bot_workflows')
      .insert({
        id: templateId,
        workflow_name: template.name,
        workflow_steps: template.steps,
        description: template.description,
        category: template.category,
        created_by: userId,
        is_template: true,
        estimated_duration: template.estimatedDuration,
        estimated_cost: template.estimatedCost
      });

    if (error) {
      throw new Error(`Failed to create custom template: ${error.message}`);
    }

    this.templates.set(templateId, fullTemplate);
    return templateId;
  }

  async getWorkflowStatus(executionId: string): Promise<any> {
    const { data, error } = await supabase
      .from('gpt_bot_workflows')
      .select('*')
      .eq('id', executionId)
      .single();

    if (error) {
      throw new Error(`Failed to get workflow status: ${error.message}`);
    }

    return data;
  }

  async cancelWorkflow(executionId: string): Promise<void> {
    const { error } = await supabase.functions.invoke('gpt-workflow-orchestrator', {
      body: {
        action: 'cancel',
        executionId
      }
    });

    if (error) {
      throw new Error(`Failed to cancel workflow: ${error.message}`);
    }
  }
}