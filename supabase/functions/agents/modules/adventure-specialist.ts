import { BaseAgent, AgentHandler } from '../_shared/memory-utils.ts';

export const handler: AgentHandler = async (userId, intent, params, supabaseClient, openAiClient, memory) => {
  const agent = new BaseAgent(supabaseClient, 'adventure-specialist');
  
  try {
    const { 
      activityTypes = [],
      difficultyLevel = 'moderate',
      seasonPreference = 'any',
      groupSize = 1,
      gearRequired = false,
      guidedTours = true,
      destinations = []
    } = params;

    const userPrefs = await agent.getUserPreferences(userId);
    const adventureHistory = await memory?.getMemory('adventure-specialist', userId, 'adventure_activities') || [];

    const systemPrompt = `You are an adventure travel specialist for MAKU Travel's active travelers.
    
    ADVENTURE TRAVEL REQUEST:
    - Activity types: ${activityTypes.join(', ') || 'Open to recommendations'}
    - Difficulty level: ${difficultyLevel}
    - Season preference: ${seasonPreference}
    - Group size: ${groupSize}
    - Gear required: ${gearRequired}
    - Guided tours: ${guidedTours}
    - Destinations: ${destinations.join(', ') || 'Adventure-focused'}
    
    USER PREFERENCES: ${JSON.stringify(userPrefs)}
    ADVENTURE HISTORY: ${JSON.stringify(adventureHistory)}

    Provide comprehensive adventure travel planning including:
    1. Activity recommendations based on skill level
    2. Seasonal timing for optimal conditions
    3. Professional guide and instructor arrangements
    4. Equipment rental and gear recommendations
    5. Safety protocols and emergency procedures
    6. Adventure accommodation options
    7. Multi-day expedition planning
    8. Training and preparation recommendations
    9. Travel insurance for high-risk activities
    10. Photography and documentation services
    11. Group coordination for adventure teams
    12. Certification and skills development opportunities
    
    Prioritize safety while maximizing adventure and excitement.`;

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
          { role: 'user', content: `Plan adventure activities in ${destinations.join(', ')} for ${activityTypes.join(', ')} at ${difficultyLevel} level` }
        ],
        max_completion_tokens: 2000
      }),
    });

    const aiResponse = await response.json();
    const adventurePlan = aiResponse.choices[0]?.message?.content;

    await agent.logActivity(userId, 'adventure_planned', {
      destinations: destinations.length,
      activityTypes: activityTypes.length,
      difficultyLevel
    });

    const updatedHistory = [...adventureHistory, {
      destinations,
      activityTypes,
      difficultyLevel,
      groupSize,
      plannedAt: new Date().toISOString()
    }].slice(-15);

    return {
      success: true,
      result: {
        adventurePlan,
        safetyBriefing: 'Comprehensive safety protocols provided',
        gearRecommendations: gearRequired ? 'Equipment rental options available' : 'Basic gear sufficient',
        guideServices: guidedTours ? 'Professional guides arranged' : 'Self-guided options provided'
      },
      memoryUpdates: [
        {
          key: 'adventure_activities',
          data: updatedHistory,
          expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
        }
      ]
    };

  } catch (error) {
    console.error('Adventure specialist error:', error);
    return {
      success: false,
      error: error.message || 'Failed to plan adventure travel'
    };
  }
};