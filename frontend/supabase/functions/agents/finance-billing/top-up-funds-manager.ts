import { BaseAgent, AgentHandler, StructuredLogger } from '../_shared/memory-utils.ts';

export const handler: AgentHandler = async (userId, intent, params, supabaseClient, openAiClient, memory) => {
  const agent = new BaseAgent('top-up-funds-manager', supabaseClient);
  StructuredLogger.info('Top-up funds manager started', { userId, intent, params });

  try {
    // Extract top-up parameters
    const {
      amount,
      currency = 'AUD',
      topUpMethod = 'card',
      fundId,
      autoTopUp = false,
      targetBalance,
      minimumBalance,
      bonusEligible = true
    } = params;

    // Validate required parameters
    if (!amount || amount <= 0) {
      throw new Error('Invalid top-up amount specified');
    }

    // Get user preferences and fund history
    const userPreferences = await agent.getUserPreferences(userId);
    const fundHistory = await memory.getMemory('top-up-funds-manager', userId, 'fund_history') || [];

    // Fetch user's current fund balances
    const { data: userFunds } = await supabaseClient
      .from('funds')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true);

    // Fetch recent fund transactions
    const { data: recentTransactions } = await supabaseClient
      .from('fund_transactions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(10);

    // Calculate potential bonus and promotional offers
    const totalTopUps = recentTransactions?.filter(t => t.type === 'top_up')?.length || 0;
    const lastTopUpDate = recentTransactions?.find(t => t.type === 'top_up')?.created_at;
    
    let bonusAmount = 0;
    let promotionalOffer = null;

    if (bonusEligible) {
      // First-time bonus
      if (totalTopUps === 0) {
        bonusAmount = Math.min(amount * 0.1, 50); // 10% bonus up to $50
        promotionalOffer = 'First-time top-up bonus';
      }
      // Loyalty bonus for amounts > $100
      else if (amount >= 100) {
        bonusAmount = amount * 0.05; // 5% loyalty bonus
        promotionalOffer = 'Loyalty bonus for large top-up';
      }
    }

    // Check auto-top-up configuration
    let autoTopUpConfig = null;
    if (autoTopUp && targetBalance && minimumBalance) {
      autoTopUpConfig = {
        enabled: true,
        target_balance: targetBalance,
        minimum_balance: minimumBalance,
        top_up_amount: targetBalance - minimumBalance
      };
    }

    // Construct system prompt for OpenAI
    const systemPrompt = `You are a travel funds management agent for MAKU.Travel. Your role is to help users manage their travel fund top-ups, balances, and spending optimization.

TOP-UP REQUEST DETAILS:
- Amount: ${amount} ${currency}
- Method: ${topUpMethod}
- Auto Top-up: ${autoTopUp ? 'Enabled' : 'Disabled'}
${fundId ? `- Fund ID: ${fundId}` : ''}
${bonusAmount > 0 ? `- Bonus Eligible: ${bonusAmount} ${currency} (${promotionalOffer})` : ''}

CURRENT USER FUNDS:
${JSON.stringify(userFunds || [], null, 2)}

RECENT FUND TRANSACTIONS:
${JSON.stringify(recentTransactions || [], null, 2)}

USER PREFERENCES:
${JSON.stringify(userPreferences, null, 2)}

FUND MANAGEMENT HISTORY:
${JSON.stringify(fundHistory.slice(-5), null, 2)}

BONUS CALCULATION:
- Total Previous Top-ups: ${totalTopUps}
- Bonus Amount: ${bonusAmount} ${currency}
- Promotional Offer: ${promotionalOffer || 'None'}

${autoTopUpConfig ? `AUTO TOP-UP CONFIGURATION:\n${JSON.stringify(autoTopUpConfig, null, 2)}` : ''}

Please provide comprehensive fund management guidance including:
1. Top-up validation and processing recommendations
2. Optimal fund allocation strategy
3. Bonus and promotional opportunities
4. Auto top-up configuration suggestions
5. Spending optimization recommendations
6. Tax implications and reporting requirements

Focus on maximizing value for the user while ensuring secure and compliant fund management.`;

    // Call OpenAI API
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Process fund top-up of ${amount} ${currency}. ${intent}` }
        ],
        temperature: 0.3,
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const fundManagementAdvice = data.choices[0]?.message?.content || 'Unable to generate fund management guidance.';

    // Create fund transaction record (pending status)
    const transactionData = {
      user_id: userId,
      type: 'top_up',
      amount: amount,
      currency: currency,
      status: 'pending',
      billing_category: 'top_up',
      payment_method: topUpMethod,
      billing_metadata: {
        bonus_amount: bonusAmount,
        promotional_offer: promotionalOffer,
        auto_top_up: autoTopUp,
        target_balance: targetBalance,
        minimum_balance: minimumBalance
      }
    };

    const { data: newTransaction, error: transactionError } = await supabaseClient
      .from('fund_transactions')
      .insert(transactionData)
      .select()
      .single();

    if (transactionError) {
      throw new Error(`Failed to create fund transaction: ${transactionError.message}`);
    }

    // Log fund management activity
    await agent.logActivity(userId, 'fund_top_up_request', {
      amount,
      currency,
      method: topUpMethod,
      bonus_amount: bonusAmount,
      transaction_id: newTransaction.id,
      auto_top_up: autoTopUp
    });

    // Update fund management history in memory
    const updatedHistory = [
      ...fundHistory.slice(-14), // Keep last 14 entries
      {
        timestamp: new Date().toISOString(),
        action: 'top_up_request',
        amount,
        currency,
        method: topUpMethod,
        bonus_amount: bonusAmount,
        transaction_id: newTransaction.id
      }
    ];

    await memory.setMemory('top-up-funds-manager', userId, 'fund_history', updatedHistory);

    return {
      success: true,
      result: {
        fund_advice: fundManagementAdvice,
        transaction_details: {
          id: newTransaction.id,
          amount: amount,
          currency: currency,
          bonus_amount: bonusAmount,
          promotional_offer: promotionalOffer,
          status: 'pending'
        },
        optimization_recommendations: {
          auto_top_up_suggested: amount >= 50,
          bonus_opportunities: bonusAmount > 0,
          optimal_top_up_amount: Math.max(100, amount * 1.2), // Suggest 20% more for efficiency
          next_bonus_threshold: totalTopUps === 0 ? 'First bonus applied' : '5% bonus for amounts over $100'
        },
        current_balance_summary: {
          total_funds: userFunds?.reduce((sum, fund) => sum + (fund.current_amount || 0), 0) || 0,
          active_funds: userFunds?.length || 0,
          pending_amount: amount + bonusAmount
        }
      },
      memoryUpdates: {
        fund_history: updatedHistory
      }
    };

  } catch (error) {
    StructuredLogger.error('Top-up funds manager error', { error: error.message, userId });
    
    await agent.createAlert(userId, 'fund_top_up_error', 
      `Fund top-up failed: ${error.message}`, 'medium', {
        amount: params.amount,
        currency: params.currency,
        method: params.topUpMethod,
        error: error.message
      });

    return {
      success: false,
      error: error.message,
      result: null,
      memoryUpdates: {}
    };
  }
};