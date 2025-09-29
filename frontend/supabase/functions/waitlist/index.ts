import { corsHeaders } from '../_shared/cors.ts';
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.53.0";

/**
 * Waitlist Endpoint
 * 
 * Handles waitlist sign-ups for Maku.Travel platform
 * 
 * POST /waitlist - Add user to waitlist
 * GET /waitlist/stats - Get waitlist statistics (admin only)
 */

interface WaitlistSignup {
  email: string;
  full_name?: string;
  referral_code?: string;
  source?: string;
  marketing_consent?: boolean;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    if (req.method === 'POST') {
      // Handle waitlist signup
      const requestData: WaitlistSignup = await req.json();
      
      // Validate required fields
      if (!requestData.email) {
        return new Response(JSON.stringify({
          success: false,
          error: 'Email is required'
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(requestData.email)) {
        return new Response(JSON.stringify({
          success: false,
          error: 'Invalid email format'
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // Insert into waitlist
      const { data, error } = await supabase
        .from('waitlist')
        .insert({
          email: requestData.email.toLowerCase(),
          full_name: requestData.full_name,
          referral_code: requestData.referral_code,
          source: requestData.source || 'website',
          marketing_consent: requestData.marketing_consent || false
        })
        .select()
        .single();

      if (error) {
        // Check if it's a duplicate email error
        if (error.code === '23505') { // PostgreSQL unique violation
          return new Response(JSON.stringify({
            success: false,
            error: 'Email already registered in waitlist',
            code: 'DUPLICATE_EMAIL'
          }), {
            status: 409,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        console.error('Waitlist signup error:', error);
        return new Response(JSON.stringify({
          success: false,
          error: 'Failed to join waitlist'
        }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      console.log('New waitlist signup:', { email: requestData.email, id: data.id });

      return new Response(JSON.stringify({
        success: true,
        message: 'Successfully joined waitlist!',
        waitlist_id: data.id,
        position: 'You will be notified when access is available'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });

    } else if (req.method === 'GET') {
      // Handle waitlist stats (requires admin or service role)
      const authHeader = req.headers.get('Authorization');
      if (!authHeader) {
        return new Response(JSON.stringify({
          success: false,
          error: 'Authorization required'
        }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // Get waitlist statistics
      const { data: totalCount, error: countError } = await supabase
        .from('waitlist')
        .select('*', { count: 'exact', head: true });

      const { data: todayCount, error: todayError } = await supabase
        .from('waitlist')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', new Date().toISOString().split('T')[0]);

      const { data: referralStats, error: referralError } = await supabase
        .from('waitlist')
        .select('referral_code')
        .not('referral_code', 'is', null);

      if (countError || todayError) {
        return new Response(JSON.stringify({
          success: false,
          error: 'Failed to fetch waitlist statistics'
        }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      const referralCounts = referralStats?.reduce((acc: any, item: any) => {
        acc[item.referral_code] = (acc[item.referral_code] || 0) + 1;
        return acc;
      }, {}) || {};

      return new Response(JSON.stringify({
        success: true,
        stats: {
          total_signups: totalCount?.length || 0,
          signups_today: todayCount?.length || 0,
          referral_signups: referralStats?.length || 0,
          top_referrals: Object.entries(referralCounts)
            .sort(([,a], [,b]) => (b as number) - (a as number))
            .slice(0, 5)
            .map(([code, count]) => ({ code, count }))
        }
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });

    } else {
      return new Response(JSON.stringify({
        success: false,
        error: 'Method not allowed'
      }), {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

  } catch (error) {
    console.error('Waitlist endpoint error:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: 'Internal server error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});