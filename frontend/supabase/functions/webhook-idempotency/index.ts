import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { corsHeaders } from '../_shared/cors.ts';
import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'jsr:@supabase/supabase-js@2.53.0'

interface WebhookIdempotencyRecord {
  idempotency_key: string;
  webhook_id: string;
  response_data?: any;
  processed_at: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const url = new URL(req.url);
    const action = url.searchParams.get('action');

    if (action === 'check') {
      // Check if webhook has already been processed
      const idempotencyKey = req.headers.get('Idempotency-Key');
      const webhookId = req.headers.get('Webhook-ID');

      if (!idempotencyKey || !webhookId) {
        return new Response(
          JSON.stringify({ error: 'Missing required headers' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const { data: existing, error } = await supabaseClient
        .from('webhook_idempotency')
        .select('*')
        .eq('idempotency_key', idempotencyKey)
        .eq('webhook_id', webhookId)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
        throw error;
      }

      if (existing) {
        // Already processed, return cached response
        return new Response(
          JSON.stringify({
            processed: true,
            data: existing.response_data,
            processed_at: existing.processed_at
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ processed: false }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );

    } else if (action === 'record') {
      // Record webhook processing result
      const { idempotencyKey, webhookId, responseData } = await req.json();

      if (!idempotencyKey || !webhookId) {
        return new Response(
          JSON.stringify({ error: 'Missing required parameters' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const { error } = await supabaseClient
        .from('webhook_idempotency')
        .insert({
          idempotency_key: idempotencyKey,
          webhook_id: webhookId,
          response_data: responseData,
          processed_at: new Date().toISOString()
        });

      if (error) throw error;

      return new Response(
        JSON.stringify({ success: true }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );

    } else {
      return new Response(
        JSON.stringify({ error: 'Invalid action' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

  } catch (error) {
    console.error('Webhook idempotency error:', error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Internal server error'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});