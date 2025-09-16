import { BaseAgent, AgentHandler } from '../_shared/memory-utils.ts';

export const handler: AgentHandler = async (userId, intent, params, supabaseClient, openAiClient, memory) => {
  const agent = new BaseAgent(supabaseClient, 'food-culinary-guide');
  
  try {
    const { 
      cuisinePreferences = [],
      dietaryRestrictions = [],
      experienceLevel = 'adventurous',
      budgetRange = 'moderate',
      cookingClasses = false,
      marketTours = true,
      destinations = []
    } = params;

    const userPrefs = await agent.getUserPreferences(userId);
    const culinaryHistory = await memory?.getMemory('food-culinary-guide', userId, 'culinary_experiences') || [];

    const systemPrompt = `You are a food and culinary travel guide for MAKU Travel's gastronomic adventures.
    
    CULINARY TRAVEL REQUEST:
    - Cuisine preferences: ${cuisinePreferences.join(', ') || 'Open to all cuisines'}
    - Dietary restrictions: ${dietaryRestrictions.join(', ') || 'No restrictions'}
    - Experience level: ${experienceLevel}
    - Budget range: ${budgetRange}
    - Cooking classes: ${cookingClasses}
    - Market tours: ${marketTours}
    - Destinations: ${destinations.join(', ') || 'Culinary destinations'}
    
    USER PREFERENCES: ${JSON.stringify(userPrefs)}
    CULINARY HISTORY: ${JSON.stringify(culinaryHistory)}

    Provide comprehensive culinary travel guidance including:
    1. Local cuisine and specialty dish recommendations
    2. Restaurant reservations and chef recommendations
    3. Food market and street food exploration
    4. Cooking class and culinary workshop arrangements
    5. Wine and beverage pairing experiences
    6. Local ingredient sourcing and shopping
    7. Food festival and culinary event timing
    8. Dietary restriction accommodation strategies
    9. Traditional recipe and technique learning
    10. Michelin-starred and fine dining experiences
    11. Food safety and hygiene considerations
    12. Culinary history and cultural context education
    
    Immerse travelers in authentic culinary cultures and flavors.`;

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
          { role: 'user', content: `Guide culinary experiences in ${destinations.join(', ')} for ${cuisinePreferences.join(', ')} cuisine at ${experienceLevel} level` }
        ],
        max_completion_tokens: 2000
      }),
    });

    const aiResponse = await response.json();
    const culinaryGuide = aiResponse.choices[0]?.message?.content;

    await agent.logActivity(userId, 'culinary_experience_guided', {
      destinations: destinations.length,
      cuisinePreferences: cuisinePreferences.length,
      experienceLevel
    });

    const updatedHistory = [...culinaryHistory, {
      destinations,
      cuisinePreferences,
      experienceLevel,
      cookingClasses,
      guidedAt: new Date().toISOString()
    }].slice(-15);

    return {
      success: true,
      result: {
        culinaryGuide,
        gastronomicImmersion: 'Authentic local cuisine experiences curated',
        learningOpportunities: cookingClasses ? 'Hands-on cooking classes and chef workshops arranged' : 'Restaurant and tasting experiences focused',
        marketExploration: marketTours ? 'Local market tours and ingredient sourcing included' : 'Restaurant-focused culinary experiences'
      },
      memoryUpdates: [
        {
          key: 'culinary_experiences',
          data: updatedHistory,
          expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
        }
      ]
    };

  } catch (error) {
    console.error('Food culinary guide error:', error);
    return {
      success: false,
      error: error.message || 'Failed to guide culinary experiences'
    };
  }
};