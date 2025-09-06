import { BaseAgent, AgentHandler } from '../_shared/memory-utils.ts';

export const handler: AgentHandler = async (userId, intent, params, supabaseClient, openAiClient, memory) => {
  const agent = new BaseAgent(supabaseClient, 'special-interest-curator');
  
  try {
    const { 
      interestCategories = [],
      expertiseLevel = 'enthusiast',
      exclusiveAccess = false,
      groupPreference = 'individual',
      learningGoals = [],
      networkingInterest = false,
      destinations = []
    } = params;

    const userPrefs = await agent.getUserPreferences(userId);
    const specialInterestHistory = await memory?.getMemory('special-interest-curator', userId, 'special_interests') || [];

    const systemPrompt = `You are a special interest travel curator for MAKU Travel's niche experiences.
    
    SPECIAL INTEREST TRAVEL REQUEST:
    - Interest categories: ${interestCategories.join(', ') || 'Specialized hobby or interest'}
    - Expertise level: ${expertiseLevel}
    - Exclusive access: ${exclusiveAccess}
    - Group preference: ${groupPreference}
    - Learning goals: ${learningGoals.join(', ') || 'Experience and enjoyment'}
    - Networking interest: ${networkingInterest}
    - Destinations: ${destinations.join(', ') || 'Interest-specific destinations'}
    
    USER PREFERENCES: ${JSON.stringify(userPrefs)}
    SPECIAL INTEREST HISTORY: ${JSON.stringify(specialInterestHistory)}

    Provide specialized interest travel curation including:
    1. Expert-led tours and workshops in specific fields
    2. Behind-the-scenes access to specialized facilities
    3. Professional networking and community connections
    4. Hands-on learning and skill development opportunities
    5. Exclusive events and private collection access
    6. Master class and expert instruction arrangements
    7. Specialized equipment rental and technical support
    8. Field research and documentation opportunities
    9. Competition and exhibition attendance
    10. Collector and enthusiast community introductions
    11. Historical and cultural context education
    12. Advanced technique and methodology exploration
    
    Deliver deeply specialized experiences that advance knowledge and passion.`;

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
          { role: 'user', content: `Curate special interest travel to ${destinations.join(', ')} for ${interestCategories.join(', ')} at ${expertiseLevel} level` }
        ],
        max_completion_tokens: 2000
      }),
    });

    const aiResponse = await response.json();
    const specialInterestCuration = aiResponse.choices[0]?.message?.content;

    await agent.logActivity(userId, 'special_interest_curated', {
      destinations: destinations.length,
      interestCategories: interestCategories.length,
      expertiseLevel
    });

    const updatedHistory = [...specialInterestHistory, {
      destinations,
      interestCategories,
      expertiseLevel,
      exclusiveAccess,
      curatedAt: new Date().toISOString()
    }].slice(-15);

    return {
      success: true,
      result: {
        specialInterestCuration,
        expertiseMatching: `${expertiseLevel} level experiences with appropriate depth and complexity`,
        exclusiveOpportunities: exclusiveAccess ? 'VIP and exclusive access arrangements secured' : 'High-quality standard access experiences',
        communityConnections: networkingInterest ? 'Professional networking and community connections facilitated' : 'Personal interest exploration focused'
      },
      memoryUpdates: [
        {
          key: 'special_interests',
          data: updatedHistory,
          expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
        }
      ]
    };

  } catch (error) {
    console.error('Special interest curator error:', error);
    return {
      success: false,
      error: error.message || 'Failed to curate special interest travel'
    };
  }
};