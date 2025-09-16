import { corsHeaders } from '../_shared/cors.ts';
// Sabre Travel Alerts (Schedule Changes, Notifications) Edge Function
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
      action, // 'check_alerts', 'get_flight_status', 'acknowledge_alert'
      pnrLocator,
      flightNumber,
      alertId,
      userId 
    } = await req.json();

    logger.info(`[SABRE-TRAVEL-ALERTS] ${action.toUpperCase()} request`, {
      pnrLocator,
      flightNumber,
      alertId,
      userId
    });

    // Get Sabre access token
    const accessToken = await getSabreAccessToken();

    if (action === 'check_alerts') {
      // Check for flight alerts using Sabre Flight Status API
      const statusUrl = `${ENV_CONFIG.sabre?.baseUrl || 'https://api-crt.cert.havail.sabre.com'}/v1/lists/supported/historical/flights/${flightNumber}`;

      const response = await fetch(statusUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/json',
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        logger.error('[SABRE-TRAVEL-ALERTS] Flight status check failed', {
          status: response.status,
          error: errorText
        });
        throw new Error(`Flight status check failed: ${response.status}`);
      }

      const statusData = await response.json();
      const flightInfo = statusData.FlightStatusResponse?.FlightStatus?.[0];

      if (!flightInfo) {
        return new Response(JSON.stringify({
          success: true,
          alerts: [],
          meta: {
            action: 'check_alerts',
            provider: 'sabre',
            timestamp: new Date().toISOString()
          }
        }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // Check for schedule changes, delays, or cancellations
      const alerts = [];
      
      if (flightInfo.FlightStatusCode === 'DL') {
        alerts.push({
          type: 'delay',
          severity: 'medium',
          title: 'Flight Delayed',
          message: `Flight ${flightNumber} has been delayed. New departure time: ${flightInfo.DepartureDateTime}`,
          flightData: flightInfo
        });
      }

      if (flightInfo.FlightStatusCode === 'CX') {
        alerts.push({
          type: 'cancellation',
          severity: 'high',
          title: 'Flight Cancelled',
          message: `Flight ${flightNumber} has been cancelled. Please contact customer service for rebooking.`,
          flightData: flightInfo
        });
      }

      if (flightInfo.GateInfo?.Gate && flightInfo.GateInfo.Gate !== flightInfo.OriginalGate) {
        alerts.push({
          type: 'gate_change',
          severity: 'medium',
          title: 'Gate Change',
          message: `Flight ${flightNumber} gate changed from ${flightInfo.OriginalGate} to ${flightInfo.GateInfo.Gate}`,
          flightData: flightInfo
        });
      }

      // Get PNR record to associate alerts
      const { data: pnrRecord } = await supabase
        .from('pnr_records')
        .select('id')
        .eq('pnr_locator', pnrLocator)
        .eq('user_id', userId)
        .single();

      // Save alerts to database
      if (pnrRecord && alerts.length > 0) {
        const alertRecords = alerts.map(alert => ({
          pnr_id: pnrRecord.id,
          user_id: userId,
          alert_type: alert.type,
          severity: alert.severity,
          title: alert.title,
          message: alert.message,
          flight_segment_id: flightNumber,
          original_data: {},
          updated_data: alert.flightData,
          acknowledged: false,
          expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours
        }));

        const { error: alertError } = await supabase
          .from('travel_alerts')
          .insert(alertRecords);

        if (alertError) {
          logger.error('[SABRE-TRAVEL-ALERTS] Alert creation failed', alertError);
        }
      }

      return new Response(JSON.stringify({
        success: true,
        alerts: alerts,
        flightStatus: flightInfo,
        meta: {
          action: 'check_alerts',
          provider: 'sabre',
          timestamp: new Date().toISOString()
        }
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });

    } else if (action === 'get_flight_status') {
      // Get current flight status
      const statusUrl = `${ENV_CONFIG.sabre?.baseUrl || 'https://api-crt.cert.havail.sabre.com'}/v1/lists/supported/historical/flights/${flightNumber}`;

      const response = await fetch(statusUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/json',
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        logger.error('[SABRE-TRAVEL-ALERTS] Flight status retrieval failed', {
          status: response.status,
          error: errorText
        });
        throw new Error(`Flight status retrieval failed: ${response.status}`);
      }

      const statusData = await response.json();

      return new Response(JSON.stringify({
        success: true,
        flightStatus: statusData.FlightStatusResponse?.FlightStatus?.[0] || {},
        meta: {
          action: 'get_flight_status',
          provider: 'sabre',
          timestamp: new Date().toISOString()
        }
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });

    } else if (action === 'acknowledge_alert') {
      // Acknowledge travel alert
      const { error: ackError } = await supabase
        .from('travel_alerts')
        .update({
          acknowledged: true,
          acknowledged_at: new Date().toISOString()
        })
        .eq('id', alertId)
        .eq('user_id', userId);

      if (ackError) {
        logger.error('[SABRE-TRAVEL-ALERTS] Alert acknowledgment failed', ackError);
        throw new Error('Failed to acknowledge alert');
      }

      return new Response(JSON.stringify({
        success: true,
        meta: {
          action: 'acknowledge_alert',
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
    logger.error('[SABRE-TRAVEL-ALERTS] Operation failed', { error });
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message || 'Travel alerts operation failed',
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