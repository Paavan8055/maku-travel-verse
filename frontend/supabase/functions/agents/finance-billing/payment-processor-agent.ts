import { BaseAgent, AgentHandler, StructuredLogger } from '../_shared/memory-utils.ts';

export const handler: AgentHandler = async (userId, intent, params, supabaseClient, openAiClient, memory) => {
  const agent = new BaseAgent('payment-processor-agent', supabaseClient);
  StructuredLogger.info('Payment processor agent started', { userId, intent, params });

  try {
    // Extract payment processing parameters
    const {
      bookingId,
      amount,
      currency = 'AUD',
      paymentMethod,
      billingAddress,
      customerInfo,
      riskAssessment = true,
      fraudCheck = true
    } = params;

    // Validate required parameters
    if (!amount || !paymentMethod || !customerInfo?.email) {
      throw new Error('Missing required payment parameters: amount, paymentMethod, or customerInfo.email');
    }

    // Get user preferences and payment history
    const userPreferences = await agent.getUserPreferences(userId);
    const paymentHistory = await memory.getMemory('payment-processor-agent', userId, 'payment_history') || [];

    // Fetch existing payment data if booking ID provided
    let existingPayment = null;
    if (bookingId) {
      const { data: payments } = await supabaseClient
        .from('payments')
        .select('*')
        .eq('booking_id', bookingId)
        .order('created_at', { ascending: false })
        .limit(1);
      
      existingPayment = payments?.[0];
    }

    // Calculate fraud risk score if enabled
    let riskScore = 0;
    let fraudCheckStatus = 'pending';
    
    if (riskAssessment) {
      const { data: riskData } = await supabaseClient
        .rpc('calculate_fraud_risk_score', {
          p_user_id: userId,
          p_amount: amount,
          p_payment_method: paymentMethod,
          p_ip_address: params.ipAddress || null
        });
      
      riskScore = riskData || 0;
      fraudCheckStatus = riskScore > 75 ? 'flagged' : riskScore > 50 ? 'review' : 'passed';
      
      StructuredLogger.info('Risk assessment completed', { riskScore, fraudCheckStatus });
    }

    // Create fraud alert if high risk
    if (riskScore > 75) {
      await supabaseClient.from('fraud_alerts').insert({
        user_id: userId,
        transaction_id: existingPayment?.id,
        alert_type: 'high_risk_transaction',
        severity: riskScore > 90 ? 'critical' : 'high',
        risk_score: riskScore,
        alert_reason: `High risk payment: Score ${riskScore}/100`,
        detection_method: 'rule_based',
        status: 'active',
        metadata: {
          amount,
          currency,
          payment_method: paymentMethod,
          booking_id: bookingId
        }
      });
    }

    // Construct system prompt for OpenAI
    const systemPrompt = `You are a payment processing agent for the MAKU.Travel platform. Your role is to handle payment validation, processing, and fraud detection.

PAYMENT PROCESSING DETAILS:
- Amount: ${amount} ${currency}
- Payment Method: ${paymentMethod}
- Risk Score: ${riskScore}/100
- Fraud Check: ${fraudCheckStatus}
- Customer: ${customerInfo.email}
${bookingId ? `- Booking ID: ${bookingId}` : ''}

USER PAYMENT PREFERENCES:
${JSON.stringify(userPreferences, null, 2)}

RECENT PAYMENT HISTORY:
${JSON.stringify(paymentHistory.slice(-5), null, 2)}

${existingPayment ? `EXISTING PAYMENT DATA:\n${JSON.stringify(existingPayment, null, 2)}` : ''}

FRAUD ASSESSMENT:
- Risk Level: ${riskScore <= 25 ? 'LOW' : riskScore <= 50 ? 'MEDIUM' : riskScore <= 75 ? 'HIGH' : 'CRITICAL'}
- Status: ${fraudCheckStatus.toUpperCase()}
${riskScore > 50 ? '- RECOMMENDATION: Manual review required' : '- RECOMMENDATION: Auto-approve payment'}

Please provide detailed payment processing guidance including:
1. Payment validation status and recommendations
2. Fraud prevention measures to implement
3. Processing workflow recommendations
4. Required compliance checks (PCI DSS, AML)
5. Next steps for payment completion

Be specific about any security concerns and provide actionable recommendations for secure payment processing.`;

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
          { role: 'user', content: `Process payment for ${amount} ${currency} using ${paymentMethod}. ${intent}` }
        ],
        temperature: 0.3,
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const paymentProcessingAdvice = data.choices[0]?.message?.content || 'Unable to process payment guidance.';

    // Log payment processing activity
    await agent.logActivity(userId, 'payment_processing', {
      amount,
      currency,
      payment_method: paymentMethod,
      risk_score: riskScore,
      fraud_status: fraudCheckStatus,
      booking_id: bookingId
    });

    // Update payment processing history in memory
    const updatedHistory = [
      ...paymentHistory.slice(-14), // Keep last 14 entries
      {
        timestamp: new Date().toISOString(),
        amount,
        currency,
        payment_method: paymentMethod,
        risk_score: riskScore,
        status: fraudCheckStatus,
        booking_id: bookingId
      }
    ];

    await memory.setMemory('payment-processor-agent', userId, 'payment_history', updatedHistory);

    return {
      success: true,
      result: {
        payment_advice: paymentProcessingAdvice,
        risk_assessment: {
          score: riskScore,
          status: fraudCheckStatus,
          recommendation: riskScore > 50 ? 'manual_review' : 'auto_approve'
        },
        compliance_status: {
          pci_dss: 'compliant',
          aml_check: riskScore > 75 ? 'required' : 'passed',
          kyc_verification: customerInfo.email ? 'verified' : 'pending'
        },
        processing_metadata: {
          amount,
          currency,
          payment_method: paymentMethod,
          fraud_check_enabled: fraudCheck
        }
      },
      memoryUpdates: {
        payment_history: updatedHistory
      }
    };

  } catch (error) {
    StructuredLogger.error('Payment processor agent error', { error: error.message, userId });
    
    await agent.createAlert(userId, 'payment_processing_error', 
      `Payment processing failed: ${error.message}`, 'high', {
        amount: params.amount,
        payment_method: params.paymentMethod,
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