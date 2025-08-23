import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import logger from "../_shared/simpleLogger.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ErrorReport {
  error_type: string;
  error_message: string;
  stack_trace?: string;
  user_context?: any;
  request_context?: any;
  severity?: 'debug' | 'info' | 'warning' | 'error' | 'fatal';
  correlation_id?: string;
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
    const errorReport: ErrorReport = await req.json();
    
    logger.info('[ERROR-TRACKING] Received error report', { 
      errorType: errorReport.error_type,
      severity: errorReport.severity 
    });

    // Store error in database
    const { error: dbError } = await supabase
      .from('error_tracking')
      .insert({
        correlation_id: errorReport.correlation_id || crypto.randomUUID(),
        error_type: errorReport.error_type,
        error_message: errorReport.error_message,
        stack_trace: errorReport.stack_trace,
        user_context: errorReport.user_context || {},
        request_context: errorReport.request_context || {},
        severity: errorReport.severity || 'error',
        environment: 'production'
      });

    if (dbError) {
      logger.error('[ERROR-TRACKING] Failed to store error', { error: dbError.message });
    } else {
      logger.info('[ERROR-TRACKING] Error stored successfully');
    }

    // Check if Sentry integration is enabled
    const { data: sentryFlag } = await supabase
      .from('feature_flags')
      .select('enabled')
      .eq('flag_name', 'sentry_error_tracking')
      .single();

    if (sentryFlag?.enabled) {
      // TODO: Forward to Sentry when integration is set up
      logger.info('[ERROR-TRACKING] Would forward to Sentry (integration pending)');
    }

    return new Response(JSON.stringify({
      success: true,
      message: 'Error tracked successfully'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    logger.error('[ERROR-TRACKING] Failed to process error report', { error: error.message });
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500
    });
  }
});