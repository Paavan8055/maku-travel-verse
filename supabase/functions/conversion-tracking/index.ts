import { corsHeaders } from '../_shared/cors.ts';
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.53.0'

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { event } = await req.json()
    
    if (!event || !event.event_name) {
      return new Response(
        JSON.stringify({ error: 'Missing event data' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Insert conversion event
    const { error: insertError } = await supabase
      .from('conversion_events')
      .insert({
        event_name: event.event_name,
        user_id: event.user_id || null,
        session_id: event.session_id,
        page_url: event.page_url,
        properties: event.properties || {},
        value: event.value || null,
        currency: event.currency || null,
        created_at: event.timestamp
      })

    if (insertError) {
      console.error('Conversion tracking insert error:', insertError)
      return new Response(
        JSON.stringify({ error: 'Failed to track conversion' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Update session analytics
    await supabase
      .from('session_analytics')
      .upsert({
        session_id: event.session_id,
        user_id: event.user_id || null,
        last_activity: event.timestamp,
        total_events: 1,
        total_value: event.value || 0,
        currency: event.currency || 'AUD'
      }, {
        onConflict: 'session_id',
        ignoreDuplicates: false
      })

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Conversion tracking error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})