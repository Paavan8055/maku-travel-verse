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
      status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }

  try {
    logger.info("[GOOGLE-HOTEL] Request received", { method: req.method });

    const body = await req.json().catch(() => ({}));
    const { valid, errors, sanitizedData } = SecurityValidator.validateInput(body, {
      cityCode: { type: "string", required: true, minLength: 2, maxLength: 10 },
      checkInDate: { type: "string", required: true },
      checkOutDate: { type: "string", required: true },
      adults: { type: "number", required: true, min: 1 },
      max: { type: "number", required: false, min: 1, max: 50 },
    });
    if (!valid) {
      return new Response(JSON.stringify({ success: false, error: "Invalid input", details: errors }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    const { cityCode, checkInDate, checkOutDate, adults = 1, max = 20 } = sanitizedData as any;

    logger.info("Google hotel search parameters:", { cityCode, checkInDate, adults });

    logger.info("Google hotel credentials check:", { hasKey: !!ENV_CONFIG.GOOGLE_HOTELS_API_KEY });

    const baseUrl = getGoogleBaseUrl("hotels");
    const params = new URLSearchParams({
      cityCode, checkInDate, checkOutDate,
      adults: String(adults),
      currencyCode: "AUD",
      max: String(max),
    });
    // params.append("key", ENV_CONFIG.GOOGLE_HOTELS_API_KEY); // if key-in-query

    const url = `${baseUrl}/v1/hotel-offers?${params.toString()}`;
    logger.info("Making Google Hotels request to:", url);

    const response = await fetch(url, { method: "GET", headers: getGoogleHeaders("hotels") });
    if (!response.ok) {
      const errorText = await response.text();
      logger.error("Google Hotels API error:", { status: response.status, error: errorText });
      return new Response(JSON.stringify({ success: false, error: "Upstream error", details: errorText }), {
        status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    const data = await response.json().catch(() => ({}));
    logger.info("✅ Google Hotels response received", { count: data?.data?.length ?? 0 });

    return new Response(JSON.stringify({
      success: true,
      data: data?.data ?? [],
      meta: data?.meta ?? {},
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });

  } catch (error) {
    logger.error("Google hotel search error:", error);
    return new Response(JSON.stringify({
      success: false, error: error?.message ?? "Hotel search failed"
    }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
