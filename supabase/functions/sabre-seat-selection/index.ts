// Sabre Seat Selection Edge Function
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { getSabreAccessToken } from "../_shared/sabre.ts";
import logger from "../_shared/logger.ts";
import { ENV_CONFIG } from "../_shared/config.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      ENV_CONFIG.SUPABASE_URL || '',
      ENV_CONFIG.SUPABASE_SERVICE_ROLE_KEY || ''
    );

    const { 
      action, // 'get_seatmap', 'select_seats'
      pnrLocator,
      flightSegmentId,
      seatSelections,
      userId 
    } = await req.json();

    logger.info(`[SABRE-SEAT-SELECTION] ${action.toUpperCase()} request`, {
      pnrLocator,
      flightSegmentId,
      userId
    });

    // Get Sabre access token
    const accessToken = await getSabreAccessToken();

    if (action === 'get_seatmap') {
      // Get seat map using Sabre Seat Map API
      const seatMapUrl = `${ENV_CONFIG.sabre?.baseUrl || 'https://api-crt.cert.havail.sabre.com'}/v1/shop/flights/seatmaps`;

      const seatMapRequest = {
        SeatMapRQ: {
          Version: "4.0.0",
          SeatMapQueryList: {
            SeatMapQuery: {
              Flight: {
                OriginLocation: flightSegmentId.split('-')[0],
                DestinationLocation: flightSegmentId.split('-')[1],
                MarketingAirlineCode: flightSegmentId.split('-')[2],
                FlightNumber: flightSegmentId.split('-')[3],
                DepartureDateTime: flightSegmentId.split('-')[4]
              },
              SeatMapMode: "Detailed"
            }
          }
        }
      };

      const response = await fetch(seatMapUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(seatMapRequest)
      });

      if (!response.ok) {
        const errorText = await response.text();
        logger.error('[SABRE-SEAT-SELECTION] Seat map retrieval failed', {
          status: response.status,
          error: errorText
        });
        throw new Error(`Seat map retrieval failed: ${response.status}`);
      }

      const seatMapData = await response.json();

      return new Response(JSON.stringify({
        success: true,
        seatMap: seatMapData.SeatMapRS?.SeatMapList?.SeatMap || [],
        meta: {
          action: 'get_seatmap',
          provider: 'sabre',
          timestamp: new Date().toISOString()
        }
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });

    } else if (action === 'select_seats') {
      // Select seats using Sabre Seat Assignment API
      const seatAssignmentRequest = {
        AssignSeatsRQ: {
          Version: "1.0.0",
          ReservationLocator: pnrLocator,
          SeatAssignmentList: {
            SeatAssignment: seatSelections.map((selection: any) => ({
              FlightSegment: {
                OriginLocation: selection.origin,
                DestinationLocation: selection.destination,
                MarketingAirlineCode: selection.airline,
                FlightNumber: selection.flightNumber,
                DepartureDateTime: selection.departureTime
              },
              PassengerNumber: selection.passengerNumber,
              SeatNumber: selection.seatNumber,
              SeatPreference: selection.preference || "Any"
            }))
          }
        }
      };

      const seatAssignmentUrl = `${ENV_CONFIG.sabre?.baseUrl || 'https://api-crt.cert.havail.sabre.com'}/v1.0.0/passenger/records/${pnrLocator}/seats`;

      const response = await fetch(seatAssignmentUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(seatAssignmentRequest)
      });

      if (!response.ok) {
        const errorText = await response.text();
        logger.error('[SABRE-SEAT-SELECTION] Seat assignment failed', {
          status: response.status,
          error: errorText
        });
        throw new Error(`Seat assignment failed: ${response.status}`);
      }

      const assignmentData = await response.json();

      // Get PNR ID for database operations
      const { data: pnrRecord } = await supabase
        .from('pnr_records')
        .select('id')
        .eq('pnr_locator', pnrLocator)
        .eq('user_id', userId)
        .single();

      if (pnrRecord) {
        // Save seat assignments to database
        const seatAssignmentRecords = seatSelections.map((selection: any) => ({
          pnr_id: pnrRecord.id,
          passenger_id: selection.passengerId,
          flight_segment_id: flightSegmentId,
          seat_number: selection.seatNumber,
          seat_type: selection.seatType,
          cabin_class: selection.cabinClass,
          fee_amount: selection.feeAmount || 0,
          currency: selection.currency || 'USD',
          status: 'confirmed'
        }));

        const { error: seatError } = await supabase
          .from('seat_assignments')
          .insert(seatAssignmentRecords);

        if (seatError) {
          logger.error('[SABRE-SEAT-SELECTION] Seat assignment record creation failed', seatError);
        }
      }

      return new Response(JSON.stringify({
        success: true,
        assignments: assignmentData,
        meta: {
          action: 'select_seats',
          provider: 'sabre',
          timestamp: new Date().toISOString()
        }
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });

    } else {
      throw new Error(`Unsupported action: ${action}`);
    }

  } catch (error) {
    logger.error('[SABRE-SEAT-SELECTION] Operation failed', { error });
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message || 'Seat selection operation failed',
      meta: {
        provider: 'sabre',
        timestamp: new Date().toISOString()
      }
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});