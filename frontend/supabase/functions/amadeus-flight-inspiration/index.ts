import { corsHeaders } from '../_shared/cors.ts';
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import logger from "../_shared/logger.ts";

interface AmadeusAuthResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

interface PopularDestination {
  id: string;
  destination: string;
  departure: string;
  price?: {
    total: string;
    currency: string;
  };
  departureDate?: string;
  returnDate?: string;
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
    throw new Error(`Failed to get Amadeus token: ${response.statusText}`);
  }

  const authData: AmadeusAuthResponse = await response.json();
  return authData.access_token;
}

async function getMostTraveledDestinations(accessToken: string, originLocationCode: string = 'SYD'): Promise<PopularDestination[]> {
  try {
    const response = await fetch(
      `https://test.api.amadeus.com/v1/travel/analytics/air-traffic/traveled?originCityCode=${originLocationCode}&period=2024-11`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      }
    );

    if (!response.ok) {
      logger.info(`Most traveled destinations API failed: ${response.statusText}`);
      return [];
    }

    const data = await response.json();
    
    return data.data?.slice(0, 6).map((item: any, index: number) => ({
      id: `${originLocationCode}-${item.destination}-${index}`,
      destination: item.destination,
      departure: originLocationCode,
    })) || [];
  } catch (error) {
    logger.error('Error fetching most traveled destinations:', error);
    return [];
  }
}

async function getFlightInspiration(accessToken: string, origin: string = 'SYD'): Promise<PopularDestination[]> {
  try {
    const departureDate = new Date();
    departureDate.setDate(departureDate.getDate() + 14); // 2 weeks from now
    
    const response = await fetch(
      `https://test.api.amadeus.com/v1/shopping/flight-destinations?origin=${origin}&departureDate=${departureDate.toISOString().split('T')[0]}&maxPrice=2000`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      }
    );

    if (!response.ok) {
      logger.info(`Flight inspiration API failed: ${response.statusText}`);
      return [];
    }

    const data = await response.json();
    
    return data.data?.slice(0, 8).map((item: any, index: number) => ({
      id: `inspiration-${origin}-${item.destination}-${index}`,
      destination: item.destination,
      departure: origin,
      price: {
        total: item.price?.total || '299',
        currency: item.price?.currency || 'AUD',
      },
      departureDate: item.departureDate,
      returnDate: item.returnDate,
    })) || [];
  } catch (error) {
    logger.error('Error fetching flight inspiration:', error);
    return [];
  }
}

function generateMockInspirationData(): PopularDestination[] {
  const mockRoutes = [
    { destination: 'BOM', departure: 'SYD', price: { total: '899', currency: 'AUD' } },
    { destination: 'LON', departure: 'SYD', price: { total: '1299', currency: 'AUD' } },
    { destination: 'NYC', departure: 'SYD', price: { total: '1499', currency: 'AUD' } },
    { destination: 'BKK', departure: 'SYD', price: { total: '599', currency: 'AUD' } },
    { destination: 'LAX', departure: 'SYD', price: { total: '1199', currency: 'AUD' } },
    { destination: 'SIN', departure: 'SYD', price: { total: '649', currency: 'AUD' } },
    { destination: 'NRT', departure: 'SYD', price: { total: '799', currency: 'AUD' } },
    { destination: 'DXB', departure: 'SYD', price: { total: '949', currency: 'AUD' } },
  ];

  const departureDate = new Date();
  departureDate.setDate(departureDate.getDate() + 14);
  
  const returnDate = new Date(departureDate);
  returnDate.setDate(returnDate.getDate() + 7);

  return mockRoutes.map((route, index) => ({
    id: `mock-${route.departure}-${route.destination}-${index}`,
    ...route,
    departureDate: departureDate.toISOString().split('T')[0],
    returnDate: returnDate.toISOString().split('T')[0],
  }));
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { searchParams } = new URL(req.url);
    const origin = searchParams.get('origin') || 'SYD';
    const type = searchParams.get('type') || 'inspiration'; // 'inspiration', 'popular', 'both'

    logger.info(`Fetching flight inspiration data for origin: ${origin}, type: ${type}`);

    const accessToken = await getAmadeusAccessToken();
    
    let inspirationData: PopularDestination[] = [];
    let popularData: PopularDestination[] = [];

    if (type === 'inspiration' || type === 'both') {
      inspirationData = await getFlightInspiration(accessToken, origin);
      
      // Fallback to mock data if API fails
      if (inspirationData.length === 0) {
        logger.info('Using mock inspiration data as fallback');
        inspirationData = generateMockInspirationData();
      }
    }

    if (type === 'popular' || type === 'both') {
      popularData = await getMostTraveledDestinations(accessToken, origin);
    }

    const result = {
      success: true,
      data: {
        inspiration: inspirationData,
        popular: popularData,
        origin: origin,
        timestamp: new Date().toISOString(),
      }
    };

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    logger.error('Error in flight inspiration function:', error);
    
    // Return mock data as fallback
    const mockData = generateMockInspirationData();
    
    return new Response(JSON.stringify({
      success: true,
      data: {
        inspiration: mockData,
        popular: [],
        origin: 'SYD',
        timestamp: new Date().toISOString(),
      },
      fallback: true,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});