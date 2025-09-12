import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { corsHeaders } from '../_shared/cors.ts';


import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'jsr:@supabase/supabase-js@2.53.0'

serve(async (req) => {
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

    // Get user from auth header
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

    // Verify admin status using the same method as the frontend
    const { data: isAdmin, error: adminError } = await anonClient.rpc('is_admin', {
      user_id_param: user.id
    });

    if (adminError || !isAdmin) {
      console.log('Admin check failed:', { adminError, isAdmin, userId: user.id });
      return new Response(
        JSON.stringify({ error: 'Admin access required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('✅ Admin access verified for user:', user.id);

    // Check cache first
    const { data: cachedMetrics } = await supabaseClient
      .from('admin_metrics_cache')
      .select('*')
      .eq('metric_type', 'dashboard_summary')
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (cachedMetrics) {
      console.log('✅ Returning cached admin metrics');
      // Ensure cached data has proper types
      const cachedData = cachedMetrics.metric_value;
      const processedData = {
        ...cachedData,
        recentBookings: Array.isArray(cachedData.recentBookings) 
          ? cachedData.recentBookings 
          : (typeof cachedData.recentBookings === 'string' ? JSON.parse(cachedData.recentBookings) : []),
        totalBookings: Number(cachedData.totalBookings) || 0,
        totalRevenue: Number(cachedData.totalRevenue) || 0,
        totalUsers: Number(cachedData.totalUsers) || 0,
        activeProperties: Number(cachedData.activeProperties) || 0
      };
      
      return new Response(
        JSON.stringify({
          success: true,
          data: processedData
        }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Aggregate fresh metrics from database
    const [
      { data: totalBookings, count: bookingsCount },
      { data: confirmedBookings },
      { data: totalUsers },
      { data: activeProperties, count: propertiesCount },
      { data: recentBookings }
    ] = await Promise.all([
      // Total bookings count
      supabaseClient
        .from('bookings')
        .select('id', { count: 'exact' }),
      
      // Confirmed bookings for revenue calculation
      supabaseClient
        .from('bookings')
        .select('total_amount')
        .in('status', ['confirmed', 'completed']),
      
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

    // Calculate total revenue from confirmed bookings
    const revenue = confirmedBookings?.reduce((sum: number, booking: any) => 
      sum + (parseFloat(booking.total_amount) || 0), 0) || 0;

    // Get notification stats
    const { data: notificationStats } = await supabaseClient
      .from('notifications')
      .select('type', { count: 'exact' });

    // Get document stats
    const { data: documentStats } = await supabaseClient
      .from('user_documents')
      .select('document_type', { count: 'exact' });

    // Ensure all data types are consistent
    const metrics = {
      totalBookings: Number(bookingsCount) || 0,
      totalRevenue: Number(revenue) || 0,
      totalUsers: Number(totalUsers?.users?.length) || 0,
      activeProperties: Number(propertiesCount) || 0,
      recentBookings: Array.isArray(recentBookings) ? recentBookings : [],
      notificationCount: Number(notificationStats?.length) || 0,
      documentCount: Number(documentStats?.length) || 0,
      lastUpdated: new Date().toISOString()
    };

    console.log('✅ Metrics prepared:', {
      totalBookings: metrics.totalBookings,
      recentBookingsType: typeof metrics.recentBookings,
      recentBookingsLength: metrics.recentBookings.length
    });

    // Cache the metrics
    await supabaseClient
      .from('admin_metrics_cache')
      .insert({
        metric_type: 'dashboard_summary',
        metric_value: metrics,
        expires_at: new Date(Date.now() + 60 * 60 * 1000).toISOString() // 1 hour cache
      });

    console.log('✅ Admin metrics fetched successfully');

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
    console.error('Admin metrics error:', error);
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

