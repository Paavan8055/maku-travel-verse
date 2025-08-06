import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface BookingPaymentParams {
  bookingType: 'flight' | 'hotel' | 'activity' | 'package';
  bookingData: any;
  amount: number;
  currency?: string;
  customerInfo: {
    email: string;
    firstName: string;
    lastName: string;
    phone?: string;
  };
  paymentMethod?: 'card' | 'fund' | 'split';
  fundAmount?: number;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const params: BookingPaymentParams = await req.json();
    
    console.log('Creating booking payment:', { 
      type: params.bookingType, 
      amount: params.amount,
      paymentMethod: params.paymentMethod 
    });

    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Get authenticated user if available
    const authHeader = req.headers.get("Authorization");
    let user = null;
    if (authHeader) {
      const token = authHeader.replace("Bearer ", "");
      const { data } = await supabaseClient.auth.getUser(token);
      user = data.user;
    }

    // Generate booking reference
    const bookingReference = `MK${Date.now().toString().slice(-8)}${Math.random().toString(36).substr(2, 4).toUpperCase()}`;

    // Create booking record
    const { data: booking, error: bookingError } = await supabaseClient
      .from('bookings')
      .insert({
        user_id: user?.id || null,
        booking_reference: bookingReference,
        booking_type: params.bookingType,
        status: 'pending',
        total_amount: params.amount,
        currency: params.currency || 'USD',
        booking_data: {
          ...params.bookingData,
          customerInfo: params.customerInfo,
          paymentMethod: params.paymentMethod
        }
      })
      .select()
      .single();

    if (bookingError) {
      throw new Error(`Failed to create booking: ${bookingError.message}`);
    }

    console.log('Booking created:', booking.id);

    // Handle payment based on method
    let checkoutUrl = null;
    let paymentStatus = 'pending';

    if (params.paymentMethod === 'fund') {
      // Check if user has sufficient funds
      if (!user) {
        throw new Error('User must be logged in to use travel fund');
      }

      const { data: balance } = await supabaseClient
        .from('fund_balances')
        .select('balance')
        .eq('user_id', user.id)
        .single();

      if (!balance || balance.balance < params.amount) {
        throw new Error('Insufficient funds in travel fund');
      }

      // Deduct from fund and mark as paid
      await supabaseClient
        .from('fund_transactions')
        .insert({
          user_id: user.id,
          type: 'booking',
          amount: -params.amount,
          status: 'completed'
        });

      paymentStatus = 'paid';
      
    } else if (params.paymentMethod === 'split') {
      // Split payment: part fund, part card
      if (!user || !params.fundAmount) {
        throw new Error('Invalid split payment configuration');
      }

      const cardAmount = params.amount - params.fundAmount;
      
      // Create Stripe checkout for card portion
      const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
        apiVersion: "2023-10-16",
      });

      const session = await stripe.checkout.sessions.create({
        customer_email: params.customerInfo.email,
        line_items: [
          {
            price_data: {
              currency: params.currency || "usd",
              product_data: {
                name: `${params.bookingType.charAt(0).toUpperCase() + params.bookingType.slice(1)} Booking - ${bookingReference}`,
                description: `Travel booking payment (split: $${params.fundAmount} from fund + $${cardAmount} card)`
              },
              unit_amount: Math.round(cardAmount * 100),
            },
            quantity: 1,
          },
        ],
        mode: "payment",
        success_url: `${req.headers.get("origin")}/booking/confirmation?booking_id=${booking.id}&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${req.headers.get("origin")}/booking/cancelled?booking_id=${booking.id}`,
        metadata: {
          booking_id: booking.id,
          booking_reference: bookingReference,
          fund_amount: params.fundAmount.toString(),
          payment_method: 'split'
        }
      });

      checkoutUrl = session.url;

    } else {
      // Full card payment
      const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
        apiVersion: "2023-10-16",
      });

      const session = await stripe.checkout.sessions.create({
        customer_email: params.customerInfo.email,
        line_items: [
          {
            price_data: {
              currency: params.currency || "usd",
              product_data: {
                name: `${params.bookingType.charAt(0).toUpperCase() + params.bookingType.slice(1)} Booking - ${bookingReference}`,
                description: `Travel booking payment`
              },
              unit_amount: Math.round(params.amount * 100),
            },
            quantity: 1,
          },
        ],
        mode: "payment",
        success_url: `${req.headers.get("origin")}/booking/confirmation?booking_id=${booking.id}&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${req.headers.get("origin")}/booking/cancelled?booking_id=${booking.id}`,
        metadata: {
          booking_id: booking.id,
          booking_reference: bookingReference,
          payment_method: 'card'
        }
      });

      checkoutUrl = session.url;
    }

    // Update booking status if paid via fund
    if (paymentStatus === 'paid') {
      await supabaseClient
        .from('bookings')
        .update({ status: 'confirmed' })
        .eq('id', booking.id);
    }

    return new Response(JSON.stringify({
      success: true,
      booking: {
        id: booking.id,
        reference: bookingReference,
        status: paymentStatus === 'paid' ? 'confirmed' : 'pending',
        amount: params.amount,
        currency: params.currency || 'USD'
      },
      payment: {
        method: params.paymentMethod,
        status: paymentStatus,
        checkoutUrl: checkoutUrl
      }
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error('Booking payment error:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});