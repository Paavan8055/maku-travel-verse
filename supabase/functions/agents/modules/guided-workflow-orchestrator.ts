import { BaseAgent, AgentHandler } from '../_shared/memory-utils.ts';

export const handler: AgentHandler = async (userId, intent, params, supabaseClient, openAiClient, memory) => {
  const agent = new BaseAgent(supabaseClient, 'guided-workflow-orchestrator');
  
  try {
    const { 
      workflowType,
      currentStep = 1,
      stepData = {},
      customerQuery,
      escalationLevel = 0,
      sessionId
    } = params;

    if (!workflowType) {
      return { success: false, error: 'Workflow type is required' };
    }

    // Get or create workflow session
    const workflowSession = await getOrCreateWorkflowSession(
      workflowType,
      userId,
      sessionId,
      supabaseClient
    );

    // Determine workflow configuration
    const workflowConfig = getWorkflowConfiguration(workflowType);
    if (!workflowConfig) {
      return { success: false, error: `Unknown workflow type: ${workflowType}` };
    }

    // Process current step
    const stepResult = await processWorkflowStep(
      workflowConfig,
      currentStep,
      stepData,
      customerQuery,
      escalationLevel,
      supabaseClient,
      openAiClient
    );

    // Update workflow session
    await updateWorkflowSession(
      workflowSession.id,
      currentStep,
      stepResult,
      supabaseClient
    );

    // Determine next step or completion
    const nextAction = determineNextAction(
      workflowConfig,
      currentStep,
      stepResult,
      escalationLevel
    );

    // Log workflow activity
    await agent.logActivity(userId, 'workflow_step_processed', {
      workflowType,
      currentStep,
      stepResult: stepResult.outcome,
      nextAction: nextAction.action,
      sessionId: workflowSession.id
    });

    // Store workflow state in memory
    await memory?.setMemory(
      'guided-workflow-orchestrator',
      userId,
      `workflow_${workflowSession.id}`,
      {
        workflowType,
        currentStep,
        stepHistory: [...(workflowSession.stepHistory || []), stepResult],
        customerSatisfaction: stepResult.customerSatisfaction,
        escalationLevel,
        lastUpdated: new Date().toISOString()
      },
      workflowSession.id
    );

    return {
      success: true,
      result: {
        sessionId: workflowSession.id,
        workflowType,
        currentStep,
        stepResult,
        nextAction,
        progress: calculateProgress(workflowConfig, currentStep, stepResult),
        estimatedCompletion: estimateCompletion(workflowConfig, currentStep),
        customerGuidance: generateCustomerGuidance(nextAction, workflowConfig)
      }
    };

  } catch (error) {
    console.error('Workflow orchestrator error:', error);
    return {
      success: false,
      error: 'Failed to process workflow: ' + error.message
    };
  }
};

async function getOrCreateWorkflowSession(
  workflowType: string,
  userId: string,
  sessionId: string | undefined,
  supabaseClient: any
): Promise<any> {
  if (sessionId) {
    // Try to get existing session
    const { data: existingSession } = await supabaseClient
      .from('agent_task_queue')
      .select('*')
      .eq('id', sessionId)
      .eq('customer_id', userId)
      .single();

    if (existingSession) {
      return existingSession;
    }
  }

  // Create new workflow session
  const { data: newSession, error } = await supabaseClient
    .from('agent_task_queue')
    .insert({
      agent_id: 'guided-workflow-orchestrator',
      task_type: workflowType,
      customer_id: userId,
      status: 'in_progress',
      task_data: {
        workflowType,
        startedAt: new Date().toISOString(),
        currentStep: 1,
        stepHistory: []
      }
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create workflow session: ${error.message}`);
  }

  return newSession;
}

function getWorkflowConfiguration(workflowType: string): any {
  const workflows = {
    booking_issue: {
      name: 'Booking Issue Resolution',
      steps: [
        { id: 1, name: 'Issue Identification', required: true },
        { id: 2, name: 'Customer Verification', required: true },
        { id: 3, name: 'Problem Analysis', required: true },
        { id: 4, name: 'Solution Implementation', required: true },
        { id: 5, name: 'Customer Confirmation', required: true }
      ],
      estimatedDuration: 15, // minutes
      escalationTriggers: ['payment_issue', 'system_error', 'customer_dissatisfaction']
    },
    refund_request: {
      name: 'Refund Processing',
      steps: [
        { id: 1, name: 'Request Validation', required: true },
        { id: 2, name: 'Policy Verification', required: true },
        { id: 3, name: 'Refund Calculation', required: true },
        { id: 4, name: 'Payment Processing', required: true },
        { id: 5, name: 'Confirmation & Documentation', required: true }
      ],
      estimatedDuration: 20,
      escalationTriggers: ['policy_exception', 'large_amount', 'system_error']
    },
    account_security: {
      name: 'Account Security Response',
      steps: [
        { id: 1, name: 'Security Assessment', required: true },
        { id: 2, name: 'Identity Verification', required: true },
        { id: 3, name: 'Threat Mitigation', required: true },
        { id: 4, name: 'Account Restoration', required: false },
        { id: 5, name: 'Security Education', required: true }
      ],
      estimatedDuration: 25,
      escalationTriggers: ['high_threat', 'identity_verification_failed', 'system_compromise']
    },
    general_support: {
      name: 'General Customer Support',
      steps: [
        { id: 1, name: 'Query Classification', required: true },
        { id: 2, name: 'Information Gathering', required: true },
        { id: 3, name: 'Solution Research', required: true },
        { id: 4, name: 'Response Delivery', required: true },
        { id: 5, name: 'Follow-up Scheduling', required: false }
      ],
      estimatedDuration: 10,
      escalationTriggers: ['complex_query', 'customer_frustration', 'technical_limitation']
    }
  };

  return workflows[workflowType];
}

async function processWorkflowStep(
  workflowConfig: any,
  currentStep: number,
  stepData: any,
  customerQuery: string,
  escalationLevel: number,
  supabaseClient: any,
  openAiClient: any
): Promise<any> {
  const step = workflowConfig.steps.find((s: any) => s.id === currentStep);
  if (!step) {
    throw new Error(`Invalid step ${currentStep} for workflow ${workflowConfig.name}`);
  }

  // Build step-specific prompt
  const stepPrompt = buildStepPrompt(workflowConfig, step, stepData, customerQuery, escalationLevel);

  // Call OpenAI for step processing
  const completion = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-5-2025-08-07',
      messages: [
        { role: 'system', content: stepPrompt },
        { role: 'user', content: customerQuery || `Process step ${currentStep}: ${step.name}` }
      ],
      max_completion_tokens: 1000
    }),
  });

  const response = await completion.json();
  const stepAnalysis = response.choices[0].message.content;

  // Parse structured response
  const stepResult = parseStepResponse(stepAnalysis, step, stepData);

  return {
    stepId: currentStep,
    stepName: step.name,
    outcome: stepResult.outcome,
    confidence: stepResult.confidence,
    customerSatisfaction: stepResult.customerSatisfaction,
    recommendedAction: stepResult.recommendedAction,
    escalationRequired: stepResult.escalationRequired,
    completedAt: new Date().toISOString(),
    processingTime: Date.now() - (stepData.startTime || Date.now())
  };
}

function buildStepPrompt(workflowConfig: any, step: any, stepData: any, customerQuery: string, escalationLevel: number): string {
  return `You are a customer support workflow orchestrator for MAKU Travel. You are currently processing step ${step.id}: "${step.name}" in the ${workflowConfig.name} workflow.

Current Context:
- Workflow: ${workflowConfig.name}
- Current Step: ${step.name}
- Escalation Level: ${escalationLevel}
- Customer Query: ${customerQuery || 'Not provided'}
- Step Data: ${JSON.stringify(stepData)}

Your task is to:
1. Analyze the current step requirements
2. Process the customer information/request
3. Determine the outcome and confidence level
4. Assess customer satisfaction
5. Recommend next actions
6. Identify if escalation is needed

Respond in this JSON format:
{
  "outcome": "success|requires_attention|failed",
  "confidence": 0.0-1.0,
  "customerSatisfaction": 1-10,
  "recommendedAction": "specific action recommendation",
  "escalationRequired": true|false,
  "reasoning": "explanation of your analysis",
  "nextStepData": { "any": "data needed for next step" }
}

Focus on customer satisfaction, clear communication, and efficient problem resolution.`;
}

function parseStepResponse(analysis: string, step: any, stepData: any): any {
  try {
    // Try to parse JSON response
    const jsonMatch = analysis.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
  } catch (error) {
    console.error('Failed to parse step response:', error);
  }

  // Fallback to basic parsing
  return {
    outcome: analysis.includes('success') ? 'success' : 'requires_attention',
    confidence: 0.7,
    customerSatisfaction: 7,
    recommendedAction: 'Continue to next step',
    escalationRequired: analysis.includes('escalation') || analysis.includes('escalate'),
    reasoning: analysis.substring(0, 200) + '...'
  };
}

async function updateWorkflowSession(
  sessionId: string,
  currentStep: number,
  stepResult: any,
  supabaseClient: any
): Promise<void> {
  const { error } = await supabaseClient
    .from('agent_task_queue')
    .update({
      status: stepResult.outcome === 'failed' ? 'failed' : 'in_progress',
      updated_at: new Date().toISOString(),
      result: {
        currentStep,
        latestStepResult: stepResult,
        lastUpdated: new Date().toISOString()
      }
    })
    .eq('id', sessionId);

  if (error) {
    console.error('Failed to update workflow session:', error);
  }
}

function determineNextAction(
  workflowConfig: any,
  currentStep: number,
  stepResult: any,
  escalationLevel: number
): any {
  if (stepResult.escalationRequired || escalationLevel > 2) {
    return {
      action: 'escalate',
      target: 'human_agent',
      reason: 'Escalation required based on step analysis',
      priority: escalationLevel > 2 ? 'high' : 'medium'
    };
  }

  if (stepResult.outcome === 'failed') {
    return {
      action: 'retry',
      target: currentStep,
      reason: 'Step failed, requires retry or escalation',
      priority: 'medium'
    };
  }

  if (currentStep >= workflowConfig.steps.length) {
    return {
      action: 'complete',
      target: 'workflow_completion',
      reason: 'All workflow steps completed successfully',
      priority: 'low'
    };
  }

  return {
    action: 'continue',
    target: currentStep + 1,
    reason: 'Proceed to next workflow step',
    priority: 'low'
  };
}

function calculateProgress(workflowConfig: any, currentStep: number, stepResult: any): number {
  const totalSteps = workflowConfig.steps.length;
  const completedSteps = stepResult.outcome === 'success' ? currentStep : currentStep - 1;
  return Math.round((completedSteps / totalSteps) * 100);
}

function estimateCompletion(workflowConfig: any, currentStep: number): number {
  const remainingSteps = workflowConfig.steps.length - currentStep + 1;
  const avgStepTime = workflowConfig.estimatedDuration / workflowConfig.steps.length;
  return Math.round(remainingSteps * avgStepTime);
}

function generateCustomerGuidance(nextAction: any, workflowConfig: any): string {
  const guidance = {
    continue: 'We\'re processing your request step by step. Please provide any additional information requested.',
    escalate: 'Your case requires special attention. A specialist will contact you shortly.',
    retry: 'We need to review some information. Please bear with us as we resolve this.',
    complete: 'Great! We\'ve successfully processed your request. You should receive confirmation shortly.'
  };

  return guidance[nextAction.action] || 'We\'re working on your request and will update you soon.';
}