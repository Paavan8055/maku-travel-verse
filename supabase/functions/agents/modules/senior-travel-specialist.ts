import { BaseAgent, AgentHandler } from '../_shared/memory-utils.ts';

export const handler: AgentHandler = async (userId, intent, params, supabaseClient, openAiClient, memory) => {
  const agent = new BaseAgent(supabaseClient, 'senior-travel-specialist');
  
  try {
    const { 
      mobilityLevel = 'moderate',
      healthConsiderations = [],
      pacePreference = 'leisurely',
      accessibilityNeeds = [],
      socialInteraction = 'moderate',
      comfortLevel = 'high',
      destinations = []
    } = params;

    const userPrefs = await agent.getUserPreferences(userId);
    const seniorTravelHistory = await memory?.getMemory('senior-travel-specialist', userId, 'senior_travel_preferences') || [];

    const systemPrompt = `You are a senior travel specialist for MAKU Travel's mature travelers.
    
    SENIOR TRAVEL REQUEST:
    - Mobility level: ${mobilityLevel}
    - Health considerations: ${healthConsiderations.join(', ') || 'General health awareness'}
    - Pace preference: ${pacePreference}
    - Accessibility needs: ${accessibilityNeeds.join(', ') || 'Standard accessibility'}
    - Social interaction: ${socialInteraction}
    - Comfort level: ${comfortLevel}
    - Destinations: ${destinations.join(', ') || 'Senior-friendly destinations'}
    
    USER PREFERENCES: ${JSON.stringify(userPrefs)}
    SENIOR TRAVEL HISTORY: ${JSON.stringify(seniorTravelHistory)}

    Provide specialized senior travel planning including:
    1. Age-appropriate accommodation with comfort features
    2. Leisurely-paced itineraries with rest periods
    3. Medical facility proximity and accessibility
    4. Comfortable transportation with easy boarding
    5. Senior group tour and social opportunities
    6. Cultural and educational experience focus
    7. Health and wellness activity options
    8. Medication and health management support
    9. Emergency contact and assistance services
    10. Comfortable dining and dietary accommodations
    11. Senior discount and value opportunities
    12. Companion and family travel coordination
    
    Prioritize comfort, safety, and enriching experiences for mature travelers.`;

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
          { role: 'user', content: `Plan senior travel to ${destinations.join(', ')} with ${mobilityLevel} mobility and ${pacePreference} pace` }
        ],
        max_completion_tokens: 2000
      }),
    });

    const aiResponse = await response.json();
    const seniorTravelPlan = aiResponse.choices[0]?.message?.content;

    await agent.logActivity(userId, 'senior_travel_planned', {
      destinations: destinations.length,
      mobilityLevel,
      pacePreference
    });

    const updatedHistory = [...seniorTravelHistory, {
      destinations,
      mobilityLevel,
      healthConsiderations,
      pacePreference,
      plannedAt: new Date().toISOString()
    }].slice(-10);

    return {
      success: true,
      result: {
        seniorTravelPlan,
        comfortFocus: 'High comfort accommodations and services prioritized',
        healthSupport: 'Health and medical support services coordinated',
        socialOpportunities: socialInteraction === 'high' ? 'Group and social activities included' : 'Peaceful and quiet experiences emphasized'
      },
      memoryUpdates: [
        {
          key: 'senior_travel_preferences',
          data: updatedHistory,
          expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
        }
      ]
    };

  } catch (error) {
    console.error('Senior travel specialist error:', error);
    return {
      success: false,
      error: error.message || 'Failed to plan senior travel'
    };
  }
};