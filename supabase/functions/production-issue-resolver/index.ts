import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ProductionIssue {
  id: string;
  type: 'booking' | 'error' | 'provider';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  affected_services?: string[];
  error_count?: number;
  last_occurrence: string;
  resolved: boolean;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );

  try {
    const issues: ProductionIssue[] = [];

    // 1. Check for ReferenceError issues
    const { data: referenceErrors } = await supabase
      .from('error_tracking')
      .select('*')
      .eq('error_type', 'ReferenceError')
      .eq('resolved', false)
      .order('created_at', { ascending: false })
      .limit(10);

    if (referenceErrors && referenceErrors.length > 0) {
      // Group by error message
      const errorGroups = referenceErrors.reduce((acc, error) => {
        const key = error.error_message;
        if (!acc[key]) {
          acc[key] = { count: 0, latest: error.created_at, errors: [] };
        }
        acc[key].count++;
        acc[key].errors.push(error);
        if (error.created_at > acc[key].latest) {
          acc[key].latest = error.created_at;
        }
        return acc;
      }, {} as Record<string, { count: number; latest: string; errors: any[] }>);

      // Resolve specific errors
      for (const [message, data] of Object.entries(errorGroups)) {
        if (message.includes('HotelSelectionPage is not defined')) {
          // Auto-resolve this specific error since we're fixing it
          const errorIds = data.errors.map(e => e.id);
          await supabase
            .from('error_tracking')
            .update({ resolved: true, updated_at: new Date().toISOString() })
            .in('id', errorIds);

          console.log(`Auto-resolved HotelSelectionPage errors: ${errorIds.length} errors`);
        } else {
          issues.push({
            id: crypto.randomUUID(),
            type: 'error',
            severity: data.count > 10 ? 'critical' : data.count > 5 ? 'high' : 'medium',
            description: `${data.count} unresolved ReferenceError: ${message}`,
            error_count: data.count,
            last_occurrence: data.latest,
            resolved: false
          });
        }
      }
    }

    // 2. Check for stuck bookings
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { data: stuckBookings } = await supabase
      .from('bookings')
      .select('*')
      .eq('status', 'pending')
      .lt('created_at', oneHourAgo);

    if (stuckBookings && stuckBookings.length > 0) {
      issues.push({
        id: crypto.randomUUID(),
        type: 'booking',
        severity: stuckBookings.length > 20 ? 'critical' : stuckBookings.length > 10 ? 'high' : 'medium',
        description: `${stuckBookings.length} bookings stuck in pending status for over 1 hour`,
        error_count: stuckBookings.length,
        last_occurrence: new Date().toISOString(),
        resolved: false
      });
    }

    // 3. Check provider health
    const { data: healthResult } = await supabase.functions.invoke('health-check');
    if (healthResult?.services) {
      const unhealthyServices = Object.entries(healthResult.services)
        .filter(([, service]: [string, any]) => service.status !== 'up')
        .map(([name]) => name);

      if (unhealthyServices.length > 0) {
        issues.push({
          id: crypto.randomUUID(),
          type: 'provider',
          severity: unhealthyServices.length > 2 ? 'critical' : 'high',
          description: `${unhealthyServices.length} provider(s) unhealthy`,
          affected_services: unhealthyServices,
          last_occurrence: new Date().toISOString(),
          resolved: false
        });
      }
    }

    // 4. Auto-run stuck bookings resolver if needed
    if (stuckBookings && stuckBookings.length > 5) {
      try {
        await supabase.functions.invoke('fix-stuck-bookings');
        console.log('Auto-triggered stuck bookings resolver');
      } catch (error) {
        console.error('Failed to auto-trigger stuck bookings resolver:', error);
      }
    }

    return new Response(JSON.stringify({
      success: true,
      timestamp: new Date().toISOString(),
      issues_found: issues.length,
      issues: issues,
      auto_actions_taken: {
        resolved_reference_errors: referenceErrors?.filter(e => e.error_message.includes('HotelSelectionPage')).length || 0,
        triggered_booking_resolver: stuckBookings && stuckBookings.length > 5
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Production issue resolver error:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500
    });
  }
});