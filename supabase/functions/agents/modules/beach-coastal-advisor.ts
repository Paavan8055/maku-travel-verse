import { BaseAgent, AgentHandler } from '../_shared/memory-utils.ts';

export const handler: AgentHandler = async (userId, intent, params, supabaseClient, openAiClient, memory) => {
  const agent = new BaseAgent(supabaseClient, 'beach-coastal-advisor');
  
  try {
    const { 
      beachActivities = [],
      waterSports = [],
      relaxationLevel = 'moderate',
      familyFriendly = false,
      beachType = 'any',
      seasonPreference = 'warm',
      destinations = []
    } = params;

    const userPrefs = await agent.getUserPreferences(userId);
    const beachHistory = await memory?.getMemory('beach-coastal-advisor', userId, 'beach_preferences') || [];

    const systemPrompt = `You are a beach and coastal travel advisor for MAKU Travel's seaside experiences.
    
    BEACH COASTAL REQUEST:
    - Beach activities: ${beachActivities.join(', ') || 'General beach relaxation'}
    - Water sports: ${waterSports.join(', ') || 'Swimming and lounging'}
    - Relaxation level: ${relaxationLevel}
    - Family friendly: ${familyFriendly}
    - Beach type preference: ${beachType}
    - Season preference: ${seasonPreference}
    - Destinations: ${destinations.join(', ') || 'Beautiful beach destinations'}
    
    USER PREFERENCES: ${JSON.stringify(userPrefs)}
    BEACH HISTORY: ${JSON.stringify(beachHistory)}

    Provide comprehensive beach and coastal travel advice including:
    1. Beach destination and coastline recommendations
    2. Water sport equipment rental and instruction
    3. Beach safety and swimming condition updates
    4. Seaside accommodation with ocean views
    5. Beach club and resort facility access
    6. Coastal hiking and nature exploration
    7. Marine life and snorkeling/diving opportunities
    8. Beach dining and seafood experiences
    9. Sunset and sunrise viewing location guidance
    10. Family-friendly beach amenities and services
    11. Beach photography and scenic spot recommendations
    12. Coastal weather and seasonal timing optimization
    
    Maximize coastal experiences from relaxation to active water adventures.`;

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
          { role: 'user', content: `Advise beach travel to ${destinations.join(', ')} for ${beachActivities.join(', ')} with ${relaxationLevel} relaxation level` }
        ],
        max_completion_tokens: 2000
      }),
    });

    const aiResponse = await response.json();
    const beachAdvice = aiResponse.choices[0]?.message?.content;

    await agent.logActivity(userId, 'beach_advice_provided', {
      destinations: destinations.length,
      beachActivities: beachActivities.length,
      waterSports: waterSports.length
    });

    const updatedHistory = [...beachHistory, {
      destinations,
      beachActivities,
      waterSports,
      relaxationLevel,
      advisedAt: new Date().toISOString()
    }].slice(-10);

    return {
      success: true,
      result: {
        beachAdvice,
        waterActivities: waterSports.length > 0 ? 'Water sports equipment and instruction coordinated' : 'Peaceful beach relaxation optimized',
        familyServices: familyFriendly ? 'Family-friendly beaches and amenities prioritized' : 'Adult-focused beach experiences selected',
        seasonalTiming: `${seasonPreference} season beach conditions and timing optimized`
      },
      memoryUpdates: [
        {
          key: 'beach_preferences',
          data: updatedHistory,
          expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
        }
      ]
    };

  } catch (error) {
    console.error('Beach coastal advisor error:', error);
    return {
      success: false,
      error: error.message || 'Failed to provide beach advice'
    };
  }
};