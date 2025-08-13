
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

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

const CONTENT_BASE = "https://api.test.hotelbeds.com/hotel-content-api/1.0";

// Use Web Crypto instead of Deno std hash module
const generateHotelBedsSignature = async (apiKey: string, secret: string, timestamp: number): Promise<string> => {
  const encoder = new TextEncoder();
  const data = encoder.encode(apiKey + secret + timestamp);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
  return hashHex;
};

async function hbFetch(path: string) {
  const apiKey = Deno.env.get("HOTELBEDS_API_KEY");
  const secret = Deno.env.get("HOTELBEDS_SECRET");
  if (!apiKey || !secret) {
    throw new Error("HotelBeds credentials not configured");
  }
  const timestamp = Math.floor(Date.now() / 1000);
  const signature = await generateHotelBedsSignature(apiKey, secret, timestamp);

  const resp = await fetch(`${CONTENT_BASE}${path}`, {
    headers: {
      "Api-key": apiKey,
      "X-Signature": signature,
      "Accept": "application/json",
    },
  });
  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`HotelBeds content API ${path} failed: ${resp.status} ${text}`);
  }
  return resp.json();
}

// Coerce any value to a lowercased string before searching
function includesQuery(hay: unknown, q: string) {
  const text = String(hay ?? "").toLowerCase();
  return text.includes(q);
}

// Safe getters handling both string and { content } shapes
const getName = (obj: any): string => obj?.name?.content ?? obj?.name ?? "";
const getCity = (obj: any): string | undefined =>
  obj?.city?.content ?? obj?.city ?? obj?.destinationName ?? undefined;
const getCountry = (obj: any): string =>
  obj?.countryCode ?? obj?.country?.code ?? obj?.country?.isoCode ?? obj?.country ?? "";
const getCode = (obj: any): string | undefined => {
  const code = obj?.code ?? obj?.destinationCode ?? obj?.id;
  return code != null ? String(code) : undefined;
};

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

    // Destinations (cities)
    let destinations: Suggestion[] = [];
    try {
      const destPayload = await hbFetch(`/locations/destinations?fields=all&language=ENG&from=1&to=200`);
      const items = Array.isArray(destPayload?.destinations) ? destPayload.destinations : [];
      destinations = items
        .filter((d: any) => {
          const name = getName(d);
          const code = getCode(d) ?? "";
          const country = getCountry(d);
          return includesQuery(name, qLower) || includesQuery(code, qLower) || includesQuery(country, qLower);
        })
        .slice(0, max)
        .map((d: any): Suggestion => {
          const name = getName(d);
          const country = getCountry(d);
          const code = getCode(d);
          return {
            id: `hb-dest-${code ?? name}`,
            name: name || code || "",
            city: name || undefined,
            country: country,
            code,
            type: "city",
            displayName: name && country ? `${name}, ${country}` : name || code || "",
          };
        });
      console.log("hotelbeds-autocomplete destinations count:", destinations.length);
    } catch (e) {
      console.error("HotelBeds destinations fetch error:", e);
    }

    // Hotels
    let hotels: Suggestion[] = [];
    try {
      const hotelsPayload = await hbFetch(`/hotels?fields=basic&language=ENG&from=1&to=200`);
      const items = Array.isArray(hotelsPayload?.hotels) ? hotelsPayload.hotels : [];
      hotels = items
        .filter((h: any) => includesQuery(h?.name?.content ?? h?.name, qLower))
        .slice(0, max)
        .map((h: any): Suggestion => {
          const name = h?.name?.content ?? h?.name ?? "";
          const city = getCity(h);
          const country = getCountry(h);
          return {
            id: `hb-hotel-${getCode(h) ?? name}`,
            name: city || name,
            city: city || undefined,
            country,
            type: "hotel",
            displayName: city ? `${name} — ${city}` : name,
          };
        });
      console.log("hotelbeds-autocomplete hotels count:", hotels.length);
    } catch (e) {
      console.error("HotelBeds hotels fetch error:", e);
    }

    // Merge results, prioritize destinations (cities), then hotels
    const merged: Suggestion[] = [...destinations, ...hotels];
    const seen = new Set<string>();
    const unique = merged
      .filter((s) => {
        const key = (s.displayName || s.name || s.id).toLowerCase();
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .slice(0, max);

    return new Response(JSON.stringify({ results: unique }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("hotelbeds-autocomplete error:", err);
    return new Response(JSON.stringify({ error: String((err as Error).message || err) }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
