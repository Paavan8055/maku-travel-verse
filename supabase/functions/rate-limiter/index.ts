import { corsHeaders } from '../_shared/cors.ts';
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.53.0";
import logger from "../_shared/logger.ts";


interface RateLimitRequest {
  identifier: string; // IP or user ID
  action: string; // login, signup, booking, etc.
  window?: number; // time window in seconds (default: 300 = 5 minutes)
  maxAttempts?: number; // max attempts per window (default: 5)
}

const DEFAULT_LIMITS = {
  login: { window: 300, maxAttempts: 5 }, // 5 attempts per 5 minutes
  signup: { window: 300, maxAttempts: 3 }, // 3 signups per 5 minutes
  booking: { window: 60, maxAttempts: 10 }, // 10 bookings per minute
  search: { window: 60, maxAttempts: 100 }, // 100 searches per minute
  default: { window: 300, maxAttempts: 10 }
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const params: RateLimitRequest = await req.json();
    const { identifier, action } = params;

    if (!identifier || !action) {
      throw new Error("Missing required parameters: identifier and action");
    }

    // Get rate limit configuration for the action
    const limits = DEFAULT_LIMITS[action] || DEFAULT_LIMITS.default;
    const window = params.window || limits.window;
    const maxAttempts = params.maxAttempts || limits.maxAttempts;

    // Create key for rate limiting
    const key = `rate_limit:${action}:${identifier}`;
    const now = Math.floor(Date.now() / 1000);
    const windowStart = now - window;

    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Check existing attempts in the time window
    const { data: attempts, error } = await supabaseClient
      .from('user_activity_logs')
      .select('id')
      .eq('session_id', key)
      .eq('activity_type', 'rate_limit_check')
      .gte('created_at', new Date(windowStart * 1000).toISOString());

    if (error) {
      logger.error("Error checking rate limits:", error);
      // In case of database error, allow the request to proceed
      return new Response(JSON.stringify({
        allowed: true,
        reason: "Rate limit check failed, allowing request"
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const currentAttempts = attempts?.length || 0;

    if (currentAttempts >= maxAttempts) {
      // Rate limit exceeded
      const resetTime = windowStart + window;
      const retryAfter = resetTime - now;

      return new Response(JSON.stringify({
        allowed: false,
        reason: "Rate limit exceeded",
        currentAttempts,
        maxAttempts,
        windowSeconds: window,
        retryAfter: Math.max(0, retryAfter)
      }), {
        headers: { 
          ...corsHeaders, 
          "Content-Type": "application/json",
          "Retry-After": retryAfter.toString()
        },
        status: 429,
      });
    }

    // Log this attempt
    await supabaseClient
      .from('user_activity_logs')
      .insert({
        session_id: key,
        activity_type: 'rate_limit_check',
        item_type: action,
        item_id: identifier,
        item_data: {
          window,
          maxAttempts,
          currentAttempts: currentAttempts + 1
        }
      });

    // Rate limit check passed
    return new Response(JSON.stringify({
      allowed: true,
      currentAttempts: currentAttempts + 1,
      maxAttempts,
      windowSeconds: window,
      remainingAttempts: maxAttempts - currentAttempts - 1
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    logger.error("Rate limiter error:", error);
    return new Response(JSON.stringify({
      allowed: true, // Default to allow in case of errors
      error: error.message
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});