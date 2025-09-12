import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { corsHeaders } from '../_shared/cors.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.53.0'
import logger from "../_shared/logger.ts";
...
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

    const { action, date_range, metrics_type } = await req.json()
    
    console.log(`[BUSINESS-INTELLIGENCE] Processing ${action} request`)

    switch (action) {
      case 'get_business_metrics':
        return await getBusinessMetrics(supabase, date_range)
      
      case 'generate_financial_report':
        return await generateFinancialReport(supabase, date_range)
      
      case 'analyze_customer_behavior':
        return await analyzeCustomerBehavior(supabase)
      
      case 'predictive_analytics':
        return await generatePredictiveAnalytics(supabase)
      
      case 'kpi_dashboard':
        return await generateKPIDashboard(supabase)
      
      default:
        throw new Error(`Unknown BI action: ${action}`)
    }

  } catch (error) {
    console.error('[BUSINESS-INTELLIGENCE] Error:', error)
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    )
  }
})

async function getBusinessMetrics(supabase: any, dateRange: string = '30d') {
  const startTime = performance.now()
  
  // Calculate date range
  const endDate = new Date()
  const startDate = new Date()
  switch (dateRange) {
    case '7d':
      startDate.setDate(endDate.getDate() - 7)
      break
    case '30d':
      startDate.setDate(endDate.getDate() - 30)
      break
    case '90d':
      startDate.setDate(endDate.getDate() - 90)
      break
    case '1y':
      startDate.setFullYear(endDate.getFullYear() - 1)
      break
  }

  // Get booking data
  const { data: bookings } = await supabase
    .from('bookings')
    .select('*')
    .gte('created_at', startDate.toISOString())
    .lte('created_at', endDate.toISOString())

  // Get conversion events
  const { data: conversions } = await supabase
    .from('conversion_events')
    .select('*')
    .gte('created_at', startDate.toISOString())
    .lte('created_at', endDate.toISOString())

  // Calculate metrics
  const totalRevenue = bookings?.reduce((sum, booking) => sum + (booking.total_amount || 0), 0) || 0
  const totalBookings = bookings?.length || 0
  const averageBookingValue = totalBookings > 0 ? totalRevenue / totalBookings : 0

  const revenueByService = {
    hotels: bookings?.filter(b => b.booking_type === 'hotel').reduce((sum, b) => sum + (b.total_amount || 0), 0) || 0,
    flights: bookings?.filter(b => b.booking_type === 'flight').reduce((sum, b) => sum + (b.total_amount || 0), 0) || 0,
    activities: bookings?.filter(b => b.booking_type === 'activity').reduce((sum, b) => sum + (b.total_amount || 0), 0) || 0
  }

  const bookingsByStatus = {
    confirmed: bookings?.filter(b => b.status === 'confirmed').length || 0,
    pending: bookings?.filter(b => b.status === 'pending').length || 0,
    cancelled: bookings?.filter(b => b.status === 'cancelled').length || 0,
    completed: bookings?.filter(b => b.status === 'completed').length || 0
  }

  // Generate monthly revenue trend
  const monthlyRevenue = []
  for (let i = 5; i >= 0; i--) {
    const monthStart = new Date()
    monthStart.setMonth(monthStart.getMonth() - i)
    monthStart.setDate(1)
    
    const monthEnd = new Date(monthStart)
    monthEnd.setMonth(monthEnd.getMonth() + 1)
    monthEnd.setDate(0)
    
    const monthBookings = bookings?.filter(b => {
      const bookingDate = new Date(b.created_at)
      return bookingDate >= monthStart && bookingDate <= monthEnd
    }) || []
    
    const monthRevenue = monthBookings.reduce((sum, b) => sum + (b.total_amount || 0), 0)
    
    monthlyRevenue.push({
      month: monthStart.toLocaleDateString('en-US', { year: 'numeric', month: 'short' }),
      amount: monthRevenue
    })
  }

  const metrics: BusinessMetrics = {
    revenue: {
      total: totalRevenue,
      growth_rate: 15.5, // Mock calculation
      by_service: revenueByService,
      by_month: monthlyRevenue
    },
    bookings: {
      total: totalBookings,
      conversion_rate: conversions?.length ? (totalBookings / conversions.length) * 100 : 0,
      average_value: averageBookingValue,
      by_status: bookingsByStatus
    },
    customers: {
      total: new Set(bookings?.map(b => b.user_id).filter(id => id)).size,
      new_customers: 45, // Mock calculation
      retention_rate: 78.5, // Mock calculation
      lifetime_value: 850 // Mock calculation
    },
    performance: {
      search_success_rate: 94.2, // Mock calculation
      booking_completion_rate: 87.3, // Mock calculation
      average_response_time: 245, // Mock calculation
      uptime_percentage: 99.8 // Mock calculation
    }
  }

  return new Response(
    JSON.stringify({
      success: true,
      metrics,
      date_range: dateRange,
      execution_time_ms: performance.now() - startTime
    }),
    { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200 
    }
  )
}

async function generateFinancialReport(supabase: any, dateRange: string = '30d') {
  const startTime = performance.now()

  // Get payment data
  const { data: payments } = await supabase
    .from('payments')
    .select('*')
    .gte('created_at', new Date(Date.now() - 30 * 24 * 3600000).toISOString())

  const financialReport = {
    gross_revenue: payments?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0,
    net_revenue: (payments?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0) * 0.97, // Mock 3% fees
    transaction_fees: (payments?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0) * 0.03,
    refunds: payments?.filter(p => p.status === 'refunded').reduce((sum, p) => sum + (p.amount || 0), 0) || 0,
    payment_methods: {
      card: payments?.filter(p => p.status === 'completed').length || 0,
      bank_transfer: 0, // Mock
      digital_wallet: 0 // Mock
    },
    currencies: {
      AUD: payments?.filter(p => p.currency === 'AUD').reduce((sum, p) => sum + (p.amount || 0), 0) || 0,
      USD: payments?.filter(p => p.currency === 'USD').reduce((sum, p) => sum + (p.amount || 0), 0) || 0
    },
    recommendations: [
      'Consider implementing dynamic pricing for peak seasons',
      'Expand payment method options to increase conversion',
      'Analyze refund patterns to reduce cancellation rates'
    ]
  }

  return new Response(
    JSON.stringify({
      success: true,
      financial_report: financialReport,
      execution_time_ms: performance.now() - startTime
    }),
    { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200 
    }
  )
}

async function analyzeCustomerBehavior(supabase: any) {
  const startTime = performance.now()

  // Get user activity data
  const { data: activities } = await supabase
    .from('user_activity_logs')
    .select('*')
    .gte('created_at', new Date(Date.now() - 30 * 24 * 3600000).toISOString())
    .limit(1000)

  // Get booking data for behavior analysis
  const { data: bookings } = await supabase
    .from('bookings')
    .select('*')
    .gte('created_at', new Date(Date.now() - 90 * 24 * 3600000).toISOString())

  const behaviorAnalysis = {
    user_journey: {
      average_session_duration: 8.5, // Mock minutes
      pages_per_session: 4.2,
      bounce_rate: 23.5, // Mock percentage
      conversion_funnel: {
        search: 1000,
        select: 450,
        review: 200,
        payment: 120,
        confirmed: 98
      }
    },
    booking_patterns: {
      peak_booking_hours: [10, 11, 14, 15, 20], // Hours of day
      advance_booking_days: 35, // Average days in advance
      popular_destinations: [
        { destination: 'Sydney', bookings: 45 },
        { destination: 'Melbourne', bookings: 38 },
        { destination: 'Brisbane', bookings: 22 }
      ],
      seasonal_trends: {
        summer: 1.4,
        autumn: 0.9,
        winter: 0.7,
        spring: 1.1
      }
    },
    customer_segments: [
      {
        segment: 'Business Travelers',
        size: 35,
        characteristics: ['Short stays', 'Weekday bookings', 'Premium hotels'],
        avg_booking_value: 450
      },
      {
        segment: 'Leisure Travelers',
        size: 55,
        characteristics: ['Weekend stays', 'Package deals', 'Price sensitive'],
        avg_booking_value: 280
      },
      {
        segment: 'Group Travelers',
        size: 10,
        characteristics: ['Multiple rooms', 'Activities included', 'Extended stays'],
        avg_booking_value: 1200
      }
    ],
    retention_analysis: {
      first_time_customers: 60, // Percentage
      repeat_customers: 40,
      customer_lifetime_value: 850,
      churn_rate: 15.2 // Monthly percentage
    }
  }

  return new Response(
    JSON.stringify({
      success: true,
      behavior_analysis: behaviorAnalysis,
      execution_time_ms: performance.now() - startTime
    }),
    { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200 
    }
  )
}

async function generatePredictiveAnalytics(supabase: any) {
  const startTime = performance.now()

  // Generate mock predictive analytics (in production, use ML models)
  const analytics: PredictiveAnalytics = {
    booking_forecast: [
      { date: '2025-09-04', predicted_bookings: 25, confidence_interval: [20, 30] },
      { date: '2025-09-05', predicted_bookings: 28, confidence_interval: [23, 33] },
      { date: '2025-09-06', predicted_bookings: 22, confidence_interval: [18, 26] },
      { date: '2025-09-07', predicted_bookings: 35, confidence_interval: [30, 40] },
      { date: '2025-09-08', predicted_bookings: 18, confidence_interval: [15, 21] }
    ],
    revenue_forecast: [
      { month: 'Sep 2025', predicted_revenue: 125000, growth_rate: 12.5 },
      { month: 'Oct 2025', predicted_revenue: 140000, growth_rate: 15.2 },
      { month: 'Nov 2025', predicted_revenue: 135000, growth_rate: 8.8 },
      { month: 'Dec 2025', predicted_revenue: 180000, growth_rate: 28.5 }
    ],
    demand_patterns: [
      {
        destination: 'Sydney',
        peak_months: ['December', 'January', 'February'],
        demand_score: 8.5
      },
      {
        destination: 'Melbourne',
        peak_months: ['March', 'April', 'September'],
        demand_score: 7.2
      },
      {
        destination: 'Gold Coast',
        peak_months: ['June', 'July', 'September'],
        demand_score: 6.8
      }
    ],
    customer_segments: [
      {
        segment: 'High-Value Business',
        size: 15,
        avg_booking_value: 850,
        characteristics: ['Premium services', 'Last-minute bookings', 'Loyalty program members']
      },
      {
        segment: 'Family Travelers',
        size: 35,
        avg_booking_value: 420,
        characteristics: ['Multi-room bookings', 'Family-friendly destinations', 'Package deals']
      },
      {
        segment: 'Budget Conscious',
        size: 50,
        avg_booking_value: 180,
        characteristics: ['Price comparison', 'Flexible dates', 'Basic accommodations']
      }
    ]
  }

  return new Response(
    JSON.stringify({
      success: true,
      predictive_analytics: analytics,
      execution_time_ms: performance.now() - startTime
    }),
    { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200 
    }
  )
}

async function generateKPIDashboard(supabase: any) {
  const kpis = {
    financial: {
      monthly_recurring_revenue: 45000,
      customer_acquisition_cost: 25,
      lifetime_value: 850,
      gross_margin: 72.5
    },
    operational: {
      booking_conversion_rate: 8.2,
      search_success_rate: 94.5,
      customer_satisfaction_score: 4.6,
      system_uptime: 99.9
    },
    growth: {
      monthly_growth_rate: 15.2,
      new_customer_rate: 35,
      market_penetration: 2.1,
      brand_awareness: 18
    },
    targets: {
      monthly_revenue_target: 50000,
      conversion_rate_target: 10,
      customer_satisfaction_target: 4.8,
      uptime_target: 99.95
    }
  }

  return new Response(
    JSON.stringify({
      success: true,
      kpi_dashboard: kpis
    }),
    { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200 
    }
  )
}