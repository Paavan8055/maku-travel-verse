import { BaseAgent, AgentHandler } from '../_shared/memory-utils.ts';
import { AmadeusClient, HotelBedsClient } from '../_shared/api-clients.ts';

export const handler: AgentHandler = async (userId, intent, params, supabaseClient, openAiClient, memory) => {
  const agent = new BaseAgent(supabaseClient, 'solo-travel-planner');
  
  try {
    const { 
      destination, 
      dates, 
      budget, 
      travelStyle = 'adventure', // adventure, wellness, cultural, business
      safetyLevel = 'standard', // low, standard, high
      socialPreference = 'mixed' // solo, mixed, social
    } = params;

    if (!destination || !dates) {
      return {
        success: false,
        error: 'Missing required parameters: destination or dates'
      };
    }

    const userPrefs = await agent.getUserPreferences(userId);
    const soloTripHistory = await memory?.getMemory('solo-travel-planner', userId, 'solo_trips') || [];

    const systemPrompt = `You are a solo travel specialist for MAKU Travel.
    
    SOLO TRAVELER PROFILE:
    - Destination: ${destination}
    - Travel dates: ${JSON.stringify(dates)}
    - Budget: ${budget || 'Flexible'}
    - Travel style: ${travelStyle}
    - Safety preference: ${safetyLevel}
    - Social preference: ${socialPreference}
    
    USER PREFERENCES: ${JSON.stringify(userPrefs)}
    PREVIOUS SOLO TRIPS: ${JSON.stringify(soloTripHistory)}

    Create a personalized solo travel plan including:
    1. Solo-friendly accommodation (single occupancy, safety, social areas)
    2. Solo activities and experiences (tours, classes, meetups)
    3. Safety recommendations and emergency contacts
    4. Local meetup opportunities and social events
    5. Solo dining options and local food experiences
    6. Transportation advice for solo travelers
    7. Budget optimization for single travelers
    8. Photography spots and solo-friendly attractions
    
    Consider safety, social opportunities, and personal growth experiences.
    Emphasize independence while providing connection opportunities.`;

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
          { role: 'user', content: `Plan a ${travelStyle} solo trip to ${destination}` }
        ],
        max_completion_tokens: 2000
      }),
    });

    const aiResponse = await response.json();
    const soloTravelPlan = aiResponse.choices[0]?.message?.content;

    await agent.logActivity(userId, 'solo_trip_planned', {
      destination,
      travelStyle,
      safetyLevel,
      socialPreference
    });

    const updatedSoloHistory = [...soloTripHistory, {
      destination,
      dates,
      travelStyle,
      safetyLevel,
      socialPreference,
      plannedAt: new Date().toISOString()
    }].slice(-10);

    return {
      success: true,
      result: {
        soloTravelPlan,
        travelProfile: {
          style: travelStyle,
          safetyLevel,
          socialPreference
        },
        safetyTips: `Customized safety recommendations for ${destination}`,
        socialOpportunities: `Solo traveler meetups and social activities in ${destination}`
      },
      memoryUpdates: [
        {
          key: 'solo_trips',
          data: updatedSoloHistory,
          expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
        }
      ]
    };

  } catch (error) {
    console.error('Solo travel planner error:', error);
    return {
      success: false,
      error: error.message || 'Failed to create solo travel plan'
    };
  }
};