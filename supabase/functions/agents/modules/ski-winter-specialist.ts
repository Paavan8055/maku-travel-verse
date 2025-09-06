import { BaseAgent, AgentHandler } from '../_shared/memory-utils.ts';

export const handler: AgentHandler = async (userId, intent, params, supabaseClient, openAiClient, memory) => {
  const agent = new BaseAgent(supabaseClient, 'ski-winter-specialist');
  
  try {
    const { 
      skillLevel = 'intermediate',
      winterActivities = [],
      equipmentRental = true,
      lessonPreference = false,
      apresSkiInterest = true,
      accommodationType = 'ski_lodge',
      destinations = []
    } = params;

    const userPrefs = await agent.getUserPreferences(userId);
    const skiHistory = await memory?.getMemory('ski-winter-specialist', userId, 'ski_experiences') || [];

    const systemPrompt = `You are a ski and winter sports specialist for MAKU Travel's snow adventures.
    
    SKI WINTER REQUEST:
    - Skill level: ${skillLevel}
    - Winter activities: ${winterActivities.join(', ') || 'Skiing and snowboarding'}
    - Equipment rental: ${equipmentRental}
    - Lesson preference: ${lessonPreference}
    - Après-ski interest: ${apresSkiInterest}
    - Accommodation type: ${accommodationType}
    - Destinations: ${destinations.join(', ') || 'Top ski destinations'}
    
    USER PREFERENCES: ${JSON.stringify(userPrefs)}
    SKI HISTORY: ${JSON.stringify(skiHistory)}

    Provide expert ski and winter travel planning including:
    1. Ski resort and slope recommendations by skill level
    2. Snow condition and seasonal timing guidance
    3. Equipment rental and purchase recommendations
    4. Ski lessons and instructor arrangements
    5. Winter activity and sport options beyond skiing
    6. Slope-side and ski-in/ski-out accommodation
    7. Après-ski entertainment and dining options
    8. Ski pass and lift ticket optimization
    9. Winter clothing and gear recommendations
    10. Mountain safety and avalanche awareness
    11. Non-skiing companion activity options
    12. Transportation and airport transfer coordination
    
    Maximize mountain experiences for all skill levels and winter interests.`;

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
          { role: 'user', content: `Plan ski trip to ${destinations.join(', ')} for ${skillLevel} skier with ${winterActivities.join(', ')} activities` }
        ],
        max_completion_tokens: 2000
      }),
    });

    const aiResponse = await response.json();
    const skiPlan = aiResponse.choices[0]?.message?.content;

    await agent.logActivity(userId, 'ski_trip_planned', {
      destinations: destinations.length,
      skillLevel,
      winterActivities: winterActivities.length
    });

    const updatedHistory = [...skiHistory, {
      destinations,
      skillLevel,
      winterActivities,
      lessonPreference,
      plannedAt: new Date().toISOString()
    }].slice(-10);

    return {
      success: true,
      result: {
        skiPlan,
        slopeAccess: `Slopes optimized for ${skillLevel} skill level`,
        equipmentSupport: equipmentRental ? 'Equipment rental arrangements coordinated' : 'Personal equipment transport guidance provided',
        skillDevelopment: lessonPreference ? 'Professional ski lessons arranged' : 'Independent skiing optimized'
      },
      memoryUpdates: [
        {
          key: 'ski_experiences',
          data: updatedHistory,
          expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
        }
      ]
    };

  } catch (error) {
    console.error('Ski winter specialist error:', error);
    return {
      success: false,
      error: error.message || 'Failed to plan ski trip'
    };
  }
};