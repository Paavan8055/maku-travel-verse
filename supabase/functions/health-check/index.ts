import { corsHeaders } from '../_shared/cors.ts';
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.53.0";

const RATE_LIMIT_WINDOW = 60_000; // 1 minute
const RATE_LIMIT_MAX = 60; // max requests per window
const requests = new Map<string, { count: number; start: number }>();

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = requests.get(ip);
  if (!entry || now - entry.start > RATE_LIMIT_WINDOW) {
    requests.set(ip, { count: 1, start: now });
    return false;
  }
  if (entry.count >= RATE_LIMIT_MAX) return true;
  entry.count++;
  return false;
}


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

  if (req.method !== 'GET') {
    return new Response(
      JSON.stringify({ error: 'method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  const url = new URL(req.url);
  if ([...url.searchParams.keys()].length > 0) {
    return new Response(
      JSON.stringify({ error: 'query parameters are not allowed' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  const ip = req.headers.get('x-forwarded-for') ?? 'unknown';
  if (isRateLimited(ip)) {
    return new Response(
      JSON.stringify({ error: 'rate limit exceeded' }),
      { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  const startTime = performance.now();
  
  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    );

    // Run all health checks concurrently but handle individual failures
    const [databaseResult, amadeusResult, stripeResult, supabaseResult] = await Promise.allSettled([
      checkDatabase(supabase),
      checkAmadeus(),
      checkStripe(),
      checkSupabase()
    ]);

    const healthStatus: HealthStatus = {
      status: 'healthy',
      timestamp: Date.now(),
      services: {
        database: databaseResult.status === 'fulfilled' ? databaseResult.value : {
          status: 'down',
          lastChecked: Date.now(),
          error: databaseResult.reason?.message || 'Service check failed'
        },
        amadeus: amadeusResult.status === 'fulfilled' ? amadeusResult.value : {
          status: 'down',
          lastChecked: Date.now(),
          error: amadeusResult.reason?.message || 'Service check failed'
        },
        stripe: stripeResult.status === 'fulfilled' ? stripeResult.value : {
          status: 'down',
          lastChecked: Date.now(),
          error: stripeResult.reason?.message || 'Service check failed'
        },
        supabase: supabaseResult.status === 'fulfilled' ? supabaseResult.value : {
          status: 'down',
          lastChecked: Date.now(),
          error: supabaseResult.reason?.message || 'Service check failed'
        }
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

    // Store health check results (non-blocking)
    supabase
      .from('health_checks')
      .insert({
        status: healthStatus.status,
        services: healthStatus.services,
        performance: healthStatus.performance,
        checked_at: new Date().toISOString()
      })
      .then(() => {
        console.log('Health check stored successfully');
      })
      .catch((error) => {
        console.warn('Failed to store health check:', error);
      });

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
        database: { status: 'down', lastChecked: Date.now(), error: 'Health check system failure' },
        amadeus: { status: 'down', lastChecked: Date.now(), error: 'Health check system failure' },
        stripe: { status: 'down', lastChecked: Date.now(), error: 'Health check system failure' },
        supabase: { status: 'down', lastChecked: Date.now(), error: 'Health check system failure' }
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
    const { data, error } = await supabase
      .from('airports')
      .select('iata_code')
      .limit(1);
    
    const responseTime = performance.now() - start;
    
    if (error) {
      return {
        status: 'down',
        responseTime,
        lastChecked: Date.now(),
        error: `Database error: ${error.message}`
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
      error: `Database connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}

async function checkAmadeus(): Promise<ServiceHealth> {
  const start = performance.now();
  try {
    // Simple connectivity check - just verify credentials exist
    const clientId = Deno.env.get('AMADEUS_CLIENT_ID');
    const clientSecret = Deno.env.get('AMADEUS_CLIENT_SECRET');
    
    const responseTime = performance.now() - start;
    
    if (!clientId || !clientSecret) {
      return {
        status: 'down',
        responseTime,
        lastChecked: Date.now(),
        error: 'Missing Amadeus credentials'
      };
    }

    // For a real health check, we could make a lightweight API call
    // For now, just check credentials exist
    return {
      status: 'up',
      responseTime,
      lastChecked: Date.now()
    };
  } catch (error) {
    return {
      status: 'down',
      responseTime: performance.now() - start,
      lastChecked: Date.now(),
      error: `Amadeus check failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}

async function checkStripe(): Promise<ServiceHealth> {
  const start = performance.now();
  try {
    const stripeKey = Deno.env.get('STRIPE_SECRET_KEY');
    
    const responseTime = performance.now() - start;
    
    if (!stripeKey) {
      return {
        status: 'down',
        responseTime,
        lastChecked: Date.now(),
        error: 'Missing Stripe key'
      };
    }

    return {
      status: 'up',
      responseTime,
      lastChecked: Date.now()
    };
  } catch (error) {
    return {
      status: 'down',
      responseTime: performance.now() - start,
      lastChecked: Date.now(),
      error: `Stripe check failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}

async function checkSupabase(): Promise<ServiceHealth> {
  const start = performance.now();
  try {
    const url = Deno.env.get('SUPABASE_URL');
    const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    const responseTime = performance.now() - start;
    
    if (!url || !key) {
      return {
        status: 'down',
        responseTime,
        lastChecked: Date.now(),
        error: 'Missing Supabase configuration'
      };
    }

    return {
      status: 'up',
      responseTime,
      lastChecked: Date.now()
    };
  } catch (error) {
    return {
      status: 'down',
      responseTime: performance.now() - start,
      lastChecked: Date.now(),
      error: `Supabase check failed: ${error instanceof Error ? error.message : 'Unknown error'}`
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