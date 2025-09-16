import { corsHeaders } from '../_shared/cors.ts';
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import logger from "../_shared/logger.ts";


interface AmadeusAuthResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

interface FlightBookingParams {
  flightOffers: any[];
  passengers: {
    id: string;
    dateOfBirth: string;
    name: {
      firstName: string;
      lastName: string;
    };
    gender: string;
    contact: {
      emailAddress: string;
      phones: {
        deviceType: string;
        countryCallingCode: string;
        number: string;
      }[];
    };
    documents: {
      documentType: string;
      number: string;
      expiryDate: string;
      issuanceCountry: string;
      nationality: string;
      holder: boolean;
    }[];
  }[];
  remarks?: {
    general?: {
      subType: string;
      text: string;
    }[];
  };
  ticketingAgreement?: {
    option: string;
    delay?: string;
  };
  contacts?: {
    addresseeName: {
      firstName: string;
      lastName: string;
    };
    companyName?: string;
    purpose: string;
    phones: {
      deviceType: string;
      countryCallingCode: string;
      number: string;
    }[];
    emailAddress: string;
    address: {
      lines: string[];
      postalCode: string;
      cityName: string;
      countryCode: string;
    };
  }[];
}

const getAmadeusAccessToken = async (): Promise<string> => {
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

  const data: AmadeusAuthResponse = await response.json();
  return data.access_token;
};

const createFlightOrder = async (params: FlightBookingParams, accessToken: string) => {
  const response = await fetch('https://test.api.amadeus.com/v1/booking/flight-orders', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      data: {
        type: 'flight-order',
        flightOffers: params.flightOffers,
        travelers: params.passengers,
        remarks: params.remarks,
        ticketingAgreement: params.ticketingAgreement || {
          option: 'DELAY_TO_CANCEL',
          delay: '6D'
        },
        contacts: params.contacts
      }
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    logger.error('Amadeus booking error:', errorText);
    throw new Error(`Flight booking failed: ${response.statusText} - ${errorText}`);
  }

  return await response.json();
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const bookingParams: FlightBookingParams = await req.json();
    
    logger.info('Creating flight booking with Amadeus:', {
      flightOffersCount: bookingParams.flightOffers?.length,
      passengersCount: bookingParams.passengers?.length
    });

    // Get Amadeus access token
    const accessToken = await getAmadeusAccessToken();
    
    // Create flight order
    const flightOrder = await createFlightOrder(bookingParams, accessToken);
    
    logger.info('Flight booking successful:', flightOrder.data?.id);

    // Transform the response to our format
    const booking = {
      id: flightOrder.data?.id,
      type: 'flight',
      status: flightOrder.data?.flightOffers?.[0]?.bookingStatus || 'confirmed',
      reference: flightOrder.data?.associatedRecords?.[0]?.reference,
      travelers: flightOrder.data?.travelers,
      flightOffers: flightOrder.data?.flightOffers,
      contacts: flightOrder.data?.contacts,
      ticketingAgreement: flightOrder.data?.ticketingAgreement,
      documents: flightOrder.data?.documents,
      createdAt: new Date().toISOString()
    };

    return new Response(JSON.stringify({
      success: true,
      booking: booking,
      rawResponse: flightOrder // Include raw response for debugging
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    logger.error('Flight booking error:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message || 'Flight booking failed'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});