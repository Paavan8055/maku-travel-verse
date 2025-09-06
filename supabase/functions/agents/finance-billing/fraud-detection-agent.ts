import { BaseAgent, AgentHandler, StructuredLogger } from '../_shared/memory-utils.ts';

export const handler: AgentHandler = async (userId, intent, params, supabaseClient, openAiClient, memory) => {
  const agent = new BaseAgent('fraud-detection-agent', supabaseClient);
  StructuredLogger.info('Fraud detection agent started', { userId, intent, params });

  try {
    // Extract fraud detection parameters
    const {
      transactionId,
      amount,
      currency = 'AUD',
      paymentMethod,
      ipAddress,
      userAgent,
      geoLocation,
      transactionType = 'payment',
      alertThreshold = 50,
      autoBlock = false,
      investigationLevel = 'standard'
    } = params;

    // Validate required parameters
    if (!transactionId && !amount) {
      throw new Error('Either transaction ID or amount must be provided for fraud detection');
    }

    // Get user preferences and fraud history
    const userPreferences = await agent.getUserPreferences(userId);
    const fraudHistory = await memory.getMemory('fraud-detection-agent', userId, 'fraud_history') || [];

    // Fetch transaction details if transaction ID provided
    let transactionDetails = null;
    if (transactionId) {
      const { data: payment } = await supabaseClient
        .from('payments')
        .select('*')
        .eq('id', transactionId)
        .single();
      
      transactionDetails = payment;
    }

    // Fetch user's transaction history for pattern analysis
    const { data: recentTransactions } = await supabaseClient
      .from('payments')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(50);

    // Fetch existing fraud alerts for this user
    const { data: existingAlerts } = await supabaseClient
      .from('fraud_alerts')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(10);

    // Calculate comprehensive risk score
    const { data: baseRiskScore } = await supabaseClient
      .rpc('calculate_fraud_risk_score', {
        p_user_id: userId,
        p_amount: amount || transactionDetails?.amount || 0,
        p_payment_method: paymentMethod || transactionDetails?.payment_method || 'unknown',
        p_ip_address: ipAddress || null
      });

    let riskScore = baseRiskScore || 0;

    // Enhanced fraud pattern detection
    const fraudPatterns = {
      velocity_anomaly: false,
      amount_anomaly: false,
      geo_anomaly: false,
      device_anomaly: false,
      time_anomaly: false,
      pattern_anomaly: false
    };

    // Velocity check - multiple transactions in short time
    const recentCount = recentTransactions?.filter(t => 
      new Date(t.created_at) > new Date(Date.now() - 60 * 60 * 1000) // Last hour
    ).length || 0;
    
    if (recentCount > 5) {
      fraudPatterns.velocity_anomaly = true;
      riskScore += 20;
    }

    // Amount anomaly - significantly higher than usual
    const avgAmount = recentTransactions?.reduce((sum, t) => sum + (t.amount || 0), 0) / (recentTransactions?.length || 1);
    const currentAmount = amount || transactionDetails?.amount || 0;
    
    if (currentAmount > avgAmount * 5) {
      fraudPatterns.amount_anomaly = true;
      riskScore += 15;
    }

    // Time anomaly - transaction at unusual hours
    const currentHour = new Date().getHours();
    if (currentHour < 6 || currentHour > 23) {
      fraudPatterns.time_anomaly = true;
      riskScore += 10;
    }

    // Existing alerts increase risk
    if (existingAlerts && existingAlerts.length > 0) {
      riskScore += existingAlerts.length * 5;
    }

    // Determine alert severity
    let severity = 'low';
    if (riskScore >= 75) severity = 'critical';
    else if (riskScore >= 50) severity = 'high';
    else if (riskScore >= 25) severity = 'medium';

    // Create fraud alert if threshold exceeded
    let newAlert = null;
    if (riskScore >= alertThreshold) {
      const alertData = {
        user_id: userId,
        transaction_id: transactionId,
        alert_type: 'automated_fraud_detection',
        severity: severity,
        risk_score: riskScore,
        alert_reason: `Automated fraud detection: Risk score ${riskScore}/100`,
        detection_method: 'ml_model',
        status: autoBlock && riskScore >= 75 ? 'blocked' : 'active',
        metadata: {
          fraud_patterns: fraudPatterns,
          transaction_details: {
            amount: currentAmount,
            currency: currency,
            payment_method: paymentMethod,
            transaction_type: transactionType
          },
          detection_context: {
            ip_address: ipAddress,
            user_agent: userAgent,
            geo_location: geoLocation,
            recent_transaction_count: recentCount,
            avg_transaction_amount: avgAmount
          }
        },
        ip_address: ipAddress,
        user_agent: userAgent
      };

      const { data: alert, error: alertError } = await supabaseClient
        .from('fraud_alerts')
        .insert(alertData)
        .select()
        .single();

      if (alertError) {
        StructuredLogger.error('Failed to create fraud alert', { error: alertError.message });
      } else {
        newAlert = alert;
      }
    }

    // Construct system prompt for OpenAI
    const systemPrompt = `You are a fraud detection and security agent for MAKU.Travel. Your role is to analyze transaction patterns, detect suspicious activities, and recommend security measures.

FRAUD ANALYSIS REQUEST:
- Risk Score: ${riskScore}/100
- Severity Level: ${severity.toUpperCase()}
- Alert Threshold: ${alertThreshold}
- Auto-Block Enabled: ${autoBlock}
${transactionId ? `- Transaction ID: ${transactionId}` : ''}

TRANSACTION DETAILS:
- Amount: ${currentAmount} ${currency}
- Type: ${transactionType}
- Payment Method: ${paymentMethod || 'unknown'}
- Average User Amount: ${avgAmount.toFixed(2)} ${currency}

FRAUD PATTERN ANALYSIS:
${JSON.stringify(fraudPatterns, null, 2)}

RECENT TRANSACTION ACTIVITY:
- Transactions in last hour: ${recentCount}
- Total recent transactions: ${recentTransactions?.length || 0}
- Active fraud alerts: ${existingAlerts?.length || 0}

EXISTING FRAUD ALERTS:
${JSON.stringify(existingAlerts || [], null, 2)}

USER SECURITY PROFILE:
${JSON.stringify(userPreferences, null, 2)}

FRAUD DETECTION HISTORY:
${JSON.stringify(fraudHistory.slice(-5), null, 2)}

DETECTION CONTEXT:
- IP Address: ${ipAddress || 'Not provided'}
- User Agent: ${userAgent || 'Not provided'}
- Geo Location: ${geoLocation ? JSON.stringify(geoLocation) : 'Not provided'}
- Investigation Level: ${investigationLevel}

Please provide comprehensive fraud analysis including:
1. Detailed risk assessment and threat analysis
2. Specific security recommendations and protective measures
3. Investigation priorities and next steps
4. User communication strategy (if applicable)
5. System security enhancements to prevent similar fraud
6. Compliance and reporting requirements

Be specific about the fraud patterns detected and provide actionable security recommendations.`;

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
          { role: 'user', content: `Analyze fraud risk for transaction. ${intent}` }
        ],
        temperature: 0.1,
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const fraudAnalysis = data.choices[0]?.message?.content || 'Unable to generate fraud analysis.';

    // Log fraud detection activity
    await agent.logActivity(userId, 'fraud_detection_analysis', {
      transaction_id: transactionId,
      risk_score: riskScore,
      severity: severity,
      alert_created: !!newAlert,
      patterns_detected: Object.values(fraudPatterns).some(p => p),
      amount: currentAmount,
      currency: currency
    });

    // Update fraud detection history in memory
    const updatedHistory = [
      ...fraudHistory.slice(-19), // Keep last 19 entries
      {
        timestamp: new Date().toISOString(),
        transaction_id: transactionId,
        risk_score: riskScore,
        severity: severity,
        patterns_detected: fraudPatterns,
        alert_created: !!newAlert,
        amount: currentAmount
      }
    ];

    await memory.setMemory('fraud-detection-agent', userId, 'fraud_history', updatedHistory);

    return {
      success: true,
      result: {
        fraud_analysis: fraudAnalysis,
        risk_assessment: {
          score: riskScore,
          severity: severity,
          threshold_exceeded: riskScore >= alertThreshold,
          auto_blocked: autoBlock && riskScore >= 75
        },
        fraud_patterns: fraudPatterns,
        security_recommendations: {
          immediate_action: riskScore >= 75 ? 'block_transaction' : riskScore >= 50 ? 'manual_review' : 'monitor',
          investigation_priority: severity === 'critical' ? 'urgent' : severity === 'high' ? 'high' : 'standard',
          user_notification: riskScore >= 50,
          additional_verification: riskScore >= 25
        },
        alert_details: newAlert ? {
          id: newAlert.id,
          severity: newAlert.severity,
          status: newAlert.status,
          created_at: newAlert.created_at
        } : null,
        transaction_context: {
          amount: currentAmount,
          currency: currency,
          payment_method: paymentMethod,
          recent_activity_level: recentCount > 3 ? 'high' : recentCount > 1 ? 'medium' : 'low'
        }
      },
      memoryUpdates: {
        fraud_history: updatedHistory
      }
    };

  } catch (error) {
    StructuredLogger.error('Fraud detection agent error', { error: error.message, userId });
    
    await agent.createAlert(userId, 'fraud_detection_error', 
      `Fraud detection analysis failed: ${error.message}`, 'high', {
        transaction_id: params.transactionId,
        amount: params.amount,
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
