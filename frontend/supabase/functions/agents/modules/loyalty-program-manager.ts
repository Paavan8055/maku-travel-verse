import { BaseAgent, AgentHandler } from '../_shared/memory-utils.ts';

export const handler: AgentHandler = async (userId, intent, params, supabaseClient, openAiClient, memory) => {
  const agent = new BaseAgent(supabaseClient, 'loyalty-program-manager');
  
  try {
    const { 
      loyaltyPrograms = [],
      optimizationGoals = [],
      upcomingTravel = {},
      pointsUtilization = 'maximize_value',
      statusMaintenance = true,
      crossProgramStrategies = true
    } = params;

    const userPrefs = await agent.getUserPreferences(userId);
    const loyaltyHistory = await memory?.getMemory('loyalty-program-manager', userId, 'loyalty_strategies') || [];

    // Get current loyalty points from database
    const { data: loyaltyData } = await supabaseClient
      .from('loyalty_points')
      .select('*')
      .eq('user_id', userId)
      .single();

    const systemPrompt = `You are a loyalty program manager for MAKU Travel's customer retention system.
    
    LOYALTY OPTIMIZATION REQUEST:
    - Current loyalty programs: ${JSON.stringify(loyaltyPrograms)}
    - Optimization goals: ${JSON.stringify(optimizationGoals)}
    - Upcoming travel: ${JSON.stringify(upcomingTravel)}
    - Points utilization strategy: ${pointsUtilization}
    - Status maintenance priority: ${statusMaintenance}
    - Cross-program strategies: ${crossProgramStrategies}
    
    CURRENT LOYALTY STATUS:
    - Total points: ${loyaltyData?.total_points || 0}
    - Current tier: ${loyaltyData?.current_tier || 'bronze'}
    - Available rewards: ${loyaltyData?.available_rewards || 0}
    
    USER PROFILE:
    - Preferences: ${JSON.stringify(userPrefs)}
    - Loyalty history: ${JSON.stringify(loyaltyHistory.slice(-10))}
    
    Provide comprehensive loyalty program management including:
    1. Points optimization strategies and timing
    2. Status tier advancement planning
    3. Reward redemption recommendations
    4. Elite status maintenance strategies
    5. Cross-program partnership utilization
    6. Promotional opportunity identification
    7. Point expiration prevention planning
    8. Upgrade opportunity maximization
    9. Transfer and partnership program analysis
    10. Seasonal promotion calendar planning
    11. Credit card and earning optimization
    12. Family pooling and sharing strategies
    
    Format as actionable loyalty management plan with specific recommendations.`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-5-2025-08-07',
        max_completion_tokens: 2000,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Optimize my loyalty program strategy for upcoming travel: ${JSON.stringify(upcomingTravel)}` }
        ]
      })
    });

    const data = await response.json();
    const loyaltyRecommendations = data.choices[0].message.content;

    await agent.logActivity(userId, 'loyalty_management', {
      programsManaged: loyaltyPrograms.length,
      optimizationGoals,
      currentPoints: loyaltyData?.total_points || 0
    });

    // Update loyalty strategies
    const newLoyaltyEntry = {
      loyaltyPrograms,
      optimizationGoals,
      upcomingTravel,
      pointsUtilization,
      managementDate: new Date().toISOString(),
      currentBalance: loyaltyData?.total_points || 0
    };
    
    const updatedHistory = [...loyaltyHistory, newLoyaltyEntry].slice(-20);
    await memory?.setMemory('loyalty-program-manager', userId, 'loyalty_strategies', updatedHistory);

    return {
      success: true,
      loyaltyRecommendations,
      currentBalance: loyaltyData?.total_points || 0,
      currentTier: loyaltyData?.current_tier || 'bronze',
      availableRewards: loyaltyData?.available_rewards || 0,
      memoryUpdates: {
        loyalty_strategies: updatedHistory
      }
    };
  } catch (error) {
    console.error('Error in loyalty-program-manager:', error);
    return {
      success: false,
      error: 'Failed to manage loyalty programs'
    };
  }
};