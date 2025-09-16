import { BaseAgent, AgentHandler } from '../_shared/memory-utils.ts';

export const handler: AgentHandler = async (userId, intent, params, supabaseClient, openAiClient, memory) => {
  const agent = new BaseAgent(supabaseClient, 'wedding-honeymoon-planner');
  
  try {
    const { 
      eventType = 'honeymoon', // honeymoon, destination_wedding, anniversary
      romance_level = 'high',
      groupSize = 2,
      specialOccasions = [],
      budgetRange = 'moderate',
      privacyPreference = 'private',
      destinations = []
    } = params;

    const userPrefs = await agent.getUserPreferences(userId);
    const romanticHistory = await memory?.getMemory('wedding-honeymoon-planner', userId, 'romantic_travel') || [];

    const systemPrompt = `You are a wedding and honeymoon specialist for MAKU Travel's romantic celebrations.
    
    ROMANTIC TRAVEL REQUEST:
    - Event type: ${eventType}
    - Romance level: ${romance_level}
    - Group size: ${groupSize}
    - Special occasions: ${specialOccasions.join(', ') || 'Romantic getaway'}
    - Budget range: ${budgetRange}
    - Privacy preference: ${privacyPreference}
    - Destinations: ${destinations.join(', ') || 'Romantic destinations'}
    
    USER PREFERENCES: ${JSON.stringify(userPrefs)}
    ROMANTIC TRAVEL HISTORY: ${JSON.stringify(romanticHistory)}

    Provide exceptional romantic travel planning including:
    1. Luxury romantic accommodation selection
    2. Private dining and special meal arrangements
    3. Couples spa and wellness experiences
    4. Romantic activity and excursion planning
    5. Anniversary and special occasion coordination
    6. Photography and videography services
    7. Surprise and special moment planning
    8. Wine tasting and culinary experiences
    9. Sunset and scenic location recommendations
    10. Privacy and intimate setting arrangements
    11. Romantic transportation options
    12. Celebration and ceremony coordination
    
    Create unforgettable romantic memories with personalized luxury touches.`;

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
          { role: 'user', content: `Plan ${eventType} travel to ${destinations.join(', ')} for ${groupSize} people with ${romance_level} romance level` }
        ],
        max_completion_tokens: 2500
      }),
    });

    const aiResponse = await response.json();
    const romanticPlan = aiResponse.choices[0]?.message?.content;

    await agent.logActivity(userId, 'romantic_travel_planned', {
      eventType,
      destinations: destinations.length,
      romance_level
    });

    const updatedHistory = [...romanticHistory, {
      destinations,
      eventType,
      romance_level,
      groupSize,
      plannedAt: new Date().toISOString()
    }].slice(-10);

    return {
      success: true,
      result: {
        romanticPlan,
        specialArrangements: 'Romantic surprises and special moments coordinated',
        privacyLevel: privacyPreference === 'private' ? 'Private and intimate experiences arranged' : 'Romantic group experiences planned',
        memorabilityFactor: 'Unforgettable romantic memories guaranteed'
      },
      memoryUpdates: [
        {
          key: 'romantic_travel',
          data: updatedHistory,
          expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
        }
      ]
    };

  } catch (error) {
    console.error('Wedding honeymoon planner error:', error);
    return {
      success: false,
      error: error.message || 'Failed to plan romantic travel'
    };
  }
};