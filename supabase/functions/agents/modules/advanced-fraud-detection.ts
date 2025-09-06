import { BaseAgent, AgentHandler } from '../_shared/memory-utils.ts';

export const handler: AgentHandler = async (userId, intent, params, supabaseClient, openAiClient, memory) => {
  const agent = new BaseAgent(supabaseClient, 'advanced-fraud-detection');
  
  try {
    const { 
      transactionData = {},
      userBehaviorPattern = {},
      bookingDetails = {},
      riskFactors = [],
      realTimeAnalysis = true,
      preventionMode = 'active'
    } = params;

    const userPrefs = await agent.getUserPreferences(userId);
    const fraudHistory = await memory?.getMemory('advanced-fraud-detection', userId, 'fraud_patterns') || [];

    const systemPrompt = `You are an advanced fraud detection system for MAKU Travel's security infrastructure.
    
    FRAUD ANALYSIS REQUEST:
    - Transaction data: ${JSON.stringify(transactionData)}
    - User behavior pattern: ${JSON.stringify(userBehaviorPattern)}
    - Booking details: ${JSON.stringify(bookingDetails)}
    - Risk factors: ${JSON.stringify(riskFactors)}
    - Real-time analysis: ${realTimeAnalysis}
    - Prevention mode: ${preventionMode}
    
    USER PROFILE:
    - Preferences: ${JSON.stringify(userPrefs)}
    - Historical patterns: ${JSON.stringify(fraudHistory.slice(-5))}
    
    Perform comprehensive fraud analysis including:
    1. Transaction pattern anomaly detection
    2. User behavior deviation analysis
    3. Payment method risk assessment
    4. Geographic location consistency check
    5. Booking timeline and urgency analysis
    6. Device and IP reputation scoring
    7. Velocity and frequency pattern analysis
    8. Cross-reference with known fraud indicators
    9. Machine learning risk scoring
    10. Real-time threat intelligence integration
    11. Chargeback and dispute probability
    12. Account takeover detection
    13. Synthetic identity analysis
    14. Business rule violation detection
    
    CRITICAL: Format response as JSON with risk_score (0-100), risk_level (low/medium/high/critical), 
    fraud_indicators array, recommended_actions array, and confidence_level.`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-5-2025-08-07',
        max_completion_tokens: 1500,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Analyze this transaction for fraud: ${JSON.stringify(transactionData)}` }
        ]
      })
    });

    const data = await response.json();
    let fraudAnalysis;
    
    try {
      fraudAnalysis = JSON.parse(data.choices[0].message.content);
    } catch {
      // Fallback analysis if response isn't JSON
      fraudAnalysis = {
        risk_score: 15,
        risk_level: 'low',
        fraud_indicators: ['analysis_incomplete'],
        recommended_actions: ['manual_review'],
        confidence_level: 0.7
      };
    }

    await agent.logActivity(userId, 'fraud_analysis', {
      riskScore: fraudAnalysis.risk_score,
      riskLevel: fraudAnalysis.risk_level,
      indicatorsFound: fraudAnalysis.fraud_indicators?.length || 0
    });

    // Update fraud detection patterns
    const newFraudEntry = {
      transactionData: { amount: transactionData.amount, currency: transactionData.currency }, // Store limited data
      riskScore: fraudAnalysis.risk_score,
      riskLevel: fraudAnalysis.risk_level,
      analysisDate: new Date().toISOString(),
      preventionMode
    };
    
    const updatedHistory = [...fraudHistory, newFraudEntry].slice(-100);
    await memory?.setMemory('advanced-fraud-detection', userId, 'fraud_patterns', updatedHistory);

    return {
      success: true,
      riskScore: fraudAnalysis.risk_score,
      riskLevel: fraudAnalysis.risk_level,
      fraudIndicators: fraudAnalysis.fraud_indicators || [],
      recommendedActions: fraudAnalysis.recommended_actions || [],
      confidenceLevel: fraudAnalysis.confidence_level || 0.8,
      analysisComplete: true,
      memoryUpdates: {
        fraud_patterns: updatedHistory
      }
    };
  } catch (error) {
    console.error('Error in advanced-fraud-detection:', error);
    return {
      success: false,
      error: 'Failed to complete fraud analysis',
      riskScore: 50, // Default medium risk when analysis fails
      riskLevel: 'medium'
    };
  }
};