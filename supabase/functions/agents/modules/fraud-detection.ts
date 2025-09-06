import { BaseAgent, AgentHandler } from '../_shared/memory-utils.ts';

export const handler: AgentHandler = async (userId, intent, params, supabaseClient, openAiClient, memory) => {
  const agent = new BaseAgent(supabaseClient, 'fraud-detection');
  
  try {
    const { transactionData, userProfile, riskFactors, paymentMethod } = params;
    
    const fraudHistory = await memory.getMemory('fraud-detection', userId, 'fraud_analysis') || [];
    
    // Analyze transaction patterns
    const riskScore = calculateRiskScore(transactionData, userProfile, riskFactors);
    
    const systemPrompt = `You are an advanced fraud detection agent for MAKU.Travel.
    
TASK: Analyze transaction for potential fraud indicators.

TRANSACTION DATA: ${JSON.stringify(transactionData)}
USER PROFILE: ${JSON.stringify(userProfile)}
RISK FACTORS: ${JSON.stringify(riskFactors)}
PAYMENT METHOD: ${paymentMethod}
CALCULATED RISK SCORE: ${riskScore}/100
FRAUD HISTORY: ${JSON.stringify(fraudHistory.slice(-3))}

Analyze for:
1. Unusual booking patterns
2. Payment anomalies
3. Geographic inconsistencies
4. Velocity checks
5. Device fingerprinting
6. Behavioral analysis

Provide:
- Risk assessment (LOW/MEDIUM/HIGH/CRITICAL)
- Specific fraud indicators found
- Recommended actions
- Additional verification steps if needed

Be thorough and security-focused.`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAiClient}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-5-2025-08-07',
        messages: [{ role: 'system', content: systemPrompt }],
        max_completion_tokens: 1500
      }),
    });

    const aiResponse = await response.json();
    const fraudAnalysis = aiResponse.choices[0]?.message?.content || 'Fraud analysis completed';

    // Determine final risk level
    const riskLevel = riskScore >= 80 ? 'CRITICAL' :
                     riskScore >= 60 ? 'HIGH' :
                     riskScore >= 40 ? 'MEDIUM' : 'LOW';

    await agent.logActivity(userId, 'fraud_analysis_performed', { riskScore, riskLevel });
    
    // Update fraud analysis memory
    const updatedFraudHistory = [
      ...fraudHistory.slice(-4),
      {
        riskScore,
        riskLevel,
        analysis: fraudAnalysis.substring(0, 500),
        timestamp: new Date().toISOString(),
        transactionId: transactionData.id
      }
    ];
    
    await memory.setMemory('fraud-detection', userId, 'fraud_analysis', updatedFraudHistory);

    return {
      success: true,
      result: {
        riskLevel,
        riskScore,
        fraudAnalysis,
        recommendedActions: riskLevel === 'CRITICAL' ? ['BLOCK_TRANSACTION', 'MANUAL_REVIEW'] :
                           riskLevel === 'HIGH' ? ['ADDITIONAL_VERIFICATION', 'MANUAL_REVIEW'] :
                           riskLevel === 'MEDIUM' ? ['ENHANCED_MONITORING'] : ['APPROVE'],
        requiresManualReview: riskScore >= 60
      }
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

function calculateRiskScore(transactionData: any, userProfile: any, riskFactors: any): number {
  let score = 0;
  
  // High amount transactions
  if (transactionData.amount > 10000) score += 30;
  else if (transactionData.amount > 5000) score += 20;
  else if (transactionData.amount > 2000) score += 10;
  
  // New user risk
  if (userProfile.accountAge < 30) score += 25;
  else if (userProfile.accountAge < 90) score += 15;
  
  // Geographic risk
  if (riskFactors.unusualLocation) score += 20;
  if (riskFactors.vpnDetected) score += 15;
  
  // Payment method risk
  if (riskFactors.newPaymentMethod) score += 15;
  if (riskFactors.failedPayments > 2) score += 25;
  
  // Velocity risk
  if (riskFactors.rapidBookings) score += 20;
  
  return Math.min(score, 100);
}