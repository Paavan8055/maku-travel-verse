import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.54.0';
import { ENV_CONFIG } from '../_shared/config.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CancelBookingParams {
  bookingId: string;
  reason?: string;
  correlationId?: string;
}

async function generateHotelBedsSignature(apiKey: string, secret: string, timestamp: number): Promise<string> {
  const message = apiKey + secret + timestamp;
  const encoder = new TextEncoder();
  const data = encoder.encode(message);
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signature = await crypto.subtle.sign('HMAC', key, data);
  return Array.from(new Uint8Array(signature))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

async function cancelHotelBooking(params: CancelBookingParams): Promise<any> {
  const apiKey = Deno.env.get('HOTELBEDS_API_KEY');
  const secret = Deno.env.get('HOTELBEDS_SECRET');
  
  if (!apiKey || !secret) {
    throw new Error('HotelBeds credentials not configured');
  }

  const timestamp = Math.floor(Date.now() / 1000);
  const signature = await generateHotelBedsSignature(apiKey, secret, timestamp);
  
  const baseUrl = ENV_CONFIG.hotelbeds.baseUrl;
  const url = `${baseUrl}/hotel-api/1.0/bookings/${params.bookingId}?cancellationFlag=CANCELLATION`;

  console.log(`Cancelling HotelBeds booking: ${params.bookingId}`);
  
  try {
    const response = await fetch(url, {
      method: 'DELETE',
      headers: {
        'Api-Key': apiKey,
        'X-Signature': signature,
        'Accept': 'application/json',
        'Accept-Encoding': 'gzip',
        'User-Agent': 'MAKU Travel/1.0'
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`HotelBeds cancellation failed: ${response.status} - ${errorText}`);
      throw new Error(`HotelBeds API error: ${response.status} - ${errorText}`);
    }

    const cancellationData = await response.json();
    console.log('HotelBeds cancellation response:', JSON.stringify(cancellationData, null, 2));
    
    return cancellationData;
  } catch (error) {
    console.error('Error calling HotelBeds cancellation API:', error);
    throw error;
  }
}

function transformCancellationResponse(cancellationData: any): any {
  if (!cancellationData || !cancellationData.booking) {
    return {
      success: false,
      error: 'Invalid cancellation response from HotelBeds'
    };
  }

  const booking = cancellationData.booking;
  
  return {
    success: true,
    bookingId: booking.reference,
    status: booking.status,
    cancellationDate: booking.cancellationDate || new Date().toISOString(),
    cancellationDetails: {
      reference: booking.reference,
      clientReference: booking.clientReference,
      status: booking.status,
      totalNet: booking.totalNet,
      currency: booking.currency,
      cancellationPolicies: booking.cancellationPolicies || [],
      refundAmount: booking.totalNet || 0,
      cancellationFees: booking.cancellationFees || []
    },
    hotelDetails: {
      code: booking.hotel?.code,
      name: booking.hotel?.name,
      checkIn: booking.hotel?.checkIn,
      checkOut: booking.hotel?.checkOut
    },
    timestamp: new Date().toISOString()
  };
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();
  let correlationId = '';

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const params: CancelBookingParams = await req.json();
    correlationId = params.correlationId || crypto.randomUUID();

    console.log(`[${correlationId}] Processing booking cancellation for: ${params.bookingId}`);

    if (!params.bookingId) {
      throw new Error('Booking ID is required');
    }

    // Cancel booking with HotelBeds
    const cancellationData = await cancelHotelBooking(params);
    
    // Transform the response
    const transformedResponse = transformCancellationResponse(cancellationData);
    
    const duration = Date.now() - startTime;

    // Log the cancellation event
    try {
      await supabase.functions.invoke('log-system-event', {
        body: {
          correlation_id: correlationId,
          service_name: 'hotelbeds-cancel-booking',
          log_level: 'info',
          message: `Booking cancellation ${transformedResponse.success ? 'successful' : 'failed'}`,
          duration_ms: duration,
          status_code: 200,
          metadata: {
            bookingId: params.bookingId,
            reason: params.reason,
            success: transformedResponse.success,
            refundAmount: transformedResponse.cancellationDetails?.refundAmount
          }
        }
      });

      // Log monitoring event
      await supabase.functions.invoke('hotelbeds-monitoring', {
        body: {
          type: transformedResponse.success ? 'booking_success' : 'booking_failure',
          hotelbedsFunction: 'cancel-booking',
          correlationId,
          duration,
          statusCode: 200,
          bookingReference: params.bookingId,
          metadata: {
            action: 'cancellation',
            reason: params.reason,
            refundAmount: transformedResponse.cancellationDetails?.refundAmount
          }
        }
      }, {
        body: JSON.stringify({
          action: 'log'
        })
      });
    } catch (logError) {
      console.error('Failed to log cancellation event:', logError);
    }

    return new Response(JSON.stringify(transformedResponse), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`[${correlationId}] Cancellation error:`, error);

    try {
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
      const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
      const supabase = createClient(supabaseUrl, supabaseServiceKey);

      await supabase.functions.invoke('log-system-event', {
        body: {
          correlation_id: correlationId,
          service_name: 'hotelbeds-cancel-booking',
          log_level: 'error',
          message: `Booking cancellation failed: ${error.message}`,
          duration_ms: duration,
          status_code: 500,
          error_details: {
            error: error.message,
            stack: error.stack
          }
        }
      });
    } catch (logError) {
      console.error('Failed to log error:', logError);
    }

    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      correlationId
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});