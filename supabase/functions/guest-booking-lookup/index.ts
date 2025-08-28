import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Content-Security-Policy": "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self';",
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "X-XSS-Protection": "1; mode=block",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "geolocation=(), microphone=(), camera=()"
};

interface GuestBookingLookupParams {
  bookingReference: string;
  email: string;
  accessToken?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const params: GuestBookingLookupParams = await req.json();
    
    if (!params.bookingReference || !params.email) {
      throw new Error('Booking reference and email are required');
    }

    console.log('Guest booking lookup:', { 
      reference: params.bookingReference,
      hasToken: !!params.accessToken 
    });

    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Extract IP address for audit logging
    const ipAddress = req.headers.get('x-forwarded-for') || req.headers.get('cf-connecting-ip') || 'unknown';
    const userAgent = req.headers.get('user-agent') || 'unknown';

    // First, find the booking by reference
    const { data: booking, error: bookingError } = await supabaseClient
      .from('bookings')
      .select('*')
      .eq('booking_reference', params.bookingReference)
      .eq('user_id', null) // Only guest bookings
      .single();

    if (bookingError || !booking) {
      // Log failed access attempt
      await supabaseClient.rpc('log_booking_access', {
        _booking_id: null,
        _access_type: 'guest_token',
        _access_method: 'lookup_failed',
        _ip_address: ipAddress,
        _user_agent: userAgent,
        _accessed_data: {
          booking_reference: params.bookingReference,
          reason: 'booking_not_found'
        },
        _success: false,
        _failure_reason: 'Booking not found or not a guest booking'
      });

      throw new Error('Booking not found');
    }

    // Verify guest access using the secure function
    const { data: accessGranted, error: accessError } = await supabaseClient
      .rpc('verify_guest_booking_access', {
        _booking_id: booking.id,
        _email: params.email,
        _token: params.accessToken || null
      });

    if (accessError || !accessGranted) {
      // Log failed access attempt
      await supabaseClient.rpc('log_booking_access', {
        _booking_id: booking.id,
        _access_type: 'guest_token',
        _access_method: params.accessToken ? 'token_verification' : 'email_verification',
        _ip_address: ipAddress,
        _user_agent: userAgent,
        _accessed_data: {
          booking_reference: params.bookingReference,
          email_provided: !!params.email,
          token_provided: !!params.accessToken
        },
        _success: false,
        _failure_reason: 'Access verification failed'
      });

      throw new Error('Access denied. Please check your email and booking reference.');
    }

    // Get booking items
    const { data: bookingItems } = await supabaseClient
      .from('booking_items')
      .select('*')
      .eq('booking_id', booking.id);

    // Get payment information
    const { data: payment } = await supabaseClient
      .from('payments')
      .select('*')
      .eq('booking_id', booking.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    // Remove sensitive customer info for security
    const sanitizedBooking = {
      ...booking,
      booking_data: {
        ...booking.booking_data,
        customerInfo: {
          firstName: booking.booking_data.customerInfo?.firstName,
          lastName: booking.booking_data.customerInfo?.lastName,
          email: booking.booking_data.customerInfo?.email
          // Remove phone and other sensitive data
        }
      }
    };

    // Log successful access
    await supabaseClient.rpc('log_booking_access', {
      _booking_id: booking.id,
      _access_type: 'guest_token',
      _access_method: params.accessToken ? 'token_verification' : 'email_verification',
      _ip_address: ipAddress,
      _user_agent: userAgent,
      _accessed_data: {
        booking_reference: params.bookingReference,
        access_level: params.accessToken ? 'full' : 'basic'
      },
      _success: true
    });

    return new Response(JSON.stringify({
      success: true,
      booking: sanitizedBooking,
      items: bookingItems || [],
      payment: payment ? {
        status: payment.status,
        amount: payment.amount,
        currency: payment.currency,
        created_at: payment.created_at
      } : null,
      accessInfo: {
        hasToken: !!params.accessToken,
        accessLevel: params.accessToken ? 'full' : 'basic',
        securityNote: 'This booking information is provided securely for the verified email address.'
      }
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error('Guest booking lookup error:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});