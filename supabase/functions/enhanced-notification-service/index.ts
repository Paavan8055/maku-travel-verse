import { corsHeaders } from '../_shared/cors.ts';
import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'jsr:@supabase/supabase-js@2.53.0'

interface CreateNotificationRequest {
  user_id: string;
  type: 'flight_delay' | 'price_drop' | 'check_in' | 'weather_alert' | 'document_expiry' | 'booking_confirmed' | 'payment_success' | 'security_alert';
  title: string;
  message: string;
  priority?: 'high' | 'medium' | 'low';
  action_url?: string;
  metadata?: Record<string, any>;
}

interface CreateBookingUpdateRequest {
  user_id: string;
  booking_id: string;
  booking_reference: string;
  update_type: 'status_change' | 'schedule_change' | 'gate_change' | 'reminder' | 'cancellation';
  title: string;
  message: string;
  status: 'info' | 'warning' | 'success' | 'error';
  booking_type: 'hotel' | 'flight' | 'activity' | 'transfer';
  metadata?: Record<string, any>;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const url = new URL(req.url);
    const action = url.searchParams.get('action') || 'notifications';

    if (req.method === 'POST') {
      if (action === 'booking-update') {
        // Create a booking update
        const updateData: CreateBookingUpdateRequest = await req.json();
        
        const { data, error } = await supabase
          .from('booking_updates')
          .insert({
            user_id: updateData.user_id,
            booking_id: updateData.booking_id,
            booking_reference: updateData.booking_reference,
            update_type: updateData.update_type,
            title: updateData.title,
            message: updateData.message,
            status: updateData.status,
            booking_type: updateData.booking_type,
            metadata: updateData.metadata || {}
          })
          .select()
          .single();

        if (error) {
          console.error('Error creating booking update:', error);
          return new Response(
            JSON.stringify({ success: false, error: error.message }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        return new Response(
          JSON.stringify({ success: true, update: data }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      } else {
        // Create a regular notification
        const notificationData: CreateNotificationRequest = await req.json();
        
        const { data, error } = await supabase
          .from('notifications')
          .insert({
            user_id: notificationData.user_id,
            type: notificationData.type,
            title: notificationData.title,
            message: notificationData.message,
            priority: notificationData.priority || 'medium',
            action_url: notificationData.action_url,
            metadata: notificationData.metadata || {}
          })
          .select()
          .single();

        if (error) {
          console.error('Error creating notification:', error);
          return new Response(
            JSON.stringify({ success: false, error: error.message }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        return new Response(
          JSON.stringify({ success: true, notification: data }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    if (req.method === 'GET') {
      const authHeader = req.headers.get('Authorization');
      if (!authHeader) {
        return new Response(
          JSON.stringify({ error: 'Authorization required' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Create client with user token
      const userSupabase = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_ANON_KEY') ?? '',
        {
          global: {
            headers: {
              Authorization: authHeader,
            },
          },
        }
      );

      const { data: user, error: userError } = await userSupabase.auth.getUser();
      if (userError || !user) {
        return new Response(
          JSON.stringify({ error: 'Invalid authentication' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (action === 'booking-updates') {
        // Fetch booking updates for user
        const { data: updates, error } = await userSupabase
          .from('booking_updates')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(50);

        if (error) {
          console.error('Error fetching booking updates:', error);
          return new Response(
            JSON.stringify({ success: false, error: error.message }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        return new Response(
          JSON.stringify({ 
            success: true, 
            updates: updates || []
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      } else if (action === 'communication-preferences') {
        // Fetch communication preferences
        const { data: preferences, error } = await userSupabase
          .from('communication_preferences')
          .select('*')
          .single();

        if (error && error.code !== 'PGRST116') {
          console.error('Error fetching preferences:', error);
          return new Response(
            JSON.stringify({ success: false, error: error.message }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        return new Response(
          JSON.stringify({ 
            success: true, 
            preferences: preferences
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      } else {
        // Fetch regular notifications for user
        const { data: notifications, error } = await userSupabase
          .from('notifications')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(50);

        if (error) {
          console.error('Error fetching notifications:', error);
          return new Response(
            JSON.stringify({ success: false, error: error.message }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const unreadCount = notifications?.filter(n => !n.is_read).length || 0;

        return new Response(
          JSON.stringify({ 
            success: true, 
            notifications: notifications || [], 
            unreadCount 
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    if (req.method === 'PUT') {
      if (action === 'communication-preferences') {
        const authHeader = req.headers.get('Authorization');
        if (!authHeader) {
          return new Response(
            JSON.stringify({ error: 'Authorization required' }),
            { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const userSupabase = createClient(
          Deno.env.get('SUPABASE_URL') ?? '',
          Deno.env.get('SUPABASE_ANON_KEY') ?? '',
          {
            global: {
              headers: {
                Authorization: authHeader,
              },
            },
          }
        );

        const { data: user, error: userError } = await userSupabase.auth.getUser();
        if (userError || !user) {
          return new Response(
            JSON.stringify({ error: 'Invalid authentication' }),
            { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const preferencesData = await req.json();

        const { data, error } = await userSupabase
          .from('communication_preferences')
          .upsert({
            user_id: user.user.id,
            ...preferencesData,
            updated_at: new Date().toISOString()
          })
          .select()
          .single();

        if (error) {
          console.error('Error updating preferences:', error);
          return new Response(
            JSON.stringify({ success: false, error: error.message }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        return new Response(
          JSON.stringify({ 
            success: true, 
            preferences: data
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Enhanced notification service error:', error);
    return new Response(
      JSON.stringify({ success: false, error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});