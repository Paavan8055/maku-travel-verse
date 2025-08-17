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
    const errorText = await response.text();
    console.error('Amadeus auth failed:', errorText);
    throw new Error(`Amadeus auth failed: ${response.statusText}`);
  }

  const data: AmadeusAuthResponse = await response.json();
  return data.access_token;
};

const confirmHotelPrice = async (offerId: string, accessToken: string) => {
  console.log('Amadeus Price Confirmation API call:', `https://test.api.amadeus.com/v3/shopping/hotel-offers/${offerId}`);

  const response = await fetch(
    `https://test.api.amadeus.com/v3/shopping/hotel-offers/${offerId}`,
    {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Amadeus price confirmation error:', {
      status: response.status,
      statusText: response.statusText,
      error: errorText,
      offerId: offerId
    });
    throw new Error(`Price confirmation failed: ${response.statusText} - ${errorText}`);
  }

  const result = await response.json();
  console.log('Amadeus Price Confirmation API response:', {
    offerId: result.data?.id,
    available: result.data?.available,
    priceTotal: result.data?.offers?.[0]?.price?.total
  });

  return result;
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { offerId } = await req.json();

    console.log('=== Amadeus Price Confirmation Request ===', {
      offerId
    });

    if (!offerId) {
      throw new Error('Offer ID is required');
    }

    const accessToken = await getAmadeusAccessToken();

    const confirmationData = await confirmHotelPrice(offerId, accessToken);

    const offer = confirmationData.data;
    const hotelOffer = offer?.offers?.[0];

    const transformedConfirmation = {
      id: offer?.id,
      hotelId: offer?.hotel?.hotelId,
      available: offer?.available,
      self: offer?.self,
      hotel: {
        hotelId: offer?.hotel?.hotelId,
        chainCode: offer?.hotel?.chainCode,
        dupeId: offer?.hotel?.dupeId,
        name: offer?.hotel?.name,
        cityCode: offer?.hotel?.cityCode,
        latitude: offer?.hotel?.latitude,
        longitude: offer?.hotel?.longitude
      },
      offer: hotelOffer ? {
        id: hotelOffer.id,
        checkInDate: hotelOffer.checkInDate,
        checkOutDate: hotelOffer.checkOutDate,
        rateCode: hotelOffer.rateCode,
        rateFamilyEstimated: hotelOffer.rateFamilyEstimated,
        room: hotelOffer.room,
        guests: hotelOffer.guests,
        price: {
          currency: hotelOffer.price?.currency,
          base: hotelOffer.price?.base,
          total: hotelOffer.price?.total,
          taxes: hotelOffer.price?.taxes,
          markups: hotelOffer.price?.markups,
          variations: hotelOffer.price?.variations
        },
        policies: hotelOffer.policies,
        self: hotelOffer.self
      } : null,
      lastUpdated: new Date().toISOString()
    };

    console.log(`=== Price Confirmation Complete ===`, {
      offerId: offer?.id,
      available: offer?.available,
      confirmationSuccess: true
    });

    return new Response(JSON.stringify({
      success: true,
      source: 'amadeus',
      confirmation: transformedConfirmation,
      meta: {
        apiProvider: 'Amadeus Price Confirmation',
        searchId: crypto.randomUUID(),
        timestamp: new Date().toISOString()
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('=== Amadeus Price Confirmation Error ===', {
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });

    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      source: 'amadeus',
      details: {
        errorType: error.name,
        timestamp: new Date().toISOString()
      }
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});