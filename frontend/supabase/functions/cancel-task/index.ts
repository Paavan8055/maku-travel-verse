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

    const { taskId, userId, reason = 'User cancelled' } = await req.json();

    if (!taskId) {
      return new Response(
        JSON.stringify({ error: 'Task ID is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify task exists and user has permission (or is admin)
    const { data: task, error: fetchError } = await supabaseClient
      .from('agentic_tasks')
      .select('*')
      .eq('id', taskId)
      .single();

    if (fetchError || !task) {
      return new Response(
        JSON.stringify({ error: 'Task not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if task can be cancelled
    if (task.status === 'completed' || task.status === 'cancelled') {
      return new Response(
        JSON.stringify({ 
          error: `Task cannot be cancelled. Current status: ${task.status}` 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Update task status to cancelled
    const { data: updatedTask, error: updateError } = await supabaseClient
      .from('agentic_tasks')
      .update({
        status: 'cancelled',
        error_message: reason,
        updated_at: new Date().toISOString()
      })
      .eq('id', taskId)
      .select()
      .single();

    if (updateError) {
      console.error('Task cancellation error:', updateError);
      throw new Error('Failed to cancel task');
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Task cancelled successfully',
        task: updatedTask
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Cancel task error:', error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message || 'Failed to cancel task' 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});