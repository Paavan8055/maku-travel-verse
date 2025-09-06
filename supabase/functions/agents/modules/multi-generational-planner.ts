import { BaseAgent, AgentHandler } from '../_shared/memory-utils.ts';

export const handler: AgentHandler = async (userId, intent, params, supabaseClient, openAiClient, memory) => {
  const agent = new BaseAgent(supabaseClient, 'multi-generational-planner');
  
  try {
    const { 
      ageGroups = [],
      groupSize = 6,
      accommodationNeeds = 'connected_rooms',
      activityBalance = 'varied',
      mobilityConsiderations = [],
      budgetApproach = 'shared',
      destinations = []
    } = params;

    const userPrefs = await agent.getUserPreferences(userId);
    const familyHistory = await memory?.getMemory('multi-generational-planner', userId, 'family_trips') || [];

    const systemPrompt = `You are a multi-generational travel planner for MAKU Travel's family experiences.
    
    MULTI-GENERATIONAL TRAVEL REQUEST:
    - Age groups: ${ageGroups.join(', ') || 'Mixed age family group'}
    - Group size: ${groupSize}
    - Accommodation needs: ${accommodationNeeds}
    - Activity balance: ${activityBalance}
    - Mobility considerations: ${mobilityConsiderations.join(', ') || 'Standard mobility'}
    - Budget approach: ${budgetApproach}
    - Destinations: ${destinations.join(', ') || 'Family-friendly destinations'}
    
    USER PREFERENCES: ${JSON.stringify(userPrefs)}
    FAMILY HISTORY: ${JSON.stringify(familyHistory)}

    Provide comprehensive multi-generational travel planning including:
    1. Age-appropriate activity planning and scheduling
    2. Accommodation arrangements for large family groups
    3. Mobility and accessibility considerations for all ages
    4. Meal planning and dietary accommodation for families
    5. Transportation coordination for group travel
    6. Childcare and senior care support services
    7. Emergency medical and safety planning
    8. Activity alternatives for different energy levels
    9. Budgeting and cost-sharing coordination
    10. Family bonding and shared experience opportunities
    11. Individual interest and preference accommodation
    12. Conflict resolution and group harmony strategies
    
    Create memorable experiences that unite multiple generations through travel.`;

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
          { role: 'user', content: `Plan multi-generational trip to ${destinations.join(', ')} for ${groupSize} people across age groups: ${ageGroups.join(', ')}` }
        ],
        max_completion_tokens: 2000
      }),
    });

    const aiResponse = await response.json();
    const familyPlan = aiResponse.choices[0]?.message?.content;

    await agent.logActivity(userId, 'family_trip_planned', {
      destinations: destinations.length,
      groupSize,
      ageGroups: ageGroups.length
    });

    const updatedHistory = [...familyHistory, {
      destinations,
      ageGroups,
      groupSize,
      activityBalance,
      plannedAt: new Date().toISOString()
    }].slice(-10);

    return {
      success: true,
      result: {
        familyPlan,
        inclusiveExperiences: 'Activities and experiences designed for all age groups',
        familyBonding: 'Shared experiences and family bonding opportunities prioritized',
        practicalSupport: 'Logistics and support services coordinated for seamless family travel'
      },
      memoryUpdates: [
        {
          key: 'family_trips',
          data: updatedHistory,
          expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
        }
      ]
    };

  } catch (error) {
    console.error('Multi-generational planner error:', error);
    return {
      success: false,
      error: error.message || 'Failed to plan multi-generational trip'
    };
  }
};