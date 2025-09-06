import { BaseAgent, AgentHandler } from '../_shared/memory-utils.ts';

export const handler: AgentHandler = async (userId, intent, params, supabaseClient, openAiClient, memory) => {
  const agent = new BaseAgent(supabaseClient, 'road-trip-planner');
  
  try {
    const { 
      vehicleType = 'car',
      routePreference = 'scenic',
      stopFrequency = 'moderate',
      accommodationMix = 'mixed',
      drivingExperience = 'experienced',
      groupSize = 2,
      destinations = []
    } = params;

    const userPrefs = await agent.getUserPreferences(userId);
    const roadTripHistory = await memory?.getMemory('road-trip-planner', userId, 'road_trip_routes') || [];

    const systemPrompt = `You are a road trip planning specialist for MAKU Travel's self-drive adventures.
    
    ROAD TRIP REQUEST:
    - Vehicle type: ${vehicleType}
    - Route preference: ${routePreference}
    - Stop frequency: ${stopFrequency}
    - Accommodation mix: ${accommodationMix}
    - Driving experience: ${drivingExperience}
    - Group size: ${groupSize}
    - Destinations: ${destinations.join(', ') || 'Road trip route'}
    
    USER PREFERENCES: ${JSON.stringify(userPrefs)}
    ROAD TRIP HISTORY: ${JSON.stringify(roadTripHistory)}

    Provide comprehensive road trip planning including:
    1. Optimal route planning and scenic highway selection
    2. Vehicle rental and equipment recommendations
    3. Accommodation booking along the route
    4. Fuel stop and service station planning
    5. Points of interest and attraction stops
    6. Local dining and regional cuisine discoveries
    7. Driving safety and road condition updates
    8. Parking and vehicle security considerations
    9. Emergency roadside assistance arrangements
    10. Photography and scenic viewpoint identification
    11. Rest stop and driver rotation planning
    12. Local driving laws and regulation guidance
    
    Create memorable self-drive adventures with optimal routing and experiences.`;

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
          { role: 'user', content: `Plan road trip through ${destinations.join(', ')} with ${vehicleType} taking ${routePreference} routes` }
        ],
        max_completion_tokens: 2000
      }),
    });

    const aiResponse = await response.json();
    const roadTripPlan = aiResponse.choices[0]?.message?.content;

    await agent.logActivity(userId, 'road_trip_planned', {
      destinations: destinations.length,
      vehicleType,
      routePreference
    });

    const updatedHistory = [...roadTripHistory, {
      destinations,
      vehicleType,
      routePreference,
      groupSize,
      plannedAt: new Date().toISOString()
    }].slice(-10);

    return {
      success: true,
      result: {
        roadTripPlan,
        routeOptimization: `${routePreference} routes selected for maximum enjoyment`,
        stopPlanning: `${stopFrequency} stop frequency with curated points of interest`,
        vehicleSupport: `${vehicleType} rental and equipment recommendations provided`
      },
      memoryUpdates: [
        {
          key: 'road_trip_routes',
          data: updatedHistory,
          expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
        }
      ]
    };

  } catch (error) {
    console.error('Road trip planner error:', error);
    return {
      success: false,
      error: error.message || 'Failed to plan road trip'
    };
  }
};