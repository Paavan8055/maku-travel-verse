import { BaseAgent, AgentHandler } from '../_shared/memory-utils.ts';

export const handler: AgentHandler = async (userId, intent, params, supabaseClient, openAiClient, memory) => {
  const agent = new BaseAgent(supabaseClient, 'corporate-event-planner');
  
  try {
    const { 
      eventType = 'conference',
      attendeeCount = 50,
      budget = null,
      venueRequirements = [],
      cateringNeeds = 'standard',
      techRequirements = [],
      teamBuildingActivities = false,
      destinations = []
    } = params;

    const userPrefs = await agent.getUserPreferences(userId);
    const eventHistory = await memory?.getMemory('corporate-event-planner', userId, 'corporate_events') || [];

    const systemPrompt = `You are a corporate event planner for MAKU Travel's business events and conferences.
    
    CORPORATE EVENT REQUEST:
    - Event type: ${eventType}
    - Attendee count: ${attendeeCount}
    - Budget: ${budget || 'To be determined'}
    - Venue requirements: ${venueRequirements.join(', ') || 'Standard conference facilities'}
    - Catering needs: ${cateringNeeds}
    - Tech requirements: ${techRequirements.join(', ') || 'Basic AV setup'}
    - Team building activities: ${teamBuildingActivities}
    - Destinations: ${destinations.join(', ') || 'Business-friendly destinations'}
    
    USER PREFERENCES: ${JSON.stringify(userPrefs)}
    EVENT HISTORY: ${JSON.stringify(eventHistory)}

    Provide comprehensive corporate event planning including:
    1. Venue selection and booking coordination
    2. Accommodation arrangements for attendees
    3. Catering and meal planning services
    4. Audio-visual and technology setup
    5. Transportation and transfer coordination
    6. Team building and networking activities
    7. Speaker and presenter coordination
    8. Event registration and check-in management
    9. Corporate branding and signage setup
    10. Meeting room and breakout space arrangements
    11. Networking reception and entertainment planning
    12. Post-event follow-up and evaluation services
    
    Deliver professional corporate events that enhance business objectives and team cohesion.`;

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
          { role: 'user', content: `Plan ${eventType} in ${destinations.join(', ')} for ${attendeeCount} attendees with ${cateringNeeds} catering` }
        ],
        max_completion_tokens: 2000
      }),
    });

    const aiResponse = await response.json();
    const eventPlan = aiResponse.choices[0]?.message?.content;

    await agent.logActivity(userId, 'corporate_event_planned', {
      eventType,
      attendeeCount,
      destinations: destinations.length
    });

    const updatedHistory = [...eventHistory, {
      eventType,
      attendeeCount,
      destinations,
      teamBuildingActivities,
      plannedAt: new Date().toISOString()
    }].slice(-10);

    return {
      success: true,
      result: {
        eventPlan,
        professionalExecution: 'Professional event management and coordination services',
        teamEngagement: teamBuildingActivities ? 'Team building and networking activities included' : 'Business-focused agenda prioritized',
        technologySupport: 'Complete AV and technical support coordination'
      },
      memoryUpdates: [
        {
          key: 'corporate_events',
          data: updatedHistory,
          expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
        }
      ]
    };

  } catch (error) {
    console.error('Corporate event planner error:', error);
    return {
      success: false,
      error: error.message || 'Failed to plan corporate event'
    };
  }
};