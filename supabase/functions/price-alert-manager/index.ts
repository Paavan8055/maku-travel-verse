import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface PriceAlert {
  id?: string
  user_id?: string
  search_criteria: {
    type: 'flight' | 'hotel' | 'activity'
    origin?: string
    destination: string
    dates: { start: string; end?: string }
    passengers?: number
    rooms?: number
  }
  target_price: number
  current_price: number
  threshold_percentage: number
  is_active: boolean
  notification_method: 'email' | 'push' | 'both'
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        auth: { autoRefreshToken: false, persistSession: false }
      }
    )

    const authHeader = req.headers.get('Authorization')
    let userId = null

    if (authHeader) {
      const { data: { user } } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''))
      userId = user?.id
    }

    const { action, ...payload } = await req.json()

    switch (action) {
      case 'create_alert':
        return await createPriceAlert(supabase, userId, payload)
      case 'get_alerts':
        return await getUserAlerts(supabase, userId)
      case 'update_alert':
        return await updatePriceAlert(supabase, userId, payload)
      case 'delete_alert':
        return await deletePriceAlert(supabase, userId, payload.alert_id)
      case 'check_prices':
        return await checkPriceChanges(supabase)
      default:
        return new Response(
          JSON.stringify({ error: 'Invalid action' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }

  } catch (error) {
    console.error('Price alert error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

async function createPriceAlert(supabase: any, userId: string | null, alertData: PriceAlert) {
  if (!userId) {
    return new Response(
      JSON.stringify({ error: 'Authentication required' }),
      { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  const alert = {
    user_id: userId,
    search_criteria: alertData.search_criteria,
    target_price: alertData.target_price,
    current_price: alertData.current_price,
    threshold_percentage: alertData.threshold_percentage || 10,
    is_active: true,
    notification_method: alertData.notification_method || 'email',
    created_at: new Date().toISOString(),
    last_checked: new Date().toISOString()
  }

  const { data, error } = await supabase
    .from('price_alerts')
    .insert(alert)
    .select()
    .single()

  if (error) {
    console.error('Failed to create price alert:', error)
    return new Response(
      JSON.stringify({ error: 'Failed to create alert' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  return new Response(
    JSON.stringify({ success: true, alert: data }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function getUserAlerts(supabase: any, userId: string | null) {
  if (!userId) {
    return new Response(
      JSON.stringify({ error: 'Authentication required' }),
      { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  const { data, error } = await supabase
    .from('price_alerts')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Failed to fetch alerts:', error)
    return new Response(
      JSON.stringify({ error: 'Failed to fetch alerts' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  return new Response(
    JSON.stringify({ alerts: data || [] }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function updatePriceAlert(supabase: any, userId: string | null, { alert_id, updates }: any) {
  if (!userId) {
    return new Response(
      JSON.stringify({ error: 'Authentication required' }),
      { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  const { data, error } = await supabase
    .from('price_alerts')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', alert_id)
    .eq('user_id', userId)
    .select()
    .single()

  if (error) {
    console.error('Failed to update alert:', error)
    return new Response(
      JSON.stringify({ error: 'Failed to update alert' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  return new Response(
    JSON.stringify({ success: true, alert: data }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function deletePriceAlert(supabase: any, userId: string | null, alertId: string) {
  if (!userId) {
    return new Response(
      JSON.stringify({ error: 'Authentication required' }),
      { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  const { error } = await supabase
    .from('price_alerts')
    .delete()
    .eq('id', alertId)
    .eq('user_id', userId)

  if (error) {
    console.error('Failed to delete alert:', error)
    return new Response(
      JSON.stringify({ error: 'Failed to delete alert' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  return new Response(
    JSON.stringify({ success: true }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function checkPriceChanges(supabase: any) {
  console.log('Checking price changes for active alerts...')
  
  const { data: alerts, error } = await supabase
    .from('price_alerts')
    .select('*')
    .eq('is_active', true)
    .lt('last_checked', new Date(Date.now() - 60 * 60 * 1000).toISOString()) // Check hourly

  if (error || !alerts?.length) {
    return new Response(
      JSON.stringify({ message: 'No alerts to check' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  const notifications = []

  for (const alert of alerts) {
    try {
      const newPrice = await getCurrentPrice(alert.search_criteria)
      const priceChange = ((newPrice - alert.current_price) / alert.current_price) * 100

      if (Math.abs(priceChange) >= alert.threshold_percentage) {
        // Send notification
        notifications.push({
          user_id: alert.user_id,
          alert_id: alert.id,
          old_price: alert.current_price,
          new_price: newPrice,
          change_percentage: priceChange
        })

        // Update alert with new price
        await supabase
          .from('price_alerts')
          .update({ 
            current_price: newPrice, 
            last_checked: new Date().toISOString(),
            last_triggered: priceChange < 0 ? new Date().toISOString() : alert.last_triggered
          })
          .eq('id', alert.id)
      } else {
        // Just update last_checked
        await supabase
          .from('price_alerts')
          .update({ last_checked: new Date().toISOString() })
          .eq('id', alert.id)
      }
    } catch (error) {
      console.error(`Failed to check price for alert ${alert.id}:`, error)
    }
  }

  return new Response(
    JSON.stringify({ 
      checked: alerts.length, 
      triggered: notifications.length,
      notifications 
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function getCurrentPrice(searchCriteria: any): Promise<number> {
  // Simulate price checking - in production, this would call actual provider APIs
  const basePrice = searchCriteria.type === 'flight' ? 350 : 
                   searchCriteria.type === 'hotel' ? 180 : 65

  // Add some randomness to simulate price fluctuation
  const fluctuation = 0.8 + Math.random() * 0.4 // ±20% variation
  return Math.round(basePrice * fluctuation)
}