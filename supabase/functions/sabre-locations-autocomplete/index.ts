const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SabreAuthResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

interface SabreGeoCoordinates {
  Latitude?: string;
  Longitude?: string;
}

interface SabreAirport {
  AirportCode?: string;
  Code?: string;
  IcaoCode?: string;
  AirportName?: string;
  Name?: string;
  CityName?: string;
  City?: string;
  CountryName?: string;
  Country?: string;
  CountryCode?: string;
  GeoCoordinates?: SabreGeoCoordinates;
  TimeZoneInfo?: string;
}

interface SabreCity {
  CityCode?: string;
  Code?: string;
  CityName?: string;
  Name?: string;
  CountryName?: string;
  Country?: string;
  CountryCode?: string;
  GeoCoordinates?: SabreGeoCoordinates;
  TimeZoneInfo?: string;
}

interface SabreGenericLocation {
  Type?: string;
  Code?: string;
  IcaoCode?: string;
  Name?: string;
  Description?: string;
  CityName?: string;
  City?: string;
  CountryName?: string;
  Country?: string;
  CountryCode?: string;
  Position?: SabreGeoCoordinates;
  GeoCoordinates?: SabreGeoCoordinates;
  TimeZone?: string;
  TimeZoneInfo?: string;
}

interface SabreLocationResponse {
  Airports?: SabreAirport | SabreAirport[];
  Cities?: SabreCity | SabreCity[];
  Locations?: SabreGenericLocation | SabreGenericLocation[];
}

interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface LocationSearchResult {
  type: 'airport' | 'city' | 'location';
  iataCode?: string;
  icaoCode?: string | null;
  name?: string;
  city?: string;
  country?: string;
  countryCode?: string;
  coordinates: Coordinates | null;
  timezone: string | null;
  source: 'sabre';
}

// Get Sabre access token
async function getSabreAccessToken(): Promise<string> {
  const clientId = Deno.env.get('SABRE_CLIENT_ID');
  const clientSecret = Deno.env.get('SABRE_CLIENT_SECRET');
  const baseUrl = Deno.env.get('SABRE_BASE_URL') || 'https://api.sabre.com';

  if (!clientId || !clientSecret) {
    throw new Error('Missing Sabre API credentials');
  }

  const credentials = btoa(`${clientId}:${clientSecret}`);

  const response = await fetch(`${baseUrl}/v2/auth/token`, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${credentials}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Sabre auth error:', errorText);
    throw new Error('Failed to authenticate with Sabre API');
  }

  const data: SabreAuthResponse = await response.json();
  return data.access_token;
}

// Search locations using Sabre API
async function searchLocations(query: string, limit: number, accessToken: string): Promise<LocationSearchResult[]> {
  const baseUrl = Deno.env.get('SABRE_BASE_URL') || 'https://api.sabre.com';

  // Sabre uses different endpoints for airports vs cities
  // First try airports, then cities if needed
  const endpoints = [
    `/v1/lists/utilities/airports?query=${encodeURIComponent(query)}&limit=${limit}`,
    `/v1/lists/utilities/cities?query=${encodeURIComponent(query)}&limit=${limit}`
  ];

  const results: SabreLocationResponse[] = [];

  for (const endpoint of endpoints) {
    try {
      const response = await fetch(`${baseUrl}${endpoint}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data: SabreLocationResponse = await response.json();
        results.push(data);
      } else {
        console.warn(`Sabre endpoint ${endpoint} returned ${response.status}`);
      }
    } catch (error) {
      console.warn(`Error calling Sabre endpoint ${endpoint}:`, error);
    }
  }

  return transformSabreLocationResponse(results);
}

// Transform Sabre location response to standardized format
function transformSabreLocationResponse(sabreResults: SabreLocationResponse[]): LocationSearchResult[] {
  const locations: LocationSearchResult[] = [];
  
  try {
    for (const result of sabreResults) {
      // Handle airport results
      if (result.Airports) {
        const airports: SabreAirport[] = Array.isArray(result.Airports) ? result.Airports : [result.Airports];

        for (const airport of airports) {
          const lat = airport.GeoCoordinates?.Latitude;
          const lon = airport.GeoCoordinates?.Longitude;
          locations.push({
            type: 'airport',
            iataCode: airport.AirportCode || airport.Code,
            icaoCode: airport.IcaoCode || null,
            name: airport.AirportName || airport.Name,
            city: airport.CityName || airport.City,
            country: airport.CountryName || airport.Country,
            countryCode: airport.CountryCode,
            coordinates: lat && lon ? {
              latitude: parseFloat(lat),
              longitude: parseFloat(lon)
            } : null,
            timezone: airport.TimeZoneInfo || null,
            source: 'sabre'
          });
        }
      }

      // Handle city results  
      if (result.Cities) {
        const cities: SabreCity[] = Array.isArray(result.Cities) ? result.Cities : [result.Cities];

        for (const city of cities) {
          const lat = city.GeoCoordinates?.Latitude;
          const lon = city.GeoCoordinates?.Longitude;
          locations.push({
            type: 'city',
            iataCode: city.CityCode || city.Code,
            name: city.CityName || city.Name,
            city: city.CityName || city.Name,
            country: city.CountryName || city.Country,
            countryCode: city.CountryCode,
            coordinates: lat && lon ? {
              latitude: parseFloat(lat),
              longitude: parseFloat(lon)
            } : null,
            timezone: city.TimeZoneInfo || null,
            source: 'sabre'
          });
        }
      }

      // Handle generic location results (fallback)
      if (result.Locations) {
        const genericLocations: SabreGenericLocation[] = Array.isArray(result.Locations)
          ? result.Locations
          : [result.Locations];

        for (const location of genericLocations) {
          const lat = location.Position?.Latitude ?? location.GeoCoordinates?.Latitude;
          const lon = location.Position?.Longitude ?? location.GeoCoordinates?.Longitude;
          locations.push({
            type: location.Type?.toLowerCase() || 'location',
            iataCode: location.Code,
            icaoCode: location.IcaoCode || null,
            name: location.Name || location.Description,
            city: location.CityName || location.City || location.Name,
            country: location.CountryName || location.Country,
            countryCode: location.CountryCode,
            coordinates: lat && lon ? {
              latitude: parseFloat(lat),
              longitude: parseFloat(lon)
            } : null,
            timezone: location.TimeZone || location.TimeZoneInfo || null,
            source: 'sabre'
          });
        }
      }
    }

    // Remove duplicates based on IATA code
    const uniqueLocations = locations.reduce<LocationSearchResult[]>((acc, current) => {
      const existing = acc.find(
        item =>
          (current.iataCode && item.iataCode === current.iataCode) ||
          (current.icaoCode && item.icaoCode === current.icaoCode)
      );
      if (!existing) {
        acc.push(current);
      }
      return acc;
    }, []);

    return uniqueLocations.slice(0, 20); // Limit results
  } catch (error) {
    console.error('Error transforming Sabre location response:', error);
    return [];
  }
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Sabre locations autocomplete request received');
    
    const body = await req.json();
    const { query, limit = 10 } = body;

    // Validate required parameters
    if (!query || query.length < 2) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Query parameter must be at least 2 characters long' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('Getting Sabre access token...');
    const accessToken = await getSabreAccessToken();
    
    console.log(`Searching locations for query: ${query}`);
    const locations = await searchLocations(query, limit, accessToken);

    return new Response(
      JSON.stringify({
        success: true,
        suggestions: locations,
        source: 'sabre',
        query: query,
        count: locations.length
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error in sabre-locations-autocomplete:', error);
    const message = error instanceof Error ? error.message : 'An unexpected error occurred';
    return new Response(
      JSON.stringify({
        success: false,
        error: message,
        source: 'sabre'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});