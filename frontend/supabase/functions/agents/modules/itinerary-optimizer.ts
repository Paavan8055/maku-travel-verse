import { BaseAgent, AgentHandler } from '../_shared/memory-utils.ts';

export const handler: AgentHandler = async (userId, intent, params, supabaseClient, openAiClient, memory) => {
  const agent = new BaseAgent(supabaseClient, 'itinerary-optimizer');
  
  try {
    const { 
      currentItinerary, 
      optimizationGoals = ['time', 'cost', 'experience'], // time, cost, experience, travel_distance
      constraints = {},
      preferences = {}
    } = params;

    if (!currentItinerary) {
      return {
        success: false,
        error: 'Missing current itinerary data'
      };
    }

    const userPrefs = await agent.getUserPreferences(userId);
    const optimizationHistory = await memory?.getMemory('itinerary-optimizer', userId, 'optimization_history') || [];

    const systemPrompt = `You are an itinerary optimization specialist for MAKU Travel.
    
    OPTIMIZATION REQUEST:
    - Current itinerary: ${JSON.stringify(currentItinerary)}
    - Optimization goals: ${optimizationGoals.join(', ')}
    - Constraints: ${JSON.stringify(constraints)}
    - User preferences: ${JSON.stringify(preferences)}
    
    USER PROFILE: ${JSON.stringify(userPrefs)}
    PREVIOUS OPTIMIZATIONS: ${JSON.stringify(optimizationHistory)}

    Analyze and optimize the itinerary for:
    1. Logical geographic flow and minimal backtracking
    2. Optimal timing for attractions (opening hours, crowd levels)
    3. Transportation efficiency and cost reduction
    4. Budget optimization across all activities
    5. Experience enhancement through better sequencing
    6. Weather and seasonal considerations
    7. Local event integration and timing
    8. Rest periods and meal scheduling
    9. Emergency buffer time allocation
    10. Alternative options for weather contingencies
    
    Provide specific recommendations with before/after comparisons.
    Include estimated time and cost savings.`;

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
          { role: 'user', content: `Optimize this itinerary focusing on: ${optimizationGoals.join(', ')}` }
        ],
        max_completion_tokens: 2500
      }),
    });

    const aiResponse = await response.json();
    const optimizedItinerary = aiResponse.choices[0]?.message?.content;

    await agent.logActivity(userId, 'itinerary_optimized', {
      optimizationGoals,
      constraintsCount: Object.keys(constraints).length,
      originalLength: Array.isArray(currentItinerary) ? currentItinerary.length : 0
    });

    const updatedOptimizationHistory = [...optimizationHistory, {
      optimizationGoals,
      optimizedAt: new Date().toISOString(),
      constraints,
      preferences
    }].slice(-5);

    return {
      success: true,
      result: {
        optimizedItinerary,
        optimizationGoals,
        improvementAreas: ['Route efficiency', 'Time management', 'Cost optimization', 'Experience enhancement'],
        estimatedSavings: 'Detailed savings breakdown in time and cost'
      },
      memoryUpdates: [
        {
          key: 'optimization_history',
          data: updatedOptimizationHistory,
          expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString()
        }
      ]
    };

  } catch (error) {
    console.error('Itinerary optimizer error:', error);
    return {
      success: false,
      error: error.message || 'Failed to optimize itinerary'
    };
  }
};