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

interface HotelBookingParams {
  hotelId: string;
  offerId: string;
  guests: {
    name: {
      firstName: string;
      lastName: string;
    };
    contact: {
      phone: string;
      email: string;
    };
  }[];
  payments: {
    method: string;
    card?: {
      vendorCode: string;
      cardNumber: string;
      expiryDate: string;
    };
  }[];
  rooms: {
    guestIds: string[];
    paymentId: string;
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

const createHotelBooking = async (params: HotelBookingParams, accessToken: string) => {
  const response = await fetch('https://test.api.amadeus.com/v1/booking/hotel-bookings', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      data: {
        type: 'hotel-booking',
        hotelId: params.hotelId,
        offerId: params.offerId,
        guests: params.guests,
        payments: params.payments,
        rooms: params.rooms
      }
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Amadeus hotel booking error:', errorText);
    throw new Error(`Hotel booking failed: ${response.statusText} - ${errorText}`);
  }

  return await response.json();
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const bookingParams: HotelBookingParams = await req.json();
    
    console.log('Creating hotel booking with Amadeus:', {
      hotelId: bookingParams.hotelId,
      offerId: bookingParams.offerId,
      guestsCount: bookingParams.guests?.length
    });

    // Get Amadeus access token
    const accessToken = await getAmadeusAccessToken();
    
    // Create hotel booking
    const hotelBooking = await createHotelBooking(bookingParams, accessToken);
    
    console.log('Hotel booking successful:', hotelBooking.data?.id);

    // Transform the response to our format
    const booking = {
      id: hotelBooking.data?.id,
      type: 'hotel',
      status: hotelBooking.data?.bookingStatus || 'confirmed',
      reference: hotelBooking.data?.associatedRecords?.[0]?.reference,
      hotelId: hotelBooking.data?.hotelId,
      guests: hotelBooking.data?.guests,
      rooms: hotelBooking.data?.rooms,
      checkIn: hotelBooking.data?.checkInDate,
      checkOut: hotelBooking.data?.checkOutDate,
      providerConfirmationId: hotelBooking.data?.providerConfirmationId,
      createdAt: new Date().toISOString()
    };

    return new Response(JSON.stringify({
      success: true,
      booking: booking,
      rawResponse: hotelBooking // Include raw response for debugging
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('Hotel booking error:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message || 'Hotel booking failed'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});