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
    const { query, types, limit } = await req.json();
    if (!query || String(query).trim().length < 2) {
      return new Response(JSON.stringify({ results: [] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const accessToken = await getAmadeusAccessToken();
    const typeParam = Array.isArray(types) && types.length > 0 ? types.join(",") : "CITY,AIRPORT";
    const max = Number.isFinite(limit) ? Math.min(Number(limit), 20) : 12;

    const url = new URL("https://test.api.amadeus.com/v1/reference-data/locations");
    url.searchParams.set("subType", typeParam);
    url.searchParams.set("keyword", String(query));
    url.searchParams.set("page[limit]", String(max));

    const resp = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!resp.ok) {
      const txt = await resp.text();
      console.error("Amadeus locations error:", resp.status, txt);
      return new Response(JSON.stringify({ results: [] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const payload = await resp.json();
    const data: AmadeusLocation[] = Array.isArray(payload?.data) ? payload.data : [];
    const results = data.map(normalize);

    return new Response(JSON.stringify({ results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("amadeus-locations-autocomplete error:", err);
    return new Response(JSON.stringify({ error: String(err?.message || err) }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
