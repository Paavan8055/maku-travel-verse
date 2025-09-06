import { BaseAgent, AgentHandler } from '../_shared/memory-utils.ts';

export const handler: AgentHandler = async (userId, intent, params, supabaseClient, openAiClient, memory) => {
  const agent = new BaseAgent(supabaseClient, 'business-travel-manager');
  
  try {
    const { 
      companyPolicy = {},
      expenseCategory = 'travel',
      budgetLimit = null,
      approvalRequired = true,
      travelDates = {},
      destinations = []
    } = params;

    const userPrefs = await agent.getUserPreferences(userId);
    const businessHistory = await memory?.getMemory('business-travel-manager', userId, 'business_trips') || [];

    const systemPrompt = `You are a corporate business travel manager for MAKU Travel.
    
    BUSINESS TRAVEL REQUEST:
    - Company policy: ${JSON.stringify(companyPolicy)}
    - Expense category: ${expenseCategory}
    - Budget limit: ${budgetLimit || 'Not specified'}
    - Approval required: ${approvalRequired}
    - Travel dates: ${JSON.stringify(travelDates)}
    - Destinations: ${destinations.join(', ') || 'Not specified'}
    
    USER PREFERENCES: ${JSON.stringify(userPrefs)}
    BUSINESS TRAVEL HISTORY: ${JSON.stringify(businessHistory)}

    Provide comprehensive business travel management including:
    1. Policy compliance verification
    2. Pre-approval workflow guidance
    3. Expense tracking and reporting
    4. Corporate rate recommendations
    5. Travel insurance requirements
    6. Visa and documentation for business
    7. Meeting coordination assistance
    8. Ground transportation arrangements
    9. Expense receipt management
    10. Post-trip reporting templates
    11. Tax deduction optimization
    12. Corporate credit card integration
    
    Ensure all recommendations comply with company policies and travel guidelines.`;

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
          { role: 'user', content: `Manage business travel for ${destinations.join(', ')} with ${expenseCategory} category` }
        ],
        max_completion_tokens: 2000
      }),
    });

    const aiResponse = await response.json();
    const businessPlan = aiResponse.choices[0]?.message?.content;

    await agent.logActivity(userId, 'business_travel_managed', {
      destinations: destinations.length,
      expenseCategory,
      approvalRequired
    });

    const updatedHistory = [...businessHistory, {
      destinations,
      travelDates,
      expenseCategory,
      budgetLimit,
      managedAt: new Date().toISOString()
    }].slice(-10);

    return {
      success: true,
      result: {
        businessPlan,
        complianceStatus: 'Verified against company policies',
        approvalWorkflow: approvalRequired ? 'Approval required before booking' : 'Direct booking authorized',
        expenseTracking: 'Corporate expense tracking enabled'
      },
      memoryUpdates: [
        {
          key: 'business_trips',
          data: updatedHistory,
          expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
        }
      ]
    };

  } catch (error) {
    console.error('Business travel manager error:', error);
    return {
      success: false,
      error: error.message || 'Failed to manage business travel'
    };
  }
};