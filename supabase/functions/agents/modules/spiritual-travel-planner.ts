import { BaseAgent, AgentHandler } from '../_shared/memory-utils.ts';

// Primary Spiritual Travel Agent - orchestrates specialized agents for spiritual/wellness journeys
export const handler: AgentHandler = async (userId, intent, params, supabaseClient, openAiClient, memory) => {
  const agent = new BaseAgent(supabaseClient, 'spiritual-travel-planner');
  
  // Agent delegation helper
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
      console.error(`Failed to delegate to ${agentId}:`, error);
      return { success: false, error: error.message };
    }
  };
  
  try {
    const { 
      destination, 
      dates, 
      spiritualPractice = 'meditation', // meditation, yoga, pilgrimage, retreat
      experienceLevel = 'beginner', // beginner, intermediate, advanced
      groupSize = 1,
      budget,
      focusAreas = [] // healing, mindfulness, cultural, nature
    } = params;

    if (!destination || !dates) {
      return {
        success: false,
        error: 'Missing required parameters: destination or dates'
      };
    }

    const userPrefs = await agent.getUserPreferences(userId);
    const spiritualHistory = await memory?.getMemory('spiritual-travel-planner', userId, 'spiritual_journeys') || [];

    // Delegate to specialized agents based on intent
    if (intent === 'find_retreats') {
      return await delegateToAgent('activity-finder', 'spiritual_retreats', { 
        destination, spiritualPractice, experienceLevel 
      });
    }
    
    if (intent === 'find_accommodation') {
      return await delegateToAgent('booking-assistant', 'wellness_hotels', { 
        destination, dates, groupSize, spiritualPractice 
      });
    }
    
    if (intent === 'find_teachers') {
      return await delegateToAgent('destination-guide', 'spiritual_teachers', { 
        destination, spiritualPractice, experienceLevel 
      });
    }
    
    if (intent === 'plan_pilgrimage') {
      return await delegateToAgent('itinerary-optimizer', 'pilgrimage_route', params);
    }

    const systemPrompt = `You are the PRIMARY spiritual travel agent for MAKU Travel. You coordinate with specialized agents to deliver transformative spiritual journey experiences.
    
    SPIRITUAL TRAVELER PROFILE:
    - Destination: ${destination}
    - Travel dates: ${JSON.stringify(dates)}
    - Spiritual practice: ${spiritualPractice}
    - Experience level: ${experienceLevel}
    - Group size: ${groupSize}
    - Budget: ${budget || 'Flexible'}
    - Focus areas: ${focusAreas.join(', ') || 'General spiritual growth'}
    
    USER PREFERENCES: ${JSON.stringify(userPrefs)}
    PREVIOUS SPIRITUAL JOURNEYS: ${JSON.stringify(spiritualHistory)}

    Create a transformative spiritual travel plan including:
    1. Sacred sites and spiritual destinations
    2. Meditation/yoga retreats and workshops
    3. Local spiritual teachers and guides
    4. Wellness accommodations (ashrams, retreat centers, eco-lodges)
    5. Spiritual practices and daily routines
    6. Cultural immersion and local traditions
    7. Healthy, mindful dining options
    8. Integration practices for post-journey
    9. Sacred ceremonies and rituals (if appropriate)
    10. Mindful transportation and eco-conscious travel
    
    Consider the spiritual significance of locations, seasonal energy, and personal growth opportunities.
    Emphasize authentic experiences, cultural respect, and inner transformation.`;

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
          { role: 'user', content: `Plan a ${spiritualPractice} spiritual journey to ${destination} for ${experienceLevel} practitioner(s)` }
        ],
        max_completion_tokens: 2000
      }),
    });

    const aiResponse = await response.json();
    const spiritualJourneyPlan = aiResponse.choices[0]?.message?.content;

    await agent.logActivity(userId, 'spiritual_journey_planned', {
      destination,
      spiritualPractice,
      experienceLevel,
      focusAreas
    });

    const updatedSpiritualHistory = [...spiritualHistory, {
      destination,
      dates,
      spiritualPractice,
      experienceLevel,
      focusAreas,
      plannedAt: new Date().toISOString()
    }].slice(-10);

    return {
      success: true,
      result: {
        spiritualJourneyPlan,
        practiceProfile: {
          practice: spiritualPractice,
          level: experienceLevel,
          focusAreas
        },
        sacredSites: `Sacred locations and spiritual sites in ${destination}`,
        growthOpportunities: `Personal development and spiritual growth activities`,
        culturalGuidance: `Cultural etiquette and spiritual customs for ${destination}`
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
      error: error.message || 'Failed to create spiritual journey plan'
    };
  }
};