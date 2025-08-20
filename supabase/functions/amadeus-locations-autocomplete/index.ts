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

// Cache for access tokens
let tokenCache: { token: string; expires: number } | null = null;

// Rate limiting with exponential backoff
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Enhanced fallback airport data
const MAJOR_AIRPORTS = [
  { iata: "TRV", name: "Trivandrum International Airport", city: "Trivandrum", country: "India" },
  { iata: "COK", name: "Cochin International Airport", city: "Kochi", country: "India" },
  { iata: "BOM", name: "Chhatrapati Shivaji International Airport", city: "Mumbai", country: "India" },
  { iata: "DEL", name: "Indira Gandhi International Airport", city: "Delhi", country: "India" },
  { iata: "SYD", name: "Sydney Kingsford Smith Airport", city: "Sydney", country: "Australia" },
  { iata: "MEL", name: "Melbourne Airport", city: "Melbourne", country: "Australia" },
  { iata: "BNE", name: "Brisbane Airport", city: "Brisbane", country: "Australia" },
  { iata: "PER", name: "Perth Airport", city: "Perth", country: "Australia" },
  { iata: "ADL", name: "Adelaide Airport", city: "Adelaide", country: "Australia" },
  { iata: "DRW", name: "Darwin Airport", city: "Darwin", country: "Australia" },
  { iata: "SIN", name: "Singapore Changi Airport", city: "Singapore", country: "Singapore" },
  { iata: "BKK", name: "Suvarnabhumi Airport", city: "Bangkok", country: "Thailand" },
  { iata: "NRT", name: "Narita International Airport", city: "Tokyo", country: "Japan" },
  { iata: "LAX", name: "Los Angeles International Airport", city: "Los Angeles", country: "United States" },
  { iata: "LHR", name: "London Heathrow Airport", city: "London", country: "United Kingdom" },
  { iata: "DXB", name: "Dubai International Airport", city: "Dubai", country: "United Arab Emirates" }
];

async function getAmadeusAccessToken(): Promise<string> {
  // Check cache first
  if (tokenCache && tokenCache.expires > Date.now()) {
    return tokenCache.token;
  }

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
  
  // Cache token for 25 minutes (tokens last 30 minutes)
  tokenCache = {
    token: json.access_token,
    expires: Date.now() + (25 * 60 * 1000)
  };
  
  return json.access_token as string;
}

// Extract IATA code from query (e.g., "Trivandrum (TRV)" -> "TRV")
function extractIataCode(query: string): string | null {
  const match = query.match(/\(([A-Z]{3})\)/);
  return match ? match[1] : null;
}

// Check if query is likely an IATA code
function isIataCode(query: string): boolean {
  return /^[A-Z]{3}$/.test(query.toUpperCase());
}

// Search fallback airport data
function searchFallbackAirports(query: string, limit: number = 12) {
  const searchTerm = query.toLowerCase();
  const iataCode = extractIataCode(query) || (isIataCode(query) ? query.toUpperCase() : null);
  
  return MAJOR_AIRPORTS
    .filter(airport => {
      if (iataCode) return airport.iata === iataCode;
      return airport.name.toLowerCase().includes(searchTerm) ||
             airport.city.toLowerCase().includes(searchTerm) ||
             airport.iata.toLowerCase().includes(searchTerm);
    })
    .slice(0, limit)
    .map(airport => ({
      id: airport.iata,
      name: airport.name,
      city: airport.city,
      country: airport.country,
      code: airport.iata,
      type: "airport",
      coordinates: undefined
    }));
}

// API call with retry and exponential backoff
async function callAmadeusWithRetry<T>(
  apiCall: () => Promise<T>, 
  maxRetries: number = 3
): Promise<T | null> {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await apiCall();
    } catch (error: any) {
      const is429 = error.message?.includes('429') || error.status === 429;
      const isLastAttempt = attempt === maxRetries - 1;
      
      if (is429 && !isLastAttempt) {
        // Exponential backoff: 1s, 2s, 4s
        const delayMs = Math.pow(2, attempt) * 1000;
        console.log(`Rate limited, retrying in ${delayMs}ms (attempt ${attempt + 1}/${maxRetries})`);
        await delay(delayMs);
        continue;
      }
      
      if (isLastAttempt) {
        console.error(`Final attempt failed:`, error.message);
        return null;
      }
      
      throw error;
    }
  }
  return null;
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
    // Default to AIRPORT for better airport search results
    const requestedTypes = Array.isArray(types) && types.length > 0 ? types : ["AIRPORT"];
    const max = Number.isFinite(limit) ? Math.min(Number(limit), 20) : 12;

    // Enhanced API helpers with retry logic
    const tryLocations = async (keyword: string, subType: string): Promise<AmadeusLocation[]> => {
      return await callAmadeusWithRetry(async () => {
        const url = new URL("https://test.api.amadeus.com/v1/reference-data/locations");
        url.searchParams.set("subType", subType);
        url.searchParams.set("keyword", keyword);
        url.searchParams.set("page[limit]", String(max));
        const resp = await fetch(url.toString(), { headers: { Authorization: `Bearer ${accessToken}` } });
        if (!resp.ok) {
          const txt = await resp.text();
          throw new Error(`Amadeus locations error: ${resp.status} ${txt}`);
        }
        const payload = await resp.json();
        return Array.isArray(payload?.data) ? (payload.data as AmadeusLocation[]) : [];
      }) || [];
    };

    const tryAirportsEndpoint = async (keyword: string): Promise<AmadeusLocation[]> => {
      return await callAmadeusWithRetry(async () => {
        const url = new URL("https://test.api.amadeus.com/v1/reference-data/locations/airports");
        url.searchParams.set("keyword", keyword);
        url.searchParams.set("page[limit]", String(max));
        const resp = await fetch(url.toString(), { headers: { Authorization: `Bearer ${accessToken}` } });
        if (!resp.ok) {
          const txt = await resp.text();
          throw new Error(`Amadeus airports error: ${resp.status} ${txt}`);
        }
        const payload = await resp.json();
        return Array.isArray(payload?.data) ? (payload.data as AmadeusLocation[]) : [];
      }) || [];
    };

    const tryCitiesEndpoint = async (keyword: string): Promise<AmadeusLocation[]> => {
      return await callAmadeusWithRetry(async () => {
        const url = new URL("https://test.api.amadeus.com/v1/reference-data/locations/cities");
        url.searchParams.set("keyword", keyword);
        url.searchParams.set("max", String(max));
        const resp = await fetch(url.toString(), { headers: { Authorization: `Bearer ${accessToken}` } });
        if (!resp.ok) {
          const txt = await resp.text();
          throw new Error(`Amadeus cities error: ${resp.status} ${txt}`);
        }
        const payload = await resp.json();
        return Array.isArray(payload?.data) ? (payload.data as AmadeusLocation[]) : [];
      }) || [];
    };

    let data: AmadeusLocation[] = [];
    const iataCode = extractIataCode(query) || (isIataCode(query) ? query.toUpperCase() : null);

    // Enhanced search strategy
    if (requestedTypes.includes("AIRPORT")) {
      // 1) Direct IATA code search if detected
      if (iataCode) {
        console.log("amadeus-locations step=iata-search code=%s", iataCode);
        const iataResults = await tryLocations(iataCode, "AIRPORT");
        console.log("amadeus-locations step=iata-search code=%s count=%d", iataCode, iataResults.length);
        data.push(...iataResults);
      }

      // 2) Dedicated airports endpoint
      if (data.length === 0) {
        const airportResults = await tryAirportsEndpoint(query);
        console.log("amadeus-locations step=airports-endpoint q=%s count=%d", query, airportResults.length);
        data.push(...airportResults);
      }

      // 3) General locations search for airports
      if (data.length === 0) {
        const locationResults = await tryLocations(query, "AIRPORT");
        console.log("amadeus-locations step=locations subtype=AIRPORT q=%s count=%d", query, locationResults.length);
        data.push(...locationResults);
      }

      // 4) Prefix search with multiple variations
      if (data.length === 0 && query.length >= 3) {
        const variations = [
          query.slice(0, 3),
          query.slice(0, 4),
          query.split(' ')[0]?.slice(0, 3)
        ].filter(Boolean);

        for (const variation of variations) {
          if (data.length > 0) break;
          const prefixResults = await tryLocations(variation, "AIRPORT");
          console.log("amadeus-locations step=prefix-airport q=%s prefix=%s count=%d", query, variation, prefixResults.length);
          data.push(...prefixResults);
        }
      }
    }

    // Search other types (cities, etc.)
    for (const type of requestedTypes.filter(t => t !== "AIRPORT")) {
      if (data.length >= max) break;
      
      const typeResults = await tryLocations(query, type);
      console.log("amadeus-locations step=locations subtype=%s q=%s count=%d", type, query, typeResults.length);
      data.push(...typeResults);
    }

    // Fallback: cities endpoint (if CITY is allowed and no results yet)
    if (data.length === 0 && requestedTypes.includes("CITY")) {
      const cities = await tryCitiesEndpoint(query);
      console.log("amadeus-locations step=cities-endpoint q=%s count=%d", query, cities.length);
      data = cities;
    }

    // Final fallback: local airport data
    if (data.length === 0 && requestedTypes.includes("AIRPORT")) {
      console.log("amadeus-locations step=fallback-local q=%s", query);
      const fallbackResults = searchFallbackAirports(query, max);
      console.log("amadeus-locations step=fallback-local q=%s count=%d", query, fallbackResults.length);
      
      return new Response(JSON.stringify({ 
        results: fallbackResults,
        source: "fallback"
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Normalize and filter results
    const results = data
      .map(normalize)
      .filter((r) => requestedTypes.includes("AIRPORT") ? true : r.type !== "airport")
      .slice(0, max);

    return new Response(JSON.stringify({ 
      results,
      source: "amadeus" 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("amadeus-locations-autocomplete error:", err);
    
    // Emergency fallback for airport searches
    const body = await req.json().catch(() => ({}));
    const query = String(body?.query ?? "").trim();
    const types = Array.isArray(body?.types) ? body.types : undefined;
    const requestedTypes = Array.isArray(types) && types.length > 0 ? types : ["AIRPORT"];
    
    if (requestedTypes.includes("AIRPORT") && query.length >= 2) {
      const fallbackResults = searchFallbackAirports(query, 12);
      console.log("amadeus-locations emergency-fallback q=%s count=%d", query, fallbackResults.length);
      
      return new Response(JSON.stringify({ 
        results: fallbackResults,
        source: "emergency_fallback",
        error: "API temporarily unavailable"
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    
    return new Response(JSON.stringify({ 
      error: String((err as any)?.message || err),
      results: []
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
