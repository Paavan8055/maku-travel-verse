import { corsHeaders } from "../_shared/cors.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import logger from "../_shared/logger.ts";
import SecurityValidator from "../_shared/securityUtils.ts";
import { ENV_CONFIG } from "../_shared/config.ts";
import { getGoogleHeaders, getGoogleBaseUrl } from "../_shared/google.ts";

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const ip = req.headers.get("x-forwarded-for") ?? req.headers.get("cf-connecting-ip") ?? "anonymous";
  const rate = SecurityValidator.checkRateLimit(ip, 30, 60_000);
  if (!rate.allowed) {
    return new Response(JSON.stringify({ success: false, error: "Rate limit exceeded" }), {
      status: 429,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    logger.info("[GOOGLE-FLIGHT] Request received", { method: req.method });

    const body = await req.json().catch(() => ({}));
    const { valid, errors, sanitizedData } = SecurityValidator.validateInput(
      body,
      { ...SecurityValidator.getFlightSearchSchema(), nonStop: { type: "boolean" } }
    );

    if (!valid) {
      return new Response(JSON.stringify({ success: false, error: "Invalid input", details: errors }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const {
      originLocationCode,
      destinationLocationCode,
      departureDate,
      returnDate,
      adults = 1,
      children = 0,
      infants = 0,
      travelClass = "ECONOMY",
      nonStop = false,
    } = sanitizedData as any;

    logger.info("Google flight search parameters:", {
      originLocationCode,
      destinationLocationCode,
      departureDate,
      adults,
    });

    logger.info("Google flight credentials check:", {
      hasKey: !!ENV_CONFIG.GOOGLE_FLIGHTS_API_KEY,
    });

    const baseUrl = getGoogleBaseUrl("flights");
    const params = new URLSearchParams({
      originLocationCode,
      destinationLocationCode,
      departureDate,
      adults: String(adults),
      nonStop: String(nonStop),
      currencyCode: "AUD",
      max: "10",
    });
    if (returnDate) params.append("returnDate", returnDate);
    if (children > 0) params.append("children", String(children));
    if (infants > 0) params.append("infants", String(infants));
    if (travelClass && travelClass !== "ECONOMY") params.append("travelClass", travelClass);

    // params.append("key", ENV_CONFIG.GOOGLE_FLIGHTS_API_KEY);

    const url = `${baseUrl}/v1/flight-offers?${params.toString()}`;
    logger.info("Making Google Flights request to:", url);

    const response = await fetch(url, {
      method: "GET",
      headers: getGoogleHeaders("flights"),
    });

    if (!response.ok) {
      const errorText = await response.text();
      logger.error("Google Flights API error:", { status: response.status, error: errorText });
      return new Response(
        JSON.stringify({ success: false, error: "Upstream error", details: errorText }),
        {
          status: 502,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const data = await response.json().catch(() => ({}));
    logger.info("✅ Google Flights response received", { count: data?.data?.length ?? 0 });

    return new Response(
      JSON.stringify({
        success: true,
        data: data?.data ?? [],
        meta: data?.meta ?? {},
        dictionaries: data?.dictionaries ?? {},
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    logger.error("Google flight search error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error?.message ?? "Flight search failed",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
