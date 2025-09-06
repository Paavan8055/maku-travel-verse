import { BaseAgent, AgentHandler } from '../_shared/memory-utils.ts';
import { StripeClient } from '../_shared/api-clients.ts';

export const handler: AgentHandler = async (userId, intent, params, supabaseClient, openAiClient, memory) => {
  const agent = new BaseAgent(supabaseClient, 'payment-helper');
  
  try {
    const { 
      issue = 'general_inquiry', // general_inquiry, payment_failed, refund_request, currency_question
      paymentMethod = null,
      amount = null,
      currency = 'AUD',
      bookingId = null
    } = params;

    const userPrefs = await agent.getUserPreferences(userId);
    const paymentHistory = await memory?.getMemory('payment-helper', userId, 'payment_assistance') || [];

    // Get recent payment data if bookingId provided
    let paymentData = null;
    if (bookingId) {
      const { data } = await supabaseClient
        .from('payments')
        .select('*')
        .eq('booking_id', bookingId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      paymentData = data;
    }

    const systemPrompt = `You are a payment assistance specialist for MAKU Travel.
    
    PAYMENT ASSISTANCE REQUEST:
    - Issue type: ${issue}
    - Payment method: ${paymentMethod || 'Not specified'}
    - Amount: ${amount ? `${amount} ${currency}` : 'Not specified'}
    - Booking ID: ${bookingId || 'Not provided'}
    
    PAYMENT DATA: ${paymentData ? JSON.stringify(paymentData) : 'No specific payment data'}
    USER PREFERENCES: ${JSON.stringify(userPrefs)}
    ASSISTANCE HISTORY: ${JSON.stringify(paymentHistory)}

    Provide comprehensive payment assistance including:
    1. Issue diagnosis and root cause analysis
    2. Step-by-step resolution instructions
    3. Alternative payment methods available
    4. Currency conversion and fees explanation
    5. Payment security and protection measures
    6. Refund process and timeline expectations
    7. Dispute resolution procedures
    8. Payment plan options if applicable
    9. International payment considerations
    10. Mobile payment and digital wallet options
    11. Bank transfer and wire instructions
    12. Payment confirmation and receipt details
    
    Provide specific troubleshooting steps and expected timelines.
    Include contact information for escalation if needed.`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-5-2025-08-07',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Help resolve payment issue: ${issue}` }
        ],
        max_completion_tokens: 2000
      }),
    });

    const aiResponse = await response.json();
    const paymentAssistance = aiResponse.choices[0]?.message?.content;

    await agent.logActivity(userId, 'payment_assistance_provided', {
      issue,
      paymentMethod,
      hasBookingId: !!bookingId
    });

    const updatedPaymentHistory = [...paymentHistory, {
      issue,
      paymentMethod,
      amount,
      currency,
      assistedAt: new Date().toISOString()
    }].slice(-15);

    return {
      success: true,
      result: {
        paymentAssistance,
        issue,
        resolution: 'Comprehensive payment assistance provided',
        nextSteps: 'Follow the provided instructions or contact support',
        escalationAvailable: true
      },
      memoryUpdates: [
        {
          key: 'payment_assistance',
          data: updatedPaymentHistory,
          expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString()
        }
      ]
    };

  } catch (error) {
    console.error('Payment helper error:', error);
    return {
      success: false,
      error: error.message || 'Failed to provide payment assistance'
    };
  }
};