import { corsHeaders } from '../_shared/cors.ts';
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.53.0";

/**
 * Get Secrets Edge Function
 * 
 * Securely retrieves API keys and configuration secrets from the environment table.
 * This function is designed to be called by backend services with service-role authentication.
 * 
 * Usage:
 * POST https://<project>.functions.supabase.co/get-secrets
 * 
 * Authentication: Requires service-role token
 * 
 * Request Body:
 * {
 *   "keys": ["STRIPE_SECRET_KEY", "AMADEUS_CLIENT_ID"] // Optional: specific keys to retrieve
 * }
 * 
 * Response:
 * {
 *   "success": true,
 *   "secrets": {
 *     "STRIPE_SECRET_KEY": "sk_test_...",
 *     "AMADEUS_CLIENT_ID": "..."
 *   },
 *   "environment": "development"
 * }
 */

interface SecretRequest {
  keys?: string[];
  environment?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Only allow POST requests
    if (req.method !== 'POST') {
      return new Response(JSON.stringify({
        success: false,
        error: 'Method not allowed'
      }), {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Verify authentication - must use service role key
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Authorization required'
      }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const token = authHeader.replace('Bearer ', '');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!serviceRoleKey || token !== serviceRoleKey) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Invalid service role token'
      }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Parse request body
    const requestData: SecretRequest = await req.json().catch(() => ({}));
    const { keys, environment = 'development' } = requestData;

    // Initialize Supabase client with service role
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log(`[GET-SECRETS] Retrieving secrets for environment: ${environment}`);

    // Query the environment table for secrets
    let query = supabase
      .from('environment')
      .select('key, value, is_secret')
      .eq('environment', environment)
      .eq('is_active', true);

    // If specific keys are requested, filter for those
    if (keys && keys.length > 0) {
      query = query.in('key', keys);
      console.log(`[GET-SECRETS] Filtering for specific keys:`, keys);
    }

    const { data: secrets, error } = await query;

    if (error) {
      console.error('[GET-SECRETS] Database error:', error);
      return new Response(JSON.stringify({
        success: false,
        error: 'Failed to retrieve secrets from database',
        details: error.message
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (!secrets || secrets.length === 0) {
      console.warn(`[GET-SECRETS] No secrets found for environment: ${environment}`);
      return new Response(JSON.stringify({
        success: true,
        secrets: {},
        environment,
        message: `No secrets configured for environment: ${environment}`
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Transform the secrets into a key-value object
    const secretsObject: Record<string, string> = {};
    let secretCount = 0;
    let publicCount = 0;

    secrets.forEach((secret: any) => {
      secretsObject[secret.key] = secret.value;
      if (secret.is_secret) {
        secretCount++;
      } else {
        publicCount++;
      }
    });

    console.log(`[GET-SECRETS] Retrieved ${secrets.length} items (${secretCount} secrets, ${publicCount} public)`);

    // Return the secrets
    return new Response(JSON.stringify({
      success: true,
      secrets: secretsObject,
      environment,
      metadata: {
        total_items: secrets.length,
        secret_items: secretCount,
        public_items: publicCount,
        timestamp: new Date().toISOString()
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('[GET-SECRETS] Unexpected error:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: 'Internal server error',
      message: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});