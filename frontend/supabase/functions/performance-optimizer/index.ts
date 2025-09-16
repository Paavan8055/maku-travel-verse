import { corsHeaders } from '../_shared/cors.ts';
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.53.0";
import logger from "../_shared/logger.ts";

interface OptimizationResult {
  optimization: string;
  status: 'applied' | 'failed' | 'skipped';
  impact: 'high' | 'medium' | 'low';
  details: string;
  performanceGain?: string;
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
    logger.info('[PERFORMANCE-OPTIMIZER] Starting system optimization');
    
    const optimizations: OptimizationResult[] = [];
    
    // 1. Cache Optimization - Clear expired cache entries
    try {
      const startTime = Date.now();
      
      // Clean expired flight offers
      const { count: flightCount } = await supabase
        .from('flight_offers_cache')
        .delete()
        .lt('ttl_expires_at', new Date().toISOString());

      // Clean expired hotel offers  
      const { count: hotelCount } = await supabase
        .from('hotel_offers_cache') 
        .delete()
        .lt('ttl_expires_at', new Date().toISOString());

      // Clean expired activity offers
      const { count: activityCount } = await supabase
        .from('activities_offers_cache')
        .delete() 
        .lt('ttl_expires_at', new Date().toISOString());

      const totalCleaned = (flightCount || 0) + (hotelCount || 0) + (activityCount || 0);
      const duration = Date.now() - startTime;

      optimizations.push({
        optimization: 'cache_cleanup',
        status: 'applied',
        impact: 'high',
        details: `Cleaned ${totalCleaned} expired cache entries in ${duration}ms`,
        performanceGain: `Reduced cache size by ${totalCleaned} entries`
      });
    } catch (error) {
      optimizations.push({
        optimization: 'cache_cleanup',
        status: 'failed', 
        impact: 'high',
        details: error.message
      });
    }

    // 2. Task Queue Optimization - Remove old completed tasks
    try {
      const { data: taskCount } = await supabase.rpc('cleanup_old_tasks');
      
      optimizations.push({
        optimization: 'task_cleanup',
        status: 'applied',
        impact: 'medium',
        details: `Cleaned ${taskCount || 0} old completed tasks`,
        performanceGain: 'Reduced task queue overhead'
      });
    } catch (error) {
      optimizations.push({
        optimization: 'task_cleanup',
        status: 'failed',
        impact: 'medium',
        details: error.message
      });
    }

    // 3. Provider Health Optimization - Reset stale health records
    try {
      const oldHealthThreshold = new Date(Date.now() - 10 * 60 * 1000); // 10 minutes
      
      const { count: healthUpdates } = await supabase
        .from('provider_health')
        .update({
          status: 'unknown',
          last_checked: new Date().toISOString()
        })
        .lt('last_checked', oldHealthThreshold.toISOString());

      optimizations.push({
        optimization: 'health_reset',
        status: 'applied',
        impact: 'medium',
        details: `Reset ${healthUpdates || 0} stale health records`,
        performanceGain: 'Improved provider selection accuracy'
      });
    } catch (error) {
      optimizations.push({
        optimization: 'health_reset',
        status: 'failed',
        impact: 'medium',
        details: error.message
      });
    }

    // 4. Memory Optimization - Clean expired agent memory
    try {
      const { count: memoryCount } = await supabase
        .from('agentic_memory')
        .delete()
        .lt('expires_at', new Date().toISOString());

      optimizations.push({
        optimization: 'memory_cleanup',
        status: 'applied',
        impact: 'medium',
        details: `Cleaned ${memoryCount || 0} expired memory entries`,
        performanceGain: 'Reduced memory footprint'
      });
    } catch (error) {
      optimizations.push({
        optimization: 'memory_cleanup',
        status: 'failed',
        impact: 'medium', 
        details: error.message
      });
    }

    const successCount = optimizations.filter(o => o.status === 'applied').length;

    logger.info('[PERFORMANCE-OPTIMIZER] Optimization completed', {
      totalOptimizations: optimizations.length,
      successful: successCount
    });

    return new Response(JSON.stringify({
      success: true,
      optimizations,
      summary: {
        total: optimizations.length,
        applied: successCount,
        failed: optimizations.filter(o => o.status === 'failed').length
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    logger.error('[PERFORMANCE-OPTIMIZER] Optimization failed', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      optimizations: []
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500
    });
  }
});