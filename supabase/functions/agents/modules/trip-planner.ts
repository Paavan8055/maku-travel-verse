import { BaseAgent, AgentHandler } from '../_shared/memory-utils.ts';
import { OpenAIServiceWrapper } from '../_shared/openai-service-wrapper.ts';
import { UserAnalyticsUtils } from '../_shared/user-analytics-utils.ts';

export const handler: AgentHandler = async (userId, intent, params, supabaseClient, openAiClient, memory) => {
  const agent = new BaseAgent(supabaseClient, 'trip-planner');
  const openai = new OpenAIServiceWrapper(openAiClient);
  const analytics = new UserAnalyticsUtils(supabaseClient);
  
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
    const userProfile = await analytics.getUserBehaviorProfile(userId);
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
    USER BEHAVIOR PROFILE: ${JSON.stringify(userProfile)}
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

    const tripPlanResponse = await openai.chat({
      prompt: systemPrompt,
      context: `Plan a ${travelStyle} trip to ${destination} for ${travelers} travelers`,
      model: 'gpt-5-2025-08-07',
      maxTokens: 3000
    });

    const tripPlan = tripPlanResponse.content;

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