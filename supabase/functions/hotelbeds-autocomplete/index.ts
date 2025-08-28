import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import logger from "../_shared/logger.ts";
import { ENV_CONFIG } from "../_shared/config.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type Suggestion = {
  id: string;
  name: string;
  city?: string;
  country: string;
  code?: string;
  type: "city" | "hotel";
  coordinates?: [number, number];
  displayName?: string;
};

const CONTENT_BASE = `${ENV_CONFIG.hotelbeds.baseUrl}/hotel-content-api/1.0`;

// Web Crypto SHA-256 signature generation
const generateHotelBedsSignature = async (apiKey: string, secret: string, timestamp: number): Promise<string> => {
  const encoder = new TextEncoder();
  const data = encoder.encode(apiKey + secret + timestamp);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
  return hashHex;
};

async function hbFetch(path: string) {
  const apiKey = Deno.env.get("HOTELBEDS_HOTEL_API_KEY");
  const secret = Deno.env.get("HOTELBEDS_HOTEL_SECRET");
  if (!apiKey || !secret) {
    throw new Error("HotelBeds credentials not configured");
  }
  const timestamp = Math.floor(Date.now() / 1000);
  const signature = await generateHotelBedsSignature(apiKey, secret, timestamp);

  const resp = await fetch(`${CONTENT_BASE}${path}`, {
    headers: {
      "Api-key": apiKey,
      "X-Signature": signature,
      Accept: "application/json",
    },
  });
  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`HotelBeds content API ${path} failed: ${resp.status} ${text}`);
  }
  return resp.json();
}

// Helpers
function includesQuery(hay: unknown, qLower: string) {
  const text = String(hay ?? "").toLowerCase();
  return text.includes(qLower);
}
const getName = (obj: any): string => obj?.name?.content ?? obj?.name ?? "";
const getCity = (obj: any): string | undefined => obj?.city?.content ?? obj?.city ?? obj?.destinationName ?? undefined;
const getCountry = (obj: any): string => obj?.countryCode ?? obj?.country?.code ?? obj?.country?.isoCode ?? obj?.country ?? "";
const getCode = (obj: any): string | undefined => {
  const code = obj?.code ?? obj?.destinationCode ?? obj?.id;
  return code != null ? String(code) : undefined;
};

async function fetchDestinationsPaged(qLower: string, max: number) {
  const batch = 200;
  const out: Suggestion[] = [];
  let scanned = 0;
  for (let page = 0; page < 5 && out.length < max; page++) {
    const from = page * batch + 1;
    const to = (page + 1) * batch;
    try {
      const payload = await hbFetch(`/locations/destinations?fields=all&language=ENG&from=${from}&to=${to}`);
      const items: any[] = Array.isArray(payload?.destinations) ? payload.destinations : [];
      scanned += items.length;
      for (const d of items) {
        if (out.length >= max) break;
        const name = getName(d);
        const code = getCode(d) ?? "";
        const country = getCountry(d);
        if (includesQuery(name, qLower) || includesQuery(code, qLower) || includesQuery(country, qLower)) {
          out.push({
            id: `hb-dest-${code || name}`,
            name: name || code || "",
            city: name || undefined,
            country,
            code,
            type: "city",
            displayName: name && country ? `${name}, ${country}` : name || code || "",
          });
        }
      }
      if (items.length < batch) break; // no more pages
    } catch (e) {
      logger.error("HotelBeds destinations page error:", e);
      break;
    }
  }
  logger.info("hotelbeds-autocomplete destinations scanned=%d matched=%d", scanned, out.length);
  return out;
}

async function fetchHotelsPaged(qLower: string, max: number) {
  const batch = 200;
  const out: Suggestion[] = [];
  let scanned = 0;
  for (let page = 0; page < 5 && out.length < max; page++) {
    const from = page * batch + 1;
    const to = (page + 1) * batch;
    try {
      const payload = await hbFetch(`/hotels?fields=basic&language=ENG&from=${from}&to=${to}`);
      const items: any[] = Array.isArray(payload?.hotels) ? payload.hotels : [];
      scanned += items.length;
      for (const h of items) {
        if (out.length >= max) break;
        const name = getName(h);
        const city = getCity(h);
        const country = getCountry(h);
        if (includesQuery(name, qLower) || includesQuery(city, qLower) || includesQuery(country, qLower)) {
          out.push({
            id: `hb-hotel-${getCode(h) ?? name}`,
            name: city || name,
            city: city || undefined,
            country,
            type: "hotel",
            displayName: city ? `${name} — ${city}` : name,
          });
        }
      }
      if (items.length < batch) break;
    } catch (e) {
      logger.error("HotelBeds hotels page error:", e);
      break;
    }
  }
  logger.info("hotelbeds-autocomplete hotels scanned=%d matched=%d", scanned, out.length);
  return out;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { query, limit } = await req.json();
    const q = String(query || "").trim();
    if (q.length < 2) {
      return new Response(JSON.stringify({ results: [] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const qLower = q.toLowerCase();
    const max = Number.isFinite(limit) ? Math.min(Number(limit), 20) : 12;

    // Fetch destinations and hotels in parallel with pagination
    const [destinations, hotels] = await Promise.all([
      fetchDestinationsPaged(qLower, max),
      fetchHotelsPaged(qLower, max),
    ]);

    const merged: Suggestion[] = [...destinations, ...hotels];
    const byKey = new Map<string, Suggestion>();
    for (const s of merged) {
      const key = (s.displayName || s.name || s.id).toLowerCase();
      if (!byKey.has(key)) byKey.set(key, s);
    }
    const unique = Array.from(byKey.values()).slice(0, max);

    return new Response(JSON.stringify({ results: unique }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    logger.error("hotelbeds-autocomplete error:", err);
    return new Response(JSON.stringify({ error: String((err as Error).message || err) }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
