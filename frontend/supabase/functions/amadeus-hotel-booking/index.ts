import { corsHeaders } from '../_shared/cors.ts';
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import logger from "../_shared/logger.ts";

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
    throw new Error(`Failed to get Amadeus access token: ${response.statusText}`);
  }

  const data: AmadeusAuthResponse = await response.json();
  return data.access_token;
}

async function bookHotel(params: HotelBookingParams, accessToken: string): Promise<any> {
  logger.info('Creating Amadeus hotel booking:', {
    offerId: params.hotelOfferId,
    guest: `${params.guestDetails.firstName} ${params.guestDetails.lastName}`,
    email: params.guestDetails.email,
    checkIn: params.roomDetails.checkIn,
    checkOut: params.roomDetails.checkOut
  });

  const bookingData = {
    data: {
      type: "hotel-booking",
      hotelOfferId: params.hotelOfferId,
      guests: [{
        id: 1,
        name: {
          title: "MR", // Simplified for now
          firstName: params.guestDetails.firstName,
          lastName: params.guestDetails.lastName
        },
        contact: {
          phone: params.guestDetails.phone,
          email: params.guestDetails.email
        }
      }],
      payments: [{
        id: 1,
        method: "creditCard",
        card: {
          // Production: Replace with tokenized card data
          vendorCode: "VI",
          cardNumber: "4111111111111111",
          expiryDate: "2025-08"
        }
      }],
      rooms: [{
        guestIds: [1],
        paymentId: 1,
        specialRequests: params.specialRequests ? [params.specialRequests] : undefined
      }]
    }
  };

  logger.info('Amadeus booking request:', JSON.stringify(bookingData, null, 2));

  const response = await fetch('https://test.api.amadeus.com/v1/booking/hotel-bookings', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(bookingData),
  });

  if (!response.ok) {
    const errorText = await response.text();
    logger.error('Amadeus hotel booking failed:', {
      status: response.status,
      statusText: response.statusText,
      error: errorText
    });
    throw new Error(`Hotel booking failed: ${response.statusText} - ${errorText}`);
  }

  const result = await response.json();
  logger.info('Amadeus booking successful:', {
    bookingId: result.data?.[0]?.id,
    confirmationNumber: result.data?.[0]?.bookingReference,
    status: result.data?.[0]?.status
  });

  return result;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const params: HotelBookingParams = await req.json();
    
    const accessToken = await getAmadeusAccessToken();
    const bookingResult = await bookHotel(params, accessToken);
    
    // Extract real booking data from Amadeus response
    const booking = bookingResult.data?.[0];
    if (!booking) {
      throw new Error('No booking data returned from Amadeus');
    }

    const realBookingData = {
      amadeus_booking_id: booking.id,
      confirmation_number: booking.bookingReference,
      hotel_confirmation_number: booking.providerConfirmationId || booking.bookingReference,
      status: booking.status === 'CONFIRMED' ? 'confirmed' : 'pending',
      total_amount: parseFloat(booking.associatedRecords?.[0]?.amountDue?.amount || booking.quote?.total?.amount || '0'),
      currency: booking.associatedRecords?.[0]?.amountDue?.currency || booking.quote?.total?.currency || 'USD',
      hotel_details: {
        name: booking.hotel?.name || 'Hotel',
        address: booking.hotel?.address,
        contact: booking.hotel?.contact,
        chainCode: booking.hotel?.chainCode
      },
      guest_details: params.guestDetails,
      room_details: params.roomDetails,
      check_in_time: booking.checkInDate || params.roomDetails.checkIn,
      check_out_time: booking.checkOutDate || params.roomDetails.checkOut,
      special_requests: params.specialRequests
    };

    return new Response(
      JSON.stringify({
        success: true,
        booking: {
          id: booking.id,
          reference: booking.bookingReference,
          confirmationNumber: booking.providerConfirmationId || booking.bookingReference,
          status: booking.status === 'CONFIRMED' ? 'confirmed' : 'pending',
          totalPrice: parseFloat(booking.associatedRecords?.[0]?.amountDue?.amount || booking.quote?.total?.amount || '0'),
          currency: booking.associatedRecords?.[0]?.amountDue?.currency || booking.quote?.total?.currency || 'USD',
          checkInTime: booking.checkInDate || params.roomDetails.checkIn,
          checkOutTime: booking.checkOutDate || params.roomDetails.checkOut,
          hotel: realBookingData.hotel_details,
          amadeus: realBookingData
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    logger.error('Hotel booking error:', error);
    
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