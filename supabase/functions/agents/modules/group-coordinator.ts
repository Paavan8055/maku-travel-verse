import { BaseAgent, AgentHandler } from '../_shared/memory-utils.ts';

export const handler: AgentHandler = async (userId, intent, params, supabaseClient, openAiClient, memory) => {
  const agent = new BaseAgent(supabaseClient, 'group-coordinator');
  
  try {
    const { 
      groupType = 'friends', // family, friends, business, wedding, conference, tour
      groupSize,
      destination = null,
      dates = {},
      coordinationNeeds = [], // accommodation, transport, activities, dining, communication
      budgetRange = null,
      specialRequirements = []
    } = params;

    if (!groupSize || groupSize < 2) {
      return {
        success: false,
        error: 'Group size must be at least 2 people'
      };
    }

    const userPrefs = await agent.getUserPreferences(userId);
    const coordinationHistory = await memory?.getMemory('group-coordinator', userId, 'group_events') || [];

    const systemPrompt = `You are a group travel coordination specialist for MAKU Travel.
    
    GROUP COORDINATION REQUEST:
    - Group type: ${groupType}
    - Group size: ${groupSize} people
    - Destination: ${destination || 'To be determined'}
    - Travel dates: ${JSON.stringify(dates)}
    - Coordination needs: ${coordinationNeeds.join(', ') || 'Full coordination'}
    - Budget range: ${budgetRange || 'Not specified'}
    - Special requirements: ${specialRequirements.join(', ') || 'None'}
    
    USER PREFERENCES: ${JSON.stringify(userPrefs)}
    COORDINATION HISTORY: ${JSON.stringify(coordinationHistory)}

    Provide comprehensive group coordination including:
    1. Group accommodation booking strategies
    2. Transportation coordination and group rates
    3. Activity planning for diverse interests
    4. Dining reservations for large groups
    5. Communication and coordination tools
    6. Payment collection and splitting methods
    7. Itinerary synchronization and sharing
    8. Group dynamic management tips
    9. Contingency planning for no-shows
    10. Special occasion arrangements
    11. Group discounts and bulk booking benefits
    12. Accessibility and special needs accommodation
    13. Documentation and paperwork coordination
    14. Travel insurance for groups
    15. Conflict resolution and decision-making frameworks
    
    Provide specific tools, platforms, and services for group management.
    Include templates and checklists for organization.`;

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
          { role: 'user', content: `Coordinate a ${groupType} group of ${groupSize} people for travel to ${destination || 'various destinations'}` }
        ],
        max_completion_tokens: 2500
      }),
    });

    const aiResponse = await response.json();
    const coordinationPlan = aiResponse.choices[0]?.message?.content;

    await agent.logActivity(userId, 'group_coordinated', {
      groupType,
      groupSize,
      destination,
      coordinationNeeds
    });

    const updatedCoordinationHistory = [...coordinationHistory, {
      groupType,
      groupSize,
      destination,
      coordinationNeeds,
      specialRequirements,
      coordinatedAt: new Date().toISOString()
    }].slice(-10);

    return {
      success: true,
      result: {
        coordinationPlan,
        groupType,
        groupSize,
        coordinationAreas: coordinationNeeds.length > 0 ? coordinationNeeds : ['Full service coordination'],
        groupTools: 'Recommended apps and platforms for group management'
      },
      memoryUpdates: [
        {
          key: 'group_events',
          data: updatedCoordinationHistory,
          expiresAt: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString()
        }
      ]
    };

  } catch (error) {
    console.error('Group coordinator error:', error);
    return {
      success: false,
      error: error.message || 'Failed to coordinate group travel'
    };
  }
};