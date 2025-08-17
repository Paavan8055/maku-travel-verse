import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface AmadeusAuthResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

interface HotelBookingParams {
  hotelOfferId: string;
  guestDetails: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
  };
  roomDetails: {
    roomType: string;
    boardType: string;
    checkIn: string;
    checkOut: string;
    guests: number;
  };
  specialRequests?: string;
}

async function getAmadeusAccessToken(): Promise<string> {
  const clientId = Deno.env.get('AMADEUS_CLIENT_ID');
  const clientSecret = Deno.env.get('AMADEUS_CLIENT_SECRET');
  
  if (!clientId || !clientSecret) {
    throw new Error('Amadeus credentials not configured');
  }

  const response = await fetch('https://api.amadeus.com/v1/security/oauth2/token', {
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
    throw new Error(`Failed to get Amadeus access token: ${response.statusText}`);
  }

  const data: AmadeusAuthResponse = await response.json();
  return data.access_token;
}

async function bookHotel(params: HotelBookingParams, accessToken: string): Promise<any> {
  const response = await fetch('https://api.amadeus.com/v1/booking/hotel-bookings', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      data: {
        offerId: params.hotelOfferId,
        guests: [{
          name: {
            title: 'MR',
            firstName: params.guestDetails.firstName,
            lastName: params.guestDetails.lastName
          },
          contact: {
            phone: params.guestDetails.phone,
            email: params.guestDetails.email
          }
        }]
      }
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Amadeus hotel booking error:', errorText);
    throw new Error(`Hotel booking failed: ${response.statusText}`);
  }

  return await response.json();
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const params: HotelBookingParams = await req.json();
    
    const accessToken = await getAmadeusAccessToken();
    const bookingResult = await bookHotel(params, accessToken);
    
    return new Response(
      JSON.stringify({
        success: true,
        booking: {
          id: bookingResult.data?.id || `HOTEL_${Date.now()}`,
          reference: bookingResult.data?.bookingReference || `HT${Date.now()}`,
          status: 'confirmed',
          totalPrice: bookingResult.data?.price?.total || 200,
          currency: 'USD'
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Hotel booking error:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Hotel booking failed'
      }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});