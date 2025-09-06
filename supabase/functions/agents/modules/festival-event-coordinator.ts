import { BaseAgent, AgentHandler } from '../_shared/memory-utils.ts';

export const handler: AgentHandler = async (userId, intent, params, supabaseClient, openAiClient, memory) => {
  const agent = new BaseAgent(supabaseClient, 'festival-event-coordinator');
  
  try {
    const { 
      eventTypes = [],
      festivalCategories = [],
      crowdPreference = 'moderate',
      musicGenres = [],
      culturalEvents = true,
      seasonalPreference = 'any',
      destinations = []
    } = params;

    const userPrefs = await agent.getUserPreferences(userId);
    const festivalHistory = await memory?.getMemory('festival-event-coordinator', userId, 'festival_experiences') || [];

    const systemPrompt = `You are a festival and event coordinator for MAKU Travel's cultural experiences.
    
    FESTIVAL EVENT REQUEST:
    - Event types: ${eventTypes.join(', ') || 'General festivals'}
    - Festival categories: ${festivalCategories.join(', ') || 'All categories'}
    - Crowd preference: ${crowdPreference}
    - Music genres: ${musicGenres.join(', ') || 'All music styles'}
    - Cultural events: ${culturalEvents}
    - Seasonal preference: ${seasonalPreference}
    - Destinations: ${destinations.join(', ') || 'Festival destinations'}
    
    USER PREFERENCES: ${JSON.stringify(userPrefs)}
    FESTIVAL HISTORY: ${JSON.stringify(festivalHistory)}

    Provide comprehensive festival and event coordination including:
    1. Festival calendar and timing optimization
    2. Ticket purchasing and VIP access arrangements
    3. Festival accommodation and camping options
    4. Transportation to and from festival venues
    5. Local cultural and traditional celebrations
    6. Music festival and concert coordination
    7. Food and culinary festival experiences
    8. Art and creative festival participation
    9. Religious and spiritual ceremony access
    10. Sports and competition event attendance
    11. Seasonal holiday and celebration timing
    12. Festival safety and crowd management tips
    
    Maximize cultural immersion through authentic festival experiences.`;

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
          { role: 'user', content: `Coordinate festival experiences in ${destinations.join(', ')} for ${eventTypes.join(', ')} with ${crowdPreference} crowd preference` }
        ],
        max_completion_tokens: 2000
      }),
    });

    const aiResponse = await response.json();
    const festivalCoordination = aiResponse.choices[0]?.message?.content;

    await agent.logActivity(userId, 'festival_coordinated', {
      destinations: destinations.length,
      eventTypes: eventTypes.length,
      festivalCategories: festivalCategories.length
    });

    const updatedHistory = [...festivalHistory, {
      destinations,
      eventTypes,
      festivalCategories,
      crowdPreference,
      coordinatedAt: new Date().toISOString()
    }].slice(-15);

    return {
      success: true,
      result: {
        festivalCoordination,
        culturalImmersion: culturalEvents ? 'Deep cultural festival experiences arranged' : 'Entertainment-focused events prioritized',
        crowdManagement: `${crowdPreference} crowd level festivals selected for optimal experience`,
        authenticity: 'Authentic local festivals and traditional celebrations included'
      },
      memoryUpdates: [
        {
          key: 'festival_experiences',
          data: updatedHistory,
          expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
        }
      ]
    };

  } catch (error) {
    console.error('Festival event coordinator error:', error);
    return {
      success: false,
      error: error.message || 'Failed to coordinate festival events'
    };
  }
};