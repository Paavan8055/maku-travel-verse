import { corsHeaders } from '../_shared/cors.ts';
// Sabre PNR Management (Retrieve, Modify, Cancel) Edge Function
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
      action, // 'retrieve', 'modify', 'cancel'
      pnrLocator,
      userId,
      modificationData 
    } = await req.json();

    logger.info(`[SABRE-PNR-MANAGEMENT] ${action.toUpperCase()} PNR request`, {
      pnrLocator,
      userId
    });

    // Get Sabre access token
    const accessToken = await getSabreAccessToken();

    if (action === 'retrieve') {
      // Retrieve PNR using Sabre Get Reservation API
      const retrieveUrl = `${ENV_CONFIG.sabre?.baseUrl || 'https://api-crt.cert.havail.sabre.com'}/v1.0.0/passenger/records/${pnrLocator}`;

      const response = await fetch(retrieveUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/json',
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        logger.error('[SABRE-PNR-MANAGEMENT] PNR retrieval failed', {
          status: response.status,
          error: errorText
        });
        throw new Error(`PNR retrieval failed: ${response.status}`);
      }

      const pnrData = await response.json();
      
      // Update local PNR record with latest data
      const { error: updateError } = await supabase
        .from('pnr_records')
        .update({
          metadata: {
            ...pnrData,
            lastRetrieved: new Date().toISOString()
          },
          updated_at: new Date().toISOString()
        })
        .eq('pnr_locator', pnrLocator)
        .eq('user_id', userId);

      if (updateError) {
        logger.error('[SABRE-PNR-MANAGEMENT] PNR update failed', updateError);
      }

      return new Response(JSON.stringify({
        success: true,
        pnr: pnrData,
        meta: {
          action: 'retrieve',
          provider: 'sabre',
          timestamp: new Date().toISOString()
        }
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });

    } else if (action === 'modify') {
      // Modify PNR using Sabre Update Reservation API
      const modifyRequest = {
        UpdateReservationRQ: {
          Version: "1.0.0",
          ReservationUpdateList: {
            Locator: pnrLocator,
            ReservationUpdateItem: modificationData
          }
        }
      };

      const modifyUrl = `${ENV_CONFIG.sabre?.baseUrl || 'https://api-crt.cert.havail.sabre.com'}/v1.0.0/passenger/records/${pnrLocator}`;

      const response = await fetch(modifyUrl, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(modifyRequest)
      });

      if (!response.ok) {
        const errorText = await response.text();
        logger.error('[SABRE-PNR-MANAGEMENT] PNR modification failed', {
          status: response.status,
          error: errorText
        });
        throw new Error(`PNR modification failed: ${response.status}`);
      }

      const modifyData = await response.json();

      // Create change request record
      const { error: changeError } = await supabase
        .from('flight_change_requests')
        .insert({
          pnr_id: (await supabase
            .from('pnr_records')
            .select('id')
            .eq('pnr_locator', pnrLocator)
            .eq('user_id', userId)
            .single()).data?.id,
          user_id: userId,
          original_flight_data: {},
          requested_flight_data: modificationData,
          change_type: 'modification',
          status: 'processed',
          sabre_change_reference: modifyData.UpdateReservationRS?.ReservationUpdateList?.Locator,
          processed_at: new Date().toISOString(),
          metadata: modifyData
        });

      if (changeError) {
        logger.error('[SABRE-PNR-MANAGEMENT] Change request creation failed', changeError);
      }

      return new Response(JSON.stringify({
        success: true,
        modification: modifyData,
        meta: {
          action: 'modify',
          provider: 'sabre',
          timestamp: new Date().toISOString()
        }
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });

    } else if (action === 'cancel') {
      // Cancel PNR using Sabre Cancel Reservation API
      const cancelRequest = {
        CancelReservationRQ: {
          Version: "1.0.0",
          Locator: pnrLocator,
          CancelType: "Full"
        }
      };

      const cancelUrl = `${ENV_CONFIG.sabre?.baseUrl || 'https://api-crt.cert.havail.sabre.com'}/v1.0.0/passenger/records/${pnrLocator}/cancel`;

      const response = await fetch(cancelUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(cancelRequest)
      });

      if (!response.ok) {
        const errorText = await response.text();
        logger.error('[SABRE-PNR-MANAGEMENT] PNR cancellation failed', {
          status: response.status,
          error: errorText
        });
        throw new Error(`PNR cancellation failed: ${response.status}`);
      }

      const cancelData = await response.json();

      // Update PNR and booking status
      const { error: pnrUpdateError } = await supabase
        .from('pnr_records')
        .update({
          booking_status: 'cancelled',
          metadata: {
            ...cancelData,
            cancelledAt: new Date().toISOString()
          },
          updated_at: new Date().toISOString()
        })
        .eq('pnr_locator', pnrLocator)
        .eq('user_id', userId);

      const { error: bookingUpdateError } = await supabase
        .from('bookings')
        .update({
          status: 'cancelled',
          updated_at: new Date().toISOString()
        })
        .eq('booking_reference', pnrLocator);

      if (pnrUpdateError) {
        logger.error('[SABRE-PNR-MANAGEMENT] PNR status update failed', pnrUpdateError);
      }
      if (bookingUpdateError) {
        logger.error('[SABRE-PNR-MANAGEMENT] Booking status update failed', bookingUpdateError);
      }

      return new Response(JSON.stringify({
        success: true,
        cancellation: cancelData,
        meta: {
          action: 'cancel',
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
    logger.error('[SABRE-PNR-MANAGEMENT] Operation failed', { error });
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message || 'PNR management operation failed',
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