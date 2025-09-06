import { BaseAgent, AgentHandler } from '../_shared/memory-utils.ts';

export const handler: AgentHandler = async (userId, intent, params, supabaseClient, openAiClient, memory) => {
  const agent = new BaseAgent(supabaseClient, 'destination-guide');
  
  try {
    const { 
      destination, 
      travelPurpose = 'tourism', // tourism, business, education, healthcare
      duration = '3-7 days',
      season = 'current',
      interestCategories = ['culture', 'food', 'nature']
    } = params;

    if (!destination) {
      return {
        success: false,
        error: 'Missing required parameter: destination'
      };
    }

    const userPrefs = await agent.getUserPreferences(userId);
    const destinationHistory = await memory?.getMemory('destination-guide', userId, 'destination_history') || [];

    // Get destination content if available
    const { data: destinationContent } = await supabaseClient
      .from('destination_content')
      .select('*')
      .ilike('destination_name', `%${destination}%`)
      .eq('content_status', 'published')
      .single();

    const systemPrompt = `You are a comprehensive destination guide specialist for MAKU Travel.
    
    DESTINATION GUIDE REQUEST:
    - Destination: ${destination}
    - Travel purpose: ${travelPurpose}
    - Duration: ${duration}
    - Season: ${season}
    - Interest categories: ${interestCategories.join(', ')}
    
    USER PREFERENCES: ${JSON.stringify(userPrefs)}
    PREVIOUS DESTINATIONS: ${JSON.stringify(destinationHistory)}
    DESTINATION DATA: ${destinationContent ? JSON.stringify(destinationContent) : 'No specific data available'}

    Create a comprehensive destination guide including:
    1. Destination overview and key highlights
    2. Best time to visit and weather patterns
    3. Cultural insights and local customs
    4. Must-see attractions and hidden gems
    5. Local cuisine and dining recommendations
    6. Transportation options and getting around
    7. Accommodation recommendations by budget
    8. Safety and health considerations
    9. Language and communication tips
    10. Currency and payment methods
    11. Visa and entry requirements
    12. Local events and festivals
    13. Shopping and souvenir suggestions
    14. Day trip options and nearby attractions
    15. Emergency contacts and useful resources
    
    Tailor recommendations to the travel purpose and user interests.
    Include practical tips and insider knowledge.`;

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
          { role: 'user', content: `Create a comprehensive ${duration} ${travelPurpose} guide for ${destination}` }
        ],
        max_completion_tokens: 3000
      }),
    });

    const aiResponse = await response.json();
    const destinationGuide = aiResponse.choices[0]?.message?.content;

    await agent.logActivity(userId, 'destination_guide_generated', {
      destination,
      travelPurpose,
      duration,
      interestCategories
    });

    const updatedDestinationHistory = [...destinationHistory, {
      destination,
      travelPurpose,
      duration,
      interestCategories,
      guidedAt: new Date().toISOString()
    }].slice(-15);

    return {
      success: true,
      result: {
        destinationGuide,
        destination,
        travelPurpose,
        highlights: destinationContent?.highlights || ['Cultural experiences', 'Local cuisine', 'Natural beauty'],
        bestTimeToVisit: destinationContent?.best_time_to_visit || 'Year-round destination',
        safetyInfo: destinationContent?.safety_info || 'Standard travel precautions advised'
      },
      memoryUpdates: [
        {
          key: 'destination_history',
          data: updatedDestinationHistory,
          expiresAt: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString()
        }
      ]
    };

  } catch (error) {
    console.error('Destination guide error:', error);
    return {
      success: false,
      error: error.message || 'Failed to generate destination guide'
    };
  }
};