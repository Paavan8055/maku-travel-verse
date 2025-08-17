import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AmadeusAuthResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

interface FlightPriceParams {
  flightOfferId: string;
  pricingOptions?: {
    fareType?: string[];
    includedCheckedBagsOnly?: boolean;
  };
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

const confirmFlightPrice = async (params: FlightPriceParams, accessToken: string) => {
  const requestBody = {
    data: {
      type: "flight-offers-pricing",
      flightOffers: [{ id: params.flightOfferId }],
      pricingOptions: params.pricingOptions || {}
    }
  };

  const response = await fetch('https://test.api.amadeus.com/v1/shopping/flight-offers/pricing', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Amadeus flight price confirmation error:', errorText);
    throw new Error(`Flight price confirmation failed: ${response.statusText} - ${errorText}`);
  }

  return await response.json();
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { flightOfferId, pricingOptions } = await req.json();
    
    console.log('Confirming flight price for offer:', flightOfferId);

    // Get Amadeus access token
    const accessToken = await getAmadeusAccessToken();
    
    // Confirm flight price
    const priceConfirmation = await confirmFlightPrice({
      flightOfferId,
      pricingOptions
    }, accessToken);
    
    console.log('Flight price confirmation successful:', priceConfirmation.data?.[0]?.id);

    // Transform the response to our format
    const confirmedOffer = priceConfirmation.data?.[0];
    
    if (!confirmedOffer) {
      throw new Error('No price confirmation data received');
    }

    const response = {
      success: true,
      confirmed: true,
      offerId: confirmedOffer.id,
      price: {
        total: confirmedOffer.price.total,
        currency: confirmedOffer.price.currency,
        grandTotal: confirmedOffer.price.grandTotal
      },
      pricingOptions: confirmedOffer.pricingOptions,
      travelerPricings: confirmedOffer.travelerPricings,
      validatingAirlineCodes: confirmedOffer.validatingAirlineCodes,
      lastTicketingDate: confirmedOffer.lastTicketingDate,
      itineraries: confirmedOffer.itineraries,
      type: confirmedOffer.type,
      source: confirmedOffer.source,
      instantTicketingRequired: confirmedOffer.instantTicketingRequired,
      nonHomogeneous: confirmedOffer.nonHomogeneous,
      oneWay: confirmedOffer.oneWay,
      paymentCardRequired: confirmedOffer.paymentCardRequired
    };

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('Flight price confirmation error:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message || 'Flight price confirmation failed',
      confirmed: false
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});