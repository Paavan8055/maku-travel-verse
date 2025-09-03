import { corsHeaders } from '../_shared/cors.ts';
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.53.0'

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { action } = await req.json()
    const correlationId = crypto.randomUUID()

    console.log(`Emergency provider fix starting: ${action}`, { correlationId })

    if (action === 'force_reset_health') {
      // Reset all provider health to healthy status
      const { error: resetError } = await supabaseClient
        .from('provider_health')
        .update({
          status: 'healthy',
          response_time_ms: 1500,
          error_count: 0,
          last_checked: new Date().toISOString()
        })
        .neq('provider', 'nonexistent')

      if (resetError) {
        console.error('Failed to reset provider health:', resetError)
        throw resetError
      }

      console.log('Provider health reset completed', { correlationId })
    }

    if (action === 'test_auth') {
      // Test authentication by querying admin users
      const { data: adminData, error: adminError } = await supabaseClient
        .from('admin_users')
        .select('id')
        .limit(1)

      if (adminError) {
        console.warn('Auth test failed:', adminError)
      } else {
        console.log('Auth test passed', { correlationId })
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        action,
        correlationId 
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Emergency provider fix error:', error)
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})