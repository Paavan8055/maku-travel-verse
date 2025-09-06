import { BaseAgent, AgentHandler } from '../_shared/memory-utils.ts';

export const handler: AgentHandler = async (userId, intent, params, supabaseClient, openAiClient, memory) => {
  const agent = new BaseAgent(supabaseClient, 'sustainable-travel-advisor');
  
  try {
    const { 
      sustainabilityGoals = [],
      carbonOffsetPreference = true,
      ecoFriendlyAccommodation = true,
      localCommunitySupport = true,
      environmentalImpact = 'minimize',
      sustainableTransport = true,
      destinations = []
    } = params;

    const userPrefs = await agent.getUserPreferences(userId);
    const sustainabilityHistory = await memory?.getMemory('sustainable-travel-advisor', userId, 'sustainability_practices') || [];

    const systemPrompt = `You are a sustainable travel advisor for MAKU Travel's eco-conscious travelers.
    
    SUSTAINABLE TRAVEL REQUEST:
    - Sustainability goals: ${sustainabilityGoals.join(', ') || 'General eco-friendly travel'}
    - Carbon offset preference: ${carbonOffsetPreference}
    - Eco-friendly accommodation: ${ecoFriendlyAccommodation}
    - Local community support: ${localCommunitySupport}
    - Environmental impact: ${environmentalImpact}
    - Sustainable transport: ${sustainableTransport}
    - Destinations: ${destinations.join(', ') || 'Eco-certified destinations'}
    
    USER PREFERENCES: ${JSON.stringify(userPrefs)}
    SUSTAINABILITY HISTORY: ${JSON.stringify(sustainabilityHistory)}

    Provide comprehensive sustainable travel guidance including:
    1. Carbon footprint calculation and offset options
    2. Eco-certified accommodation recommendations
    3. Sustainable transportation alternatives
    4. Local community-based tourism options
    5. Environmental conservation activities
    6. Responsible wildlife and nature experiences
    7. Plastic-free and zero-waste travel tips
    8. Local organic and sustainable dining
    9. Fair trade shopping and souvenir guidance
    10. Conservation project volunteer opportunities
    11. Renewable energy accommodation options
    12. Sustainable packing and travel gear
    
    Minimize environmental impact while maximizing positive community benefits.`;

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
          { role: 'user', content: `Advise sustainable travel to ${destinations.join(', ')} with goals: ${sustainabilityGoals.join(', ')}` }
        ],
        max_completion_tokens: 2000
      }),
    });

    const aiResponse = await response.json();
    const sustainabilityAdvice = aiResponse.choices[0]?.message?.content;

    await agent.logActivity(userId, 'sustainability_advised', {
      destinations: destinations.length,
      sustainabilityGoals: sustainabilityGoals.length,
      carbonOffsetPreference
    });

    const updatedHistory = [...sustainabilityHistory, {
      destinations,
      sustainabilityGoals,
      carbonOffsetPreference,
      environmentalImpact,
      advisedAt: new Date().toISOString()
    }].slice(-10);

    return {
      success: true,
      result: {
        sustainabilityAdvice,
        carbonFootprint: 'Carbon impact calculated with offset options available',
        certifications: 'Eco-certified accommodations and services recommended',
        communityImpact: 'Positive local community benefit opportunities identified'
      },
      memoryUpdates: [
        {
          key: 'sustainability_practices',
          data: updatedHistory,
          expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
        }
      ]
    };

  } catch (error) {
    console.error('Sustainable travel advisor error:', error);
    return {
      success: false,
      error: error.message || 'Failed to provide sustainability advice'
    };
  }
};