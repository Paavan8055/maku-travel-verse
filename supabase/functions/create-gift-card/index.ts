import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { Resend } from "npm:resend@2.0.0";
import logger from "../_shared/logger.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

interface GiftCardRequest {
  amount: number;
  senderName: string;
  senderEmail: string;
  recipientName: string;
  recipientEmail: string;
  personalMessage?: string;
  designTemplate?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2023-10-16",
    });

    // Get authenticated user (optional for gift cards)
    let userId = null;
    const authHeader = req.headers.get("Authorization");
    if (authHeader) {
      const token = authHeader.replace("Bearer ", "");
      const { data } = await supabaseClient.auth.getUser(token);
      userId = data.user?.id || null;
    }

    const giftCardData: GiftCardRequest = await req.json();

    // Validate request
    if (!giftCardData.amount || giftCardData.amount < 100 || giftCardData.amount > 10000) {
      throw new Error("Gift card amount must be between $100 and $10,000");
    }

    if (!giftCardData.senderName || !giftCardData.senderEmail || 
        !giftCardData.recipientName || !giftCardData.recipientEmail) {
      throw new Error("Sender and recipient information is required");
    }

    // Generate unique gift card code
    const { data: codeData, error: codeError } = await supabaseClient
      .rpc('generate_gift_card_code');
    
    if (codeError || !codeData) {
      logger.error("Gift card code generation error:", codeError);
      throw new Error(`Failed to generate gift card code: ${codeError?.message || 'Unknown error'}`);
    }
    const giftCardCode = codeData;

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      customer_email: giftCardData.senderEmail,
      line_items: [
        {
          price_data: {
            currency: "aud",
            product_data: { 
              name: `Maku Travel Gift Card - $${giftCardData.amount}`,
              description: `Gift card for ${giftCardData.recipientName}`,
            },
            unit_amount: giftCardData.amount * 100, // Convert to cents
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${req.headers.get("origin")}/gift-cards?success=true&code=${giftCardCode}`,
      cancel_url: `${req.headers.get("origin")}/gift-cards?cancelled=true`,
      metadata: {
        type: "gift_card",
        gift_card_code: giftCardCode,
        recipient_email: giftCardData.recipientEmail,
        sender_email: giftCardData.senderEmail,
      }
    });

    // Create gift card record in database
    const { error: insertError } = await supabaseClient
      .from('gift_cards')
      .insert({
        code: giftCardCode,
        amount: giftCardData.amount,
        original_amount: giftCardData.amount,
        currency: 'AUD',
        status: 'active',
        sender_id: userId,
        sender_name: giftCardData.senderName,
        sender_email: giftCardData.senderEmail,
        recipient_name: giftCardData.recipientName,
        recipient_email: giftCardData.recipientEmail,
        personal_message: giftCardData.personalMessage || null,
        design_template: giftCardData.designTemplate || 'default',
      });

    if (insertError) {
      logger.error("Gift card insert error:", insertError);
      throw new Error("Failed to create gift card record");
    }

    logger.info("Gift card created successfully:", giftCardCode);

    return new Response(JSON.stringify({ 
      success: true,
      checkout_url: session.url,
      gift_card_code: giftCardCode
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    logger.error("Error in create-gift-card function:", error);
    return new Response(JSON.stringify({ 
      success: false,
      error: error.message 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});