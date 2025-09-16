import { BaseAgent, AgentHandler } from '../_shared/memory-utils.ts';

export const handler: AgentHandler = async (userId, intent, params, supabaseClient, openAiClient, memory) => {
  const agent = new BaseAgent(supabaseClient, 'photography-tour-guide');
  
  try {
    const { 
      photographyStyle = [],
      skillLevel = 'intermediate',
      equipmentNeeds = [],
      workshopInterest = false,
      goldenHourFocus = true,
      subjectPreferences = [],
      destinations = []
    } = params;

    const userPrefs = await agent.getUserPreferences(userId);
    const photographyHistory = await memory?.getMemory('photography-tour-guide', userId, 'photography_tours') || [];

    const systemPrompt = `You are a photography tour guide for MAKU Travel's visual storytelling adventures.
    
    PHOTOGRAPHY TOUR REQUEST:
    - Photography style: ${photographyStyle.join(', ') || 'General photography'}
    - Skill level: ${skillLevel}
    - Equipment needs: ${equipmentNeeds.join(', ') || 'Basic camera equipment'}
    - Workshop interest: ${workshopInterest}
    - Golden hour focus: ${goldenHourFocus}
    - Subject preferences: ${subjectPreferences.join(', ') || 'Varied subjects'}
    - Destinations: ${destinations.join(', ') || 'Photogenic destinations'}
    
    USER PREFERENCES: ${JSON.stringify(userPrefs)}
    PHOTOGRAPHY HISTORY: ${JSON.stringify(photographyHistory)}

    Provide expert photography tour guidance including:
    1. Optimal lighting and timing for photography
    2. Scenic viewpoint and composition location scouting
    3. Professional photography workshop arrangements
    4. Equipment rental and technical support
    5. Local photography permit and access coordination
    6. Subject-specific shooting opportunities
    7. Photo editing and post-processing guidance
    8. Cultural sensitivity and photography etiquette
    9. Weather-dependent backup location planning
    10. Professional photographer guide services
    11. Portfolio development and critique sessions
    12. Photography exhibition and sharing opportunities
    
    Capture stunning images while respecting local cultures and environments.`;

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
          { role: 'user', content: `Guide photography tour in ${destinations.join(', ')} for ${photographyStyle.join(', ')} style at ${skillLevel} level` }
        ],
        max_completion_tokens: 2000
      }),
    });

    const aiResponse = await response.json();
    const photographyGuide = aiResponse.choices[0]?.message?.content;

    await agent.logActivity(userId, 'photography_tour_guided', {
      destinations: destinations.length,
      photographyStyle: photographyStyle.length,
      skillLevel
    });

    const updatedHistory = [...photographyHistory, {
      destinations,
      photographyStyle,
      skillLevel,
      subjectPreferences,
      guidedAt: new Date().toISOString()
    }].slice(-10);

    return {
      success: true,
      result: {
        photographyGuide,
        visualOpportunities: 'Prime photography locations and timing optimized',
        skillDevelopment: workshopInterest ? 'Photography workshops and professional instruction arranged' : 'Independent shooting guidance provided',
        lightingOptimization: goldenHourFocus ? 'Golden hour and optimal lighting schedules prioritized' : 'All-day shooting opportunities included'
      },
      memoryUpdates: [
        {
          key: 'photography_tours',
          data: updatedHistory,
          expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
        }
      ]
    };

  } catch (error) {
    console.error('Photography tour guide error:', error);
    return {
      success: false,
      error: error.message || 'Failed to guide photography tour'
    };
  }
};