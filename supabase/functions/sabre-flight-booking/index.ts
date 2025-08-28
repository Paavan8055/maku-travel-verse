// Sabre Flight Booking (PNR Creation) Edge Function
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
      flightOffer, 
      passengers, 
      contactInfo, 
      paymentInfo,
      userId 
    } = await req.json();

    logger.info('[SABRE-FLIGHT-BOOKING] Starting flight booking process', {
      userId,
      flightOfferId: flightOffer?.id
    });

    // Get Sabre access token
    const accessToken = await getSabreAccessToken();

    // Create PNR using Sabre Create Passenger Name Record API
    const pnrRequest = {
      CreatePassengerNameRecordRQ: {
        Version: "2.3.0",
        TravelItineraryAddInfo: {
          AgencyInfo: {
            Address: {
              AddressLine: "MAKU Travel Agency",
              CityName: "Sydney",
              CountryCode: "AU",
              PostalCode: "2000",
              StateCountyProv: "NSW"
            },
            Ticketing: {
              TicketType: "7TAW"
            }
          },
          CustomerInfo: {
            PersonName: passengers.map((passenger: any, index: number) => ({
              NameNumber: (index + 1).toString().padStart(2, '0'),
              PassengerType: "ADT",
              GivenName: passenger.firstName,
              Surname: passenger.lastName
            })),
            ContactNumbers: {
              ContactNumber: [
                {
                  Phone: contactInfo.phone,
                  PhoneUseType: "H"
                }
              ]
            },
            Email: [
              {
                Address: contactInfo.email,
                Type: "CC"
              }
            ]
          }
        },
        AirBook: {
          OriginDestinationInformation: {
            FlightSegment: {
              DepartureDateTime: flightOffer.departureTime,
              FlightNumber: flightOffer.flightNumber,
              NumberInParty: passengers.length.toString(),
              ResBookDesigCode: flightOffer.cabinClass || "Y",
              Status: "NN",
              DestinationLocation: {
                LocationCode: flightOffer.destination
              },
              MarketingAirline: {
                Code: flightOffer.airline,
                FlightNumber: flightOffer.flightNumber
              },
              OriginLocation: {
                LocationCode: flightOffer.origin
              }
            }
          }
        },
        PostProcessing: {
          RedisplayReservation: true,
          ARUNK: {
            PriceCalcCmd: {
              ItinTotalFare: {
                TotalFare: {
                  Amount: flightOffer.totalPrice
                }
              }
            }
          }
        }
      }
    };

    const pnrUrl = `${ENV_CONFIG.sabre?.baseUrl || 'https://api-crt.cert.havail.sabre.com'}/v2.3.0/passenger/records`;

    const pnrResponse = await fetch(pnrUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(pnrRequest)
    });

    if (!pnrResponse.ok) {
      const errorText = await pnrResponse.text();
      logger.error('[SABRE-FLIGHT-BOOKING] PNR creation failed', {
        status: pnrResponse.status,
        error: errorText
      });
      throw new Error(`PNR creation failed: ${pnrResponse.status}`);
    }

    const pnrData = await pnrResponse.json();
    const pnrLocator = pnrData.CreatePassengerNameRecordRS?.ItineraryRef?.ID || 
                      pnrData.CreatePassengerNameRecordRS?.TravelItineraryRead?.TravelItinerary?.ItineraryRef?.ID;

    if (!pnrLocator) {
      logger.error('[SABRE-FLIGHT-BOOKING] No PNR locator received', pnrData);
      throw new Error('No PNR locator received from Sabre');
    }

    logger.info('[SABRE-FLIGHT-BOOKING] PNR created successfully', { pnrLocator });

    // Create booking record in database
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .insert({
        user_id: userId,
        booking_type: 'flight',
        booking_reference: `FL${Date.now()}`,
        status: 'confirmed',
        total_amount: flightOffer.totalPrice,
        currency: flightOffer.currency || 'USD',
        booking_data: {
          flightOffer,
          passengers,
          contactInfo,
          pnrLocator,
          sabreData: pnrData
        }
      })
      .select()
      .single();

    if (bookingError) {
      logger.error('[SABRE-FLIGHT-BOOKING] Booking creation failed', bookingError);
      throw new Error(`Booking creation failed: ${bookingError.message}`);
    }

    // Create PNR record
    const { error: pnrError } = await supabase
      .from('pnr_records')
      .insert({
        user_id: userId,
        pnr_locator: pnrLocator,
        sabre_record_locator: pnrLocator,
        booking_id: booking.id,
        passenger_data: passengers,
        flight_segments: flightOffer.segments || [flightOffer],
        booking_status: 'confirmed',
        metadata: {
          sabreResponse: pnrData,
          contactInfo,
          bookingTimestamp: new Date().toISOString()
        }
      });

    if (pnrError) {
      logger.error('[SABRE-FLIGHT-BOOKING] PNR record creation failed', pnrError);
    }

    logger.info('[SABRE-FLIGHT-BOOKING] Flight booking completed successfully', {
      bookingId: booking.id,
      pnrLocator
    });

    return new Response(JSON.stringify({
      success: true,
      booking: {
        id: booking.id,
        reference: booking.booking_reference,
        pnrLocator: pnrLocator,
        status: 'confirmed',
        totalAmount: flightOffer.totalPrice,
        currency: flightOffer.currency || 'USD'
      },
      meta: {
        provider: 'sabre',
        timestamp: new Date().toISOString()
      }
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    logger.error('[SABRE-FLIGHT-BOOKING] Booking process failed', { error });
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message || 'Flight booking failed',
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