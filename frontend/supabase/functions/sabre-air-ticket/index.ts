import { corsHeaders } from '../_shared/cors.ts';
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.53.0";
import { getSabreAccessToken, SABRE_CONFIG } from "../_shared/sabre.ts";
import logger from "../_shared/logger.ts";


interface SabreAirTicketRequest {
  pnr: string;
  passengers: any[];
  paymentForm?: any;
  bookingId: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );

  try {
    const params: SabreAirTicketRequest = await req.json();
    logger.info('[SABRE-AIRTICKET] Ticket request:', { pnr: params.pnr, bookingId: params.bookingId });

    const accessToken = await getSabreAccessToken();
    
    const ticketRequest = {
      AirTicketRQ: {
        POS: {
          Source: [{
            PseudoCityCode: process.env.SABRE_PCC || "F9FE",
            RequestorID: {
              Type: "1",
              ID: "1",
              CompanyName: {
                Code: "TN"
              }
            }
          }]
        },
        Itinerary: {
          ID: params.pnr
        },
        Ticketing: params.passengers.map((passenger: any, index: number) => ({
          PersonName: {
            NameNumber: (index + 1).toString(),
            GivenName: passenger.firstName,
            Surname: passenger.lastName
          },
          PassengerTypeCode: passenger.type || "ADT",
          TicketNumber: "",
          Queue: {
            QueueNumber: "50",
            QueueCategory: "0"
          }
        })),
        PostProcessing: {
          EndTransaction: {
            Source: {
              ReceivedFrom: "MAKU"
            }
          }
        }
      }
    };

    const response = await fetch(`${SABRE_CONFIG.baseUrl}/v1/air/ticket`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(ticketRequest),
    });

    if (!response.ok) {
      const errorText = await response.text();
      logger.error('[SABRE-AIRTICKET] API request failed:', {
        status: response.status,
        error: errorText,
        pnr: params.pnr
      });
      throw new Error(`Sabre AirTicket failed: ${response.status}`);
    }

    const data = await response.json();
    const ticketInfo = data.AirTicketRS;
    
    if (!ticketInfo || ticketInfo.ApplicationResults?.Error) {
      throw new Error(`Ticketing failed: ${ticketInfo?.ApplicationResults?.Error?.[0]?.SystemSpecificResults?.[0]?.Message?.[0] || 'Unknown error'}`);
    }

    // Extract ticket numbers and confirmation details
    const tickets = ticketInfo.ItineraryRef?.Ticketing || [];
    const ticketNumbers = tickets.map((ticket: any) => ticket.TicketNumber).filter(Boolean);
    
    logger.info('[SABRE-AIRTICKET] Ticketing successful:', { 
      pnr: params.pnr, 
      ticketCount: ticketNumbers.length,
      ticketNumbers 
    });

    // Update booking with ticket information
    const { error: updateError } = await supabase
      .from('bookings')
      .update({
        booking_data: {
          ticketNumbers,
          pnr: params.pnr,
          ticketingDate: new Date().toISOString(),
          confirmationNumber: ticketInfo.Locator || params.pnr
        },
        status: 'confirmed'
      })
      .eq('id', params.bookingId);

    if (updateError) {
      logger.error('[SABRE-AIRTICKET] Failed to update booking:', updateError);
    }

    return new Response(JSON.stringify({
      success: true,
      data: {
        pnr: params.pnr,
        ticketNumbers,
        confirmationNumber: ticketInfo.Locator || params.pnr,
        ticketingDate: new Date().toISOString(),
        status: 'confirmed',
        eTickets: tickets.map((ticket: any) => ({
          ticketNumber: ticket.TicketNumber,
          passengerName: ticket.PersonName?.GivenName + ' ' + ticket.PersonName?.Surname,
          validatingCarrier: ticket.ValidatingCarrier
        }))
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    logger.error('[SABRE-AIRTICKET] Error:', error);
    
    // Insert critical alert for failed ticketing
    try {
      await supabase
        .from('critical_alerts')
        .insert({
          alert_type: 'flight_ticketing_failed',
          message: `Sabre ticketing failed: ${error.message}`,
          severity: 'critical',
          requires_manual_action: true,
          booking_id: params?.bookingId
        });
    } catch (alertError) {
      logger.error('[SABRE-AIRTICKET] Failed to create alert:', alertError);
    }
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message || 'Ticketing failed',
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});