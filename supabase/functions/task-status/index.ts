import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.53.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const url = new URL(req.url);
    const taskId = url.searchParams.get('taskId');
    const userId = url.searchParams.get('userId');
    const status = url.searchParams.get('status');
    const agentId = url.searchParams.get('agentId');

    let query = supabaseClient.from('agentic_tasks').select('*');

    // Apply filters
    if (taskId) {
      query = query.eq('id', taskId);
    }
    if (userId) {
      query = query.eq('user_id', userId);
    }
    if (status) {
      query = query.eq('status', status);
    }
    if (agentId) {
      query = query.eq('agent_id', agentId);
    }

    // Order by creation date (newest first) and limit results
    query = query.order('created_at', { ascending: false }).limit(50);

    const { data: tasks, error } = await query;

    if (error) {
      console.error('Task query error:', error);
      throw new Error('Failed to fetch task status');
    }

    // If requesting a single task, return it directly
    if (taskId && tasks.length > 0) {
      return new Response(
        JSON.stringify(tasks[0]),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Return all matching tasks
    return new Response(
      JSON.stringify({ tasks: tasks || [], count: tasks?.length || 0 }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Task status error:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Failed to fetch task status',
        tasks: [],
        count: 0
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});