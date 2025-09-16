import { BaseAgent, AgentHandler } from '../_shared/memory-utils.ts';

export const handler: AgentHandler = async (userId, intent, params, supabaseClient, openAiClient, memory) => {
  const agent = new BaseAgent(supabaseClient, 'transport-advisor');
  
  try {
    const { 
      origin,
      destination,
      transportType = 'all', // all, flight, train, bus, car_rental, taxi, rideshare
      travelDate = null,
      passengers = 1,
      preferences = [], // speed, cost, comfort, scenic, environmental
      accessibility = 'standard' // standard, wheelchair, mobility_aid
    } = params;

    if (!origin || !destination) {
      return {
        success: false,
        error: 'Missing required parameters: origin or destination'
      };
    }

    const userPrefs = await agent.getUserPreferences(userId);
    const transportHistory = await memory?.getMemory('transport-advisor', userId, 'transport_searches') || [];

    const systemPrompt = `You are a transportation specialist for MAKU Travel.
    
    TRANSPORT ADVISORY REQUEST:
    - Origin: ${origin}
    - Destination: ${destination}
    - Transport type: ${transportType}
    - Travel date: ${travelDate || 'Flexible'}
    - Passengers: ${passengers}
    - Preferences: ${preferences.join(', ') || 'No specific preferences'}
    - Accessibility: ${accessibility}
    
    USER PREFERENCES: ${JSON.stringify(userPrefs)}
    TRANSPORT HISTORY: ${JSON.stringify(transportHistory)}

    Provide comprehensive transportation advice including:
    1. Available transport options and comparison
    2. Cost analysis and price ranges
    3. Travel time estimates and schedules
    4. Booking platforms and procedures
    5. Comfort levels and amenities
    6. Route options and connections
    7. Baggage allowances and restrictions
    8. Accessibility features and accommodations
    9. Cancellation policies and flexibility
    10. Safety and reliability ratings
    11. Environmental impact considerations
    12. Loyalty program benefits
    13. Peak vs off-peak pricing
    14. Alternative routes and backup options
    15. Local transport integration at destination
    
    Include specific transport operators, booking links, and cost estimates.
    Provide recommendations based on user preferences and travel context.`;

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
          { role: 'user', content: `Find the best ${transportType} transport from ${origin} to ${destination}` }
        ],
        max_completion_tokens: 2500
      }),
    });

    const aiResponse = await response.json();
    const transportAdvice = aiResponse.choices[0]?.message?.content;

    await agent.logActivity(userId, 'transport_advised', {
      origin,
      destination,
      transportType,
      passengers
    });

    const updatedTransportHistory = [...transportHistory, {
      origin,
      destination,
      transportType,
      passengers,
      preferences,
      advisedAt: new Date().toISOString()
    }].slice(-20);

    return {
      success: true,
      result: {
        transportAdvice,
        origin,
        destination,
        transportType,
        passengers,
        recommendationBasis: preferences.length > 0 ? preferences.join(', ') : 'Comprehensive analysis'
      },
      memoryUpdates: [
        {
          key: 'transport_searches',
          data: updatedTransportHistory,
          expiresAt: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString()
        }
      ]
    };

  } catch (error) {
    console.error('Transport advisor error:', error);
    return {
      success: false,
      error: error.message || 'Failed to provide transport advice'
    };
  }
};