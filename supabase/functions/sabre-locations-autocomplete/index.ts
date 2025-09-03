import { corsHeaders } from '../_shared/cors.ts';

interface SabreAuthResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
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
    logger.error('Sabre auth error:', errorText);
    throw new Error('Failed to authenticate with Sabre API');
  }

  const data: SabreAuthResponse = await response.json();
  return data.access_token;
}

// Search locations using Sabre API
async function searchLocations(query: string, limit: number, accessToken: string): Promise<any> {
  const baseUrl = Deno.env.get('SABRE_BASE_URL') || 'https://api.sabre.com';
  
  // Sabre uses different endpoints for airports vs cities
  // First try airports, then cities if needed
  const endpoints = [
    `/v1/lists/utilities/airports?query=${encodeURIComponent(query)}&limit=${limit}`,
    `/v1/lists/utilities/cities?query=${encodeURIComponent(query)}&limit=${limit}`
  ];

  const results = [];
  
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
        const data = await response.json();
        results.push(data);
      } else {
        logger.warn(`Sabre endpoint ${endpoint} returned ${response.status}`);
      }
    } catch (error) {
      logger.warn(`Error calling Sabre endpoint ${endpoint}:`, error);
    }
  }

  return results;
}

// Transform Sabre location response to standardized format
function transformSabreLocationResponse(sabreResults: any[]): any[] {
  const locations: any[] = [];
  
  try {
    for (const result of sabreResults) {
      // Handle airport results
      if (result.Airports) {
        const airports = Array.isArray(result.Airports) ? result.Airports : [result.Airports];
        
        for (const airport of airports) {
          locations.push({
            type: 'airport',
            iataCode: airport.AirportCode || airport.Code,
            icaoCode: airport.IcaoCode || null,
            name: airport.AirportName || airport.Name,
            city: airport.CityName || airport.City,
            country: airport.CountryName || airport.Country,
            countryCode: airport.CountryCode,
            coordinates: airport.GeoCoordinates ? {
              latitude: parseFloat(airport.GeoCoordinates.Latitude || '0'),
              longitude: parseFloat(airport.GeoCoordinates.Longitude || '0')
            } : null,
            timezone: airport.TimeZoneInfo || null,
            source: 'sabre'
          });
        }
      }

      // Handle city results  
      if (result.Cities) {
        const cities = Array.isArray(result.Cities) ? result.Cities : [result.Cities];
        
        for (const city of cities) {
          locations.push({
            type: 'city',
            iataCode: city.CityCode || city.Code,
            icaoCode: null,
            name: city.CityName || city.Name,
            city: city.CityName || city.Name,
            country: city.CountryName || city.Country,
            countryCode: city.CountryCode,
            coordinates: city.GeoCoordinates ? {
              latitude: parseFloat(city.GeoCoordinates.Latitude || '0'),
              longitude: parseFloat(city.GeoCoordinates.Longitude || '0')
            } : null,
            timezone: city.TimeZoneInfo || null,
            source: 'sabre'
          });
        }
      }

      // Handle generic location results (fallback)
      if (result.Locations) {
        const locations_data = Array.isArray(result.Locations) ? result.Locations : [result.Locations];
        
        for (const location of locations_data) {
          locations.push({
            type: location.Type?.toLowerCase() || 'location',
            iataCode: location.Code,
            icaoCode: location.IcaoCode || null,
            name: location.Name || location.Description,
            city: location.CityName || location.City || location.Name,
            country: location.CountryName || location.Country,
            countryCode: location.CountryCode,
            coordinates: location.Position || location.GeoCoordinates ? {
              latitude: parseFloat(location.Position?.Latitude || location.GeoCoordinates?.Latitude || '0'),
              longitude: parseFloat(location.Position?.Longitude || location.GeoCoordinates?.Longitude || '0')
            } : null,
            timezone: location.TimeZone || location.TimeZoneInfo || null,
            source: 'sabre'
          });
        }
      }
    }

    // Remove duplicates based on IATA code
    const uniqueLocations = locations.reduce((acc, current) => {
      const existing = acc.find(item => item.iataCode === current.iataCode);
      if (!existing && current.iataCode) {
        acc.push(current);
      }
      return acc;
    }, []);

    return uniqueLocations.slice(0, 20); // Limit results
  } catch (error) {
    logger.error('Error transforming Sabre location response:', error);
    return [];
  }
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logger.info('Sabre locations autocomplete request received');
    
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

    logger.info('Getting Sabre access token...');
    const accessToken = await getSabreAccessToken();
    
    logger.info(`Searching locations for query: ${query}`);
    const sabreResults = await searchLocations(query, limit, accessToken);
    
    logger.info('Sabre location data received, transforming...');
    const transformedLocations = transformSabreLocationResponse(sabreResults);
    
    return new Response(
      JSON.stringify({
        success: true,
        suggestions: transformedLocations,
        source: 'sabre',
        query: query,
        count: transformedLocations.length,
        rawData: sabreResults // Include for debugging
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    logger.error('Error in sabre-locations-autocomplete:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'An unexpected error occurred',
        source: 'sabre'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});