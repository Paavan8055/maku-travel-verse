import { BaseAgent, AgentHandler } from '../_shared/memory-utils.ts';

export const handler: AgentHandler = async (userId, intent, params, supabaseClient, openAiClient, memory) => {
  const agent = new BaseAgent(supabaseClient, 'loyalty-manager');
  
  try {
    const { 
      action = 'status_check', // status_check, redeem_points, earn_points, transfer_points
      points = 0,
      rewardType = null,
      partnerProgram = null
    } = params;

    const userPrefs = await agent.getUserPreferences(userId);
    const loyaltyHistory = await memory?.getMemory('loyalty-manager', userId, 'loyalty_actions') || [];

    // Get current loyalty points
    const { data: loyaltyData } = await supabaseClient
      .from('loyalty_points')
      .select('*')
      .eq('user_id', userId)
      .single();

    const systemPrompt = `You are a loyalty program manager for MAKU Travel.
    
    LOYALTY REQUEST:
    - Action: ${action}
    - Points involved: ${points}
    - Reward type: ${rewardType || 'N/A'}
    - Partner program: ${partnerProgram || 'N/A'}
    
    CURRENT LOYALTY STATUS: ${JSON.stringify(loyaltyData)}
    USER PREFERENCES: ${JSON.stringify(userPrefs)}
    LOYALTY HISTORY: ${JSON.stringify(loyaltyHistory)}

    Handle loyalty program operations including:
    1. Current points balance and tier status
    2. Points earning opportunities and rates
    3. Redemption options and requirements
    4. Tier benefits and privileges
    5. Partner program integrations
    6. Points expiration and maintenance
    7. Special promotions and bonus offers
    8. Transfer options to other programs
    9. Family account linking and sharing
    10. Tier upgrade requirements and progress
    11. Exclusive member benefits and access
    12. Points purchase options if available
    
    Provide specific calculations and recommendations.
    Include actionable next steps for maximizing value.`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-5-mini-2025-08-07',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Execute loyalty action: ${action}` }
        ],
        max_completion_tokens: 1500
      }),
    });

    const aiResponse = await response.json();
    const loyaltyResponse = aiResponse.choices[0]?.message?.content;

    await agent.logActivity(userId, 'loyalty_managed', {
      action,
      points,
      currentBalance: loyaltyData?.total_points || 0
    });

    const updatedLoyaltyHistory = [...loyaltyHistory, {
      action,
      points,
      rewardType,
      managedAt: new Date().toISOString()
    }].slice(-20);

    return {
      success: true,
      result: {
        loyaltyResponse,
        action,
        currentBalance: loyaltyData?.total_points || 0,
        tier: loyaltyData?.tier || 'Bronze',
        availableRewards: 'Updated rewards catalog based on current points'
      },
      memoryUpdates: [
        {
          key: 'loyalty_actions',
          data: updatedLoyaltyHistory,
          expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
        }
      ]
    };

  } catch (error) {
    console.error('Loyalty manager error:', error);
    return {
      success: false,
      error: error.message || 'Failed to manage loyalty program'
    };
  }
};