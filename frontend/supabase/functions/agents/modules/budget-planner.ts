import { BaseAgent, AgentHandler } from '../_shared/memory-utils.ts';

export const handler: AgentHandler = async (userId, intent, params, supabaseClient, openAiClient, memory) => {
  const agent = new BaseAgent(supabaseClient, 'budget-planner');
  
  try {
    const { 
      totalBudget,
      destination,
      duration = 7,
      travelers = 1,
      travelStyle = 'mid_range', // budget, mid_range, luxury, ultra_luxury
      priorities = ['accommodation', 'activities'], // accommodation, food, transport, activities, shopping
      currency = 'AUD'
    } = params;

    if (!totalBudget || !destination) {
      return {
        success: false,
        error: 'Missing required parameters: totalBudget or destination'
      };
    }

    const userPrefs = await agent.getUserPreferences(userId);
    const budgetHistory = await memory?.getMemory('budget-planner', userId, 'budget_plans') || [];

    const systemPrompt = `You are a travel budget planning specialist for MAKU Travel.
    
    BUDGET PLANNING REQUEST:
    - Total budget: ${totalBudget} ${currency}
    - Destination: ${destination}
    - Duration: ${duration} days
    - Number of travelers: ${travelers}
    - Travel style: ${travelStyle}
    - Priorities: ${priorities.join(', ')}
    
    USER PREFERENCES: ${JSON.stringify(userPrefs)}
    BUDGET HISTORY: ${JSON.stringify(budgetHistory)}

    Create a comprehensive budget plan including:
    1. Detailed budget breakdown by category
    2. Daily spending recommendations
    3. Accommodation budget and options
    4. Food and dining budget allocation
    5. Transportation costs (local and international)
    6. Activities and entertainment budget
    7. Shopping and souvenir allowance
    8. Emergency fund recommendations
    9. Travel insurance and fees
    10. Currency exchange and banking fees
    11. Gratuity and service charge guidelines
    12. Money-saving tips and strategies
    13. Budget tracking recommendations
    14. Cost optimization opportunities
    15. Contingency planning for budget overruns
    
    Provide specific amounts for each category based on destination costs.
    Include both conservative and optimistic scenarios.`;

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
          { role: 'user', content: `Create a detailed ${travelStyle} budget plan for ${travelers} travelers` }
        ],
        max_completion_tokens: 2500
      }),
    });

    const aiResponse = await response.json();
    const budgetPlan = aiResponse.choices[0]?.message?.content;

    await agent.logActivity(userId, 'budget_planned', {
      destination,
      totalBudget,
      duration,
      travelers,
      travelStyle
    });

    const updatedBudgetHistory = [...budgetHistory, {
      destination,
      totalBudget,
      duration,
      travelers,
      travelStyle,
      priorities,
      plannedAt: new Date().toISOString()
    }].slice(-10);

    return {
      success: true,
      result: {
        budgetPlan,
        destination,
        totalBudget: `${totalBudget} ${currency}`,
        dailyBudget: `${Math.round(totalBudget / duration)} ${currency}`,
        travelStyle,
        budgetCategories: ['Accommodation', 'Food', 'Transport', 'Activities', 'Miscellaneous']
      },
      memoryUpdates: [
        {
          key: 'budget_plans',
          data: updatedBudgetHistory,
          expiresAt: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString()
        }
      ]
    };

  } catch (error) {
    console.error('Budget planner error:', error);
    return {
      success: false,
      error: error.message || 'Failed to create budget plan'
    };
  }
};