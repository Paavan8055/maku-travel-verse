import { BaseAgent, AgentHandler } from '../_shared/memory-utils.ts';

export const handler: AgentHandler = async (userId, intent, params, supabaseClient, openAiClient, memory) => {
  const agent = new BaseAgent(supabaseClient, 'weather-travel-advisor');
  
  try {
    const { 
      destination,
      travelDates = {},
      activities = [],
      packingNeeds = true,
      weatherAlerts = true,
      alternativePlanning = true,
      seasonalInsights = true
    } = params;

    if (!destination) {
      return {
        success: false,
        error: 'Destination is required for weather travel advice'
      };
    }

    const userPrefs = await agent.getUserPreferences(userId);
    const weatherHistory = await memory?.getMemory('weather-travel-advisor', userId, 'weather_preferences') || [];

    const systemPrompt = `You are a specialized weather travel advisor for MAKU Travel's optimization system.
    
    WEATHER INQUIRY:
    - Destination: ${destination}
    - Travel dates: ${JSON.stringify(travelDates)}
    - Planned activities: ${JSON.stringify(activities)}
    - Include packing advice: ${packingNeeds}
    - Weather alerts needed: ${weatherAlerts}
    - Alternative planning: ${alternativePlanning}
    - Seasonal insights: ${seasonalInsights}
    
    USER PROFILE:
    - Preferences: ${JSON.stringify(userPrefs)}
    - Weather history: ${JSON.stringify(weatherHistory.slice(-10))}
    
    Provide comprehensive weather-based travel advice including:
    1. Current and forecasted weather conditions
    2. Seasonal weather patterns and best times to visit
    3. Activity-specific weather recommendations
    4. Detailed packing suggestions based on weather
    5. Weather-related travel alerts and warnings
    6. Alternative indoor/outdoor activity options
    7. Local climate insights and seasonal variations
    8. Weather-driven itinerary optimization
    9. Natural disaster risk assessment
    10. Clothing and gear recommendations
    11. Health considerations related to climate
    12. Photography conditions and golden hour times
    
    Format as comprehensive weather travel guidance with actionable recommendations.`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-5-2025-08-07',
        max_completion_tokens: 2000,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Provide weather travel advice for ${destination} with travel dates: ${JSON.stringify(travelDates)}` }
        ]
      })
    });

    const data = await response.json();
    const weatherAdvice = data.choices[0].message.content;

    await agent.logActivity(userId, 'weather_advice', {
      destination,
      travelDates,
      activitiesCount: activities.length,
      adviceLength: weatherAdvice.length
    });

    // Update weather preferences
    const newWeatherEntry = {
      destination,
      travelDates,
      activities,
      consultationDate: new Date().toISOString(),
      weatherConditions: 'analyzed' // Would be actual weather data in production
    };
    
    const updatedHistory = [...weatherHistory, newWeatherEntry].slice(-25);
    await memory?.setMemory('weather-travel-advisor', userId, 'weather_preferences', updatedHistory);

    return {
      success: true,
      weatherAdvice,
      packingRecommendations: packingNeeds ? 'included' : 'not_requested',
      weatherAlerts: weatherAlerts ? 'monitored' : 'disabled',
      alternativePlans: alternativePlanning ? 'provided' : 'not_requested',
      memoryUpdates: {
        weather_preferences: updatedHistory
      }
    };
  } catch (error) {
    console.error('Error in weather-travel-advisor:', error);
    return {
      success: false,
      error: 'Failed to provide weather travel advice'
    };
  }
};