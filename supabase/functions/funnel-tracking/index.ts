import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { step } = await req.json()
    
    if (!step || !step.step_name || step.step_order === undefined) {
      return new Response(
        JSON.stringify({ error: 'Missing step data' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Insert funnel step
    const { error: insertError } = await supabase
      .from('funnel_steps')
      .insert({
        step_name: step.step_name,
        step_order: step.step_order,
        user_id: step.user_id || null,
        session_id: step.session_id,
        metadata: step.metadata || {},
        created_at: step.timestamp
      })

    if (insertError) {
      console.error('Funnel tracking insert error:', insertError)
      return new Response(
        JSON.stringify({ error: 'Failed to track funnel step' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Update session funnel progression
    await supabase.rpc('update_session_funnel_progress', {
      p_session_id: step.session_id,
      p_step_order: step.step_order,
      p_timestamp: step.timestamp
    })

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Funnel tracking error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})