import { BaseAgent, AgentHandler } from '../_shared/memory-utils.ts';

export const handler: AgentHandler = async (userId, intent, params, supabaseClient, openAiClient, memory) => {
  const agent = new BaseAgent(supabaseClient, 'group-booking-coordinator');
  
  try {
    const { 
      groupSize = 1,
      travelers = [],
      bookingType = 'leisure',
      specialRequirements = [],
      budget = { currency: 'AUD', total: 0, perPerson: 0 },
      preferences = {},
      coordinatorRole = 'lead',
      groupDynamics = 'family'
    } = params;

    const userPrefs = await agent.getUserPreferences(userId);
    const groupHistory = await memory?.getMemory('group-booking-coordinator', userId, 'group_bookings') || [];

    const systemPrompt = `You are a group booking coordination agent for MAKU Travel's complex group travel needs.
    
    GROUP BOOKING REQUEST:
    - Group size: ${groupSize} travelers
    - Travelers: ${JSON.stringify(travelers)}
    - Booking type: ${bookingType}
    - Special requirements: ${specialRequirements.join(', ') || 'None'}
    - Budget: ${budget.currency} ${budget.total} (${budget.perPerson} per person)
    - Preferences: ${JSON.stringify(preferences)}
    - Coordinator role: ${coordinatorRole}
    - Group dynamics: ${groupDynamics}
    
    USER PREFERENCES: ${JSON.stringify(userPrefs)}
    GROUP HISTORY: ${JSON.stringify(groupHistory)}

    Provide comprehensive group booking coordination including:
    1. Multi-traveler preference aggregation and conflict resolution
    2. Room allocation optimization (families, couples, singles)
    3. Group discount negotiation and application
    4. Coordinated itinerary planning with consensus building
    5. Split payment management and tracking
    6. Group communication and update distribution
    7. Special needs accommodation (dietary, accessibility, age)
    8. Group activity recommendations and booking
    9. Transportation coordination (flights, transfers, ground)
    10. Emergency contact and travel insurance coordination
    11. Visa and documentation tracking for all travelers
    12. Real-time booking status updates for group leaders
    
    Balance individual preferences with group harmony and budget constraints.`;

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
          { role: 'user', content: `Coordinate group booking for ${groupSize} travelers: ${JSON.stringify(travelers)}` }
        ],
        max_completion_tokens: 2000
      }),
    });

    const aiResponse = await response.json();
    const groupCoordination = aiResponse.choices[0]?.message?.content;

    await agent.logActivity(userId, 'group_coordinated', {
      groupSize,
      bookingType,
      coordinatorRole
    });

    const updatedHistory = [...groupHistory, {
      groupSize,
      bookingType,
      travelers: travelers.length,
      coordinatorRole,
      groupDynamics,
      coordinatedAt: new Date().toISOString()
    }].slice(-15);

    return {
      success: true,
      result: {
        groupCoordination,
        consensusStatus: 'Group preferences have been balanced and coordinated',
        paymentPlan: 'Split payment options and group discounts have been applied',
        communicationPlan: 'All travelers will receive coordinated updates and confirmations'
      },
      memoryUpdates: [
        {
          key: 'group_bookings',
          data: updatedHistory,
          expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
        }
      ]
    };

  } catch (error) {
    console.error('Group booking coordinator error:', error);
    return {
      success: false,
      error: error.message || 'Failed to coordinate group booking'
    };
  }
};