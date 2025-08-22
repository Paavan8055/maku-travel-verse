import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: number;
  services: {
    database: ServiceHealth;
    amadeus: ServiceHealth;
    stripe: ServiceHealth;
    supabase: ServiceHealth;
  };
  performance: {
    responseTime: number;
    memoryUsage?: number;
    cpuUsage?: number;
  };
}

interface ServiceHealth {
  status: 'up' | 'down' | 'slow';
  responseTime?: number;
  lastChecked: number;
  error?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = performance.now();
  
  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    );

    const healthStatus: HealthStatus = {
      status: 'healthy',
      timestamp: Date.now(),
      services: {
        database: await checkDatabase(supabase),
        amadeus: await checkAmadeus(),
        stripe: await checkStripe(),
        supabase: await checkSupabase()
      },
      performance: {
        responseTime: 0, // Will be set below
        memoryUsage: getMemoryUsage()
      }
    };

    // Calculate overall status
    const serviceStatuses = Object.values(healthStatus.services);
    const downServices = serviceStatuses.filter(s => s.status === 'down').length;
    const slowServices = serviceStatuses.filter(s => s.status === 'slow').length;

    if (downServices > 0) {
      healthStatus.status = downServices > 1 ? 'unhealthy' : 'degraded';
    } else if (slowServices > 1) {
      healthStatus.status = 'degraded';
    }

    healthStatus.performance.responseTime = performance.now() - startTime;

    // Store health check results
    await supabase
      .from('health_checks')
      .insert({
        status: healthStatus.status,
        services: healthStatus.services,
        performance: healthStatus.performance,
        checked_at: new Date().toISOString()
      })
      .catch(() => {}); // Don't fail health check if we can't store results

    const httpStatus = healthStatus.status === 'healthy' ? 200 : 
                      healthStatus.status === 'degraded' ? 200 : 503;

    return new Response(JSON.stringify(healthStatus), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: httpStatus,
    });

  } catch (error) {
    console.error('Health check failed:', error);
    
    const failureResponse: HealthStatus = {
      status: 'unhealthy',
      timestamp: Date.now(),
      services: {
        database: { status: 'down', lastChecked: Date.now(), error: 'Health check failed' },
        amadeus: { status: 'down', lastChecked: Date.now(), error: 'Health check failed' },
        stripe: { status: 'down', lastChecked: Date.now(), error: 'Health check failed' },
        supabase: { status: 'down', lastChecked: Date.now(), error: 'Health check failed' }
      },
      performance: {
        responseTime: performance.now() - startTime
      }
    };

    return new Response(JSON.stringify(failureResponse), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 503,
    });
  }
});

async function checkDatabase(supabase: any): Promise<ServiceHealth> {
  const start = performance.now();
  try {
    const { error } = await supabase
      .from('airports')
      .select('iata_code')
      .limit(1);
    
    const responseTime = performance.now() - start;
    
    if (error) {
      return {
        status: 'down',
        responseTime,
        lastChecked: Date.now(),
        error: error.message
      };
    }
    
    return {
      status: responseTime > 1000 ? 'slow' : 'up',
      responseTime,
      lastChecked: Date.now()
    };
  } catch (error) {
    return {
      status: 'down',
      responseTime: performance.now() - start,
      lastChecked: Date.now(),
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

async function checkAmadeus(): Promise<ServiceHealth> {
  const start = performance.now();
  try {
    // Simple connectivity check - just verify credentials exist
    const clientId = Deno.env.get('AMADEUS_CLIENT_ID');
    const clientSecret = Deno.env.get('AMADEUS_CLIENT_SECRET');
    
    if (!clientId || !clientSecret) {
      return {
        status: 'down',
        responseTime: performance.now() - start,
        lastChecked: Date.now(),
        error: 'Missing Amadeus credentials'
      };
    }

    // For a real health check, we could make a lightweight API call
    // For now, just check credentials exist
    return {
      status: 'up',
      responseTime: performance.now() - start,
      lastChecked: Date.now()
    };
  } catch (error) {
    return {
      status: 'down',
      responseTime: performance.now() - start,
      lastChecked: Date.now(),
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

async function checkStripe(): Promise<ServiceHealth> {
  const start = performance.now();
  try {
    const stripeKey = Deno.env.get('STRIPE_SECRET_KEY');
    
    if (!stripeKey) {
      return {
        status: 'down',
        responseTime: performance.now() - start,
        lastChecked: Date.now(),
        error: 'Missing Stripe key'
      };
    }

    return {
      status: 'up',
      responseTime: performance.now() - start,
      lastChecked: Date.now()
    };
  } catch (error) {
    return {
      status: 'down',
      responseTime: performance.now() - start,
      lastChecked: Date.now(),
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

async function checkSupabase(): Promise<ServiceHealth> {
  const start = performance.now();
  try {
    const url = Deno.env.get('SUPABASE_URL');
    const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!url || !key) {
      return {
        status: 'down',
        responseTime: performance.now() - start,
        lastChecked: Date.now(),
        error: 'Missing Supabase configuration'
      };
    }

    return {
      status: 'up',
      responseTime: performance.now() - start,
      lastChecked: Date.now()
    };
  } catch (error) {
    return {
      status: 'down',
      responseTime: performance.now() - start,
      lastChecked: Date.now(),
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

function getMemoryUsage(): number | undefined {
  try {
    // Deno memory usage
    const memInfo = Deno.memoryUsage();
    return Math.round(memInfo.heapUsed / 1024 / 1024); // MB
  } catch {
    return undefined;
  }
}