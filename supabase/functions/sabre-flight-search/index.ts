const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SabreAuthResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

interface FlightSearchParams {
  origin: string;
  destination: string;
  departureDate: string;
  returnDate?: string;
  passengers: {
    adults: number;
    children?: number;
    infants?: number;
  };
  cabinClass: string;
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

// Search flights using Sabre API
async function searchFlights(params: FlightSearchParams, accessToken: string): Promise<any> {
  const baseUrl = Deno.env.get('SABRE_BASE_URL') || 'https://api.sabre.com';
  
  const requestBody = {
    "OTA_AirLowFareSearchRQ": {
      "OriginDestinationInformation": [
        {
          "DepartureDateTime": params.departureDate,
          "OriginLocation": {
            "LocationCode": params.origin
          },
          "DestinationLocation": {
            "LocationCode": params.destination
          }
        }
      ],
      "TravelPreferences": {
        "CabinPref": [
          {
            "Cabin": params.cabinClass || "Economy"
          }
        ]
      },
      "TravelerInfoSummary": {
        "AirTravelerAvail": [
          {
            "PassengerTypeQuantity": [
              {
                "Code": "ADT",
                "Quantity": params.passengers.adults
              }
            ]
          }
        ]
      },
      "TPA_Extensions": {
        "IntelliSellTransaction": {
          "RequestType": {
            "Name": "50ITINS"
          }
        }
      }
    }
  };

  // Add return date for round trip
  if (params.returnDate) {
    requestBody.OTA_AirLowFareSearchRQ.OriginDestinationInformation.push({
      "DepartureDateTime": params.returnDate,
      "OriginLocation": {
        "LocationCode": params.destination
      },
      "DestinationLocation": {
        "LocationCode": params.origin
      }
    });
  }

  // Add children if specified
  if (params.passengers.children && params.passengers.children > 0) {
    requestBody.OTA_AirLowFareSearchRQ.TravelerInfoSummary.AirTravelerAvail[0].PassengerTypeQuantity.push({
      "Code": "CNN",
      "Quantity": params.passengers.children
    });
  }

  // Add infants if specified
  if (params.passengers.infants && params.passengers.infants > 0) {
    requestBody.OTA_AirLowFareSearchRQ.TravelerInfoSummary.AirTravelerAvail[0].PassengerTypeQuantity.push({
      "Code": "INF",
      "Quantity": params.passengers.infants
    });
  }

  const response = await fetch(`${baseUrl}/v4.3.0/shop/flights`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const errorText = await response.text();
    logger.error('Sabre flight search error:', errorText);
    throw new Error(`Sabre API error: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

// Transform Sabre response to standardized format
function transformSabreResponse(sabreData: any): any[] {
  try {
    const flights: any[] = [];
    
    if (!sabreData?.OTA_AirLowFareSearchRS?.PricedItineraries?.PricedItinerary) {
      logger.info('No flights found in Sabre response');
      return flights;
    }

    const itineraries = Array.isArray(sabreData.OTA_AirLowFareSearchRS.PricedItineraries.PricedItinerary) 
      ? sabreData.OTA_AirLowFareSearchRS.PricedItineraries.PricedItinerary 
      : [sabreData.OTA_AirLowFareSearchRS.PricedItineraries.PricedItinerary];

    for (const itinerary of itineraries) {
      const airItinerary = itinerary.AirItinerary?.OriginDestinationOptions?.OriginDestinationOption || [];
      const fareInfo = itinerary.AirItineraryPricingInfo?.ItinTotalFare?.TotalFare || {};
      
      const segments = Array.isArray(airItinerary) ? airItinerary : [airItinerary];
      
      for (const segment of segments) {
        const flightSegments = Array.isArray(segment.FlightSegment) ? segment.FlightSegment : [segment.FlightSegment];
        
        const transformedFlight = {
          id: `sabre-${itinerary.SequenceNumber || Math.random()}`,
          source: 'sabre',
          airline: {
            code: flightSegments[0]?.OperatingAirline?.Code || flightSegments[0]?.MarketingAirline?.Code,
            name: flightSegments[0]?.OperatingAirline?.CompanyShortName || flightSegments[0]?.MarketingAirline?.CompanyShortName || 'Unknown Airline'
          },
          flightNumber: flightSegments[0]?.FlightNumber || 'N/A',
          departure: {
            airport: flightSegments[0]?.DepartureAirport?.LocationCode || 'Unknown',
            time: flightSegments[0]?.DepartureDateTime || 'Unknown',
            terminal: flightSegments[0]?.DepartureAirport?.TerminalID || null
          },
          arrival: {
            airport: flightSegments[flightSegments.length - 1]?.ArrivalAirport?.LocationCode || 'Unknown',
            time: flightSegments[flightSegments.length - 1]?.ArrivalDateTime || 'Unknown',
            terminal: flightSegments[flightSegments.length - 1]?.ArrivalAirport?.TerminalID || null
          },
          duration: segment.ElapsedTime || 'N/A',
          stops: flightSegments.length - 1,
          aircraft: flightSegments[0]?.Equipment?.[0]?.AirEquipType || 'N/A',
          price: {
            total: parseFloat(fareInfo.Amount || '0'),
            currency: fareInfo.CurrencyCode || 'USD',
            breakdown: {
              base: parseFloat(fareInfo.Amount || '0'),
              taxes: 0,
              fees: 0
            }
          },
          fareClass: flightSegments[0]?.BookingClassAvail?.[0]?.BookingCode || 'Economy',
          segments: flightSegments.map((seg: any) => ({
            departure: {
              airport: seg.DepartureAirport?.LocationCode,
              time: seg.DepartureDateTime,
              terminal: seg.DepartureAirport?.TerminalID
            },
            arrival: {
              airport: seg.ArrivalAirport?.LocationCode,
              time: seg.ArrivalDateTime,
              terminal: seg.ArrivalAirport?.TerminalID
            },
            flightNumber: seg.FlightNumber,
            airline: seg.OperatingAirline?.Code || seg.MarketingAirline?.Code,
            aircraft: seg.Equipment?.[0]?.AirEquipType,
            duration: seg.ElapsedTime
          })),
          baggage: {
            included: '1 x 23kg checked bag',
            additional: 'Available for purchase'
          },
          amenities: [],
          booking: {
            available: true,
            seatsRemaining: parseInt(flightSegments[0]?.BookingClassAvail?.[0]?.AvailabilityCount || '9'),
            bookingClass: flightSegments[0]?.BookingClassAvail?.[0]?.BookingCode || 'Y'
          }
        };

        flights.push(transformedFlight);
      }
    }

    return flights.slice(0, 50); // Limit to 50 results
  } catch (error) {
    logger.error('Error transforming Sabre response:', error);
    return [];
  }
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logger.info('Sabre flight search request received');
    
    const body = await req.json();
    const {
      origin,
      destination,
      departureDate,
      returnDate,
      passengers = { adults: 1 },
      cabinClass = 'Economy'
    } = body;

    // Validate required parameters
    if (!origin || !destination || !departureDate) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Missing required parameters: origin, destination, or departureDate' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    logger.info('Getting Sabre access token...');
    const accessToken = await getSabreAccessToken();
    
    logger.info('Searching flights with Sabre...');
    const searchParams: FlightSearchParams = {
      origin,
      destination,
      departureDate,
      returnDate,
      passengers,
      cabinClass
    };

    const sabreData = await searchFlights(searchParams, accessToken);
    logger.info('Sabre flight data received, transforming...');
    
    const transformedFlights = transformSabreResponse(sabreData);
    
    return new Response(
      JSON.stringify({
        success: true,
        data: transformedFlights,
        source: 'sabre',
        searchCriteria: searchParams,
        resultCount: transformedFlights.length,
        rawData: sabreData // Include for debugging
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    logger.error('Error in sabre-flight-search:', error);
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