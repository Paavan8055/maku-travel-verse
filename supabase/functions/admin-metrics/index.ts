import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'jsr:@supabase/supabase-js@2'
import logger from "../_shared/logger.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Create Supabase client with service role for admin access
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get user from auth header and verify admin status
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authorization required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const anonClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );
    
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await anonClient.auth.getUser(token);

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid authentication' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify admin status
    const { data: isAdmin, error: adminError } = await supabaseClient.rpc('is_secure_admin', {
      user_id: user.id
    });

    if (adminError || !isAdmin) {
      return new Response(
        JSON.stringify({ error: 'Admin access required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    logger.info('Fetching admin metrics for user:', user.id);

    // Aggregate metrics from database
    const [
      { data: totalBookings },
      { data: totalRevenue },
      { data: totalUsers },
      { data: activeProperties },
      { data: recentBookings }
    ] = await Promise.all([
      // Total bookings count
      supabaseClient
        .from('bookings')
        .select('id', { count: 'exact' }),
      
      // Total revenue sum
      supabaseClient
        .from('bookings')
        .select('total_amount')
        .eq('status', 'confirmed'),
      
      // Total users count
      supabaseClient.auth.admin.listUsers(),
      
      // Active properties count
      supabaseClient
        .from('partner_properties')
        .select('id', { count: 'exact' })
        .eq('status', 'active'),
      
      // Recent bookings
      supabaseClient
        .from('bookings')
        .select(`
          id,
          booking_reference,
          booking_type,
          total_amount,
          currency,
          status,
          created_at
        `)
        .order('created_at', { ascending: false })
        .limit(10)
    ]);

    // Calculate total revenue
    const revenue = totalRevenue?.reduce((sum: number, booking: any) => 
      sum + (parseFloat(booking.total_amount) || 0), 0) || 0;

    const metrics = {
      totalBookings: totalBookings?.length || 0,
      totalRevenue: revenue,
      totalUsers: totalUsers?.users?.length || 0,
      activeProperties: activeProperties?.length || 0,
      recentBookings: recentBookings || [],
      lastUpdated: new Date().toISOString()
    };

    logger.info('✅ Admin metrics fetched successfully');

    return new Response(
      JSON.stringify({
        success: true,
        data: metrics
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    logger.error('Admin metrics error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch admin metrics'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});