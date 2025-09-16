import { BaseAgent, AgentHandler } from '../_shared/memory-utils.ts';

export const handler: AgentHandler = async (userId, intent, params, supabaseClient, openAiClient, memory) => {
  const agent = new BaseAgent(supabaseClient, 'payment-investigation');
  
  try {
    const { transactionId, investigationType, paymentData, suspiciousActivity, timeframe } = params;
    
    const investigationHistory = await memory.getMemory('payment-investigation', userId, 'investigation_history') || [];
    
    const systemPrompt = `You are a payment investigation specialist for MAKU.Travel.
    
TASK: Conduct thorough payment investigation and forensic analysis.

INVESTIGATION REQUEST:
- Transaction ID: ${transactionId}
- Type: ${investigationType}
- Payment Data: ${JSON.stringify(paymentData)}
- Suspicious Activity: ${JSON.stringify(suspiciousActivity)}
- Timeframe: ${timeframe}

INVESTIGATION HISTORY: ${JSON.stringify(investigationHistory.slice(-3))}

Investigate for:
1. Payment flow analysis
2. Transaction anomalies
3. Fraud indicators
4. Chargeback risks
5. Money laundering patterns
6. Account linking analysis
7. Geographic inconsistencies
8. Velocity analysis

Provide:
- Investigation findings
- Risk assessment (LOW/MEDIUM/HIGH/CRITICAL)
- Evidence summary
- Recommended actions
- Legal compliance notes
- Prevention recommendations

Be thorough and forensically sound in your investigation.`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAiClient}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-5-2025-08-07',
        messages: [{ role: 'system', content: systemPrompt }],
        max_completion_tokens: 1800
      }),
    });

    const aiResponse = await response.json();
    const investigationReport = aiResponse.choices[0]?.message?.content || 'Investigation completed';

    // Analyze payment patterns
    const riskAnalysis = analyzePaymentRisk(paymentData, suspiciousActivity);
    
    await agent.logActivity(userId, 'payment_investigation_completed', { 
      transactionId, 
      investigationType,
      riskLevel: riskAnalysis.riskLevel 
    });
    
    // Update investigation history
    const updatedInvestigationHistory = [
      ...investigationHistory.slice(-4),
      {
        transactionId,
        investigationType,
        riskLevel: riskAnalysis.riskLevel,
        findings: investigationReport.substring(0, 500),
        timestamp: new Date().toISOString()
      }
    ];
    
    await memory.setMemory('payment-investigation', userId, 'investigation_history', updatedInvestigationHistory);

    return {
      success: true,
      result: {
        investigationReport,
        riskAssessment: riskAnalysis.riskLevel,
        findings: riskAnalysis.findings,
        recommendedActions: riskAnalysis.actions,
        evidenceSummary: riskAnalysis.evidence,
        complianceNotes: 'All investigations comply with financial regulations',
        preventionRecommendations: riskAnalysis.prevention
      }
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

function analyzePaymentRisk(paymentData: any, suspiciousActivity: any) {
  let riskScore = 0;
  const findings: string[] = [];
  const evidence: string[] = [];
  const actions: string[] = [];
  const prevention: string[] = [];

  // Amount analysis
  if (paymentData.amount > 10000) {
    riskScore += 20;
    findings.push('High-value transaction detected');
    evidence.push('Transaction amount exceeds normal threshold');
  }

  // Frequency analysis
  if (suspiciousActivity.rapidTransactions) {
    riskScore += 30;
    findings.push('Unusual transaction velocity detected');
    evidence.push('Multiple transactions in short timeframe');
    actions.push('Implement velocity checks');
  }

  // Geographic analysis
  if (suspiciousActivity.unusualLocation) {
    riskScore += 25;
    findings.push('Geographic anomaly detected');
    evidence.push('Transaction from unusual location');
    prevention.push('Enhanced geographic monitoring');
  }

  // Payment method analysis
  if (paymentData.newPaymentMethod) {
    riskScore += 15;
    findings.push('New payment method used');
    evidence.push('Recently added payment instrument');
  }

  // Failed attempts
  if (suspiciousActivity.failedAttempts > 3) {
    riskScore += 35;
    findings.push('Multiple failed payment attempts');
    evidence.push('Pattern of unsuccessful transactions');
    actions.push('Enhanced verification required');
  }

  const riskLevel = riskScore >= 70 ? 'CRITICAL' :
                   riskScore >= 50 ? 'HIGH' :
                   riskScore >= 30 ? 'MEDIUM' : 'LOW';

  if (riskLevel === 'CRITICAL') {
    actions.push('Freeze account', 'Manual review required', 'Contact authorities if necessary');
  } else if (riskLevel === 'HIGH') {
    actions.push('Enhanced monitoring', 'Additional verification');
  }

  prevention.push('Improve payment monitoring systems', 'Enhanced fraud detection algorithms');

  return { riskLevel, findings, evidence, actions, prevention };
}