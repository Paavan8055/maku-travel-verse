import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.53.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        auth: {
          persistSession: false,
        },
      }
    );

    const {
      amount,
      currency = 'USD',
      purchaserEmail,
      purchaserName,
      recipientEmail,
      recipientName,
      message,
      deliveryDate,
      paymentMethodId
    } = await req.json();

    console.log('Create gift card request:', { amount, currency, purchaserEmail });

    // Validation
    if (!amount || amount <= 0) {
      throw new Error('Invalid gift card amount');
    }

    if (!purchaserEmail || !purchaserName) {
      throw new Error('Purchaser information is required');
    }

    if (amount < 10 || amount > 2000) {
      throw new Error('Gift card amount must be between $10 and $2000');
    }

    // Generate unique gift card code
    const giftCardCode = generateGiftCardCode();
    console.log('Generated gift card code:', giftCardCode.substring(0, 8) + '...');

    // Create gift card using database function
    const { data: giftCardData, error: dbError } = await supabaseClient
      .rpc('generate_gift_card_code')
      .single();

    if (dbError) {
      console.error('Error generating gift card code:', dbError);
    }

    const actualCode = giftCardData || giftCardCode;

    // Insert gift card record
    const { data: giftCard, error: insertError } = await supabaseClient
      .from('gift_cards')
      .insert({
        code: actualCode,
        amount: amount,
        currency: currency,
        purchaser_email: purchaserEmail,
        purchaser_name: purchaserName,
        recipient_email: recipientEmail || purchaserEmail,
        recipient_name: recipientName || purchaserName,
        message: message,
        delivery_date: deliveryDate ? new Date(deliveryDate).toISOString() : null,
        status: 'pending',
        expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
      })
      .select()
      .single();

    if (insertError) {
      console.error('Database error creating gift card:', insertError);
      throw new Error('Failed to create gift card record');
    }

    // Process payment if payment method provided
    let paymentResult = null;
    if (paymentMethodId) {
      try {
        paymentResult = await processPayment(
          giftCard.id,
          amount,
          currency,
          paymentMethodId,
          purchaserEmail
        );

        if (paymentResult.success) {
          await supabaseClient
            .from('gift_cards')
            .update({ 
              status: 'active',
              purchased_at: new Date().toISOString()
            })
            .eq('id', giftCard.id);
        }
      } catch (paymentError) {
        console.error('Payment error:', paymentError);
        await supabaseClient
          .from('gift_cards')
          .update({ status: 'failed' })
          .eq('id', giftCard.id);
        throw new Error('Payment processing failed');
      }
    }

    console.log(`Gift card created: ${actualCode}`);

    return new Response(
      JSON.stringify({
        success: true,
        giftCard: {
          id: giftCard.id,
          code: actualCode,
          amount,
          currency,
          status: paymentMethodId ? (paymentResult?.success ? 'active' : 'failed') : 'pending',
          expiresAt: giftCard.expires_at
        },
        payment: paymentResult,
        meta: {
          timestamp: new Date().toISOString()
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Create gift card error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        meta: { timestamp: new Date().toISOString() }
      }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

function generateGiftCardCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  
  for (let i = 0; i < 16; i++) {
    if (i > 0 && i % 4 === 0) {
      code += '-';
    }
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  
  return code;
}

async function processPayment(
  giftCardId: string,
  amount: number,
  currency: string,
  paymentMethodId: string,
  customerEmail: string
) {
  const stripeKey = Deno.env.get('STRIPE_SECRET_KEY');
  
  if (!stripeKey) {
    console.warn('Stripe not configured, using mock payment');
    return {
      success: true,
      paymentIntentId: `pi_mock_${Date.now()}`,
      status: 'succeeded'
    };
  }

  try {
    const response = await fetch('https://api.stripe.com/v1/payment_intents', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${stripeKey}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        amount: (amount * 100).toString(),
        currency: currency.toLowerCase(),
        payment_method: paymentMethodId,
        confirmation_method: 'manual',
        confirm: 'true',
        receipt_email: customerEmail,
        description: `MAKU Travel Gift Card - ${giftCardId}`
      }),
    });

    if (!response.ok) {
      throw new Error('Payment processing failed');
    }

    const data = await response.json();
    
    return {
      success: data.status === 'succeeded',
      paymentIntentId: data.id,
      status: data.status
    };

  } catch (error) {
    console.error('Payment processing error:', error);
    throw error;
  }
}