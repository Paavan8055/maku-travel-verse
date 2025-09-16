import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'jsr:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-correlation-id',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { logs } = await req.json();
    
    // Insert system logs
    if (logs && Array.isArray(logs)) {
      const { error } = await supabaseClient
        .from('system_logs')
        .insert(logs.map(log => ({
          correlation_id: req.headers.get('x-correlation-id') || crypto.randomUUID(),
          service_name: log.service_name,
          log_level: log.log_level,
          level: log.log_level, 
          message: log.message,
          metadata: log.metadata || {},
          created_at: new Date().toISOString()
        })));

      if (error) console.error('Failed to insert system logs:', error);
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: 'Failed to process logs' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});