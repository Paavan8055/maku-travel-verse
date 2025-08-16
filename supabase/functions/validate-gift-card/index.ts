import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ValidateGiftCardRequest {
  code: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    const { code }: ValidateGiftCardRequest = await req.json();

    if (!code) {
      throw new Error("Gift card code is required");
    }

    // Get gift card details
    const { data: giftCard, error: fetchError } = await supabaseClient
      .from('gift_cards')
      .select(`
        id,
        code,
        amount,
        original_amount,
        currency,
        status,
        recipient_name,
        expires_at,
        created_at
      `)
      .eq('code', code.toUpperCase())
      .single();

    if (fetchError || !giftCard) {
      return new Response(JSON.stringify({ 
        success: false,
        error: "Invalid gift card code"
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 404,
      });
    }

    // Check if expired
    if (new Date(giftCard.expires_at) <= new Date()) {
      return new Response(JSON.stringify({ 
        success: false,
        error: "Gift card has expired"
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    // Check if not active
    if (giftCard.status !== 'active') {
      return new Response(JSON.stringify({ 
        success: false,
        error: `Gift card is ${giftCard.status}`
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    // Get redemption history to calculate remaining balance
    const { data: redemptions, error: redemptionError } = await supabaseClient
      .from('gift_card_redemptions')
      .select('amount_redeemed')
      .eq('gift_card_id', giftCard.id);

    if (redemptionError) {
      throw new Error("Failed to fetch redemption history");
    }

    const totalRedeemed = redemptions?.reduce((sum, r) => sum + Number(r.amount_redeemed), 0) || 0;
    const remainingBalance = Number(giftCard.amount) - totalRedeemed;

    if (remainingBalance <= 0) {
      return new Response(JSON.stringify({ 
        success: false,
        error: "Gift card has been fully redeemed"
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    console.log("Gift card validated successfully:", code);

    return new Response(JSON.stringify({ 
      success: true,
      gift_card: {
        id: giftCard.id,
        code: giftCard.code,
        original_amount: giftCard.original_amount,
        remaining_balance: remainingBalance,
        currency: giftCard.currency,
        recipient_name: giftCard.recipient_name,
        expires_at: giftCard.expires_at,
        created_at: giftCard.created_at
      }
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error("Error in validate-gift-card function:", error);
    return new Response(JSON.stringify({ 
      success: false,
      error: error.message 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});