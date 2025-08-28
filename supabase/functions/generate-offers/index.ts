import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    console.log('Generating dynamic offers...')

    // TODO: Integrate with travel APIs to get real pricing data
    // For now, generate sample offers based on popular routes
    const sampleOffers = [
      {
        route: 'SYD-BNE',
        hotel_chain: 'Crown',
        discount_pct: 18,
        offer_type: 'flash_sale',
        description: 'Limited time: 18% off Crown properties in Brisbane',
        valid_until: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days
        is_active: true
      },
      {
        route: 'MEL-ADL',
        airline: 'Jetstar',
        discount_pct: 22,
        offer_type: 'early_bird',
        description: 'Early bird special: 22% off Jetstar flights to Adelaide',
        valid_until: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days
        is_active: true
      },
      {
        route: 'PER-DRW',
        hotel_chain: 'DoubleTree',
        discount_pct: 25,
        offer_type: 'weekend_special',
        description: 'Weekend getaway: 25% off DoubleTree Darwin',
        valid_until: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
        is_active: true
      }
    ]

    // Clear expired offers first
    await supabase
      .from('dynamic_offers')
      .update({ is_active: false })
      .lt('valid_until', new Date().toISOString())

    // Insert new offers
    const { data, error } = await supabase
      .from('dynamic_offers')
      .insert(sampleOffers)
      .select()

    if (error) {
      console.error('Database error:', error)
      return new Response(
        JSON.stringify({ error: 'Failed to generate offers' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    console.log(`Generated ${data.length} new offers`)

    return new Response(
      JSON.stringify({
        success: true,
        offersGenerated: data.length,
        offers: data
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Function error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})