import { BaseAgent, AgentHandler } from '../_shared/memory-utils.ts';

export const handler: AgentHandler = async (userId, intent, params, supabaseClient, openAiClient, memory) => {
  const agent = new BaseAgent(supabaseClient, 'spiritual-travel-planner');
  
  const delegateToAgent = async (agentId: string, taskIntent: string, taskParams: any) => {
    try {
      const response = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/agents`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          agent_id: agentId,
          intent: taskIntent,
          params: { ...taskParams, userId }
        })
      });
      return await response.json();
    } catch (error) {
      return { success: false, error: error.message };
    }
  };
  
  try {
    const { destination, dates, spiritualPractice = 'meditation', faith = 'universal' } = params;

    if (!destination || !dates) {
      return { success: false, error: 'Missing required parameters: destination or dates' };
    }

    if (intent === 'find_retreats') {
      return await delegateToAgent('activity-finder', 'spiritual_retreats', { ...params, spiritualPractice, faith });
    }

    const systemPrompt = `You are a spiritual travel specialist for MAKU Travel. Create transformative spiritual journeys to ${destination}.
    
    Practice: ${spiritualPractice}, Faith: ${faith}
    
    Focus on sacred sites, retreats, and authentic spiritual experiences with cultural respect.`;

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
          { role: 'user', content: `Plan a spiritual journey to ${destination}` }
        ],
        max_completion_tokens: 1500
      }),
    });

    const aiResponse = await response.json();
    const spiritualJourneyPlan = aiResponse.choices[0]?.message?.content;

    await agent.logActivity(userId, 'spiritual_journey_planned', { destination, spiritualPractice, faith });

    return {
      success: true,
      result: {
        spiritualJourneyPlan,
        practiceProfile: { spiritualPractice, faith },
        sacredSites: 'Sacred locations and temples',
        practiceSupport: 'Daily spiritual practice guidance'
      }
    };

  } catch (error) {
    return { success: false, error: error.message || 'Failed to create spiritual journey plan' };
  }
};