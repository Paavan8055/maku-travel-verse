import { BaseAgent, AgentHandler } from '../_shared/memory-utils.ts';

export const handler: AgentHandler = async (userId, intent, params, supabaseClient, openAiClient, memory) => {
  const agent = new BaseAgent(supabaseClient, 'backpacker-advisor');
  
  try {
    const { 
      budgetLevel = 'ultra_budget',
      travelStyle = 'independent',
      accommodationType = 'hostel',
      transportMode = 'public',
      socializing = true,
      flexibility = 'high',
      destinations = []
    } = params;

    const userPrefs = await agent.getUserPreferences(userId);
    const backpackerHistory = await memory?.getMemory('backpacker-advisor', userId, 'backpacker_trips') || [];

    const systemPrompt = `You are a backpacker travel advisor for MAKU Travel's budget adventurers.
    
    BACKPACKER TRAVEL REQUEST:
    - Budget level: ${budgetLevel}
    - Travel style: ${travelStyle}
    - Accommodation type: ${accommodationType}
    - Transport mode: ${transportMode}
    - Socializing preference: ${socializing}
    - Flexibility: ${flexibility}
    - Destinations: ${destinations.join(', ') || 'Backpacker-friendly destinations'}
    
    USER PREFERENCES: ${JSON.stringify(userPrefs)}
    BACKPACKER HISTORY: ${JSON.stringify(backpackerHistory)}

    Provide expert backpacker travel advice including:
    1. Ultra-budget accommodation and hostel recommendations
    2. Public transport and overland travel options
    3. Street food and budget dining discoveries
    4. Free activities and attractions guidance
    5. Backpacker community and social connections
    6. Flexible itinerary and spontaneous travel tips
    7. Essential gear and packing minimization
    8. Safety and security for solo travelers
    9. Visa and border crossing logistics
    10. Money-saving tips and budget stretching
    11. Cultural immersion on a budget
    12. Work and volunteer opportunities abroad
    
    Maximize travel experiences while minimizing costs and maintaining safety.`;

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
          { role: 'user', content: `Advise backpacker travel to ${destinations.join(', ')} with ${budgetLevel} budget using ${transportMode} transport` }
        ],
        max_completion_tokens: 2000
      }),
    });

    const aiResponse = await response.json();
    const backpackerAdvice = aiResponse.choices[0]?.message?.content;

    await agent.logActivity(userId, 'backpacker_advice_provided', {
      destinations: destinations.length,
      budgetLevel,
      travelStyle
    });

    const updatedHistory = [...backpackerHistory, {
      destinations,
      budgetLevel,
      accommodationType,
      transportMode,
      advisedAt: new Date().toISOString()
    }].slice(-15);

    return {
      success: true,
      result: {
        backpackerAdvice,
        budgetOptimization: 'Maximum value budget travel strategies provided',
        communityConnections: socializing ? 'Backpacker community and social opportunities identified' : 'Solo travel independence focused',
        flexibilitySupport: flexibility === 'high' ? 'Spontaneous travel tips and open itinerary guidance' : 'Structured budget travel plan'
      },
      memoryUpdates: [
        {
          key: 'backpacker_trips',
          data: updatedHistory,
          expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
        }
      ]
    };

  } catch (error) {
    console.error('Backpacker advisor error:', error);
    return {
      success: false,
      error: error.message || 'Failed to provide backpacker advice'
    };
  }
};