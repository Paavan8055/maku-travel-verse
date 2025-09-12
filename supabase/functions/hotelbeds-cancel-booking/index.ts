import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { corsHeaders } from '../_shared/cors.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.53.0'
import logger from "../_shared/logger.ts";
...
}

serve(async (req) => {
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