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
    logger.info("[GOOGLE-ACTIVITY] Request received", { method: req.method });

    const body = await req.json().catch(() => ({}));
    const { valid, errors, sanitizedData } = SecurityValidator.validateInput(body, {
      latitude: { type: "number", required: true, min: -90, max: 90 },
      longitude: { type: "number", required: true, min: -180, max: 180 },
      radiusKm: { type: "number", required: true, min: 1, max: 300 },
      startDate: { type: "string", required: false },
      endDate: { type: "string", required: false },
      max: { type: "number", required: false, min: 1, max: 50 },
    });
    if (!valid) {
      return new Response(JSON.stringify({ success: false, error: "Invalid input", details: errors }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    const { latitude, longitude, radiusKm, startDate, endDate, max = 25 } = sanitizedData as any;

    logger.info("Google activity search params:", { latitude, longitude, radiusKm });

    logger.info("Google activity credentials check:", { hasKey: !!ENV_CONFIG.GOOGLE_ACTIVITIES_API_KEY });

    const baseUrl = getGoogleBaseUrl("activities");
    const params = new URLSearchParams({
      lat: String(latitude),
      lon: String(longitude),
      radiusKm: String(radiusKm),
      max: String(max),
    });
    if (startDate) params.append("startDate", startDate);
    if (endDate) params.append("endDate", endDate);
    // params.append("key", ENV_CONFIG.GOOGLE_ACTIVITIES_API_KEY); // if key-in-query

    const url = `${baseUrl}/v1/nearby?${params.toString()}`;
    logger.info("Making Google Activities request to:", url);

    const response = await fetch(url, { method: "GET", headers: getGoogleHeaders("activities") });
    if (!response.ok) {
      const errorText = await response.text();
      logger.error("Google Activities API error:", { status: response.status, error: errorText });
      return new Response(JSON.stringify({ success: false, error: "Upstream error", details: errorText }), {
        status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    const data = await response.json().catch(() => ({}));
    logger.info("✅ Google Activities response", { count: data?.data?.length ?? 0 });

    return new Response(JSON.stringify({
      success: true,
      data: data?.data ?? [],
      meta: data?.meta ?? {},
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });

  } catch (error) {
    logger.error("Google activity search error:", error);
    return new Response(JSON.stringify({
      success: false, error: error?.message ?? "Activity search failed"
    }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
