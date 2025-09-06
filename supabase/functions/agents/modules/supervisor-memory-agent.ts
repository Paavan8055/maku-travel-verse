import { BaseAgent, AgentHandler } from '../_shared/memory-utils.ts';

export const handler: AgentHandler = async (userId, intent, params, supabaseClient, openAiClient, memory) => {
  const agent = new BaseAgent(supabaseClient, 'supervisor-memory-agent');
  
  try {
    const { 
      taskType = 'workflow_coordination',
      complexWorkflow = true,
      multiStepProcess = true,
      crossAgentCoordination = false,
      memoryScope = 'user_session',
      orchestrationLevel = 'advanced'
    } = params;

    // Fetch all user's active tasks
    const { data: activeTasks } = await supabaseClient
      .from('agentic_tasks')
      .select('*')
      .eq('user_id', userId)
      .in('status', ['pending', 'in_progress']);

    // Fetch comprehensive memory context
    const allMemoryContexts = await Promise.all([
      memory?.getMemory('supervisor-memory-agent', userId, 'workflow_state'),
      memory?.getMemory('supervisor-memory-agent', userId, 'agent_coordination'),
      memory?.getMemory('supervisor-memory-agent', userId, 'task_dependencies'),
      memory?.getMemory('supervisor-memory-agent', userId, 'user_context')
    ]);

    const [workflowState, agentCoordination, taskDependencies, userContext] = allMemoryContexts;

    const systemPrompt = `You are the supervisor memory agent for MAKU Travel's advanced orchestration system.
    
    SUPERVISOR COORDINATION REQUEST:
    - Task type: ${taskType}
    - Complex workflow: ${complexWorkflow}
    - Multi-step process: ${multiStepProcess}
    - Cross-agent coordination: ${crossAgentCoordination}
    - Memory scope: ${memoryScope}
    - Orchestration level: ${orchestrationLevel}
    
    ACTIVE TASKS: ${JSON.stringify(activeTasks || [])}
    WORKFLOW STATE: ${JSON.stringify(workflowState || {})}
    AGENT COORDINATION: ${JSON.stringify(agentCoordination || {})}
    TASK DEPENDENCIES: ${JSON.stringify(taskDependencies || {})}
    USER CONTEXT: ${JSON.stringify(userContext || {})}

    Provide advanced orchestration and memory management including:
    1. Multi-agent workflow coordination and sequencing
    2. Cross-task dependency tracking and resolution
    3. Long-term memory context preservation
    4. Agent handoff and state transfer management
    5. Complex workflow step orchestration
    6. User preference and context continuity
    7. Error recovery and workflow resilience
    8. Performance optimization and resource allocation
    9. Real-time collaboration between specialized agents
    10. Workflow progress monitoring and reporting
    11. Decision point routing and agent selection
    12. Memory consolidation and context synthesis
    
    Orchestrate seamless multi-agent experiences with intelligent workflow management.`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-5-2025-08-07',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Orchestrate ${taskType} with ${orchestrationLevel} coordination for ${activeTasks?.length || 0} active tasks` }
        ],
        max_completion_tokens: 2500
      }),
    });

    const aiResponse = await response.json();
    const orchestrationPlan = aiResponse.choices[0]?.message?.content;

    await agent.logActivity(userId, 'workflow_orchestrated', {
      taskType,
      activeTaskCount: activeTasks?.length || 0,
      orchestrationLevel
    });

    // Update coordination state
    const coordinationState = {
      activeTasks: activeTasks?.map(t => ({ id: t.id, agent_id: t.agent_id, status: t.status })),
      orchestrationLevel,
      lastCoordination: new Date().toISOString(),
      workflowComplexity: complexWorkflow ? 'high' : 'standard'
    };

    return {
      success: true,
      result: {
        orchestrationPlan,
        coordinationStatus: 'Multi-agent workflow coordination active',
        memoryManagement: 'Cross-session context and state preservation enabled',
        workflowIntelligence: 'Advanced workflow routing and optimization engaged'
      },
      memoryUpdates: [
        {
          key: 'workflow_state',
          data: coordinationState,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          key: 'agent_coordination',
          data: {
            coordinatedAgents: activeTasks?.map(t => t.agent_id) || [],
            coordinationTime: new Date().toISOString(),
            crossAgentEnabled: crossAgentCoordination
          },
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
        }
      ]
    };

  } catch (error) {
    console.error('Supervisor memory agent error:', error);
    return {
      success: false,
      error: error.message || 'Failed to orchestrate workflow'
    };
  }
};