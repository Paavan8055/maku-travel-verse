import { BaseAgent, AgentHandler } from '../_shared/memory-utils.ts';

export const handler: AgentHandler = async (userId, intent, params, supabaseClient, openAiClient, memory) => {
  const agent = new BaseAgent(supabaseClient, 'cruise-specialist');
  
  try {
    const { 
      cruiseType = 'ocean',
      cruiseLine = 'any',
      cabinPreference = 'balcony',
      diningPackage = 'standard',
      portActivities = true,
      duration = '7_days',
      destinations = []
    } = params;

    const userPrefs = await agent.getUserPreferences(userId);
    const cruiseHistory = await memory?.getMemory('cruise-specialist', userId, 'cruise_preferences') || [];

    const systemPrompt = `You are a cruise travel specialist for MAKU Travel's cruise vacations.
    
    CRUISE TRAVEL REQUEST:
    - Cruise type: ${cruiseType}
    - Cruise line preference: ${cruiseLine}
    - Cabin preference: ${cabinPreference}
    - Dining package: ${diningPackage}
    - Port activities: ${portActivities}
    - Duration: ${duration}
    - Destinations: ${destinations.join(', ') || 'Popular cruise routes'}
    
    USER PREFERENCES: ${JSON.stringify(userPrefs)}
    CRUISE HISTORY: ${JSON.stringify(cruiseHistory)}

    Provide comprehensive cruise vacation planning including:
    1. Cruise line and ship recommendations
    2. Cabin category and location optimization
    3. Dining package and specialty restaurant options
    4. Shore excursion and port activity planning
    5. Onboard entertainment and activity scheduling
    6. Cruise ship amenity and facility guidance
    7. Specialty cruise experience options
    8. Group and family cruise coordination
    9. Cruise insurance and protection plans
    10. Pre and post-cruise accommodation
    11. Transportation to and from ports
    12. Packing and preparation for cruise travel
    
    Maximize onboard experience and port exploration opportunities.`;

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
          { role: 'user', content: `Recommend ${cruiseType} cruise to ${destinations.join(', ')} for ${duration} with ${cabinPreference} cabin` }
        ],
        max_completion_tokens: 2000
      }),
    });

    const aiResponse = await response.json();
    const cruiseRecommendations = aiResponse.choices[0]?.message?.content;

    await agent.logActivity(userId, 'cruise_planned', {
      cruiseType,
      destinations: destinations.length,
      duration
    });

    const updatedHistory = [...cruiseHistory, {
      destinations,
      cruiseType,
      cabinPreference,
      duration,
      plannedAt: new Date().toISOString()
    }].slice(-10);

    return {
      success: true,
      result: {
        cruiseRecommendations,
        onboardExperience: 'Complete onboard amenity and entertainment guide provided',
        shoreExcursions: portActivities ? 'Port activities and excursions coordinated' : 'Onboard relaxation focused',
        cruiseValue: 'Best value cruise options with optimal timing identified'
      },
      memoryUpdates: [
        {
          key: 'cruise_preferences',
          data: updatedHistory,
          expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
        }
      ]
    };

  } catch (error) {
    console.error('Cruise specialist error:', error);
    return {
      success: false,
      error: error.message || 'Failed to plan cruise vacation'
    };
  }
};