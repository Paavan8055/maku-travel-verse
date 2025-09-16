import { corsHeaders } from "../_shared/cors.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import SecurityValidator from "../_shared/securityUtils.ts";
import logger from "../_shared/logger.ts";
import { duffelHeaders, duffelBase } from "../_shared/duffel.ts";

// Types for flight search
interface SearchBody {
  origin: string;
  destination: string;
  departureDate: string;
  returnDate?: string;
  adults?: number;
  cabin?: "economy" | "premium_economy" | "business" | "first";
  max?: number;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }
  const ip = req.headers.get("x-forwarded-for") ?? req.headers.get("cf-connecting-ip") ?? "anon";
  const rate = SecurityValidator.checkRateLimit(ip, 30, 60_000);
  if (!rate.allowed) {
    return new Response(
      JSON.stringify({ success: false, error: "Rate limit exceeded" }),
      { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
  try {
    const body = await req.json().catch(() => ({}));
    // Validate and sanitize input
    const { valid, errors, sanitizedData } = SecurityValidator.validateInput(body, {
      origin: { type: "string", required: true, minLength: 3, maxLength: 3 },
      destination: { type: "string", required: true, minLength: 3, maxLength: 3 },
      departureDate: { type: "string", required: true },
      returnDate: { type: "string", required: false },
      adults: { type: "number", required: false, min: 1 },
      cabin: { type: "string", required: false },
      max: { type: "number", required: false, min: 1, max: 50 },
    });
    if (!valid) {
      return new Response(
        JSON.stringify({ success: false, error: "Invalid input", details: errors }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    const { origin, destination, departureDate, returnDate, adults = 1, cabin = "economy", max = 25 } =
      sanitizedData as SearchBody;

    logger.info("Duffel flight search params:", { origin, destination, departureDate, adults, cabin });

    // Create Offer Request
    const base = duffelBase();
    const requestBody: any = {
      data: {
        passengers: Array.from({ length: adults }).map((_, i) => ({ type: "adult", id: `pax_${i + 1}` })),
        slices: [
          {
            origin,
            destination,
            departure_date: departureDate,
          },
        ],
        cabin_class: cabin,
      },
    };
    if (returnDate) {
      requestBody.data.slices.push({ origin: destination, destination: origin, departure_date: returnDate });
    }

    const orRes = await fetch(`${base}/air/offer_requests`, {
      method: "POST",
      headers: duffelHeaders(),
      body: JSON.stringify(requestBody),
    });
    if (!orRes.ok) {
      const t = await orRes.text();
      logger.error("Duffel offer request error", { 
        status: orRes.status, 
        body: t, 
        requestParams: { origin, destination, departureDate, adults, cabin },
        requestBody: JSON.stringify(requestBody)
      });
      return new Response(
        JSON.stringify({ success: false, error: "Offer request failed", details: t }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    const orJson = await orRes.json();
    const offerReqId = orJson?.data?.id;

    const offersRes = await fetch(
      `${base}/air/offers?offer_request_id=${offerReqId}&limit=${max}`,
      {
        method: "GET",
        headers: duffelHeaders(),
      }
    );
    if (!offersRes.ok) {
      const t = await offersRes.text();
      logger.error("Duffel offers error", { status: offersRes.status, body: t });
      return new Response(
        JSON.stringify({ success: false, error: "Offer retrieval failed", details: t }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    const offersJson = await offersRes.json();
    const mapped = (offersJson?.data ?? []).map((o: any) => ({
      provider: "DUFFEL",
      offer_id: o.id,
      total_amount: o.total_amount,
      total_currency: o.total_currency,
      slices: (o.slices ?? []).map((s: any) => ({
        origin: s.origin?.iata_code,
        destination: s.destination?.iata_code,
        duration: s.duration,
        segments: (s.segments ?? []).map((seg: any) => ({
          marketing_carrier: seg.marketing_carrier?.name,
          marketing_carrier_iata: seg.marketing_carrier?.iata_code,
          flight_number: seg.marketing_carrier_flight_number,
          aircraft: seg.aircraft?.name,
          depart_at: seg.departing_at,
          arrive_at: seg.arriving_at,
        })),
      })),
    }));

    return new Response(
      JSON.stringify({ success: true, data: mapped, raw: offersJson }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    return new Response(
      JSON.stringify({ success: false, error: (e as Error)?.message ?? "Duffel search failed" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
