import { corsHeaders } from '../_shared/cors.ts';
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";


interface HotelRateVerificationRequest {
  hotelId: string;
  roomId: string;
  rateKey?: string;
  provider: 'hotelbeds' | 'amadeus';
  searchParams: {
    hotelId: string;
    checkIn: string;
    checkOut: string;
    adults: number;
    children?: number;
    rooms: number;
  };
}

async function getAmadeusAccessToken(): Promise<string> {
  const response = await fetch('https://test.api.amadeus.com/v1/security/oauth2/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      'grant_type': 'client_credentials',
      'client_id': Deno.env.get('AMADEUS_CLIENT_ID') || '',
      'client_secret': Deno.env.get('AMADEUS_CLIENT_SECRET') || '',
    }),
  });

  const data = await response.json();
  return data.access_token;
}

async function verifyAmadeusHotelRate(accessToken: string, request: HotelRateVerificationRequest) {
  const url = `https://test.api.amadeus.com/v3/shopping/hotel-offers/${request.hotelId}`;
  const params = new URLSearchParams({
    checkInDate: request.searchParams.checkIn,
    checkOutDate: request.searchParams.checkOut,
    adults: request.searchParams.adults.toString(),
    roomQuantity: request.searchParams.rooms.toString(),
  });

  const response = await fetch(`${url}?${params}`, {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Amadeus hotel rate verification failed: ${response.statusText}`);
  }

  return await response.json();
}

async function verifyHotelBedsRate(request: HotelRateVerificationRequest) {
  const timestamp = Math.floor(Date.now() / 1000);
  const apiKey = Deno.env.get('HOTELBEDS_HOTEL_API_KEY') || '';
  const secret = Deno.env.get('HOTELBEDS_HOTEL_SECRET') || '';
  
  // Create signature for HotelBeds API
  const encoder = new TextEncoder();
  const data = encoder.encode(apiKey + secret + timestamp);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const signature = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

  const checkInDate = new Date(request.searchParams.checkIn);
  const checkOutDate = new Date(request.searchParams.checkOut);
  
  const requestBody = {
    stay: {
      checkIn: checkInDate.toISOString().split('T')[0],
      checkOut: checkOutDate.toISOString().split('T')[0]
    },
    occupancies: [{
      rooms: request.searchParams.rooms,
      adults: request.searchParams.adults,
      children: request.searchParams.children || 0
    }],
    hotels: {
      hotel: [parseInt(request.hotelId)]
    }
  };

  // If we have a rate key, use the check-rate endpoint for verification
  const endpoint = request.rateKey 
    ? 'https://api.test.hotelbeds.com/hotel-api/1.0/checkrates'
    : `https://api.test.hotelbeds.com/hotel-api/1.0/hotels`;

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'Api-key': apiKey,
      'X-Signature': signature,
    },
    body: JSON.stringify(request.rateKey ? { rateKey: request.rateKey } : requestBody),
  });

  if (!response.ok) {
    throw new Error(`HotelBeds rate verification failed: ${response.statusText}`);
  }

  return await response.json();
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const request: HotelRateVerificationRequest = await req.json();
    console.log('Hotel rate verification request:', request);

    let verificationResult;
    
    if (request.provider === 'amadeus') {
      const accessToken = await getAmadeusAccessToken();
      verificationResult = await verifyAmadeusHotelRate(accessToken, request);
    } else if (request.provider === 'hotelbeds') {
      verificationResult = await verifyHotelBedsRate(request);
    } else {
      throw new Error('Invalid provider specified');
    }

    // Extract rate information from the verification result
    const hotel = verificationResult.data?.[0] || verificationResult.hotels?.hotels?.[0];
    const currentRate = hotel?.offers?.[0]?.price || hotel?.rooms?.[0]?.rates?.[0];
    
    const result = {
      success: true,
      verified: true,
      hotelId: request.hotelId,
      roomId: request.roomId,
      currentRate: {
        total: currentRate?.total || currentRate?.net,
        currency: currentRate?.currency || 'EUR',
        rateKey: currentRate?.rateKey || request.rateKey,
        cancellationPolicies: currentRate?.cancellationPolicies || [],
        paymentType: currentRate?.paymentType || 'AT_WEB'
      },
      availability: {
        available: true,
        rooms: request.searchParams.rooms
      },
      validUntil: new Date(Date.now() + 15 * 60 * 1000).toISOString(), // 15 minutes validity
      provider: request.provider,
      timestamp: new Date().toISOString()
    };

    console.log('Hotel rate verification result:', result);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('Hotel rate verification error:', error);
    
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message || 'Rate verification failed' 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});