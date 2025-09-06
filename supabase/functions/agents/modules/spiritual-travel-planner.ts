import { BaseAgent, AgentHandler } from '../_shared/memory-utils.ts';

// Primary Spiritual Travel Agent - orchestrates other specialized agents  
export const handler: AgentHandler = async (userId, intent, params, supabaseClient, openAiClient, memory) => {
  const agent = new BaseAgent(supabaseClient, 'spiritual-travel-planner');
  
  // Agent delegation helper
  const delegateToAgent = async (agentId: string, taskIntent: string, taskParams: any) => {
    try {
      const response = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/agents/${agentId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          intent: taskIntent,
          params: taskParams
        })
      });
      return await response.json();
    } catch (error) {
      console.error(`Failed to delegate to ${agentId}:`, error);
      return { success: false, error: error.message };
    }
  };
  
  try {
    const { 
      destination, 
      dates, 
      spiritualTradition = 'general', // buddhist, christian, hindu, islamic, jewish, general
      experience = 'contemplative', // pilgrimage, retreat, contemplative, learning
      duration,
      budget
    } = params;

    if (!destination || !dates) {
      return {
        success: false,
        error: 'Missing required parameters: destination or dates'
      };
    }

    // Delegate to specialized agents based on intent
    if (intent === 'find_spiritual_sites') {
      return await delegateToAgent('destination-guide', 'spiritual_sites', { destination, spiritualTradition });
    }
    
    if (intent === 'find_retreats') {
      return await delegateToAgent('booking-assistant', 'spiritual_retreats', { destination, experience });
    }
    
    if (intent === 'spiritual_guidance') {
      return await delegateToAgent('travel-advisor', 'spiritual_etiquette', { destination, spiritualTradition });
    }
    
    if (intent === 'pilgrimage_route') {
      return await delegateToAgent('itinerary-optimizer', 'pilgrimage_path', { destination, spiritualTradition, duration });
    }

    const spiritualHistory = await memory?.getMemory('spiritual-travel-planner', userId, 'spiritual_journeys') || [];

    const systemPrompt = `You are the PRIMARY spiritual travel agent for MAKU Travel. You coordinate with specialized agents to deliver complete spiritual travel solutions.
    
    SPIRITUAL JOURNEY REQUEST:
    - Destination: ${destination}
    - Travel dates: ${JSON.stringify(dates)}
    - Spiritual tradition: ${spiritualTradition}
    - Experience type: ${experience}
    - Duration: ${duration || 'Not specified'}
    - Budget: ${budget || 'Flexible'}
    
    PREVIOUS SPIRITUAL JOURNEYS: ${JSON.stringify(spiritualHistory)}

    Create a meaningful spiritual travel plan including:
    1. Sacred sites, temples, churches, or spiritual centers
    2. Retreat centers and meditation facilities
    3. Spiritual teachers, guides, and local practitioners
    4. Religious ceremonies and festivals during travel dates
    5. Pilgrimage routes and walking paths
    6. Spiritual workshops, classes, and learning opportunities
    7. Accommodation near spiritual sites (monasteries, ashrams, retreats)
    8. Dietary considerations and spiritual food practices
    9. Cultural etiquette and dress codes for sacred spaces
    10. Time for reflection, journaling, and contemplation
    11. Connection with local spiritual communities
    12. Books, resources, and preparation materials
    
    Focus on authentic spiritual experiences, respect for traditions,
    and personal growth opportunities. Consider quiet accommodation,
    vegetarian/special dietary options, and appropriate behavior in sacred spaces.`;

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
          { role: 'user', content: `Plan a ${experience} spiritual journey to ${destination} following ${spiritualTradition} traditions` }
        ],
        max_completion_tokens: 2000
      }),
    });

    const aiResponse = await response.json();
    const spiritualPlan = aiResponse.choices[0]?.message?.content;

    await agent.logActivity(userId, 'spiritual_journey_planned', {
      destination,
      spiritualTradition,
      experience,
      duration
    });

    const updatedSpiritualHistory = [...spiritualHistory, {
      destination,
      dates,
      spiritualTradition,
      experience,
      duration,
      plannedAt: new Date().toISOString()
    }].slice(-10);

    return {
      success: true,
      result: {
        spiritualPlan,
        tradition: spiritualTradition,
        experienceType: experience,
        sacredSites: `Sacred sites and spiritual centers in ${destination}`,
        culturalGuidance: `Etiquette and cultural considerations for ${spiritualTradition} practices`,
        preparation: 'Recommended reading and spiritual preparation materials'
      },
      memoryUpdates: [
        {
          key: 'spiritual_journeys',
          data: updatedSpiritualHistory,
          expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
        }
      ]
    };

  } catch (error) {
    console.error('Spiritual travel planner error:', error);
    return {
      success: false,
      error: error.message || 'Failed to create spiritual travel plan'
    };
  }
};