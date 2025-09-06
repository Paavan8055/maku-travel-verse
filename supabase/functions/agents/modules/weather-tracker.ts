import { BaseAgent, AgentHandler } from '../_shared/memory-utils.ts';

export const handler: AgentHandler = async (userId, intent, params, supabaseClient, openAiClient, memory) => {
  const agent = new BaseAgent(supabaseClient, 'weather-tracker');
  
  try {
    const { 
      destinations = [], 
      travelDates = {},
      alertPreferences = ['severe_weather', 'temperature_changes'],
      trackingPeriod = '14_days'
    } = params;

    if (!destinations.length) {
      return {
        success: false,
        error: 'Missing required parameter: destinations'
      };
    }

    const userPrefs = await agent.getUserPreferences(userId);
    const weatherHistory = await memory?.getMemory('weather-tracker', userId, 'weather_tracking') || [];

    const systemPrompt = `You are a weather tracking specialist for MAKU Travel.
    
    WEATHER TRACKING REQUEST:
    - Destinations: ${destinations.join(', ')}
    - Travel dates: ${JSON.stringify(travelDates)}
    - Alert preferences: ${alertPreferences.join(', ')}
    - Tracking period: ${trackingPeriod}
    
    USER PREFERENCES: ${JSON.stringify(userPrefs)}
    WEATHER TRACKING HISTORY: ${JSON.stringify(weatherHistory)}

    Provide comprehensive weather analysis including:
    1. Current weather conditions for each destination
    2. Extended forecast for travel dates
    3. Seasonal weather patterns and averages
    4. Severe weather alerts and warnings
    5. Best and worst travel times weather-wise
    6. Packing recommendations based on forecast
    7. Activity suggestions for weather conditions
    8. Indoor alternatives for bad weather days
    9. Weather-related health advisories
    10. Regional climate variations within destinations
    11. Historical weather data for comparison
    12. Weather impact on transportation and activities
    
    Include specific temperature ranges, precipitation likelihood, and wind conditions.
    Provide actionable recommendations for each weather scenario.`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-5-mini-2025-08-07',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Track weather for ${destinations.join(', ')} over ${trackingPeriod}` }
        ],
        max_completion_tokens: 1500
      }),
    });

    const aiResponse = await response.json();
    const weatherReport = aiResponse.choices[0]?.message?.content;

    await agent.logActivity(userId, 'weather_tracked', {
      destinationsCount: destinations.length,
      trackingPeriod,
      alertPreferences
    });

    const updatedWeatherHistory = [...weatherHistory, {
      destinations,
      travelDates,
      trackingPeriod,
      trackedAt: new Date().toISOString()
    }].slice(-10);

    return {
      success: true,
      result: {
        weatherReport,
        destinations,
        trackingPeriod,
        alertsConfigured: alertPreferences,
        nextUpdate: 'Weather tracking updates every 6 hours'
      },
      memoryUpdates: [
        {
          key: 'weather_tracking',
          data: updatedWeatherHistory,
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
        }
      ]
    };

  } catch (error) {
    console.error('Weather tracker error:', error);
    return {
      success: false,
      error: error.message || 'Failed to track weather'
    };
  }
};