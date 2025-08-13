import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface AmadeusLocation {
  id: string;
  type: string; // location
  subType: "AIRPORT" | "CITY" | string;
  name: string;
  iataCode?: string;
  address?: {
    cityName?: string;
    countryName?: string;
    countryCode?: string;
  };
  geoCode?: { latitude: number; longitude: number };
}

async function getAmadeusAccessToken(): Promise<string> {
  const clientId = Deno.env.get("AMADEUS_CLIENT_ID");
  const clientSecret = Deno.env.get("AMADEUS_CLIENT_SECRET");
  if (!clientId || !clientSecret) throw new Error("Missing Amadeus credentials");

  const resp = await fetch("https://test.api.amadeus.com/v1/security/oauth2/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      client_id: clientId,
      client_secret: clientSecret,
    }),
  });

  if (!resp.ok) {
    const txt = await resp.text();
    throw new Error(`Amadeus auth failed: ${resp.status} ${txt}`);
  }
  const json = await resp.json();
  return json.access_token as string;
}

function normalize(loc: AmadeusLocation) {
  const type = loc.subType === "AIRPORT" ? "airport" : "city";
  return {
    id: loc.id,
    name: loc.name,
    city: loc.address?.cityName || undefined,
    country: loc.address?.countryName || loc.address?.countryCode || "",
    code: loc.iataCode,
    type,
    coordinates: loc.geoCode ? [loc.geoCode.longitude, loc.geoCode.latitude] as [number, number] : undefined,
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const query = String(body?.query ?? "").trim();
    const types = Array.isArray(body?.types) ? body.types : undefined;
    const limit = body?.limit;

    if (query.length < 2) {
      return new Response(JSON.stringify({ results: [] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const accessToken = await getAmadeusAccessToken();
    const requestedTypes = Array.isArray(types) && types.length > 0 ? types : ["CITY"]; // default to CITY only
    const max = Number.isFinite(limit) ? Math.min(Number(limit), 20) : 12;

    // Helpers - handle single subType at a time
    const tryLocations = async (keyword: string, subType: string): Promise<AmadeusLocation[]> => {
      const url = new URL("https://test.api.amadeus.com/v1/reference-data/locations");
      url.searchParams.set("subType", subType);
      url.searchParams.set("keyword", keyword);
      url.searchParams.set("page[limit]", String(max));
      const resp = await fetch(url.toString(), { headers: { Authorization: `Bearer ${accessToken}` } });
      if (!resp.ok) {
        const txt = await resp.text();
        console.error("Amadeus locations error:", resp.status, txt);
        return [];
      }
      const payload = await resp.json();
      return Array.isArray(payload?.data) ? (payload.data as AmadeusLocation[]) : [];
    };

    const tryCitiesEndpoint = async (keyword: string): Promise<AmadeusLocation[]> => {
      const url = new URL("https://test.api.amadeus.com/v1/reference-data/locations/cities");
      url.searchParams.set("keyword", keyword);
      url.searchParams.set("max", String(max));
      const resp = await fetch(url.toString(), { headers: { Authorization: `Bearer ${accessToken}` } });
      if (!resp.ok) {
        const txt = await resp.text();
        console.error("Amadeus cities endpoint error:", resp.status, txt);
        return [];
      }
      const payload = await resp.json();
      return Array.isArray(payload?.data) ? (payload.data as AmadeusLocation[]) : [];
    };

    let data: AmadeusLocation[] = [];

    // 1) Primary: try each requested type separately and combine results
    for (const type of requestedTypes) {
      const typeResults = await tryLocations(query, type);
      console.log("amadeus-locations step=locations subtype=%s q=%s count=%d", type, query, typeResults.length);
      data.push(...typeResults);
    }

    // 2) Fallback: cities endpoint (only if CITY is allowed and no results yet)
    if (data.length === 0 && requestedTypes.includes("CITY")) {
      const cities = await tryCitiesEndpoint(query);
      console.log("amadeus-locations step=cities-endpoint q=%s count=%d", query, cities.length);
      data = cities;
    }

    // 3) Fallback: prefix search using first 3 chars for each type
    if (data.length === 0 && query.length >= 3) {
      const prefix = query.slice(0, 3);
      for (const type of requestedTypes) {
        const retry = await tryLocations(prefix, type);
        console.log("amadeus-locations step=prefix q=%s prefix=%s subtype=%s count=%d", query, prefix, type, retry.length);
        data.push(...retry);
      }
    }

    // Normalize and filter out airports unless explicitly requested
    const results = data
      .map(normalize)
      .filter((r) => requestedTypes.includes("AIRPORT") ? true : r.type !== "airport")
      .slice(0, max);

    return new Response(JSON.stringify({ results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("amadeus-locations-autocomplete error:", err);
    return new Response(JSON.stringify({ error: String((err as any)?.message || err) }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
