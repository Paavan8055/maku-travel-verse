import { corsHeaders } from "../_shared/cors.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { duffelHeaders, duffelBase } from "../_shared/duffel.ts";

type CreateOrderBody = {
  offer_id: string;
  passengers: Array<{
    id: string;
    title?: string;
    given_name: string;
    family_name: string;
    born_on: string;
    gender?: string;
    email?: string;
    phone_number?: string;
  }>;
  payments?: Array<{
    type: "balance" | "payment_intent";
    amount: string;
    currency: string;
  }>;
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body = await req.json() as CreateOrderBody;
    const base = duffelBase();

    const orderRes = await fetch(`${base}/air/orders`, {
      method: "POST",
      headers: duffelHeaders(),
      body: JSON.stringify({ data: { selected_offers: [body.offer_id], passengers: body.passengers, payments: body.payments ?? [] } })
    });

    const t = await orderRes.text();
    if (!orderRes.ok) {
      return new Response(JSON.stringify({ success:false, error:"Order creation failed", details: t }), {
        status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    return new Response(JSON.stringify({ success:true, data: JSON.parse(t) }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });

  } catch (e) {
    return new Response(JSON.stringify({ success:false, error: (e as Error)?.message ?? "Duffel order failed" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});
