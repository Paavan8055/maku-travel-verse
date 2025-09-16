import { BaseAgent, AgentHandler } from '../_shared/memory-utils.ts';

export const handler: AgentHandler = async (userId, intent, params, supabaseClient, openAiClient, memory) => {
  const agent = new BaseAgent(supabaseClient, 'dispute-resolution');
  
  try {
    const { disputeType, disputeDetails, customerClaim, evidenceProvided, bookingReference } = params;
    
    const disputeHistory = await memory.getMemory('dispute-resolution', userId, 'dispute_history') || [];
    const userPreferences = await agent.getUserPreferences(userId);
    
    const systemPrompt = `You are a dispute resolution specialist for MAKU.Travel.
    
TASK: Analyze and resolve customer disputes fairly and efficiently.

DISPUTE DETAILS:
- Type: ${disputeType}
- Booking Reference: ${bookingReference}
- Customer Claim: ${customerClaim}
- Details: ${JSON.stringify(disputeDetails)}
- Evidence Provided: ${JSON.stringify(evidenceProvided)}

USER PREFERENCES: ${JSON.stringify(userPreferences)}
DISPUTE HISTORY: ${JSON.stringify(disputeHistory.slice(-3))}

Analyze dispute for:
1. Validity of customer claim
2. Evidence assessment
3. Policy compliance
4. Contractual obligations
5. Industry standards
6. Fair resolution options
7. Compensation calculations
8. Prevention recommendations

Provide:
- Dispute assessment (VALID/INVALID/PARTIAL)
- Resolution recommendation
- Compensation amount (if applicable)
- Timeline for resolution
- Communication strategy
- Learning points for prevention

Be fair, thorough, and customer-focused while protecting business interests.`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAiClient}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-5-2025-08-07',
        messages: [{ role: 'system', content: systemPrompt }],
        max_completion_tokens: 2000
      }),
    });

    const aiResponse = await response.json();
    const resolutionAnalysis = aiResponse.choices[0]?.message?.content || 'Dispute analysis completed';

    // Determine dispute validity and resolution
    const disputeAssessment = assessDispute(disputeType, disputeDetails, evidenceProvided);
    const compensationAmount = calculateCompensation(disputeType, disputeDetails, disputeAssessment);

    await agent.logActivity(userId, 'dispute_resolution_processed', { 
      disputeType, 
      assessment: disputeAssessment.validity,
      compensationAmount 
    });
    
    // Update dispute history
    const updatedDisputeHistory = [
      ...disputeHistory.slice(-4),
      {
        disputeType,
        bookingReference,
        assessment: disputeAssessment.validity,
        compensationAmount,
        resolution: resolutionAnalysis.substring(0, 500),
        timestamp: new Date().toISOString()
      }
    ];
    
    await memory.setMemory('dispute-resolution', userId, 'dispute_history', updatedDisputeHistory);

    return {
      success: true,
      result: {
        disputeAssessment: disputeAssessment.validity,
        resolutionAnalysis,
        compensationAmount,
        resolutionTimeline: disputeAssessment.timeline,
        nextSteps: disputeAssessment.nextSteps,
        communicationPlan: disputeAssessment.communicationPlan,
        preventionRecommendations: disputeAssessment.prevention
      }
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

function assessDispute(disputeType: string, details: any, evidence: any) {
  let validity = 'PARTIAL';
  let timeline = '5-7 business days';
  let nextSteps = ['Review evidence', 'Contact customer', 'Provide resolution'];
  let communicationPlan = 'Empathetic and professional communication';
  let prevention = ['Improve booking process clarity'];

  switch (disputeType) {
    case 'booking_error':
      validity = evidence.screenshot ? 'VALID' : 'PARTIAL';
      timeline = evidence.screenshot ? '2-3 business days' : '5-7 business days';
      prevention = ['Enhance booking confirmation process', 'Improve UI clarity'];
      break;
    
    case 'service_failure':
      validity = evidence.serviceReport ? 'VALID' : 'PARTIAL';
      timeline = '7-10 business days';
      prevention = ['Partner quality monitoring', 'Service standards enforcement'];
      break;
    
    case 'payment_issue':
      validity = evidence.bankStatement ? 'VALID' : 'INVALID';
      timeline = '3-5 business days';
      prevention = ['Payment system audit', 'Better error handling'];
      break;
    
    case 'cancellation_policy':
      validity = 'PARTIAL'; // Depends on specific terms
      timeline = '5-7 business days';
      prevention = ['Clearer policy communication', 'Flexible options'];
      break;
  }

  return { validity, timeline, nextSteps, communicationPlan, prevention };
}

function calculateCompensation(disputeType: string, details: any, assessment: any): number {
  if (assessment.validity === 'INVALID') return 0;
  
  const baseAmount = details.bookingAmount || 0;
  let compensationRate = 0;

  switch (disputeType) {
    case 'booking_error':
      compensationRate = assessment.validity === 'VALID' ? 1.0 : 0.5; // Full refund or 50%
      break;
    case 'service_failure':
      compensationRate = assessment.validity === 'VALID' ? 0.3 : 0.1; // 30% or 10%
      break;
    case 'payment_issue':
      compensationRate = 1.0; // Full refund for payment issues
      break;
    case 'cancellation_policy':
      compensationRate = 0.2; // 20% goodwill gesture
      break;
    default:
      compensationRate = 0.1;
  }

  return Math.round(baseAmount * compensationRate);
}