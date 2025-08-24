import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ServiceEndpoint {
  name: string;
  url: string;
  method: 'GET' | 'POST';
  headers?: Record<string, string>;
  body?: any;
  timeout: number;
  expectedStatus?: number[];
}

interface HealthCheckResult {
  service: string;
  endpoint: string;
  status: 'healthy' | 'degraded' | 'unhealthy';
  responseTime: number;
  error?: string;
  timestamp: string;
}

interface SystemHealth {
  overall_status: 'healthy' | 'degraded' | 'critical';
  timestamp: string;
  services: Record<string, HealthCheckResult[]>;
  summary: {
    total_endpoints: number;
    healthy_endpoints: number;
    degraded_endpoints: number;
    unhealthy_endpoints: number;
    average_response_time: number;
  };
}

const CRITICAL_ENDPOINTS: ServiceEndpoint[] = [
  {
    name: 'amadeus-auth',
    url: 'https://test.api.amadeus.com/v1/security/oauth2/token',
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=client_credentials&client_id=${Deno.env.get('AMADEUS_CLIENT_ID')}&client_secret=${Deno.env.get('AMADEUS_CLIENT_SECRET')}`,
    timeout: 10000,
    expectedStatus: [200]
  },
  {
    name: 'amadeus-hotels',
    url: 'https://test.api.amadeus.com/v1/reference-data/locations/hotels/by-city?cityCode=NYC&radius=5&radiusUnit=KM',
    method: 'GET',
    timeout: 15000,
    expectedStatus: [200]
  },
  {
    name: 'hotelbeds-health',
    url: 'https://api.test.hotelbeds.com/activity-api/3.0/activities/search',
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Api-key': Deno.env.get('HOTELBEDS_API_KEY') || '',
      'Accept': 'application/json'
    },
    timeout: 15000,
    expectedStatus: [200, 400, 403] // 403 might be expected for test data
  },
  {
    name: 'sabre-auth',
    url: 'https://api.test.sabre.com/v2/auth/token',
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    timeout: 10000,
    expectedStatus: [200]
  },
  {
    name: 'stripe-health',
    url: 'https://api.stripe.com/v1/charges?limit=1',
    method: 'GET',
    headers: { 'Authorization': `Bearer ${Deno.env.get('STRIPE_SECRET_KEY')}` },
    timeout: 10000,
    expectedStatus: [200]
  }
];

async function checkEndpoint(endpoint: ServiceEndpoint): Promise<HealthCheckResult> {
  const startTime = performance.now();
  
  try {
    // Handle auth tokens for Amadeus and Sabre
    let headers = { ...endpoint.headers };
    
    if (endpoint.name === 'amadeus-hotels') {
      try {
        // Get Amadeus token first
        const tokenResponse = await fetch('https://test.api.amadeus.com/v1/security/oauth2/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: `grant_type=client_credentials&client_id=${Deno.env.get('AMADEUS_CLIENT_ID')}&client_secret=${Deno.env.get('AMADEUS_CLIENT_SECRET')}`,
        });
        
        if (tokenResponse.ok) {
          const tokenData = await tokenResponse.json();
          headers['Authorization'] = `Bearer ${tokenData.access_token}`;
        }
      } catch (e) {
        console.warn('Failed to get Amadeus token for health check:', e);
      }
    }
    
    if (endpoint.name === 'hotelbeds-health') {
      // Generate HotelBeds signature
      const apiKey = Deno.env.get('HOTELBEDS_API_KEY') || '';
      const secret = Deno.env.get('HOTELBEDS_SECRET') || '';
      const timestamp = Math.floor(Date.now() / 1000);
      
      const message = apiKey + secret + timestamp;
      const encoder = new TextEncoder();
      const data = encoder.encode(message);
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const signature = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
      
      headers['X-signature'] = signature;
      endpoint.body = {
        language: "en",
        from: new Date().toISOString().split('T')[0],
        to: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        destination: { code: "NYC", type: "ZONE" },
        occupancy: [{ rooms: 1, adults: 2, children: 0 }],
        pagination: { itemsPerPage: 1, page: 1 }
      };
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), endpoint.timeout);

    const response = await fetch(endpoint.url, {
      method: endpoint.method,
      headers,
      body: endpoint.body ? (typeof endpoint.body === 'string' ? endpoint.body : JSON.stringify(endpoint.body)) : undefined,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    const responseTime = performance.now() - startTime;

    const expectedStatus = endpoint.expectedStatus || [200];
    const isHealthy = expectedStatus.includes(response.status);
    
    return {
      service: endpoint.name.split('-')[0],
      endpoint: endpoint.name,
      status: isHealthy ? 'healthy' : (response.status >= 500 ? 'unhealthy' : 'degraded'),
      responseTime: Math.round(responseTime),
      error: isHealthy ? undefined : `HTTP ${response.status}: ${response.statusText}`,
      timestamp: new Date().toISOString(),
    };

  } catch (error) {
    const responseTime = performance.now() - startTime;
    
    return {
      service: endpoint.name.split('-')[0],
      endpoint: endpoint.name,
      status: 'unhealthy',
      responseTime: Math.round(responseTime),
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    };
  }
}

async function runHealthChecks(): Promise<SystemHealth> {
  console.log('Starting comprehensive health checks...');
  
  // Run all health checks in parallel for efficiency
  const healthPromises = CRITICAL_ENDPOINTS.map(endpoint => checkEndpoint(endpoint));
  const results = await Promise.all(healthPromises);

  // Group results by service
  const services: Record<string, HealthCheckResult[]> = {};
  results.forEach(result => {
    if (!services[result.service]) {
      services[result.service] = [];
    }
    services[result.service].push(result);
  });

  // Calculate summary metrics
  const totalEndpoints = results.length;
  const healthyEndpoints = results.filter(r => r.status === 'healthy').length;
  const degradedEndpoints = results.filter(r => r.status === 'degraded').length;
  const unhealthyEndpoints = results.filter(r => r.status === 'unhealthy').length;
  const averageResponseTime = Math.round(results.reduce((sum, r) => sum + r.responseTime, 0) / totalEndpoints);

  // Determine overall status
  let overallStatus: 'healthy' | 'degraded' | 'critical' = 'healthy';
  if (unhealthyEndpoints > totalEndpoints * 0.5) {
    overallStatus = 'critical';
  } else if (unhealthyEndpoints > 0 || degradedEndpoints > totalEndpoints * 0.3) {
    overallStatus = 'degraded';
  }

  const systemHealth: SystemHealth = {
    overall_status: overallStatus,
    timestamp: new Date().toISOString(),
    services,
    summary: {
      total_endpoints: totalEndpoints,
      healthy_endpoints: healthyEndpoints,
      degraded_endpoints: degradedEndpoints,
      unhealthy_endpoints: unhealthyEndpoints,
      average_response_time: averageResponseTime,
    },
  };

  console.log('Health check completed:', systemHealth.summary);
  return systemHealth;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const healthStatus = await runHealthChecks();
    
    // Store health check results in Supabase for historical tracking
    try {
      const supabase = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      );

      await supabase.functions.invoke('health-check', {
        body: { 
          status: healthStatus.overall_status,
          details: healthStatus,
          timestamp: healthStatus.timestamp 
        }
      });
    } catch (storageError) {
      console.warn('Failed to store health check results:', storageError);
    }

    return new Response(JSON.stringify(healthStatus), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('Health check system error:', error);
    
    return new Response(JSON.stringify({
      overall_status: 'critical',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Health check system failure',
      services: {},
      summary: {
        total_endpoints: 0,
        healthy_endpoints: 0,
        degraded_endpoints: 0,
        unhealthy_endpoints: 0,
        average_response_time: 0,
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});