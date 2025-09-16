import { BaseAgent, AgentHandler } from '../_shared/memory-utils.ts';

export const handler: AgentHandler = async (userId, intent, params, supabaseClient, openAiClient, memory) => {
  const agent = new BaseAgent(supabaseClient, 'solo-travel-planner');
  
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
    const { destination, dates, travelStyle = 'adventure', age, interests = [] } = params;

    if (!destination || !dates) {
      return { success: false, error: 'Missing required parameters: destination or dates' };
    }

    if (intent === 'find_flights') {
      return await delegateToAgent('trip-planner', 'search_flights', { ...params, singleTraveler: true });
    }
    
    if (intent === 'find_accommodation') {
      return await delegateToAgent('booking-assistant', 'search_hotels', { ...params, singleOccupancy: true });
    }

    const systemPrompt = `You are a solo travel specialist for MAKU Travel. Create safe, enriching solo travel experiences for ${destination}.
    
    Traveler: Age ${age}, Style: ${travelStyle}, Interests: ${interests.join(', ')}
    
    Focus on safety, social opportunities, and authentic experiences for solo travelers.`;

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
          { role: 'user', content: `Plan a solo trip to ${destination}` }
        ],
        max_completion_tokens: 1500
      }),
    });

    const aiResponse = await response.json();
    const soloTravelPlan = aiResponse.choices[0]?.message?.content;

    await agent.logActivity(userId, 'solo_trip_planned', { destination, travelStyle });

    return {
      success: true,
      result: {
        soloTravelPlan,
        travelerProfile: { age, travelStyle },
        safetyTips: 'Solo travel safety recommendations',
        socialOpportunities: 'Ways to meet other travelers'
      }
    };

  } catch (error) {
    return { success: false, error: error.message || 'Failed to create solo travel plan' };
  }
};