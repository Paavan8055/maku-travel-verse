import { corsHeaders } from '../_shared/cors.ts';
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.53.0";
import Stripe from "https://esm.sh/stripe@14.21.0";

interface BookingPaymentParams {
  bookingType: 'hotel' | 'flight' | 'activity';
  amount: number;
  currency: string;
  customerInfo: {
    email: string;
    firstName: string;
    lastName: string;
    phone?: string;
  };
  bookingData: any;
  paymentMethod: 'card' | 'fund' | 'split';
  fundAmount?: number;
  userId?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const params: BookingPaymentParams = await req.json();
    
    console.log('Creating booking payment:', {
      bookingType: params.bookingType,
      amount: params.amount,
      currency: params.currency,
      paymentMethod: params.paymentMethod
    });

    // Validate input parameters
    if (!params.bookingType || !params.amount || !params.currency || !params.customerInfo) {
      throw new Error('Missing required parameters');
    }

    // Initialize clients
    const supabaseService = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    );

    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
      apiVersion: '2023-10-16',
    });

    // Generate unique booking reference
    const bookingReference = `MAKU-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    // Create booking record
    const { data: booking, error: bookingError } = await supabaseService
      .from('bookings')
      .insert({
        booking_reference: bookingReference,
        booking_type: params.bookingType,
        status: 'pending',
        total_amount: params.amount,
        currency: params.currency,
        booking_data: {
          ...params.bookingData,
          customerInfo: params.customerInfo
        },
        user_id: params.userId || null,
        created_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString() // 10 minutes expiry
      })
      .select()
      .single();

    if (bookingError || !booking) {
      console.error('Failed to create booking:', bookingError);
      throw new Error('Failed to create booking record');
    }

    console.log('Booking created:', { bookingId: booking.id, reference: bookingReference });

    // Handle different payment methods
    if (params.paymentMethod === 'card' || params.paymentMethod === 'split') {
      const cardAmount = params.paymentMethod === 'split' ? 
        params.amount - (params.fundAmount || 0) : params.amount;

      if (cardAmount > 0) {
        // Create Stripe Checkout Session
        const session = await stripe.checkout.sessions.create({
          payment_method_types: ['card'],
          line_items: [{
            price_data: {
              currency: params.currency.toLowerCase(),
              product_data: {
                name: `${params.bookingType.charAt(0).toUpperCase() + params.bookingType.slice(1)} Booking`,
                description: `Booking Reference: ${bookingReference}`,
              },
              unit_amount: Math.round(cardAmount * 100),
            },
            quantity: 1,
          }],
          mode: 'payment',
          success_url: `${Deno.env.get('SITE_URL') || 'https://maku.travel'}/booking/success?session_id={CHECKOUT_SESSION_ID}`,
          cancel_url: `${Deno.env.get('SITE_URL') || 'https://maku.travel'}/booking/cancelled`,
          metadata: {
            booking_id: booking.id,
            booking_reference: bookingReference,
            payment_method: params.paymentMethod,
            user_id: params.userId || 'guest'
          },
          customer_email: params.customerInfo.email,
          expires_at: Math.floor(Date.now() / 1000) + (10 * 60), // 10 minutes
        });

        // Update booking with Stripe session info
        await supabaseService
          .from('bookings')
          .update({
            stripe_checkout_session_id: session.id,
            updated_at: new Date().toISOString()
          })
          .eq('id', booking.id);

        // Create payment record
        await supabaseService
          .from('payments')
          .insert({
            booking_id: booking.id,
            stripe_checkout_session_id: session.id,
            amount: cardAmount,
            currency: params.currency,
            status: 'pending',
            payment_method: 'card',
            created_at: new Date().toISOString()
          });

        console.log('Stripe checkout session created:', { sessionId: session.id });

        return new Response(JSON.stringify({
          success: true,
          booking: {
            id: booking.id,
            reference: bookingReference,
            status: 'pending',
            expires_at: booking.expires_at
          },
          payment: {
            method: params.paymentMethod,
            checkout_url: session.url,
            session_id: session.id
          }
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        });
      }
    }

    // Handle fund payment
    if (params.paymentMethod === 'fund') {
      console.log('Processing fund payment for booking:', booking.id);
      
      // In a real implementation, you would verify the user's fund balance here
      // For now, we'll assume the funds are available and mark as confirmed
      
      await supabaseService
        .from('bookings')
        .update({
          status: 'confirmed',
          updated_at: new Date().toISOString()
        })
        .eq('id', booking.id);

      await supabaseService
        .from('payments')
        .insert({
          booking_id: booking.id,
          amount: params.amount,
          currency: params.currency,
          status: 'completed',
          payment_method: 'fund',
          created_at: new Date().toISOString()
        });

      return new Response(JSON.stringify({
        success: true,
        booking: {
          id: booking.id,
          reference: bookingReference,
          status: 'confirmed'
        },
        payment: {
          method: 'fund',
          status: 'completed'
        }
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    throw new Error('Unsupported payment method');

  } catch (error) {
    console.error('Booking payment creation error:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message || 'Failed to create booking payment'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});