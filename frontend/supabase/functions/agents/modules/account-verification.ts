import { BaseAgent, AgentHandler } from '../_shared/memory-utils.ts';

export const handler: AgentHandler = async (userId, intent, params, supabaseClient, openAiClient, memory) => {
  const agent = new BaseAgent(supabaseClient, 'account-verification');
  
  try {
    const { verificationType, documentData, userInfo, riskFactors } = params;
    
    const verificationHistory = await memory.getMemory('account-verification', userId, 'verification_history') || [];
    
    const systemPrompt = `You are an account verification specialist for MAKU.Travel.
    
TASK: Perform comprehensive account verification procedures.

VERIFICATION REQUEST:
- Type: ${verificationType}
- User Information: ${JSON.stringify(userInfo)}
- Document Data: ${JSON.stringify(documentData)}
- Risk Factors: ${JSON.stringify(riskFactors)}

VERIFICATION HISTORY: ${JSON.stringify(verificationHistory.slice(-3))}

Perform verification for:
1. Identity document validation
2. Address verification
3. Payment method verification
4. Phone number verification
5. Email verification
6. Biometric verification (if applicable)
7. Risk assessment
8. Compliance checks

Provide:
- Verification status (VERIFIED/PENDING/REJECTED)
- Confidence score (0-100)
- Issues found (if any)
- Additional verification steps needed
- Risk assessment
- Compliance status

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
    const verificationResult = aiResponse.choices[0]?.message?.content || 'Verification completed';

    // Calculate confidence score based on verification type and data quality
    const confidenceScore = calculateConfidenceScore(verificationType, documentData, riskFactors);
    
    const verificationStatus = confidenceScore >= 90 ? 'VERIFIED' :
                             confidenceScore >= 70 ? 'PENDING' : 'REJECTED';

    await agent.logActivity(userId, 'account_verification_performed', { 
      verificationType, 
      status: verificationStatus,
      confidenceScore 
    });
    
    // Update verification history
    const updatedVerificationHistory = [
      ...verificationHistory.slice(-4),
      {
        verificationType,
        status: verificationStatus,
        confidenceScore,
        result: verificationResult.substring(0, 500),
        timestamp: new Date().toISOString()
      }
    ];
    
    await memory.setMemory('account-verification', userId, 'verification_history', updatedVerificationHistory);

    return {
      success: true,
      result: {
        verificationStatus,
        confidenceScore,
        verificationResult,
        nextSteps: verificationStatus === 'PENDING' ? 'Additional documentation required' :
                  verificationStatus === 'REJECTED' ? 'Manual review initiated' :
                  'Account fully verified',
        additionalRequirements: verificationStatus !== 'VERIFIED' ? ['Manual review', 'Additional documents'] : []
      }
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

function calculateConfidenceScore(verificationType: string, documentData: any, riskFactors: any): number {
  let score = 50; // Base score
  
  // Document quality
  if (documentData.documentQuality === 'high') score += 30;
  else if (documentData.documentQuality === 'medium') score += 20;
  else score += 10;
  
  // Verification type complexity
  if (verificationType === 'identity') score += 20;
  else if (verificationType === 'address') score += 15;
  else if (verificationType === 'payment') score += 25;
  
  // Risk factors
  if (riskFactors.newAccount) score -= 10;
  if (riskFactors.unusualActivity) score -= 15;
  if (riskFactors.vpnUsage) score -= 5;
  
  // Document consistency
  if (documentData.dataConsistency === 'high') score += 15;
  else if (documentData.dataConsistency === 'low') score -= 10;
  
  return Math.max(0, Math.min(100, score));
}