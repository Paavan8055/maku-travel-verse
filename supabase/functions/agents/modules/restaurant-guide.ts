import { BaseAgent, AgentHandler } from '../_shared/memory-utils.ts';

export const handler: AgentHandler = async (userId, intent, params, supabaseClient, openAiClient, memory) => {
  const agent = new BaseAgent(supabaseClient, 'restaurant-guide');
  
  try {
    const { 
      destination,
      cuisineTypes = ['local'], // local, international, specific cuisines
      priceRange = 'mid_range', // budget, mid_range, fine_dining, luxury
      dietaryRestrictions = [], // vegetarian, vegan, gluten_free, halal, kosher, etc.
      mealTypes = ['dinner'], // breakfast, lunch, dinner, snacks, drinks
      groupSize = 2,
      occasion = 'casual' // casual, romantic, business, celebration, family
    } = params;

    if (!destination) {
      return {
        success: false,
        error: 'Missing required parameter: destination'
      };
    }

    const userPrefs = await agent.getUserPreferences(userId);
    const diningHistory = await memory?.getMemory('restaurant-guide', userId, 'dining_preferences') || [];

    const systemPrompt = `You are a dining and restaurant specialist for MAKU Travel.
    
    RESTAURANT GUIDE REQUEST:
    - Destination: ${destination}
    - Cuisine types: ${cuisineTypes.join(', ')}
    - Price range: ${priceRange}
    - Dietary restrictions: ${dietaryRestrictions.join(', ') || 'None'}
    - Meal types: ${mealTypes.join(', ')}
    - Group size: ${groupSize}
    - Occasion: ${occasion}
    
    USER PREFERENCES: ${JSON.stringify(userPrefs)}
    DINING HISTORY: ${JSON.stringify(diningHistory)}

    Provide comprehensive dining recommendations including:
    1. Top-rated restaurants by category and price range
    2. Authentic local cuisine and signature dishes
    3. Hidden gems and local favorites
    4. Dietary restriction accommodations
    5. Reservation requirements and booking information
    6. Menu highlights and must-try dishes
    7. Price ranges and average meal costs
    8. Atmosphere and ambiance descriptions
    9. Location and accessibility information
    10. Operating hours and seasonal variations
    11. Dress codes and etiquette guidelines
    12. Wine and beverage pairings
    13. Alternative options for dietary needs
    14. Food markets and street food recommendations
    15. Cooking classes and culinary experiences
    
    Include specific restaurant names, addresses, and contact information.
    Provide insider tips and local dining customs.`;

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
          { role: 'user', content: `Find ${priceRange} ${cuisineTypes.join(' and ')} restaurants in ${destination} for ${occasion} dining` }
        ],
        max_completion_tokens: 2500
      }),
    });

    const aiResponse = await response.json();
    const restaurantGuide = aiResponse.choices[0]?.message?.content;

    await agent.logActivity(userId, 'restaurant_guide_generated', {
      destination,
      cuisineTypes,
      priceRange,
      occasion
    });

    const updatedDiningHistory = [...diningHistory, {
      destination,
      cuisineTypes,
      priceRange,
      dietaryRestrictions,
      occasion,
      guidedAt: new Date().toISOString()
    }].slice(-15);

    return {
      success: true,
      result: {
        restaurantGuide,
        destination,
        cuisineTypes,
        priceRange,
        dietaryAccommodations: dietaryRestrictions.length > 0 ? 'Specialized options included' : 'Standard recommendations'
      },
      memoryUpdates: [
        {
          key: 'dining_preferences',
          data: updatedDiningHistory,
          expiresAt: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString()
        }
      ]
    };

  } catch (error) {
    console.error('Restaurant guide error:', error);
    return {
      success: false,
      error: error.message || 'Failed to generate restaurant guide'
    };
  }
};