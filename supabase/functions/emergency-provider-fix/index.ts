import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ProviderTestResult {
  provider: string;
  credentialsValid: boolean;
  authSuccess: boolean;
  error?: string;
  responseTime?: number;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { action } = await req.json()

    switch (action) {
      case 'force_reset_health':
        // Delete all duplicate health records and reset
        await supabase
          .from('provider_health')
          .delete()
          .neq('provider', 'none')

        // Insert fresh healthy records for each enabled provider
        const { data: providers } = await supabase
          .from('provider_configs')
          .select('id')
          .eq('enabled', true)

        if (providers) {
          for (const provider of providers) {
            await supabase
              .from('provider_health')
              .insert({
                provider: provider.id,
                status: 'healthy',
                error_count: 0,
                response_time_ms: 100,
                last_checked: new Date().toISOString()
              })
          }
        }

        return new Response(
          JSON.stringify({ success: true, message: 'All providers reset to healthy', count: providers?.length || 0 }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )

      case 'test_auth':
        const results: ProviderTestResult[] = []

        // Test Sabre authentication
        try {
          console.log('[EMERGENCY] Testing Sabre credentials...')
          const sabreResult = await supabase.functions.invoke('debug-sabre-credentials')
          results.push({
            provider: 'sabre',
            credentialsValid: !sabreResult.error,
            authSuccess: sabreResult.data?.authSuccess || false,
            error: sabreResult.error?.message || sabreResult.data?.error
          })
        } catch (error) {
          results.push({
            provider: 'sabre',
            credentialsValid: false,
            authSuccess: false,
            error: error.message
          })
        }

        // Test HotelBeds authentication  
        try {
          console.log('[EMERGENCY] Testing HotelBeds credentials...')
          const hotelbedsResult = await supabase.functions.invoke('hotelbeds-credential-test')
          results.push({
            provider: 'hotelbeds',
            credentialsValid: !hotelbedsResult.error,
            authSuccess: hotelbedsResult.data?.authSuccess || false,
            error: hotelbedsResult.error?.message || hotelbedsResult.data?.error
          })
        } catch (error) {
          results.push({
            provider: 'hotelbeds',
            credentialsValid: false,
            authSuccess: false,
            error: error.message
          })
        }

        // Test Amadeus authentication
        try {
          console.log('[EMERGENCY] Testing Amadeus credentials...')
          const amadeusResult = await supabase.functions.invoke('credential-test', {
            body: { provider: 'amadeus' }
          })
          results.push({
            provider: 'amadeus',
            credentialsValid: !amadeusResult.error,
            authSuccess: amadeusResult.data?.authSuccess || false,
            error: amadeusResult.error?.message || amadeusResult.data?.error
          })
        } catch (error) {
          results.push({
            provider: 'amadeus',
            credentialsValid: false,
            authSuccess: false,
            error: error.message
          })
        }

        return new Response(
          JSON.stringify({ 
            success: true, 
            results,
            summary: {
              total: results.length,
              working: results.filter(r => r.authSuccess).length,
              failed: results.filter(r => !r.authSuccess).length
            }
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )

      case 'test_rotation':
        // Test provider rotation with simple search
        try {
          console.log('[EMERGENCY] Testing provider rotation...')
          const rotationResult = await supabase.functions.invoke('provider-rotation', {
            body: {
              searchType: 'hotel',
              params: {
                cityCode: 'SYD',
                checkInDate: '2025-09-01',
                checkOutDate: '2025-09-02',
                adults: 1,
                roomQuantity: 1
              }
            }
          })

          return new Response(
            JSON.stringify({ 
              success: true, 
              rotationWorking: !rotationResult.error,
              result: rotationResult.data,
              error: rotationResult.error?.message
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        } catch (error) {
          return new Response(
            JSON.stringify({ 
              success: false, 
              rotationWorking: false,
              error: error.message
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

      default:
        return new Response(
          JSON.stringify({ error: 'Invalid action' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }

  } catch (error) {
    console.error('[EMERGENCY] Error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})