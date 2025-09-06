import { BaseAgent, AgentHandler } from '../_shared/memory-utils.ts';

export const handler: AgentHandler = async (userId, intent, params, supabaseClient, openAiClient, memory) => {
  const agent = new BaseAgent(supabaseClient, 'currency-converter');
  
  try {
    const { 
      fromCurrency = 'USD',
      toCurrency = 'AUD',
      amount = 1000,
      purpose = 'travel_budget', // travel_budget, payment_conversion, cost_comparison
      trackRates = false
    } = params;

    const userPrefs = await agent.getUserPreferences(userId);
    const conversionHistory = await memory?.getMemory('currency-converter', userId, 'conversion_history') || [];

    const systemPrompt = `You are a currency conversion specialist for MAKU Travel.
    
    CURRENCY CONVERSION REQUEST:
    - From currency: ${fromCurrency}
    - To currency: ${toCurrency}
    - Amount: ${amount}
    - Purpose: ${purpose}
    - Track rates: ${trackRates}
    
    USER PREFERENCES: ${JSON.stringify(userPrefs)}
    CONVERSION HISTORY: ${JSON.stringify(conversionHistory)}

    Provide comprehensive currency information including:
    1. Current exchange rate and converted amount
    2. Rate comparison with historical data (7-day, 30-day)
    3. Rate trend analysis and predictions
    4. Best time to convert recommendations
    5. Exchange fees and margin considerations
    6. Local purchasing power and cost comparison
    7. ATM and cash withdrawal fees abroad
    8. Credit card vs cash conversion rates
    9. Digital payment options and rates
    10. Currency hedging strategies for large amounts
    11. Multi-currency account recommendations
    12. Rate alert setup for favorable conversions
    
    Include practical advice for travelers on currency management.
    Provide specific recommendations based on the conversion purpose.`;

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
          { role: 'user', content: `Convert ${amount} ${fromCurrency} to ${toCurrency} for ${purpose}` }
        ],
        max_completion_tokens: 1200
      }),
    });

    const aiResponse = await response.json();
    const conversionInfo = aiResponse.choices[0]?.message?.content;

    await agent.logActivity(userId, 'currency_converted', {
      fromCurrency,
      toCurrency,
      amount,
      purpose
    });

    const updatedConversionHistory = [...conversionHistory, {
      fromCurrency,
      toCurrency,
      amount,
      purpose,
      convertedAt: new Date().toISOString()
    }].slice(-25);

    return {
      success: true,
      result: {
        conversionInfo,
        fromCurrency,
        toCurrency,
        originalAmount: amount,
        purpose,
        rateTracking: trackRates ? 'Rate alerts configured' : 'One-time conversion'
      },
      memoryUpdates: [
        {
          key: 'conversion_history',
          data: updatedConversionHistory,
          expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString()
        }
      ]
    };

  } catch (error) {
    console.error('Currency converter error:', error);
    return {
      success: false,
      error: error.message || 'Failed to convert currency'
    };
  }
};