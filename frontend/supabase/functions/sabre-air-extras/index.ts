import { corsHeaders } from '../_shared/cors.ts';
// Sabre Air Extras (Ancillary Services) Edge Function
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.53.0";
import { getSabreAccessToken } from "../_shared/sabre.ts";
import logger from "../_shared/logger.ts";
import { ENV_CONFIG } from "../_shared/config.ts";


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
      action, // 'get_available', 'book_extras'
      pnrLocator,
      flightSegmentId,
      extraSelections,
      userId 
    } = await req.json();

    logger.info(`[SABRE-AIR-EXTRAS] ${action.toUpperCase()} request`, {
      pnrLocator,
      flightSegmentId,
      userId
    });

    // Get Sabre access token
    const accessToken = await getSabreAccessToken();

    if (action === 'get_available') {
      // Get available ancillary services using Sabre Ancillary Services API
      const ancillaryUrl = `${ENV_CONFIG.sabre?.baseUrl || 'https://api-crt.cert.havail.sabre.com'}/v1/offers/shop/ancillaries`;

      const ancillaryRequest = {
        AncillaryServicesRQ: {
          Version: "1.0.0",
          ReservationInfo: {
            Locator: pnrLocator
          },
          ProductType: "All" // Baggage, Meals, Seats, Upgrades, etc.
        }
      };

      const response = await fetch(ancillaryUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(ancillaryRequest)
      });

      if (!response.ok) {
        const errorText = await response.text();
        logger.error('[SABRE-AIR-EXTRAS] Ancillary services retrieval failed', {
          status: response.status,
          error: errorText
        });
        throw new Error(`Ancillary services retrieval failed: ${response.status}`);
      }

      const ancillaryData = await response.json();

      return new Response(JSON.stringify({
        success: true,
        availableExtras: ancillaryData.AncillaryServicesRS?.ProductList || [],
        meta: {
          action: 'get_available',
          provider: 'sabre',
          timestamp: new Date().toISOString()
        }
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });

    } else if (action === 'book_extras') {
      // Book selected ancillary services
      const bookExtrasRequest = {
        BookAncillaryServicesRQ: {
          Version: "1.0.0",
          ReservationLocator: pnrLocator,
          AncillaryServiceList: {
            AncillaryService: extraSelections.map((extra: any) => ({
              ProductCode: extra.productCode,
              PassengerNumber: extra.passengerNumber,
              FlightSegment: extra.flightSegmentId ? {
                OriginLocation: extra.origin,
                DestinationLocation: extra.destination,
                MarketingAirlineCode: extra.airline,
                FlightNumber: extra.flightNumber,
                DepartureDateTime: extra.departureTime
              } : undefined,
              Quantity: extra.quantity || 1,
              Amount: extra.price
            }))
          }
        }
      };

      const bookExtrasUrl = `${ENV_CONFIG.sabre?.baseUrl || 'https://api-crt.cert.havail.sabre.com'}/v1.0.0/passenger/records/${pnrLocator}/ancillaries`;

      const response = await fetch(bookExtrasUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(bookExtrasRequest)
      });

      if (!response.ok) {
        const errorText = await response.text();
        logger.error('[SABRE-AIR-EXTRAS] Ancillary booking failed', {
          status: response.status,
          error: errorText
        });
        throw new Error(`Ancillary booking failed: ${response.status}`);
      }

      const bookingData = await response.json();

      // Get PNR ID for database operations
      const { data: pnrRecord } = await supabase
        .from('pnr_records')
        .select('id')
        .eq('pnr_locator', pnrLocator)
        .eq('user_id', userId)
        .single();

      if (pnrRecord) {
        // Save air extras to database
        const airExtrasRecords = extraSelections.map((extra: any) => ({
          pnr_id: pnrRecord.id,
          passenger_id: extra.passengerId,
          extra_type: extra.type, // 'baggage', 'meal', 'upgrade', 'insurance'
          extra_code: extra.productCode,
          description: extra.description,
          quantity: extra.quantity || 1,
          unit_price: extra.price,
          total_price: (extra.price * (extra.quantity || 1)),
          currency: extra.currency || 'USD',
          flight_segment_id: extra.flightSegmentId,
          status: 'booked',
          sabre_confirmation_code: bookingData.BookAncillaryServicesRS?.ConfirmationNumber,
          metadata: {
            sabreResponse: bookingData,
            bookingTimestamp: new Date().toISOString()
          }
        }));

        const { error: extrasError } = await supabase
          .from('air_extras')
          .insert(airExtrasRecords);

        if (extrasError) {
          logger.error('[SABRE-AIR-EXTRAS] Air extras record creation failed', extrasError);
        }
      }

      return new Response(JSON.stringify({
        success: true,
        bookings: bookingData,
        confirmationNumber: bookingData.BookAncillaryServicesRS?.ConfirmationNumber,
        meta: {
          action: 'book_extras',
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
    logger.error('[SABRE-AIR-EXTRAS] Operation failed', { error });
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message || 'Air extras operation failed',
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