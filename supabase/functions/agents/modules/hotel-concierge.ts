import { BaseAgent, AgentHandler } from '../_shared/memory-utils.ts';

export const handler: AgentHandler = async (userId, intent, params, supabaseClient, openAiClient, memory) => {
  const agent = new BaseAgent(supabaseClient, 'hotel-concierge');
  
  try {
    const { 
      service = 'general_inquiry', // general_inquiry, restaurant_booking, tour_booking, transport_arrangement, local_recommendations
      location = null,
      preferences = {},
      urgency = 'normal', // low, normal, high, immediate
      groupSize = 1,
      specialRequests = []
    } = params;

    const userPrefs = await agent.getUserPreferences(userId);
    const conciergeHistory = await memory?.getMemory('hotel-concierge', userId, 'concierge_requests') || [];

    // Get current bookings to understand user's location context
    const { data: currentBookings } = await supabaseClient
      .from('bookings')
      .select('booking_type, booking_data, status')
      .eq('user_id', userId)
      .in('status', ['confirmed', 'pending'])
      .order('created_at', { ascending: false })
      .limit(3);

    const systemPrompt = `You are a professional hotel concierge for MAKU Travel.
    
    CONCIERGE SERVICE REQUEST:
    - Service type: ${service}
    - Location: ${location || 'User location based on bookings'}
    - Preferences: ${JSON.stringify(preferences)}
    - Urgency: ${urgency}
    - Group size: ${groupSize}
    - Special requests: ${specialRequests.join(', ') || 'None'}
    
    USER PREFERENCES: ${JSON.stringify(userPrefs)}
    CURRENT BOOKINGS: ${JSON.stringify(currentBookings)}
    CONCIERGE HISTORY: ${JSON.stringify(conciergeHistory)}

    Provide professional concierge services including:
    1. Personalized recommendations based on preferences
    2. Restaurant reservations and dining suggestions
    3. Tour and activity bookings
    4. Transportation arrangements
    5. Event and entertainment tickets
    6. Shopping and personal assistance
    7. Business services and meeting arrangements
    8. Special occasion planning
    9. Emergency assistance and problem solving
    10. Local insider knowledge and tips
    11. Cultural etiquette and customs guidance
    12. Language assistance and translation
    13. Medical and pharmacy referrals
    14. Spa and wellness bookings
    15. Child care and family services
    
    Provide specific contact information, pricing, and booking details.
    Offer alternatives and backup options for each recommendation.`;

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
          { role: 'user', content: `Provide ${urgency} priority ${service} for ${groupSize} guests` }
        ],
        max_completion_tokens: 2500
      }),
    });

    const aiResponse = await response.json();
    const conciergeService = aiResponse.choices[0]?.message?.content;

    await agent.logActivity(userId, 'concierge_service_provided', {
      service,
      urgency,
      groupSize,
      hasSpecialRequests: specialRequests.length > 0
    });

    const updatedConciergeHistory = [...conciergeHistory, {
      service,
      urgency,
      groupSize,
      specialRequests,
      servicedAt: new Date().toISOString()
    }].slice(-25);

    return {
      success: true,
      result: {
        conciergeService,
        service,
        urgency,
        followUpAvailable: true,
        personalizedRecommendations: 'Tailored to your preferences and location'
      },
      memoryUpdates: [
        {
          key: 'concierge_requests',
          data: updatedConciergeHistory,
          expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString()
        }
      ]
    };

  } catch (error) {
    console.error('Hotel concierge error:', error);
    return {
      success: false,
      error: error.message || 'Failed to provide concierge service'
    };
  }
};