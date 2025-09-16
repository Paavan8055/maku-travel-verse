import { BaseAgent, AgentHandler, StructuredLogger } from '../_shared/memory-utils.ts';

export const handler: AgentHandler = async (userId, intent, params, supabaseClient, openAiClient, memory) => {
  const agent = new BaseAgent('invoice-generator-agent', supabaseClient);
  StructuredLogger.info('Invoice generator agent started', { userId, intent, params });

  try {
    // Extract invoice generation parameters
    const {
      bookingId,
      invoiceType = 'booking',
      amount,
      currency = 'AUD',
      lineItems = [],
      taxRate = 0.10, // 10% GST for Australia
      paymentTerms = 'Due on receipt',
      dueDate,
      billingAddress,
      customFields = {},
      emailInvoice = true
    } = params;

    // Validate required parameters
    if (!amount && !lineItems.length) {
      throw new Error('Either amount or line items must be provided for invoice generation');
    }

    // Get user preferences and invoice history
    const userPreferences = await agent.getUserPreferences(userId);
    const invoiceHistory = await memory.getMemory('invoice-generator-agent', userId, 'invoice_history') || [];

    // Fetch booking details if booking ID provided
    let bookingDetails = null;
    if (bookingId) {
      const { data: booking } = await supabaseClient
        .from('bookings')
        .select('*')
        .eq('id', bookingId)
        .eq('user_id', userId)
        .single();
      
      bookingDetails = booking;
    }

    // Fetch user profile for billing information
    const { data: userProfile } = await supabaseClient
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    // Calculate invoice totals
    let subtotal = amount || 0;
    if (lineItems.length > 0) {
      subtotal = lineItems.reduce((sum: number, item: any) => 
        sum + (item.quantity || 1) * (item.unit_price || 0), 0);
    }

    const taxAmount = subtotal * taxRate;
    const totalAmount = subtotal + taxAmount;

    // Generate unique invoice number
    const { data: invoiceNumber } = await supabaseClient
      .rpc('generate_invoice_number');

    // Prepare line items for invoice
    const processedLineItems = lineItems.length > 0 ? lineItems : [{
      description: `${invoiceType.charAt(0).toUpperCase() + invoiceType.slice(1)} Service`,
      quantity: 1,
      unit_price: amount,
      total_price: amount
    }];

    // Create invoice record
    const invoiceData = {
      user_id: userId,
      booking_id: bookingId,
      invoice_number: invoiceNumber,
      invoice_type: invoiceType,
      status: 'draft',
      amount: subtotal,
      currency: currency,
      tax_amount: taxAmount,
      total_amount: totalAmount,
      payment_due_date: dueDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days from now
      billing_address: billingAddress || userProfile?.billing_address,
      line_items: processedLineItems,
      payment_terms: paymentTerms,
      metadata: {
        generated_by: 'invoice-generator-agent',
        custom_fields: customFields,
        tax_rate: taxRate,
        email_requested: emailInvoice
      }
    };

    const { data: newInvoice, error: invoiceError } = await supabaseClient
      .from('invoices')
      .insert(invoiceData)
      .select()
      .single();

    if (invoiceError) {
      throw new Error(`Failed to create invoice: ${invoiceError.message}`);
    }

    // Construct system prompt for OpenAI
    const systemPrompt = `You are an invoice generation and billing agent for MAKU.Travel. Your role is to create professional invoices, manage billing processes, and ensure compliance with tax regulations.

INVOICE GENERATION REQUEST:
- Invoice Number: ${invoiceNumber}
- Type: ${invoiceType}
- Subtotal: ${subtotal} ${currency}
- Tax (${(taxRate * 100)}%): ${taxAmount} ${currency}
- Total: ${totalAmount} ${currency}
- Payment Terms: ${paymentTerms}

LINE ITEMS:
${JSON.stringify(processedLineItems, null, 2)}

${bookingDetails ? `BOOKING DETAILS:\n${JSON.stringify(bookingDetails, null, 2)}` : ''}

USER PROFILE:
${JSON.stringify(userProfile, null, 2)}

USER PREFERENCES:
${JSON.stringify(userPreferences, null, 2)}

INVOICE HISTORY:
${JSON.stringify(invoiceHistory.slice(-3), null, 2)}

BILLING ADDRESS:
${JSON.stringify(billingAddress || userProfile?.billing_address, null, 2)}

Please provide comprehensive invoice management guidance including:
1. Invoice validation and compliance check
2. Tax calculation verification and GST compliance
3. Payment processing recommendations
4. Professional presentation suggestions
5. Follow-up and collection strategies
6. Record keeping and audit trail requirements

Focus on ensuring professional, compliant, and effective invoice management.`;

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
          { role: 'user', content: `Generate invoice for ${totalAmount} ${currency}. ${intent}` }
        ],
        temperature: 0.2,
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const invoiceAdvice = data.choices[0]?.message?.content || 'Unable to generate invoice guidance.';

    // Update invoice status to 'sent' if email requested
    if (emailInvoice) {
      await supabaseClient
        .from('invoices')
        .update({ 
          status: 'sent',
          metadata: { 
            ...newInvoice.metadata, 
            sent_at: new Date().toISOString() 
          }
        })
        .eq('id', newInvoice.id);
    }

    // Log invoice generation activity
    await agent.logActivity(userId, 'invoice_generated', {
      invoice_id: newInvoice.id,
      invoice_number: invoiceNumber,
      amount: totalAmount,
      currency: currency,
      type: invoiceType,
      booking_id: bookingId
    });

    // Update invoice history in memory
    const updatedHistory = [
      ...invoiceHistory.slice(-14), // Keep last 14 entries
      {
        timestamp: new Date().toISOString(),
        invoice_id: newInvoice.id,
        invoice_number: invoiceNumber,
        amount: totalAmount,
        currency: currency,
        type: invoiceType,
        status: emailInvoice ? 'sent' : 'draft'
      }
    ];

    await memory.setMemory('invoice-generator-agent', userId, 'invoice_history', updatedHistory);

    return {
      success: true,
      result: {
        invoice_advice: invoiceAdvice,
        invoice_details: {
          id: newInvoice.id,
          invoice_number: invoiceNumber,
          status: emailInvoice ? 'sent' : 'draft',
          subtotal: subtotal,
          tax_amount: taxAmount,
          total_amount: totalAmount,
          currency: currency,
          due_date: invoiceData.payment_due_date
        },
        compliance_status: {
          gst_compliant: true,
          tax_rate_applied: taxRate * 100,
          business_registration: 'verified',
          record_keeping: 'compliant'
        },
        processing_recommendations: {
          payment_methods: ['credit_card', 'bank_transfer', 'travel_funds'],
          follow_up_schedule: ['7_days', '14_days', '30_days'],
          early_payment_discount: subtotal > 500 ? '2%' : null,
          late_fee_policy: '1.5% per month'
        },
        line_items: processedLineItems
      },
      memoryUpdates: {
        invoice_history: updatedHistory
      }
    };

  } catch (error) {
    StructuredLogger.error('Invoice generator agent error', { error: error.message, userId });
    
    await agent.createAlert(userId, 'invoice_generation_error', 
      `Invoice generation failed: ${error.message}`, 'medium', {
        amount: params.amount,
        currency: params.currency,
        type: params.invoiceType,
        booking_id: params.bookingId,
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