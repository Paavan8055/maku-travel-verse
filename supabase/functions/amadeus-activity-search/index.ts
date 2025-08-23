import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

// Simple logger fallback to avoid import errors
const logger = {
  info: (msg: any, ...args: any[]) => console.log('[INFO]', msg, ...args),
  error: (msg: any, ...args: any[]) => console.error('[ERROR]', msg, ...args),
  warn: (msg: any, ...args: any[]) => console.warn('[WARN]', msg, ...args),
  debug: (msg: any, ...args: any[]) => console.debug('[DEBUG]', msg, ...args),
};

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ActivitySearchParams {
  latitude?: number;
  longitude?: number;
  destination?: string;
  date?: string;
  participants?: number;
  radius?: number;
  north?: number;
  west?: number;
  south?: number;
  east?: number;
}

async function getAmadeusAccessToken(): Promise<string> {
  const clientId = Deno.env.get('AMADEUS_CLIENT_ID');
  const clientSecret = Deno.env.get('AMADEUS_CLIENT_SECRET');
  
  if (!clientId || !clientSecret) {
    throw new Error('Amadeus credentials not configured');
  }

  const response = await fetch('https://test.api.amadeus.com/v1/security/oauth2/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: clientId,
      client_secret: clientSecret,
    }),
  });

  if (!response.ok) {
    throw new Error(`Amadeus auth failed: ${response.statusText}`);
  }

  const data = await response.json();
  return data.access_token;
}

async function searchActivities(params: ActivitySearchParams, accessToken: string) {
  const searchParams = new URLSearchParams();

  if (params.north && params.west && params.south && params.east) {
    // Using square search
    searchParams.append('north', params.north.toString());
    searchParams.append('west', params.west.toString());
    searchParams.append('south', params.south.toString());
    searchParams.append('east', params.east.toString());
  } else {
    // Using radius search
    searchParams.append('latitude', params.latitude.toString());
    searchParams.append('longitude', params.longitude.toString());
    if (params.radius) {
      searchParams.append('radius', params.radius.toString());
    }
  }

  const response = await fetch(`https://test.api.amadeus.com/v1/shopping/activities?${searchParams}`, {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    logger.error('Activity search API error:', errorText);
    throw new Error(`Activity search failed: ${response.statusText}`);
  }

  return await response.json();
}

function generateSearchKey(params: ActivitySearchParams): string {
  const keyData = {
    lat: params.latitude || 0,
    lng: params.longitude || 0,
    destination: params.destination || null,
    radius: params.radius || null,
    bbox: params.north ? {
      north: params.north,
      west: params.west,
      south: params.south,
      east: params.east
    } : null,
  };
  
  return btoa(JSON.stringify(keyData));
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const body = await req.json();
    logger.info('[ACTIVITY-SEARCH] Request body:', body);

    // Convert destination to coordinates if needed
    let params: ActivitySearchParams;
    if (body.destination && !body.latitude) {
      // Simple geocoding map for common destinations
      const locationMap: { [key: string]: { lat: number; lng: number } } = {
        'sydney': { lat: -33.8688, lng: 151.2093 },
        'melbourne': { lat: -37.8136, lng: 144.9631 },
        'brisbane': { lat: -27.4698, lng: 153.0251 },
        'paris': { lat: 48.8566, lng: 2.3522 },
        'london': { lat: 51.5074, lng: -0.1278 },
        'new york': { lat: 40.7128, lng: -74.0060 },
        'tokyo': { lat: 35.6762, lng: 139.6503 },
        'mumbai': { lat: 19.0760, lng: 72.8777 }
      };
      
      const coords = locationMap[body.destination.toLowerCase()] || { lat: -33.8688, lng: 151.2093 };
      params = {
        latitude: coords.lat,
        longitude: coords.lng,
        radius: 20,
        destination: body.destination,
        date: body.date,
        participants: body.participants
      };
    } else {
      params = body;
    }

    logger.info('[ACTIVITY-SEARCH] Processed params:', params);
    const searchKey = generateSearchKey(params);
    
    // Check cache first
    const { data: cached, error: cacheError } = await supabase
      .from('activities_offers_cache')
      .select('*')
      .eq('search_key', searchKey)
      .gt('ttl_expires_at', new Date().toISOString())
      .single();

    if (cached && !cacheError) {
      logger.info('[ACTIVITY-SEARCH] Cache hit');
      return new Response(JSON.stringify({
        success: true,
        data: cached.offers,
        source: 'cache'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Cache miss - call Amadeus
    logger.info('[ACTIVITY-SEARCH] Cache miss, calling Amadeus');
    const accessToken = await getAmadeusAccessToken();
    const amadeusData = await searchActivities(params, accessToken);

    // Save to cache via RPC
    const ttlExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    const bbox = params.north ? {
      north: params.north,
      west: params.west,
      south: params.south,
      east: params.east
    } : null;

    await supabase.rpc('save_activity_search', {
      p_search_key: searchKey,
      p_city_iata: null,
      p_bbox: bbox,
      p_from: new Date().toISOString().split('T')[0],
      p_to: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      p_offers: amadeusData,
      p_ttl: ttlExpires.toISOString()
    });

    logger.info('[ACTIVITY-SEARCH] Search completed, activities:', amadeusData.data?.length || 0);

    return new Response(JSON.stringify({
      success: true,
      data: amadeusData,
      source: 'amadeus'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    logger.error('[ACTIVITY-SEARCH] Error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});