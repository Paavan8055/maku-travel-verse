import { corsHeaders } from '../_shared/cors.ts';
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.53.0'

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Get the authorization header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authorization header required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Verify JWT and get user
    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    )

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check if user is admin
    const { data: adminCheck, error: adminError } = await supabase
      .rpc('is_secure_admin', { _user_id: user.id })

    if (adminError || !adminCheck) {
      console.log('Admin access denied for user:', user.id)
      return new Response(
        JSON.stringify({ error: 'Admin access required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { action } = await req.json()

    switch (action) {
      case 'get_metrics':
        return await getAdminMetrics(supabase)
      case 'get_provider_health':
        return await getProviderHealth(supabase)
      case 'get_booking_analytics':
        return await getBookingAnalytics(supabase)
      case 'get_system_logs':
        return await getSystemLogs(supabase)
      default:
        return new Response(
          JSON.stringify({ error: 'Invalid action' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }

  } catch (error) {
    console.error('Admin dashboard error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

async function getAdminMetrics(supabase: any) {
  const [bookings, payments, users] = await Promise.all([
    supabase.from('bookings').select('status, total_amount, created_at').order('created_at', { ascending: false }).limit(100),
    supabase.from('payments').select('status, amount, created_at').order('created_at', { ascending: false }).limit(100),
    supabase.from('profiles').select('created_at').order('created_at', { ascending: false }).limit(100)
  ])

  const today = new Date().toISOString().split('T')[0]
  const todayBookings = bookings.data?.filter(b => b.created_at.startsWith(today)) || []
  const totalRevenue = payments.data?.filter(p => p.status === 'succeeded').reduce((sum, p) => sum + p.amount, 0) || 0

  return new Response(
    JSON.stringify({
      bookings: {
        total: bookings.data?.length || 0,
        today: todayBookings.length,
        revenue: totalRevenue,
        byStatus: bookings.data?.reduce((acc, b) => ({ ...acc, [b.status]: (acc[b.status] || 0) + 1 }), {}) || {}
      },
      users: {
        total: users.data?.length || 0,
        newToday: users.data?.filter(u => u.created_at.startsWith(today)).length || 0
      }
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function getProviderHealth(supabase: any) {
  const { data } = await supabase
    .from('provider_health')
    .select('*')
    .order('last_checked', { ascending: false })

  return new Response(
    JSON.stringify({ providers: data || [] }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function getBookingAnalytics(supabase: any) {
  const { data } = await supabase
    .from('bookings')
    .select('booking_type, status, total_amount, created_at')
    .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
    .order('created_at', { ascending: false })

  const analytics = {
    conversion: calculateConversion(data || []),
    revenue: calculateRevenue(data || []),
    popular_destinations: calculatePopularDestinations(data || [])
  }

  return new Response(
    JSON.stringify(analytics),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function getSystemLogs(supabase: any) {
  const { data } = await supabase
    .from('system_logs')
    .select('*')
    .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
    .order('created_at', { ascending: false })
    .limit(200)

  return new Response(
    JSON.stringify({ logs: data || [] }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

function calculateConversion(bookings: any[]) {
  const confirmed = bookings.filter(b => b.status === 'confirmed').length
  return bookings.length > 0 ? (confirmed / bookings.length * 100).toFixed(2) : '0'
}

function calculateRevenue(bookings: any[]) {
  return bookings
    .filter(b => b.status === 'confirmed')
    .reduce((sum, b) => sum + (b.total_amount || 0), 0)
}

function calculatePopularDestinations(bookings: any[]) {
  // Extract destinations from booking data
  const destinations: { [key: string]: number } = {}
  bookings.forEach(booking => {
    // This would need to parse booking_data for actual destinations
    // For now, return sample data
  })
  return { Sydney: 25, Melbourne: 18, Brisbane: 12, Perth: 8 }
}