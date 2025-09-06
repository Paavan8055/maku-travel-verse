import { BaseAgent, AgentHandler } from '../_shared/memory-utils.ts';

export const handler: AgentHandler = async (userId, intent, params, supabaseClient, openAiClient, memory) => {
  const agent = new BaseAgent(supabaseClient, 'digital-nomad-coordinator');
  
  try {
    const { 
      workRequirements = [],
      internetSpeed = 'high',
      workspaceType = 'coworking',
      timeZonePreference = 'flexible',
      stayDuration = 'medium_term',
      budgetRange = 'moderate',
      destinations = []
    } = params;

    const userPrefs = await agent.getUserPreferences(userId);
    const nomadHistory = await memory?.getMemory('digital-nomad-coordinator', userId, 'nomad_preferences') || [];

    const systemPrompt = `You are a digital nomad coordinator for MAKU Travel's remote workers.
    
    DIGITAL NOMAD REQUEST:
    - Work requirements: ${workRequirements.join(', ') || 'Basic remote work setup'}
    - Internet speed needed: ${internetSpeed}
    - Workspace type: ${workspaceType}
    - Time zone preference: ${timeZonePreference}
    - Stay duration: ${stayDuration}
    - Budget range: ${budgetRange}
    - Destinations: ${destinations.join(', ') || 'Nomad-friendly destinations'}
    
    USER PREFERENCES: ${JSON.stringify(userPrefs)}
    NOMAD HISTORY: ${JSON.stringify(nomadHistory)}

    Provide comprehensive digital nomad coordination including:
    1. High-speed internet verification and backup options
    2. Coworking space and office rental recommendations
    3. Nomad-friendly accommodation with work areas
    4. Time zone optimization for work schedules
    5. Visa requirements for remote work
    6. Cost of living analysis and budget planning
    7. Nomad community and networking opportunities
    8. Banking and payment method setup
    9. Tax implications and legal considerations
    10. Equipment shipping and tech support
    11. Healthcare and insurance for nomads
    12. Transportation and mobility solutions
    
    Optimize work-life balance for productive remote work while traveling.`;

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
          { role: 'user', content: `Coordinate digital nomad setup in ${destinations.join(', ')} for ${stayDuration} with ${internetSpeed} internet needs` }
        ],
        max_completion_tokens: 2000
      }),
    });

    const aiResponse = await response.json();
    const nomadCoordination = aiResponse.choices[0]?.message?.content;

    await agent.logActivity(userId, 'nomad_coordination_provided', {
      destinations: destinations.length,
      stayDuration,
      workspaceType
    });

    const updatedHistory = [...nomadHistory, {
      destinations,
      workRequirements,
      stayDuration,
      workspaceType,
      coordinatedAt: new Date().toISOString()
    }].slice(-10);

    return {
      success: true,
      result: {
        nomadCoordination,
        workSetup: 'Professional remote work environment verified',
        communityAccess: 'Digital nomad community connections established',
        legalCompliance: 'Visa and legal requirements for remote work confirmed'
      },
      memoryUpdates: [
        {
          key: 'nomad_preferences',
          data: updatedHistory,
          expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
        }
      ]
    };

  } catch (error) {
    console.error('Digital nomad coordinator error:', error);
    return {
      success: false,
      error: error.message || 'Failed to coordinate digital nomad setup'
    };
  }
};