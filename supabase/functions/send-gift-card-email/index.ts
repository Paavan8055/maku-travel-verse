import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

interface SendGiftCardEmailRequest {
  giftCardCode: string;
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

    const { giftCardCode }: SendGiftCardEmailRequest = await req.json();

    if (!giftCardCode) {
      throw new Error("Gift card code is required");
    }

    // Get gift card details
    const { data: giftCard, error: fetchError } = await supabaseClient
      .from('gift_cards')
      .select('*')
      .eq('code', giftCardCode)
      .single();

    if (fetchError || !giftCard) {
      throw new Error("Gift card not found");
    }

    // Create email HTML
    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>You've Received a Maku Travel Gift Card!</title>
          <style>
            body { 
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
              margin: 0; 
              padding: 0; 
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            }
            .container { 
              max-width: 600px; 
              margin: 0 auto; 
              background: white; 
              border-radius: 12px; 
              overflow: hidden; 
              box-shadow: 0 20px 40px rgba(0,0,0,0.1);
            }
            .header { 
              background: linear-gradient(135deg, #ff6b6b, #ffa726); 
              padding: 40px 30px; 
              text-align: center; 
              color: white; 
            }
            .header h1 { 
              margin: 0; 
              font-size: 28px; 
              font-weight: bold; 
            }
            .content { 
              padding: 40px 30px; 
            }
            .gift-card { 
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
              border-radius: 12px; 
              padding: 30px; 
              text-align: center; 
              color: white; 
              margin: 30px 0; 
            }
            .amount { 
              font-size: 48px; 
              font-weight: bold; 
              margin: 15px 0; 
            }
            .code { 
              background: rgba(255,255,255,0.2); 
              padding: 15px; 
              border-radius: 8px; 
              font-family: monospace; 
              font-size: 24px; 
              letter-spacing: 3px; 
              margin: 20px 0; 
            }
            .redeem-btn { 
              background: #ff6b6b; 
              color: white; 
              padding: 15px 30px; 
              text-decoration: none; 
              border-radius: 8px; 
              display: inline-block; 
              font-weight: bold; 
              margin-top: 20px;
            }
            .message { 
              background: #f8f9fa; 
              padding: 20px; 
              border-radius: 8px; 
              margin: 20px 0; 
              border-left: 4px solid #ff6b6b; 
            }
            .footer { 
              text-align: center; 
              padding: 30px; 
              color: #666; 
              border-top: 1px solid #eee; 
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎁 You've Got a Gift!</h1>
              <p>Someone special has sent you a Maku Travel gift card</p>
            </div>
            
            <div class="content">
              <h2>Hi ${giftCard.recipient_name}! 👋</h2>
              <p>${giftCard.sender_name} has sent you an amazing gift to fuel your next adventure!</p>
              
              ${giftCard.personal_message ? `
                <div class="message">
                  <strong>Personal Message from ${giftCard.sender_name}:</strong><br>
                  "${giftCard.personal_message}"
                </div>
              ` : ''}
              
              <div class="gift-card">
                <h3>🌟 Maku Travel Gift Card 🌟</h3>
                <div class="amount">$${giftCard.amount} AUD</div>
                <p>Gift Card Code:</p>
                <div class="code">${giftCard.code}</div>
                <a href="https://maku.travel" class="redeem-btn">Start Your Adventure →</a>
              </div>
              
              <h3>How to Redeem:</h3>
              <ol>
                <li>Visit <a href="https://maku.travel">maku.travel</a></li>
                <li>Browse and select your perfect trip</li>
                <li>At checkout, enter your gift card code: <strong>${giftCard.code}</strong></li>
                <li>Enjoy your adventure! ✈️</li>
              </ol>
              
              <p><strong>Valid for 1 year</strong> from today. Start planning your dream getaway!</p>
            </div>
            
            <div class="footer">
              <p>Happy travels! 🌍<br>
              The Maku Travel Team</p>
              <p><small>This gift card expires on ${new Date(giftCard.expires_at).toLocaleDateString()}</small></p>
            </div>
          </div>
        </body>
      </html>
    `;

    // Send email to recipient
    const emailResponse = await resend.emails.send({
      from: "Maku Travel <gifts@maku.travel>",
      to: [giftCard.recipient_email],
      subject: `🎁 You've received a $${giftCard.amount} travel gift card from ${giftCard.sender_name}!`,
      html: emailHtml,
    });

    if (emailResponse.error) {
      throw new Error(`Failed to send email: ${emailResponse.error.message}`);
    }

    console.log("Gift card email sent successfully:", giftCardCode);

    return new Response(JSON.stringify({ 
      success: true,
      email_id: emailResponse.data?.id
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error("Error in send-gift-card-email function:", error);
    return new Response(JSON.stringify({ 
      success: false,
      error: error.message 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});