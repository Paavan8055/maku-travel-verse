import { corsHeaders } from '../_shared/cors.ts';
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import logger from "../_shared/logger.ts";


interface AmadeusAuthResponse {
  access_token: string;
  expires_in: number;
  token_type: string;
}

interface FlightPriceParams {
  flightOfferId: string;
  pricingOptions?: {
    includedCheckedBagsOnly?: boolean;
    refundableFare?: boolean;
    noRestrictionFare?: boolean;
    noPenaltyFare?: boolean;
  };
}

async function getAmadeusAccessToken(): Promise<string> {
  const clientId = Deno.env.get('AMADEUS_CLIENT_ID');
  const clientSecret = Deno.env.get('AMADEUS_CLIENT_SECRET');
  
  if (!clientId || !clientSecret) {
    throw new Error('Missing Amadeus credentials');
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
    throw new Error(`Failed to get access token: ${response.statusText}`);
  }

  const data: AmadeusAuthResponse = await response.json();
  return data.access_token;
}

async function confirmFlightPrice(params: FlightPriceParams, accessToken: string) {
  const url = 'https://test.api.amadeus.com/v1/shopping/flight-offers/pricing';
  
  logger.info('Confirming flight price for offer ID:', params.flightOfferId);
  
  const body = {
    data: {
      type: "flight-offers-pricing",
      flightOffers: [
        {
          type: "flight-offer",
          id: params.flightOfferId
        }
      ]
    }
  };

  if (params.pricingOptions) {
    body.data.pricingOptions = params.pricingOptions;
  }

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    logger.error('Flight price confirmation API error:', response.status, response.statusText);
    throw new Error(`Flight price confirmation API error: ${response.statusText}`);
  }

  const data = await response.json();
  logger.info('Flight price confirmation response:', data);
  return data;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { flightOfferId, pricingOptions } = await req.json();
    
    if (!flightOfferId) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing flightOfferId parameter' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    logger.info('Flight price confirmation request for offer:', flightOfferId);

    // Get access token
    const accessToken = await getAmadeusAccessToken();
    logger.info('Got Amadeus access token for flight price confirmation');

    // Confirm flight price
    const priceData = await confirmFlightPrice({ flightOfferId, pricingOptions }, accessToken);

    // Transform the response
    const confirmedOffer = priceData.data?.flightOffers?.[0];
    const result = {
      success: true,
      confirmedOffer,
      priceChanged: priceData.data?.priceChanged || false,
      warnings: priceData.warnings || [],
      originalPrice: confirmedOffer?.price?.total,
      currency: confirmedOffer?.price?.currency,
      lastTicketingDate: confirmedOffer?.lastTicketingDate,
      travelerPricings: confirmedOffer?.travelerPricings || []
    };

    return new Response(
      JSON.stringify(result),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    logger.error('Flight price confirmation function error:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Failed to confirm flight price',
        details: error.message
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});