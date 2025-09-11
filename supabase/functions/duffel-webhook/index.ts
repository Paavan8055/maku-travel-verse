import { corsHeaders } from "../_shared/cors.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import logger from "../_shared/logger.ts";

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const event = await req.json().catch(() => ({}));
    // TODO: validate signature if configured
    logger.info("[DUFFEL WEBHOOK]", event);

    // Upsert status into your bookings table if needed
    // await supabase.from('bookings').update({ status: ... }).eq('order_id', event?.data?.id)

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  } catch (_e) {
    return new Response(JSON.stringify({ received: false }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});
