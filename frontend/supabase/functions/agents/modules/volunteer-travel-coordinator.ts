import { BaseAgent, AgentHandler } from '../_shared/memory-utils.ts';

export const handler: AgentHandler = async (userId, intent, params, supabaseClient, openAiClient, memory) => {
  const agent = new BaseAgent(supabaseClient, 'volunteer-travel-coordinator');
  
  try {
    const { 
      causeAreas = [],
      skillOfferings = [],
      timeCommitment = 'flexible',
      accommodationStyle = 'basic',
      culturalImmersion = true,
      groupPreference = 'mixed',
      destinations = []
    } = params;

    const userPrefs = await agent.getUserPreferences(userId);
    const volunteerHistory = await memory?.getMemory('volunteer-travel-coordinator', userId, 'volunteer_experiences') || [];

    const systemPrompt = `You are a volunteer travel coordinator for MAKU Travel's meaningful service experiences.
    
    VOLUNTEER TRAVEL REQUEST:
    - Cause areas: ${causeAreas.join(', ') || 'Open to various causes'}
    - Skill offerings: ${skillOfferings.join(', ') || 'General volunteer work'}
    - Time commitment: ${timeCommitment}
    - Accommodation style: ${accommodationStyle}
    - Cultural immersion: ${culturalImmersion}
    - Group preference: ${groupPreference}
    - Destinations: ${destinations.join(', ') || 'Volunteer destination recommendations'}
    
    USER PREFERENCES: ${JSON.stringify(userPrefs)}
    VOLUNTEER HISTORY: ${JSON.stringify(volunteerHistory)}

    Provide comprehensive volunteer travel coordination including:
    1. Reputable volunteer organization partnerships
    2. Skill-matched volunteer opportunity placement
    3. Community impact and sustainability focus
    4. Cultural sensitivity and respect training
    5. Local community integration support
    6. Volunteer accommodation and meal arrangements
    7. Project orientation and safety briefings
    8. Language learning and communication support
    9. Post-volunteer impact measurement and follow-up
    10. Ethical volunteer tourism standards compliance
    11. Group volunteer coordination and teamwork
    12. Personal development and reflection opportunities
    
    Create meaningful volunteer experiences that benefit communities while enriching volunteers.`;

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
          { role: 'user', content: `Coordinate volunteer travel to ${destinations.join(', ')} for ${causeAreas.join(', ')} causes with ${timeCommitment} commitment` }
        ],
        max_completion_tokens: 2000
      }),
    });

    const aiResponse = await response.json();
    const volunteerCoordination = aiResponse.choices[0]?.message?.content;

    await agent.logActivity(userId, 'volunteer_travel_coordinated', {
      destinations: destinations.length,
      causeAreas: causeAreas.length,
      timeCommitment
    });

    const updatedHistory = [...volunteerHistory, {
      destinations,
      causeAreas,
      skillOfferings,
      timeCommitment,
      coordinatedAt: new Date().toISOString()
    }].slice(-10);

    return {
      success: true,
      result: {
        volunteerCoordination,
        communityImpact: 'Verified community benefit and sustainable impact projects',
        skillUtilization: skillOfferings.length > 0 ? 'Professional skills matched to volunteer opportunities' : 'General volunteer support activities arranged',
        culturalExchange: culturalImmersion ? 'Deep cultural immersion and community integration' : 'Service-focused volunteer experience'
      },
      memoryUpdates: [
        {
          key: 'volunteer_experiences',
          data: updatedHistory,
          expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
        }
      ]
    };

  } catch (error) {
    console.error('Volunteer travel coordinator error:', error);
    return {
      success: false,
      error: error.message || 'Failed to coordinate volunteer travel'
    };
  }
};