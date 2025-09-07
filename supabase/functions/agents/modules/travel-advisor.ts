import { BaseAgent, AgentHandler } from '../_shared/memory-utils.ts';
import { OpenAIServiceWrapper } from '../_shared/openai-service-wrapper.ts';
import { UserAnalyticsUtils } from '../_shared/user-analytics-utils.ts';

export const handler: AgentHandler = async (userId, intent, params, supabaseClient, openAiClient, memory) => {
  const agent = new BaseAgent(supabaseClient, 'travel-advisor');
  const openai = new OpenAIServiceWrapper(openAiClient);
  const analytics = new UserAnalyticsUtils(supabaseClient);
  
  try {
    const { 
      question, 
      travelContext = {},
      urgency = 'normal', // low, normal, high, emergency
      category = 'general' // general, booking, safety, health, documentation, customs
    } = params;

    if (!question) {
      return {
        success: false,
        error: 'Missing required parameter: question'
      };
    }

    const userPrefs = await agent.getUserPreferences(userId);
    const userProfile = await analytics.getUserBehaviorProfile(userId);
    const userSegment = await analytics.segmentUser(userId);
    const advisoryHistory = await memory?.getMemory('travel-advisor', userId, 'advisory_history') || [];

    // Get user's recent bookings for context
    const { data: recentBookings } = await supabaseClient
      .from('bookings')
      .select('booking_type, booking_data, status, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(3);

    const systemPrompt = `You are an expert travel advisor for MAKU Travel with extensive knowledge of:
    - Global travel regulations and requirements
    - Safety and security protocols
    - Cultural customs and etiquette
    - Health and vaccination requirements
    - Documentation and visa processes
    - Travel insurance and protection
    - Emergency procedures and contacts
    
    ADVISORY REQUEST:
    - Question: ${question}
    - Category: ${category}
    - Urgency: ${urgency}
    - Travel context: ${JSON.stringify(travelContext)}
    
    USER PROFILE: ${JSON.stringify(userPrefs)}
    USER BEHAVIOR PROFILE: ${JSON.stringify(userProfile)}
    USER SEGMENT: ${JSON.stringify(userSegment)}
    RECENT BOOKINGS: ${JSON.stringify(recentBookings)}
    PREVIOUS ADVISORY HISTORY: ${JSON.stringify(advisoryHistory)}

    Provide expert travel advice including:
    1. Direct answer to the specific question
    2. Additional considerations and implications
    3. Step-by-step guidance if applicable
    4. Relevant regulations or requirements
    5. Safety and security recommendations
    6. Cost implications if relevant
    7. Timeline considerations
    8. Alternative options or solutions
    9. Required documentation or preparation
    10. Emergency protocols if applicable
    11. Follow-up actions needed
    12. Useful resources and contacts
    
    Adjust urgency and detail level based on the request category.
    Provide practical, actionable advice with specific next steps.`;

    const adviceResponse = await openai.chat({
      prompt: systemPrompt,
      context: `${category.toUpperCase()} QUESTION (${urgency} priority): ${question}`,
      model: 'gpt-5-2025-08-07',
      maxTokens: 2500
    });

    const travelAdvice = adviceResponse.content;

    await agent.logActivity(userId, 'travel_advice_provided', {
      category,
      urgency,
      hasContext: Object.keys(travelContext).length > 0
    });

    const updatedAdvisoryHistory = [...advisoryHistory, {
      question: question.substring(0, 100) + '...',
      category,
      urgency,
      advisedAt: new Date().toISOString()
    }].slice(-20);

    return {
      success: true,
      result: {
        travelAdvice,
        category,
        urgency,
        advisoryType: 'Expert travel consultation',
        followUpRecommended: urgency === 'high' || urgency === 'emergency',
        resourcesProvided: 'Comprehensive guidance with actionable steps'
      },
      memoryUpdates: [
        {
          key: 'advisory_history',
          data: updatedAdvisoryHistory,
          expiresAt: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString()
        }
      ]
    };

  } catch (error) {
    console.error('Travel advisor error:', error);
    return {
      success: false,
      error: error.message || 'Failed to provide travel advice'
    };
  }
};