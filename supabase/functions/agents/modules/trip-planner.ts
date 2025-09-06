import { BaseAgent, AgentHandler } from '../_shared/memory-utils.ts';
import { AmadeusClient, HotelBedsClient } from '../_shared/api-clients.ts';

export const handler: AgentHandler = async (userId, intent, params, supabaseClient, openAiClient, memory) => {
  const agent = new BaseAgent(supabaseClient, 'trip-planner');
  
  try {
    const { 
      destination, 
      dates, 
      budget, 
      travelers = 1,
      travelStyle = 'leisure', // leisure, business, adventure, luxury
      interests = [],
      accommodationType = 'hotel' // hotel, apartment, hostel, resort
    } = params;

    if (!destination || !dates) {
      return {
        success: false,
        error: 'Missing required parameters: destination or dates'
      };
    }

    const userPrefs = await agent.getUserPreferences(userId);
    const tripHistory = await memory?.getMemory('trip-planner', userId, 'trip_history') || [];

    const systemPrompt = `You are a comprehensive trip planning agent for MAKU Travel.
    
    TRIP PLANNING REQUEST:
    - Destination: ${destination}
    - Travel dates: ${JSON.stringify(dates)}
    - Number of travelers: ${travelers}
    - Budget: ${budget || 'Flexible'}
    - Travel style: ${travelStyle}
    - Interests: ${interests.join(', ') || 'General sightseeing'}
    - Accommodation preference: ${accommodationType}
    
    USER PREFERENCES: ${JSON.stringify(userPrefs)}
    PREVIOUS TRIPS: ${JSON.stringify(tripHistory)}

    Create a comprehensive travel plan including:
    1. Detailed daily itinerary with timing
    2. Accommodation recommendations with booking links
    3. Flight options and optimal booking times
    4. Local transportation options
    5. Restaurant and dining recommendations
    6. Activity and attraction suggestions
    7. Cultural insights and local customs
    8. Packing recommendations and weather considerations
    9. Budget breakdown by category
    10. Emergency contacts and travel insurance info
    11. Visa requirements and documentation needed
    12. Health and vaccination recommendations
    
    Provide specific, actionable recommendations with estimated costs in local currency.
    Include booking links and contact information where applicable.`;

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
          { role: 'user', content: `Plan a ${travelStyle} trip to ${destination} for ${travelers} travelers` }
        ],
        max_completion_tokens: 3000
      }),
    });

    const aiResponse = await response.json();
    const tripPlan = aiResponse.choices[0]?.message?.content;

    await agent.logActivity(userId, 'trip_planned', {
      destination,
      travelers,
      travelStyle,
      accommodationType
    });

    const updatedTripHistory = [...tripHistory, {
      destination,
      dates,
      travelers,
      travelStyle,
      interests,
      accommodationType,
      plannedAt: new Date().toISOString()
    }].slice(-10);

    return {
      success: true,
      result: {
        tripPlan,
        destination,
        travelStyle,
        estimatedBudget: budget,
        itineraryItems: `Detailed ${Object.keys(dates).length}-day itinerary for ${destination}`,
        recommendations: `Curated recommendations based on ${travelStyle} travel style`
      },
      memoryUpdates: [
        {
          key: 'trip_history',
          data: updatedTripHistory,
          expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
        }
      ]
    };

  } catch (error) {
    console.error('Trip planner error:', error);
    return {
      success: false,
      error: error.message || 'Failed to create trip plan'
    };
  }
};