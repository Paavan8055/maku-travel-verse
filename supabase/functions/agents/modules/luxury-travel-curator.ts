import { BaseAgent, AgentHandler } from '../_shared/memory-utils.ts';

export const handler: AgentHandler = async (userId, intent, params, supabaseClient, openAiClient, memory) => {
  const agent = new BaseAgent(supabaseClient, 'luxury-travel-curator');
  
  try {
    const { 
      budgetRange = 'ultra_luxury',
      preferredBrands = [],
      specialRequests = [],
      conciergeLevel = 'premium',
      exclusiveAccess = false,
      destinations = []
    } = params;

    const userPrefs = await agent.getUserPreferences(userId);
    const luxuryHistory = await memory?.getMemory('luxury-travel-curator', userId, 'luxury_preferences') || [];

    const systemPrompt = `You are an elite luxury travel curator for MAKU Travel's VIP clients.
    
    LUXURY TRAVEL CURATION REQUEST:
    - Budget range: ${budgetRange}
    - Preferred brands: ${preferredBrands.join(', ') || 'Open to recommendations'}
    - Special requests: ${specialRequests.join(', ') || 'Standard luxury service'}
    - Concierge level: ${conciergeLevel}
    - Exclusive access required: ${exclusiveAccess}
    - Destinations: ${destinations.join(', ') || 'Flexible'}
    
    USER PREFERENCES: ${JSON.stringify(userPrefs)}
    LUXURY HISTORY: ${JSON.stringify(luxuryHistory)}

    Provide ultra-premium travel curation including:
    1. Five-star and luxury hotel selections
    2. Private jet and first-class flight options
    3. Michelin-starred restaurant reservations
    4. Exclusive experience access and VIP tours
    5. Personal concierge and butler services
    6. Luxury ground transportation arrangements
    7. Private yacht and villa rentals
    8. High-end shopping and cultural experiences
    9. Spa and wellness retreat recommendations
    10. Art gallery and auction house access
    11. Private guide and interpreter services
    12. Luxury travel insurance and security
    
    Focus on exceptional quality, exclusivity, and personalized luxury experiences.`;

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
          { role: 'user', content: `Curate luxury travel experiences for ${destinations.join(', ')} at ${budgetRange} level` }
        ],
        max_completion_tokens: 2500
      }),
    });

    const aiResponse = await response.json();
    const luxuryCuration = aiResponse.choices[0]?.message?.content;

    await agent.logActivity(userId, 'luxury_travel_curated', {
      destinations: destinations.length,
      budgetRange,
      conciergeLevel
    });

    const updatedHistory = [...luxuryHistory, {
      destinations,
      budgetRange,
      preferredBrands,
      conciergeLevel,
      curatedAt: new Date().toISOString()
    }].slice(-10);

    return {
      success: true,
      result: {
        luxuryCuration,
        conciergeServices: 'Premium concierge services activated',
        exclusiveAccess: exclusiveAccess ? 'VIP access arrangements in progress' : 'Standard luxury access',
        personalizedService: 'Dedicated luxury travel consultant assigned'
      },
      memoryUpdates: [
        {
          key: 'luxury_preferences',
          data: updatedHistory,
          expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
        }
      ]
    };

  } catch (error) {
    console.error('Luxury travel curator error:', error);
    return {
      success: false,
      error: error.message || 'Failed to curate luxury travel'
    };
  }
};