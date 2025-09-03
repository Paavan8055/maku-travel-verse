import { corsHeaders } from '../_shared/cors.ts';
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.53.0';
import logger from "../_shared/logger.ts";

const CORE_PROVIDERS = ['amadeus','sabre-flight','sabre-hotel','hotelbeds-hotel','hotelbeds-activity'];

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );

  const startTime = Date.now();
  const correlationId = crypto.randomUUID();
  logger.info('Provider config cleanup started', { correlationId });

  try {
    const { data: offenders, error: fetchError } = await supabase
      .from('provider_configs')
      .select('id')
      .not('id', 'in', `(${CORE_PROVIDERS.map(id => `'${id}'`).join(',')})`);

    if (fetchError) throw fetchError;

    const removedIds = offenders?.map(o => o.id) ?? [];

    if (removedIds.length > 0) {
      const { error: deleteError } = await supabase
        .from('provider_configs')
        .delete()
        .not('id', 'in', `(${CORE_PROVIDERS.map(id => `'${id}'`).join(',')})`);

      if (deleteError) throw deleteError;

      const { error: auditError } = await supabase.from('cleanup_audit').insert({
        cleanup_type: 'provider_config_cleanup',
        errors_encountered: 0,
        execution_time_ms: Date.now() - startTime,
        triggered_by: 'cron',
        details: { removed_providers: removedIds }
      });

      if (auditError) logger.error('Failed to log cleanup', auditError, { correlationId });

      logger.warn('Removed non-core providers', { correlationId, removedIds });
    } else {
      logger.info('No non-core providers found', { correlationId });
    }

    return new Response(
      JSON.stringify({
        success: true,
        removed: removedIds,
        correlationId
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    logger.error('Provider config cleanup failed', error, { correlationId });

    return new Response(
      JSON.stringify({ success: false, error: error.message, correlationId }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
