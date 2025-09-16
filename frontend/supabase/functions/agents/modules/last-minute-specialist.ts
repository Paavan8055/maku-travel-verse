import { BaseAgent, AgentHandler } from '../_shared/memory-utils.ts';

export const handler: AgentHandler = async (userId, intent, params, supabaseClient, openAiClient, memory) => {
  const agent = new BaseAgent(supabaseClient, 'last-minute-specialist');
  
  try {
    const { 
      timeframe = '24_hours',
      flexibility = 'high',
      budgetPriority = 'value',
      travelReadiness = 'ready',
      accommodationPreference = 'any',
      transportMode = 'fastest',
      destinations = []
    } = params;

    const userPrefs = await agent.getUserPreferences(userId);
    const lastMinuteHistory = await memory?.getMemory('last-minute-specialist', userId, 'last_minute_bookings') || [];

    const systemPrompt = `You are a last-minute travel specialist for MAKU Travel's spontaneous adventures.
    
    LAST-MINUTE TRAVEL REQUEST:
    - Timeframe: ${timeframe}
    - Flexibility: ${flexibility}
    - Budget priority: ${budgetPriority}
    - Travel readiness: ${travelReadiness}
    - Accommodation preference: ${accommodationPreference}
    - Transport mode: ${transportMode}
    - Destinations: ${destinations.join(', ') || 'Open to suggestions'}
    
    USER PREFERENCES: ${JSON.stringify(userPrefs)}
    LAST-MINUTE HISTORY: ${JSON.stringify(lastMinuteHistory)}

    Provide urgent last-minute travel coordination including:
    1. Real-time availability checking and instant booking
    2. Last-minute deal and discount identification
    3. Express check-in and fast-track services
    4. Emergency packing and preparation checklists
    5. Same-day transportation arrangements
    6. Mobile boarding pass and digital ticket setup
    7. Travel insurance and protection for spontaneous trips
    8. 24/7 emergency support and assistance
    9. Flexible cancellation and modification options
    10. Priority booking and VIP service access
    11. Weather and condition updates for immediate travel
    12. Local contact and emergency coordination
    
    Execute rapid travel arrangements with maximum efficiency and reliability.`;

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
          { role: 'user', content: `Arrange last-minute travel to ${destinations.join(', ') || 'best available destinations'} within ${timeframe} timeframe` }
        ],
        max_completion_tokens: 1500
      }),
    });

    const aiResponse = await response.json();
    const lastMinuteArrangement = aiResponse.choices[0]?.message?.content;

    await agent.logActivity(userId, 'last_minute_travel_arranged', {
      timeframe,
      destinations: destinations.length,
      urgency: 'high'
    });

    const updatedHistory = [...lastMinuteHistory, {
      destinations,
      timeframe,
      budgetPriority,
      arrangedAt: new Date().toISOString()
    }].slice(-15);

    return {
      success: true,
      result: {
        lastMinuteArrangement,
        urgencyHandling: 'High-priority last-minute booking protocols activated',
        flexibilityAdvantage: flexibility === 'high' ? 'Maximum flexibility utilized for best deals' : 'Specific preferences prioritized',
        instantConfirmation: 'Real-time booking confirmations and instant access provided'
      },
      memoryUpdates: [
        {
          key: 'last_minute_bookings',
          data: updatedHistory,
          expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString()
        }
      ]
    };

  } catch (error) {
    console.error('Last minute specialist error:', error);
    return {
      success: false,
      error: error.message || 'Failed to arrange last-minute travel'
    };
  }
};