import { BaseAgent, AgentHandler } from '../_shared/memory-utils.ts';

export const handler: AgentHandler = async (userId, intent, params, supabaseClient, openAiClient, memory) => {
  const agent = new BaseAgent(supabaseClient, 'wellness-retreat-coordinator');
  
  try {
    const { 
      wellnessGoals = [],
      retreatType = 'holistic',
      activityPreferences = [],
      healthConditions = [],
      intensityLevel = 'moderate',
      accommodationStyle = 'retreat_center',
      destinations = []
    } = params;

    const userPrefs = await agent.getUserPreferences(userId);
    const wellnessHistory = await memory?.getMemory('wellness-retreat-coordinator', userId, 'wellness_retreats') || [];

    const systemPrompt = `You are a wellness retreat coordinator for MAKU Travel's healing and rejuvenation experiences.
    
    WELLNESS RETREAT REQUEST:
    - Wellness goals: ${wellnessGoals.join(', ') || 'General wellness and relaxation'}
    - Retreat type: ${retreatType}
    - Activity preferences: ${activityPreferences.join(', ') || 'Yoga and meditation'}
    - Health conditions: ${healthConditions.join(', ') || 'General health focus'}
    - Intensity level: ${intensityLevel}
    - Accommodation style: ${accommodationStyle}
    - Destinations: ${destinations.join(', ') || 'Wellness retreat destinations'}
    
    USER PREFERENCES: ${JSON.stringify(userPrefs)}
    WELLNESS HISTORY: ${JSON.stringify(wellnessHistory)}

    Provide comprehensive wellness retreat coordination including:
    1. Retreat center and spa facility recommendations
    2. Wellness program and treatment scheduling
    3. Yoga, meditation, and mindfulness sessions
    4. Nutritional counseling and healthy cuisine
    5. Fitness and movement therapy programs
    6. Stress reduction and mental health support
    7. Alternative healing and therapeutic treatments
    8. Nature immersion and outdoor wellness activities
    9. Detox and cleansing program coordination
    10. Personal wellness coach assignments
    11. Health assessment and progress tracking
    12. Post-retreat wellness plan development
    
    Foster deep healing and transformation through personalized wellness journeys.`;

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
          { role: 'user', content: `Coordinate wellness retreat in ${destinations.join(', ')} focusing on ${wellnessGoals.join(', ')} at ${intensityLevel} intensity` }
        ],
        max_completion_tokens: 2000
      }),
    });

    const aiResponse = await response.json();
    const wellnessCoordination = aiResponse.choices[0]?.message?.content;

    await agent.logActivity(userId, 'wellness_retreat_coordinated', {
      destinations: destinations.length,
      wellnessGoals: wellnessGoals.length,
      retreatType
    });

    const updatedHistory = [...wellnessHistory, {
      destinations,
      wellnessGoals,
      retreatType,
      intensityLevel,
      coordinatedAt: new Date().toISOString()
    }].slice(-10);

    return {
      success: true,
      result: {
        wellnessCoordination,
        healingJourney: 'Personalized wellness journey designed for optimal healing',
        professionalSupport: 'Expert wellness practitioners and coaches assigned',
        holisticApproach: `${retreatType} retreat approach tailored to individual wellness goals`
      },
      memoryUpdates: [
        {
          key: 'wellness_retreats',
          data: updatedHistory,
          expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
        }
      ]
    };

  } catch (error) {
    console.error('Wellness retreat coordinator error:', error);
    return {
      success: false,
      error: error.message || 'Failed to coordinate wellness retreat'
    };
  }
};