import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'jsr:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-correlation-id',
}

interface CorrelationDataPoint {
  correlation_id: string;
  request_type: string;
  service_name: string;
  status: 'in_progress' | 'completed' | 'failed';
  duration_ms?: number;
  request_data?: any;
  response_data?: any;
  user_id?: string;
  provider_id?: string;
  booking_value?: number;
  customer_tier?: string;
  session_id?: string;
  error_message?: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { data_points }: { data_points: CorrelationDataPoint[] } = await req.json();

    if (!data_points || !Array.isArray(data_points)) {
      return new Response(
        JSON.stringify({ error: 'Invalid data_points payload' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Process correlation data collection in background
    EdgeRuntime.waitUntil((async () => {
      try {
        // Batch insert correlation data
        const correlationEntries = data_points.map(point => ({
          correlation_id: point.correlation_id,
          request_type: point.request_type,
          service_name: point.service_name,
          status: point.status,
          duration_ms: point.duration_ms,
          request_data: point.request_data,
          response_data: point.response_data,
          user_id: point.user_id,
          provider_id: point.provider_id,
          booking_value: point.booking_value || 0,
          customer_tier: point.customer_tier || 'standard',
          session_id: point.session_id,
          error_message: point.error_message,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }));

        // Upsert correlation data
        const { error: correlationError } = await supabaseClient
          .from('correlation_tracking')
          .upsert(correlationEntries, { onConflict: 'correlation_id' });

        if (correlationError) {
          console.error('Failed to insert correlation data:', correlationError);
        }

        // Update provider performance metrics
        const providerMetrics = new Map();
        
        data_points.forEach(point => {
          if (point.provider_id) {
            const key = `${point.provider_id}_${new Date().toDateString()}`;
            if (!providerMetrics.has(key)) {
              providerMetrics.set(key, {
                provider_id: point.provider_id,
                provider_name: point.service_name,
                date: new Date().toDateString(),
                total_requests: 0,
                successful_requests: 0,
                failed_requests: 0,
                total_response_time: 0,
                revenue_generated: 0
              });
            }
            
            const metrics = providerMetrics.get(key);
            metrics.total_requests += 1;
            
            if (point.status === 'completed') {
              metrics.successful_requests += 1;
              metrics.revenue_generated += point.booking_value || 0;
            } else if (point.status === 'failed') {
              metrics.failed_requests += 1;
            }
            
            if (point.duration_ms) {
              metrics.total_response_time += point.duration_ms;
            }
          }
        });

        // Batch upsert provider performance metrics
        const providerUpdates = Array.from(providerMetrics.values()).map(metrics => ({
          provider_id: metrics.provider_id,
          provider_name: metrics.provider_name,
          date: new Date().toISOString().split('T')[0],
          total_requests: metrics.total_requests,
          successful_requests: metrics.successful_requests,
          failed_requests: metrics.failed_requests,
          avg_response_time_ms: metrics.total_requests > 0 ? 
            metrics.total_response_time / metrics.total_requests : 0,
          revenue_generated: metrics.revenue_generated,
          conversion_rate: metrics.total_requests > 0 ? 
            (metrics.successful_requests / metrics.total_requests) * 100 : 0
        }));

        if (providerUpdates.length > 0) {
          const { error: providerError } = await supabaseClient
            .from('provider_performance_metrics')
            .upsert(providerUpdates, { onConflict: 'provider_id,date' });

          if (providerError) {
            console.error('Failed to update provider metrics:', providerError);
          }
        }

        // Create revenue protection alerts for high-value failures
        const highValueFailures = data_points.filter(point => 
          point.status === 'failed' && 
          point.booking_value && 
          point.booking_value > 500
        );

        const revenueAlerts = highValueFailures.map(failure => ({
          alert_type: 'revenue_risk',
          severity: failure.booking_value! > 2000 ? 'critical' : 'high',
          title: 'High-Value Booking Failure',
          message: `Failed ${failure.request_type} booking worth $${failure.booking_value}`,
          correlation_id: failure.correlation_id,
          provider_id: failure.provider_id,
          revenue_impact: failure.booking_value,
          metadata: {
            customer_tier: failure.customer_tier,
            error_message: failure.error_message,
            service_name: failure.service_name
          }
        }));

        if (revenueAlerts.length > 0) {
          const { error: alertError } = await supabaseClient
            .from('business_alerts')
            .insert(revenueAlerts);

          if (alertError) {
            console.error('Failed to create revenue alerts:', alertError);
          }
        }

        // Update customer journey analytics
        const journeyEvents = data_points
          .filter(point => point.session_id)
          .map(point => ({
            session_id: point.session_id!,
            correlation_id: point.correlation_id,
            journey_stage: mapRequestTypeToStage(point.request_type),
            funnel_step: mapRequestTypeToFunnelStep(point.request_type),
            booking_type: extractBookingType(point.request_type),
            provider_used: point.provider_id,
            duration_ms: point.duration_ms,
            abandoned: point.status === 'failed',
            abandonment_reason: point.error_message,
            booking_value: point.booking_value || 0
          }));

        if (journeyEvents.length > 0) {
          const { error: journeyError } = await supabaseClient
            .from('customer_journey_analytics')
            .insert(journeyEvents);

          if (journeyError) {
            console.error('Failed to insert journey analytics:', journeyError);
          }
        }

        console.log(`Processed ${data_points.length} correlation data points`);
      } catch (bgError) {
        console.error('Background correlation processing failed:', bgError);
      }
    })());

    // Return immediate success response
    return new Response(
      JSON.stringify({
        success: true,
        processed_points: data_points.length,
        timestamp: new Date().toISOString()
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Correlation data collector error:', error);
    
    return new Response(
      JSON.stringify({
        error: 'Failed to process correlation data',
        message: error instanceof Error ? error.message : 'Unknown error'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});

// Helper functions for mapping request types to journey stages
function mapRequestTypeToStage(requestType: string): string {
  if (requestType.includes('search')) return 'search';
  if (requestType.includes('select')) return 'select';
  if (requestType.includes('review')) return 'review';
  if (requestType.includes('payment')) return 'payment';
  if (requestType.includes('booking')) return 'confirmation';
  return 'unknown';
}

function mapRequestTypeToFunnelStep(requestType: string): number {
  if (requestType.includes('search')) return 1;
  if (requestType.includes('select')) return 2;
  if (requestType.includes('review')) return 3;
  if (requestType.includes('payment')) return 4;
  if (requestType.includes('booking')) return 5;
  return 0;
}

function extractBookingType(requestType: string): string {
  if (requestType.includes('flight')) return 'flight';
  if (requestType.includes('hotel')) return 'hotel';
  if (requestType.includes('activity')) return 'activity';
  if (requestType.includes('transfer')) return 'transfer';
  return 'unknown';
}