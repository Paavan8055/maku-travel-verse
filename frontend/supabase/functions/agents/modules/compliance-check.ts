import { BaseAgent, AgentHandler } from '../_shared/memory-utils.ts';

export const handler: AgentHandler = async (userId, intent, params, supabaseClient, openAiClient, memory) => {
  const agent = new BaseAgent(supabaseClient, 'compliance-check');
  
  try {
    const { complianceType, dataToCheck, regulations, jurisdiction } = params;
    
    const complianceHistory = await memory.getMemory('compliance-check', userId, 'compliance_checks') || [];
    
    const systemPrompt = `You are a compliance verification agent for MAKU.Travel.
    
TASK: Perform comprehensive compliance checks against travel industry regulations.

COMPLIANCE REQUEST:
- Type: ${complianceType}
- Jurisdiction: ${jurisdiction}
- Regulations: ${JSON.stringify(regulations)}
- Data to Check: ${JSON.stringify(dataToCheck)}

COMPLIANCE HISTORY: ${JSON.stringify(complianceHistory.slice(-3))}

Verify compliance with:
1. GDPR and data protection laws
2. PCI DSS for payment processing
3. Travel industry regulations
4. Consumer protection laws
5. International travel requirements
6. Accessibility standards (ADA)
7. Anti-money laundering (AML)
8. Know Your Customer (KYC)

Provide:
- Compliance status (COMPLIANT/NON_COMPLIANT/REQUIRES_REVIEW)
- Specific violations found (if any)
- Required corrective actions
- Risk assessment
- Recommended next steps
- Documentation requirements

Be thorough and precise in compliance assessment.`;

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
    const complianceReport = aiResponse.choices[0]?.message?.content || 'Compliance check completed';

    // Determine compliance status
    const complianceStatus = dataToCheck.riskLevel === 'high' ? 'REQUIRES_REVIEW' :
                           dataToCheck.violations > 0 ? 'NON_COMPLIANT' : 'COMPLIANT';

    await agent.logActivity(userId, 'compliance_check_performed', { complianceType, status: complianceStatus });
    
    // Update compliance history
    const updatedComplianceHistory = [
      ...complianceHistory.slice(-4),
      {
        complianceType,
        status: complianceStatus,
        jurisdiction,
        report: complianceReport.substring(0, 500),
        timestamp: new Date().toISOString()
      }
    ];
    
    await memory.setMemory('compliance-check', userId, 'compliance_checks', updatedComplianceHistory);

    return {
      success: true,
      result: {
        complianceStatus,
        complianceReport,
        violationsFound: complianceStatus === 'NON_COMPLIANT' ? 'Detailed in report' : 'None',
        correctiveActions: complianceStatus !== 'COMPLIANT' ? 'Required - see report' : 'None required',
        riskLevel: complianceStatus === 'NON_COMPLIANT' ? 'HIGH' : 'LOW'
      }
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
};