import { BaseAgent, AgentHandler } from '../_shared/memory-utils.ts';
import { HotelBedsClient } from '../_shared/api-clients.ts';

export const handler: AgentHandler = async (userId, intent, params, supabaseClient, openAiClient, memory) => {
  const agent = new BaseAgent(supabaseClient, 'activity-finder');
  
  try {
    const { 
      destination,
      dates = {},
      activityTypes = ['sightseeing'], // sightseeing, adventure, cultural, food, shopping, nightlife, wellness
      budget = null,
      groupSize = 1,
      ageGroup = 'adult', // child, teen, adult, senior, family
      mobility = 'full' // full, limited, wheelchair
    } = params;

    if (!destination) {
      return {
        success: false,
        error: 'Missing required parameter: destination'
      };
    }

    const userPrefs = await agent.getUserPreferences(userId);
    const activityHistory = await memory?.getMemory('activity-finder', userId, 'activity_searches') || [];

    const systemPrompt = `You are an activity discovery specialist for MAKU Travel.
    
    ACTIVITY SEARCH REQUEST:
    - Destination: ${destination}
    - Travel dates: ${JSON.stringify(dates)}
    - Activity types: ${activityTypes.join(', ')}
    - Budget: ${budget || 'Not specified'}
    - Group size: ${groupSize}
    - Age group: ${ageGroup}
    - Mobility level: ${mobility}
    
    USER PREFERENCES: ${JSON.stringify(userPrefs)}
    ACTIVITY HISTORY: ${JSON.stringify(activityHistory)}

    Find and recommend activities including:
    1. Top-rated activities matching criteria
    2. Unique and authentic local experiences
    3. Hidden gems and off-the-beaten-path options
    4. Seasonal and weather-appropriate activities
    5. Accessibility and mobility considerations
    6. Age-appropriate recommendations
    7. Group size suitability
    8. Budget-friendly options and premium experiences
    9. Booking requirements and advance planning needed
    10. Duration and time requirements
    11. Location and transportation details
    12. Reviews and ratings from other travelers
    13. Cancellation policies and flexibility
    14. Combo deals and package opportunities
    15. Alternative activities for weather contingencies
    
    Include specific activity names, locations, costs, and booking information.
    Provide a mix of must-do attractions and unique experiences.`;

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
          { role: 'user', content: `Find ${activityTypes.join(' and ')} activities in ${destination} for ${groupSize} ${ageGroup} travelers` }
        ],
        max_completion_tokens: 2500
      }),
    });

    const aiResponse = await response.json();
    const activityRecommendations = aiResponse.choices[0]?.message?.content;

    await agent.logActivity(userId, 'activities_found', {
      destination,
      activityTypes,
      groupSize,
      ageGroup
    });

    const updatedActivityHistory = [...activityHistory, {
      destination,
      activityTypes,
      groupSize,
      ageGroup,
      mobility,
      searchedAt: new Date().toISOString()
    }].slice(-15);

    return {
      success: true,
      result: {
        activityRecommendations,
        destination,
        activityTypes,
        groupSize,
        ageGroup,
        totalRecommendations: 'Comprehensive list of curated activities'
      },
      memoryUpdates: [
        {
          key: 'activity_searches',
          data: updatedActivityHistory,
          expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString()
        }
      ]
    };

  } catch (error) {
    console.error('Activity finder error:', error);
    return {
      success: false,
      error: error.message || 'Failed to find activities'
    };
  }
};