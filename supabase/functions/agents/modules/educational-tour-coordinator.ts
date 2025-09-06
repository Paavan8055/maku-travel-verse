import { BaseAgent, AgentHandler } from '../_shared/memory-utils.ts';

export const handler: AgentHandler = async (userId, intent, params, supabaseClient, openAiClient, memory) => {
  const agent = new BaseAgent(supabaseClient, 'educational-tour-coordinator');
  
  try {
    const { 
      subjects = [],
      academicLevel = 'general',
      groupType = 'individual',
      institutionType = 'independent',
      expertGuides = true,
      handsonExperiences = true,
      destinations = []
    } = params;

    const userPrefs = await agent.getUserPreferences(userId);
    const educationalHistory = await memory?.getMemory('educational-tour-coordinator', userId, 'educational_travel') || [];

    const systemPrompt = `You are an educational tour coordinator for MAKU Travel's learning experiences.
    
    EDUCATIONAL TOUR REQUEST:
    - Subjects: ${subjects.join(', ') || 'General education'}
    - Academic level: ${academicLevel}
    - Group type: ${groupType}
    - Institution type: ${institutionType}
    - Expert guides: ${expertGuides}
    - Hands-on experiences: ${handsonExperiences}
    - Destinations: ${destinations.join(', ') || 'Educational destinations'}
    
    USER PREFERENCES: ${JSON.stringify(userPrefs)}
    EDUCATIONAL HISTORY: ${JSON.stringify(educationalHistory)}

    Provide comprehensive educational tour coordination including:
    1. Subject-specific learning site recommendations
    2. Expert guide and lecturer arrangements
    3. Museum and institution private access
    4. Hands-on workshop and laboratory experiences
    5. Academic credit and certification opportunities
    6. Research facility and university visits
    7. Cultural and historical site education
    8. Science and technology center tours
    9. Archaeological and geological expeditions
    10. Language immersion and learning programs
    11. Art and creative workshop experiences
    12. Environmental and sustainability education
    
    Maximize learning outcomes through immersive educational experiences.`;

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
          { role: 'user', content: `Coordinate educational tour to ${destinations.join(', ')} focusing on ${subjects.join(', ')} for ${academicLevel} level` }
        ],
        max_completion_tokens: 2000
      }),
    });

    const aiResponse = await response.json();
    const educationalTour = aiResponse.choices[0]?.message?.content;

    await agent.logActivity(userId, 'educational_tour_coordinated', {
      destinations: destinations.length,
      subjects: subjects.length,
      academicLevel
    });

    const updatedHistory = [...educationalHistory, {
      destinations,
      subjects,
      academicLevel,
      groupType,
      coordinatedAt: new Date().toISOString()
    }].slice(-10);

    return {
      success: true,
      result: {
        educationalTour,
        learningOutcomes: 'Structured learning objectives and outcomes defined',
        expertAccess: expertGuides ? 'Expert guides and academic specialists arranged' : 'Self-guided learning materials provided',
        experientialLearning: handsonExperiences ? 'Hands-on learning experiences coordinated' : 'Observational learning focused'
      },
      memoryUpdates: [
        {
          key: 'educational_travel',
          data: updatedHistory,
          expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
        }
      ]
    };

  } catch (error) {
    console.error('Educational tour coordinator error:', error);
    return {
      success: false,
      error: error.message || 'Failed to coordinate educational tour'
    };
  }
};