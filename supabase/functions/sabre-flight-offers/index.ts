import 'jsr:@supabase/functions-js/edge-runtime.d.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SabreAuthResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

interface FlightOfferParams {
  origin: string;
  destination: string;
  departureDate: string;
  returnDate?: string;
  adults: number;
  children?: number;
  infants?: number;
  cabinClass?: string;
}

async function getSabreAccessToken(): Promise<string> {
  const clientId = Deno.env.get('SABRE_USER_ID');
  const clientSecret = Deno.env.get('SABRE_PASSWORD');
  const baseUrl = Deno.env.get('SABRE_BASE_URL') || 'https://api-crt.cert.havail.sabre.com';
  if (!clientId || !clientSecret) {
    throw new Error('Missing Sabre API credentials');
  }
  const credentials = btoa(`${clientId}:${clientSecret}`);
  const response = await fetch(`${baseUrl}/v2/auth/token`, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${credentials}`,
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: new URLSearchParams({ grant_type: 'client_credentials' }).toString(),
  });
  if (!response.ok) {
    const errorText = await response.text();
    console.error('Sabre auth error:', errorText);
    throw new Error('Failed to authenticate with Sabre API');
  }
  const data: SabreAuthResponse = await response.json();
  return data.access_token;
}

async function searchOffers(params: FlightOfferParams, accessToken: string): Promise<any> {
  const baseUrl = Deno.env.get('SABRE_BASE_URL') || 'https://api-crt.cert.havail.sabre.com';
  // Build request body for Sabre flight shopping (Bargain Finder)
  const requestBody: any = {
    OTA_AirLowFareSearchRQ: {
      OriginDestinationInformation: [
        {
          DepartureDateTime: params.departureDate,
          OriginLocation: { LocationCode: params.origin },
          DestinationLocation: { LocationCode: params.destination },
        },
      ],
      TravelPreferences: {
        CabinPref: [{ Cabin: params.cabinClass || 'Economy' }],
      },
      TravelerInfoSummary: {
        AirTravelerAvail: [
          {
            PassengerTypeQuantity: [
              { Code: 'ADT', Quantity: params.adults },
            ],
          },
        ],
      },
      TPA_Extensions: {
        IntelliSellTransaction: {
          RequestType: { Name: '50ITINS' },
        },
      },
    },
  };
  if (params.returnDate) {
    requestBody.OTA_AirLowFareSearchRQ.OriginDestinationInformation.push({
      DepartureDateTime: params.returnDate,
      OriginLocation: { LocationCode: params.destination },
      DestinationLocation: { LocationCode: params.origin },
    });
  }
  if (params.children && params.children > 0) {
    requestBody.OTA_AirLowFareSearchRQ.TravelerInfoSummary.AirTravelerAvail[0].PassengerTypeQuantity.push({ Code: 'CNN', Quantity: params.children });
  }
  if (params.infants && params.infants > 0) {
    requestBody.OTA_AirLowFareSearchRQ.TravelerInfoSummary.AirTravelerAvail[0].PassengerTypeQuantity.push({ Code: 'INF', Quantity: params.infants });
  }

  const response = await fetch(`${baseUrl}/v4.3.0/shop/flights`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestBody),
  });
  if (!response.ok) {
    const errorText = await response.text();
    console.error('Sabre search error:', errorText);
    throw new Error(`Sabre API error: ${response.status} ${response.statusText}`);
  }
  return response.json();
}

function transformSabreOffers(sabreData: any): any[] {
  // This function transforms Sabre flight response to our internal format (simplified)
  const flights: any[] = [];
  try {
    const itineraries = Array.isArray(sabreData.OTA_AirLowFareSearchRS?.PricedItineraries?.PricedItinerary)
      ? sabreData.OTA_AirLowFareSearchRS.PricedItineraries.PricedItinerary
      : [sabreData.OTA_AirLowFareSearchRS?.PricedItineraries?.PricedItinerary].filter(Boolean);

    for (const itinerary of itineraries) {
      const airOptions = itinerary.AirItinerary?.OriginDestinationOptions?.OriginDestinationOption || [];
      const pricingInfo = itinerary.AirItineraryPricingInfo?.ItinTotalFare || {};
      const segmentsList = Array.isArray(airOptions) ? airOptions : [airOptions];
      for (const option of segmentsList) {
        const flightSegments = Array.isArray(option.FlightSegment) ? option.FlightSegment : [option.FlightSegment];
        const firstSeg = flightSegments[0];
        const lastSeg = flightSegments[flightSegments.length - 1];
        const transformed = {
          id: `sabre-${firstSeg?.FlightNumber || Math.random()}`,
          source: 'sabre',
          airline: firstSeg?.OperatingAirline?.CompanyShortName || firstSeg?.OperatingAirline?.Code,
          flightNumber: firstSeg?.FlightNumber,
          departure: {
            airport: firstSeg?.DepartureAirport?.LocationCode,
            time: firstSeg?.DepartureDateTime,
          },
          arrival: {
            airport: lastSeg?.ArrivalAirport?.LocationCode,
            time: lastSeg?.ArrivalDateTime,
          },
          stops: flightSegments.length - 1,
          aircraft: firstSeg?.Equipment ? firstSeg.Equipment?.AirEquipType : 'N/A',
          price: {
            total: pricingInfo?.TotalFare?.Amount || '0',
            currency: pricingInfo?.TotalFare?.CurrencyCode || 'USD',
            taxes: '0',
            fees: '0',
          },
          fareClass: option.BookingClassAvail?.[0]?.BookingCode || 'Economy',
        };
        flights.push(transformed);
      }
    }
  } catch (error) {
    console.error('Error transforming Sabre response:', error);
    return [];
  }
  return flights;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  try {
    console.log('Sabre flight offers request received');
    const body = await req.json();
    const {
      origin,
      destination,
      departureDate,
      returnDate,
      adults = 1,
      children = 0,
      infants = 0,
      cabinClass = 'Economy',
    } = body;
    if (!origin || !destination || !departureDate) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing required parameters: origin, destination, or departureDate' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        },
      );
    }
    const accessToken = await getSabreAccessToken();
    const sabreData = await searchOffers(
      { origin, destination, departureDate, returnDate, adults, children, infants, cabinClass },
      accessToken,
    );
    const offers = transformSabreOffers(sabreData);
    return new Response(JSON.stringify({ success: true, offers }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Sabre flight offers error:', error);
    return new Response(JSON.stringify({ success: false, error: String(error) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
