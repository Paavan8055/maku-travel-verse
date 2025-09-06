import { BaseAgent, AgentHandler } from '../_shared/memory-utils.ts';
import { AmadeusClient, HotelBedsClient } from '../_shared/api-clients.ts';

// Primary Family Travel Agent - orchestrates other specialized agents
export const handler: AgentHandler = async (userId, intent, params, supabaseClient, openAiClient, memory) => {
  const agent = new BaseAgent(supabaseClient, 'family-travel-planner');
  
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
    // Get family details and preferences from params
    const { 
      destination, 
      dates, 
      familySize, 
      childrenAges = [], 
      budget, 
      interests = [],
      accessibility = false 
    } = params;

    // Validate required parameters
    if (!destination || !dates || !familySize) {
      return {
        success: false,
        error: 'Missing required parameters: destination, dates, or family size'
      };
    }

    // Get user preferences and previous family trips
    const userPrefs = await agent.getUserPreferences(userId);
    const tripHistory = await memory?.getMemory('family-travel-planner', userId, 'trip_history') || [];

    // Initialize API clients (would use real credentials in production)
    const amadeusClient = new AmadeusClient(
      Deno.env.get('AMADEUS_CLIENT_ID') || 'test',
      Deno.env.get('AMADEUS_CLIENT_SECRET') || 'test'
    );

    const hotelBedsClient = new HotelBedsClient(
      Deno.env.get('HOTELBEDS_API_KEY') || 'test',
      Deno.env.get('HOTELBEDS_SECRET') || 'test'
    );

    // Delegate to specialized agents based on intent
    if (intent === 'find_flights') {
      return await delegateToAgent('trip-planner', 'search_flights', { ...params, familyFriendly: true });
    }
    
    if (intent === 'find_hotels') {
      return await delegateToAgent('booking-assistant', 'search_hotels', { ...params, familyRooms: true });
    }
    
    if (intent === 'monitor_prices') {
      return await delegateToAgent('price-monitor', 'track_family_deals', params);
    }
    
    if (intent === 'find_activities') {
      return await delegateToAgent('activity-finder', 'family_activities', { ...params, childrenAges });
    }

    // Build comprehensive family-specific travel plan
    const systemPrompt = `You are the PRIMARY family travel agent for MAKU Travel. You coordinate with specialized agents to deliver complete family travel solutions.
    
    FAMILY PROFILE:
    - Family size: ${familySize} people
    - Children ages: ${childrenAges.join(', ') || 'None specified'}
    - Budget: ${budget || 'Not specified'}
    - Interests: ${interests.join(', ') || 'General tourism'}
    - Accessibility needs: ${accessibility ? 'Yes' : 'No'}
    
    DESTINATION: ${destination}
    TRAVEL DATES: ${JSON.stringify(dates)}
    
    USER PREFERENCES: ${JSON.stringify(userPrefs)}
    PREVIOUS TRIPS: ${JSON.stringify(tripHistory)}

    Create a comprehensive family travel plan including:
    1. Family-friendly accommodation recommendations
    2. Age-appropriate activities and attractions
    3. Restaurant suggestions with kid-friendly options
    4. Transportation considerations for families
    5. Safety tips and local customs
    6. Packing recommendations for family travel
    7. Budget breakdown by category
    
    Focus on practical logistics, safety, and ensuring entertainment for all age groups.
    Consider nap times, meal schedules, and child-friendly facilities.`;

    // Call OpenAI for travel planning
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
          { role: 'user', content: `Plan a family trip to ${destination} for ${familySize} people including children ages ${childrenAges.join(', ')}` }
        ],
        max_completion_tokens: 2000
      }),
    });

    const aiResponse = await response.json();
    const travelPlan = aiResponse.choices[0]?.message?.content;

    // Log activity
    await agent.logActivity(userId, 'family_trip_planned', {
      destination,
      familySize,
      childrenAges,
      budget
    });

    // Update trip history in memory
    const updatedHistory = [...tripHistory, {
      destination,
      dates,
      familySize,
      childrenAges,
      plannedAt: new Date().toISOString()
    }].slice(-10); // Keep last 10 trips

    return {
      success: true,
      result: {
        travelPlan,
        familyProfile: {
          size: familySize,
          childrenAges,
          accessibility
        },
        recommendations: {
          type: 'family-friendly',
          budget,
          interests
        }
      },
      memoryUpdates: [
        {
          key: 'trip_history',
          data: updatedHistory,
          expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString() // 1 year
        }
      ]
    };

  } catch (error) {
    console.error('Family travel planner error:', error);
    return {
      success: false,
      error: error.message || 'Failed to create family travel plan'
    };
  }
};