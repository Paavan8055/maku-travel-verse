import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.54.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface MonitoringEvent {
  type: 'booking_success' | 'booking_failure' | 'search_success' | 'search_failure' | 'rate_limit_hit' | 'api_error';
  hotelbedsFunction: string;
  correlationId: string;
  duration?: number;
  statusCode?: number;
  errorMessage?: string;
  bookingReference?: string;
  hotelCode?: string;
  rateKey?: string;
  metadata?: any;
}

async function logMonitoringEvent(event: MonitoringEvent, supabase: any): Promise<void> {
  try {
    const { error } = await supabase
      .from('hotelbeds_monitoring')
      .insert({
        event_type: event.type,
        function_name: event.hotelbedsFunction,
        correlation_id: event.correlationId,
        duration_ms: event.duration,
        status_code: event.statusCode,
        error_message: event.errorMessage,
        booking_reference: event.bookingReference,
        hotel_code: event.hotelCode,
        rate_key: event.rateKey,
        metadata: event.metadata || {},
        created_at: new Date().toISOString()
      });

    if (error) {
      console.error('Failed to log monitoring event:', error);
    }
  } catch (error) {
    console.error('Error logging monitoring event:', error);
  }
}

async function checkSystemHealth(supabase: any): Promise<any> {
  try {
    // Check recent error rates
    const { data: recentEvents, error } = await supabase
      .from('hotelbeds_monitoring')
      .select('event_type, created_at')
      .gte('created_at', new Date(Date.now() - 5 * 60 * 1000).toISOString()) // Last 5 minutes
      .order('created_at', { ascending: false });

    if (error) throw error;

    const totalEvents = recentEvents?.length || 0;
    const errorEvents = recentEvents?.filter(e => e.event_type.includes('failure') || e.event_type.includes('error')).length || 0;
    const errorRate = totalEvents > 0 ? (errorEvents / totalEvents) * 100 : 0;

    // Check average response times
    const { data: performanceData, error: perfError } = await supabase
      .from('hotelbeds_monitoring')
      .select('duration_ms')
      .not('duration_ms', 'is', null)
      .gte('created_at', new Date(Date.now() - 15 * 60 * 1000).toISOString()) // Last 15 minutes
      .order('created_at', { ascending: false })
      .limit(100);

    if (perfError) throw perfError;

    const avgResponseTime = performanceData?.length > 0 
      ? performanceData.reduce((sum, item) => sum + (item.duration_ms || 0), 0) / performanceData.length 
      : 0;

    return {
      status: errorRate > 50 ? 'critical' : errorRate > 20 ? 'warning' : 'healthy',
      errorRate: Math.round(errorRate * 100) / 100,
      avgResponseTime: Math.round(avgResponseTime),
      totalEvents,
      errorEvents,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('Health check failed:', error);
    return {
      status: 'unknown',
      error: error.message,
      timestamp: new Date().toISOString()
    };
  }
}

async function getBookingAnalytics(supabase: any, timeframe: string = '24h'): Promise<any> {
  try {
    let hoursBack = 24;
    switch (timeframe) {
      case '1h': hoursBack = 1; break;
      case '6h': hoursBack = 6; break;
      case '24h': hoursBack = 24; break;
      case '7d': hoursBack = 168; break;
      default: hoursBack = 24;
    }

    const { data: bookingEvents, error } = await supabase
      .from('hotelbeds_monitoring')
      .select('event_type, booking_reference, metadata, created_at')
      .in('event_type', ['booking_success', 'booking_failure'])
      .gte('created_at', new Date(Date.now() - hoursBack * 60 * 60 * 1000).toISOString())
      .order('created_at', { ascending: false });

    if (error) throw error;

    const successfulBookings = bookingEvents?.filter(e => e.event_type === 'booking_success') || [];
    const failedBookings = bookingEvents?.filter(e => e.event_type === 'booking_failure') || [];
    
    const totalValue = successfulBookings.reduce((sum, booking) => {
      const amount = booking.metadata?.totalAmount || 0;
      return sum + amount;
    }, 0);

    return {
      timeframe,
      totalBookings: bookingEvents?.length || 0,
      successfulBookings: successfulBookings.length,
      failedBookings: failedBookings.length,
      successRate: bookingEvents?.length > 0 ? (successfulBookings.length / bookingEvents.length) * 100 : 0,
      totalValue,
      currency: 'EUR', // Default currency
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('Analytics query failed:', error);
    return {
      error: error.message,
      timestamp: new Date().toISOString()
    };
  }
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const url = new URL(req.url);
    const action = url.searchParams.get('action') || 'health';

    switch (action) {
      case 'log': {
        if (req.method !== 'POST') {
          return new Response(JSON.stringify({ error: 'Method not allowed' }), {
            status: 405,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        const event: MonitoringEvent = await req.json();
        await logMonitoringEvent(event, supabase);

        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      case 'health': {
        const healthData = await checkSystemHealth(supabase);
        return new Response(JSON.stringify(healthData), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      case 'analytics': {
        const timeframe = url.searchParams.get('timeframe') || '24h';
        const analyticsData = await getBookingAnalytics(supabase, timeframe);
        return new Response(JSON.stringify(analyticsData), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      default: {
        return new Response(JSON.stringify({ error: 'Invalid action' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    }
  } catch (error) {
    console.error('Monitoring function error:', error);
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      message: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});