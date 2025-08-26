// Sabre Flight Exchange and Modification Edge Function
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';
import { getSabreAccessToken } from "../_shared/sabre.ts";
import { logger } from "../_shared/logger.ts";
import { ENV_CONFIG } from "../_shared/env-config.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      ENV_CONFIG.SUPABASE_URL,
      ENV_CONFIG.SUPABASE_ANON_KEY
    );

    const { action, pnrLocator, selectedOption, userId } = await req.json();

    logger.info(`[SABRE-FLIGHT-EXCHANGE] ${action.toUpperCase()} request`, {
      pnrLocator,
      userId
    });

    // Get Sabre access token
    const accessToken = await getSabreAccessToken();

    if (action === 'get_exchange_options') {
      // First, get current PNR details
      const pnrUrl = `${ENV_CONFIG.SABRE_BASE_URL}/v1/passenger/records/${pnrLocator}`;
      
      const pnrResponse = await fetch(pnrUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        }
      });

      if (!pnrResponse.ok) {
        logger.error('[SABRE-FLIGHT-EXCHANGE] PNR retrieval failed', {
          status: pnrResponse.status,
          statusText: pnrResponse.statusText
        });
        throw new Error('Failed to retrieve current booking details');
      }

      const pnrData = await pnrResponse.json();
      
      // Extract current flight information
      const currentFlight = pnrData.reservationDisplayList?.reservationDisplay?.airReservation?.flightSegmentList?.flightSegment?.[0];
      
      if (!currentFlight) {
        throw new Error('No flight segments found in current booking');
      }

      // Search for alternative flights on the same route
      const searchUrl = `${ENV_CONFIG.SABRE_BASE_URL}/v4/offers/shop`;
      
      const searchPayload = {
        OTA_AirLowFareSearchRQ: {
          OriginDestinationInformation: [{
            DepartureDateTime: currentFlight.departureDateTime,
            OriginLocation: { LocationCode: currentFlight.departureAirport },
            DestinationLocation: { LocationCode: currentFlight.arrivalAirport }
          }],
          TravelPreferences: {
            CabinPref: [{ Cabin: currentFlight.cabinClassCode || 'Y' }]
          },
          TravelerInfoSummary: {
            AirTravelerAvail: [{
              PassengerTypeQuantity: [{
                Code: 'ADT',
                Quantity: 1
              }]
            }]
          }
        }
      };

      const searchResponse = await fetch(searchUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(searchPayload)
      });

      if (!searchResponse.ok) {
        logger.error('[SABRE-FLIGHT-EXCHANGE] Alternative flight search failed', {
          status: searchResponse.status,
          statusText: searchResponse.statusText
        });
        throw new Error('Failed to search for alternative flights');
      }

      const searchData = await searchResponse.json();
      
      // Extract exchange options
      const itineraries = searchData.groupedItineraryResponse?.itineraryGroups?.[0]?.itineraries || [];
      
      const exchangeOptions = itineraries.map((itinerary: any, index: number) => {
        const flight = itinerary.legs?.[0]?.segments?.[0];
        const fare = itinerary.pricingInformation?.[0]?.fare;
        
        return {
          id: `exchange_${index}`,
          flight_number: flight?.flightNumber,
          airline: flight?.airline,
          origin: flight?.departureAirport,
          destination: flight?.arrivalAirport,
          departure_time: flight?.departureDateTime,
          arrival_time: flight?.arrivalDateTime,
          cabin_class: flight?.cabinClassCode,
          fare_difference: fare?.totalFare - (pnrData.totalFare || 0),
          currency: fare?.currency || 'USD',
          available_seats: flight?.availableSeats || 0,
          restrictions: fare?.fareRules || 'Standard exchange rules apply'
        };
      });

      // Get fare rules for exchange
      const fareRules = {
        exchangeFee: '$150 USD',
        restrictions: 'Same-day changes may incur additional fees. Fare difference applies.',
        refundPolicy: 'Non-refundable. Exchange only.',
        validity: '24 hours from search'
      };

      return new Response(JSON.stringify({
        success: true,
        exchangeOptions,
        fareRules,
        currentFlight: {
          flight_number: currentFlight.flightNumber,
          departure_time: currentFlight.departureDateTime,
          origin: currentFlight.departureAirport,
          destination: currentFlight.arrivalAirport
        }
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });

    } else if (action === 'process_exchange') {
      // Process the flight exchange
      const exchangeUrl = `${ENV_CONFIG.SABRE_BASE_URL}/v1/passenger/records/${pnrLocator}/reshape`;
      
      const exchangePayload = {
        ReshapePassengerNameRecordRQ: {
          Actions: {
            Action: [{
              ActionCode: "EXCHANGE_FLIGHT",
              FlightSegment: {
                FlightNumber: selectedOption.flight_number,
                DepartureDateTime: selectedOption.departure_time,
                ArrivalDateTime: selectedOption.arrival_time,
                DepartureAirport: selectedOption.origin,
                ArrivalAirport: selectedOption.destination,
                CabinClassCode: selectedOption.cabin_class
              }
            }]
          }
        }
      };

      const exchangeResponse = await fetch(exchangeUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(exchangePayload)
      });

      if (!exchangeResponse.ok) {
        logger.error('[SABRE-FLIGHT-EXCHANGE] Flight exchange failed', {
          status: exchangeResponse.status,
          statusText: exchangeResponse.statusText
        });
        throw new Error('Flight exchange processing failed');
      }

      const exchangeResult = await exchangeResponse.json();
      
      // Update PNR record in Supabase
      const { error: updateError } = await supabase
        .from('pnr_records')
        .update({
          flight_details: {
            ...exchangeResult.flightDetails,
            exchange_processed: true,
            exchange_date: new Date().toISOString(),
            original_flight: selectedOption.original_flight,
            new_flight: selectedOption
          },
          updated_at: new Date().toISOString()
        })
        .eq('pnr_locator', pnrLocator)
        .eq('user_id', userId);

      if (updateError) {
        logger.error('[SABRE-FLIGHT-EXCHANGE] PNR update failed', updateError);
      }

      // Create flight change request record
      const { error: changeError } = await supabase
        .from('flight_change_requests')
        .insert({
          pnr_id: (await supabase.from('pnr_records').select('id').eq('pnr_locator', pnrLocator).single()).data?.id,
          user_id: userId,
          change_type: 'exchange',
          original_flight: selectedOption.original_flight,
          new_flight: selectedOption,
          status: 'completed',
          fare_difference: selectedOption.fare_difference,
          exchange_fee: 150, // Standard exchange fee
          processed_at: new Date().toISOString()
        });

      if (changeError) {
        logger.error('[SABRE-FLIGHT-EXCHANGE] Change request creation failed', changeError);
      }

      return new Response(JSON.stringify({
        success: true,
        message: 'Flight exchange completed successfully',
        newPnrLocator: exchangeResult.pnrLocator || pnrLocator,
        confirmationNumber: exchangeResult.confirmationNumber,
        exchangeDetails: {
          originalFlight: selectedOption.original_flight,
          newFlight: selectedOption,
          fareDifference: selectedOption.fare_difference,
          exchangeFee: 150
        }
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });

    } else {
      return new Response(JSON.stringify({
        success: false,
        error: 'Unsupported action'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

  } catch (error) {
    logger.error('[SABRE-FLIGHT-EXCHANGE] Operation failed', { error });
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message || 'Flight exchange operation failed',
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});