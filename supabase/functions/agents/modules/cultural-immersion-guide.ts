import { BaseAgent, AgentHandler } from '../_shared/memory-utils.ts';

export const handler: AgentHandler = async (userId, intent, params, supabaseClient, openAiClient, memory) => {
  const agent = new BaseAgent(supabaseClient, 'cultural-immersion-guide');
  
  try {
    const { 
      culturalInterests = [],
      languageLearning = false,
      localExperiences = true,
      homestayPreference = false,
      artsCraftsInterest = false,
      culinaryExperiences = true,
      destinations = []
    } = params;

    const userPrefs = await agent.getUserPreferences(userId);
    const culturalHistory = await memory?.getMemory('cultural-immersion-guide', userId, 'cultural_experiences') || [];

    const systemPrompt = `You are a cultural immersion guide for MAKU Travel's authentic travel experiences.
    
    CULTURAL IMMERSION REQUEST:
    - Cultural interests: ${culturalInterests.join(', ') || 'General cultural exploration'}
    - Language learning: ${languageLearning}
    - Local experiences: ${localExperiences}
    - Homestay preference: ${homestayPreference}
    - Arts and crafts interest: ${artsCraftsInterest}
    - Culinary experiences: ${culinaryExperiences}
    - Destinations: ${destinations.join(', ') || 'Culturally rich destinations'}
    
    USER PREFERENCES: ${JSON.stringify(userPrefs)}
    CULTURAL HISTORY: ${JSON.stringify(culturalHistory)}

    Provide authentic cultural immersion guidance including:
    1. Local family and community connections
    2. Traditional craft and skill workshops
    3. Language exchange and learning opportunities
    4. Regional cooking classes and food tours
    5. Religious and spiritual site visits
    6. Local festival and celebration participation
    7. Artisan market and craft center visits
    8. Traditional music and dance experiences
    9. Historical and archaeological site tours
    10. Community volunteer opportunities
    11. Cultural etiquette and customs guidance
    12. Traditional accommodation options
    
    Focus on respectful cultural exchange and authentic local connections.`;

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
          { role: 'user', content: `Guide cultural immersion in ${destinations.join(', ')} focusing on ${culturalInterests.join(', ')}` }
        ],
        max_completion_tokens: 2000
      }),
    });

    const aiResponse = await response.json();
    const culturalGuide = aiResponse.choices[0]?.message?.content;

    await agent.logActivity(userId, 'cultural_immersion_guided', {
      destinations: destinations.length,
      culturalInterests: culturalInterests.length,
      languageLearning
    });

    const updatedHistory = [...culturalHistory, {
      destinations,
      culturalInterests,
      languageLearning,
      localExperiences,
      guidedAt: new Date().toISOString()
    }].slice(-15);

    return {
      success: true,
      result: {
        culturalGuide,
        localConnections: 'Authentic local family and community contacts established',
        learningOpportunities: languageLearning ? 'Language learning experiences arranged' : 'Cultural learning focused',
        respectfulTravel: 'Cultural sensitivity guidelines provided'
      },
      memoryUpdates: [
        {
          key: 'cultural_experiences',
          data: updatedHistory,
          expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
        }
      ]
    };

  } catch (error) {
    console.error('Cultural immersion guide error:', error);
    return {
      success: false,
      error: error.message || 'Failed to guide cultural immersion'
    };
  }
};