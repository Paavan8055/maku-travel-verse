import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import logger from "../_shared/logger.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ActivityBookingParams {
  activityId: string;
  activityName: string;
  date: string;
  time: string;
  participants: number;
  customerInfo: {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
  };
  specialRequests?: string;
  amount: number;
  currency: string;
}

interface ActivityBookingResult {
  success: boolean;
  bookingId?: string;
  confirmationNumber?: string;
  error?: string;
  providerBookingId?: string;
}

// Mock integration with activity providers (Viator, GetYourGuide, etc.)
async function bookWithActivityProvider(params: ActivityBookingParams): Promise<{
  success: boolean;
  providerBookingId?: string;
  confirmationNumber?: string;
  error?: string;
}> {
  logger.info('Creating activity booking with provider:', {
    activityId: params.activityId,
    activityName: params.activityName,
    date: params.date,
    participants: params.participants
  });

  // In production, this would integrate with real provider APIs
  // For now, we'll simulate a successful booking
  const mockProviderBookingId = `ACT-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
  const mockConfirmationNumber = `CONF-${mockProviderBookingId}`;

  // Simulate some processing time
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Simulate 95% success rate
  if (Math.random() > 0.05) {
    logger.info('Activity provider booking successful:', {
      providerBookingId: mockProviderBookingId,
      confirmationNumber: mockConfirmationNumber
    });

    return {
      success: true,
      providerBookingId: mockProviderBookingId,
      confirmationNumber: mockConfirmationNumber
    };
  } else {
    return {
      success: false,
      error: 'Activity is no longer available for the selected date and time'
    };
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const params: ActivityBookingParams = await req.json();
    
    logger.info('Activity booking request:', {
      activityId: params.activityId,
      date: params.date,
      participants: params.participants,
      customerEmail: params.customerInfo.email
    });

    // Validate required parameters
    if (!params.activityId || !params.date || !params.customerInfo?.email || !params.amount) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Missing required parameters: activityId, date, customerInfo.email, and amount are required'
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Initialize Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Step 1: Book with activity provider
    const providerResult = await bookWithActivityProvider(params);
    
    if (!providerResult.success) {
      logger.error('Activity provider booking failed:', providerResult.error);
      return new Response(
        JSON.stringify({
          success: false,
          error: providerResult.error || 'Activity booking failed with provider'
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Step 2: Create local booking record
    const bookingReference = `ACT${Date.now().toString().slice(-6)}`;
    
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .insert({
        booking_reference: bookingReference,
        status: 'confirmed', // Activity is pre-confirmed with provider
        booking_type: 'activity',
        total_amount: params.amount,
        currency: params.currency.toUpperCase(),
        booking_data: {
          activityId: params.activityId,
          activityName: params.activityName,
          date: params.date,
          time: params.time,
          participants: params.participants,
          customerInfo: params.customerInfo,
          specialRequests: params.specialRequests,
          provider: {
            bookingId: providerResult.providerBookingId,
            confirmationNumber: providerResult.confirmationNumber
          }
        }
      })
      .select()
      .single();

    if (bookingError) {
      logger.error('Local booking creation failed:', bookingError);
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Failed to create booking record'
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    logger.info('Activity booking created successfully:', {
      bookingId: booking.id,
      bookingReference: booking.booking_reference,
      providerBookingId: providerResult.providerBookingId
    });

    const result: ActivityBookingResult = {
      success: true,
      bookingId: booking.id,
      confirmationNumber: providerResult.confirmationNumber,
      providerBookingId: providerResult.providerBookingId
    };

    return new Response(
      JSON.stringify(result),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    logger.error('Activity booking error:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Activity booking failed'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});