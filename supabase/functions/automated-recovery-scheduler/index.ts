import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.53.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ScheduledTask {
  id: string;
  name: string;
  function_name: string;
  schedule: string; // cron expression
  enabled: boolean;
  last_run?: string;
  next_run?: string;
  parameters?: any;
}

interface RecoverySchedule {
  immediate: ScheduledTask[];
  every_5_minutes: ScheduledTask[];
  every_15_minutes: ScheduledTask[];
  hourly: ScheduledTask[];
  daily: ScheduledTask[];
}

const RECOVERY_SCHEDULES: RecoverySchedule = {
  immediate: [
    {
      id: 'critical-alerts-check',
      name: 'Critical Alerts Check',
      function_name: 'critical-booking-alerts',
      schedule: '* * * * *', // Every minute
      enabled: true,
      parameters: { action: 'check_triggers' }
    }
  ],
  every_5_minutes: [
    {
      id: 'provider-health-check',
      name: 'Provider Health Check',
      function_name: 'comprehensive-health-monitor',
      schedule: '*/5 * * * *',
      enabled: true,
      parameters: {}
    },
    {
      id: 'stuck-bookings-check',
      name: 'Stuck Bookings Recovery',
      function_name: 'emergency-system-recovery',
      schedule: '*/5 * * * *',
      enabled: true,
      parameters: { action: 'emergency_recovery', mode: 'execute' }
    }
  ],
  every_15_minutes: [
    {
      id: 'provider-quota-monitor',
      name: 'Provider Quota Monitoring',
      function_name: 'provider-quota-monitor',
      schedule: '*/15 * * * *',
      enabled: true,
      parameters: {}
    },
    {
      id: 'performance-optimization',
      name: 'Performance Optimization',
      function_name: 'track-performance',
      schedule: '*/15 * * * *',
      enabled: true,
      parameters: { action: 'optimize_queries' }
    }
  ],
  hourly: [
    {
      id: 'cache-cleanup',
      name: 'Cache Cleanup',
      function_name: 'security-cleanup',
      schedule: '0 * * * *',
      enabled: true,
      parameters: { action: 'cleanup_cache' }
    },
    {
      id: 'database-health-check',
      name: 'Database Health Check',
      function_name: 'emergency-system-recovery',
      schedule: '0 * * * *',
      enabled: true,
      parameters: { action: 'database_repair' }
    }
  ],
  daily: [
    {
      id: 'full-system-recovery',
      name: 'Full System Recovery Check',
      function_name: 'emergency-system-recovery',
      schedule: '0 2 * * *', // 2 AM daily
      enabled: true,
      parameters: { action: 'system_health_check' }
    },
    {
      id: 'audit-cleanup',
      name: 'Audit Data Cleanup',
      function_name: 'ai-training-anonymizer',
      schedule: '0 3 * * *', // 3 AM daily
      enabled: true,
      parameters: { action: 'cleanup_old_data' }
    }
  ]
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { action, schedule_type, task_id } = await req.json();

    console.log(`[AUTO-RECOVERY] Processing ${action} for ${schedule_type || 'all schedules'}`);

    switch (action) {
      case 'run_scheduled_tasks':
        return await runScheduledTasks(supabase, schedule_type);
      
      case 'get_schedules':
        return await getSchedules(supabase);
      
      case 'enable_task':
        return await enableTask(supabase, task_id);
      
      case 'disable_task':
        return await disableTask(supabase, task_id);
      
      case 'run_single_task':
        return await runSingleTask(supabase, task_id);
      
      default:
        return new Response(
          JSON.stringify({ error: 'Invalid action specified' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
  } catch (error) {
    console.error('[AUTO-RECOVERY] Error:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Automated recovery scheduler failed', 
        details: error.message 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function runScheduledTasks(supabase: any, scheduleType?: string): Promise<Response> {
  const results = [];
  const startTime = Date.now();
  
  try {
    const schedules = scheduleType ? 
      { [scheduleType]: RECOVERY_SCHEDULES[scheduleType as keyof RecoverySchedule] } : 
      RECOVERY_SCHEDULES;

    console.log(`[SCHEDULER] Running tasks for ${scheduleType || 'all'} schedules`);

    for (const [type, tasks] of Object.entries(schedules)) {
      for (const task of tasks) {
        if (!task.enabled) {
          console.log(`[SCHEDULER] Skipping disabled task: ${task.name}`);
          continue;
        }

        try {
          console.log(`[SCHEDULER] Executing task: ${task.name}`);
          
          const taskStartTime = Date.now();
          const { data, error } = await supabase.functions.invoke(task.function_name, {
            body: task.parameters || {}
          });

          const executionTime = Date.now() - taskStartTime;

          if (error) {
            console.error(`[SCHEDULER] Task ${task.name} failed:`, error);
            results.push({
              task_id: task.id,
              task_name: task.name,
              status: 'failed',
              error: error.message,
              execution_time_ms: executionTime
            });
          } else {
            console.log(`[SCHEDULER] Task ${task.name} completed successfully`);
            results.push({
              task_id: task.id,
              task_name: task.name,
              status: 'success',
              result: data,
              execution_time_ms: executionTime
            });
          }

          // Log task execution
          await logTaskExecution(supabase, task, 'success', executionTime, error?.message);

        } catch (taskError) {
          console.error(`[SCHEDULER] Task ${task.name} exception:`, taskError);
          results.push({
            task_id: task.id,
            task_name: task.name,
            status: 'failed',
            error: taskError.message,
            execution_time_ms: 0
          });

          await logTaskExecution(supabase, task, 'failed', 0, taskError.message);
        }
      }
    }

    const successCount = results.filter(r => r.status === 'success').length;
    const failCount = results.filter(r => r.status === 'failed').length;

    return new Response(
      JSON.stringify({
        success: true,
        schedule_type: scheduleType || 'all',
        total_tasks: results.length,
        successful: successCount,
        failed: failCount,
        results,
        execution_time_ms: Date.now() - startTime,
        timestamp: new Date().toISOString()
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[SCHEDULER] Error running scheduled tasks:', error);
    return new Response(
      JSON.stringify({ error: 'Scheduled tasks execution failed', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}

async function getSchedules(supabase: any): Promise<Response> {
  try {
    // Get task execution history
    const { data: taskHistory, error } = await supabase
      .from('system_logs')
      .select('*')
      .eq('service_name', 'automated-recovery-scheduler')
      .order('created_at', { ascending: false })
      .limit(50);

    // Calculate next run times based on schedule
    const enrichedSchedules = Object.entries(RECOVERY_SCHEDULES).map(([type, tasks]) => ({
      schedule_type: type,
      tasks: tasks.map(task => ({
        ...task,
        last_execution: taskHistory?.find(h => h.metadata?.task_id === task.id)?.created_at,
        next_run: calculateNextRun(task.schedule)
      }))
    }));

    return new Response(
      JSON.stringify({
        success: true,
        schedules: enrichedSchedules,
        total_tasks: Object.values(RECOVERY_SCHEDULES).flat().length,
        enabled_tasks: Object.values(RECOVERY_SCHEDULES).flat().filter(t => t.enabled).length
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[GET-SCHEDULES] Error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to get schedules', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}

async function enableTask(supabase: any, taskId: string): Promise<Response> {
  try {
    // Find and enable task (in production, this would update a database table)
    const task = findTaskById(taskId);
    if (!task) {
      return new Response(
        JSON.stringify({ error: 'Task not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    task.enabled = true;

    await logTaskExecution(supabase, task, 'enabled', 0, 'Task enabled by admin');

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Task ${task.name} enabled`,
        task
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[ENABLE-TASK] Error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to enable task', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}

async function disableTask(supabase: any, taskId: string): Promise<Response> {
  try {
    const task = findTaskById(taskId);
    if (!task) {
      return new Response(
        JSON.stringify({ error: 'Task not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    task.enabled = false;

    await logTaskExecution(supabase, task, 'disabled', 0, 'Task disabled by admin');

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Task ${task.name} disabled`,
        task
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[DISABLE-TASK] Error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to disable task', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}

async function runSingleTask(supabase: any, taskId: string): Promise<Response> {
  try {
    const task = findTaskById(taskId);
    if (!task) {
      return new Response(
        JSON.stringify({ error: 'Task not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[SINGLE-TASK] Running ${task.name} manually`);

    const startTime = Date.now();
    const { data, error } = await supabase.functions.invoke(task.function_name, {
      body: { ...task.parameters, manual_trigger: true }
    });

    const executionTime = Date.now() - startTime;

    await logTaskExecution(supabase, task, error ? 'failed' : 'success', executionTime, error?.message);

    if (error) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Task execution failed', 
          details: error.message 
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        task_id: taskId,
        task_name: task.name,
        result: data,
        execution_time_ms: executionTime
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[SINGLE-TASK] Error:', error);
    return new Response(
      JSON.stringify({ error: 'Single task execution failed', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}

function findTaskById(taskId: string): ScheduledTask | null {
  for (const tasks of Object.values(RECOVERY_SCHEDULES)) {
    const task = tasks.find(t => t.id === taskId);
    if (task) return task;
  }
  return null;
}

function calculateNextRun(cronExpression: string): string {
  // Simple next run calculation (in production, use a proper cron library)
  const now = new Date();
  
  if (cronExpression === '* * * * *') {
    // Every minute
    return new Date(now.getTime() + 60000).toISOString();
  } else if (cronExpression === '*/5 * * * *') {
    // Every 5 minutes
    return new Date(now.getTime() + 5 * 60000).toISOString();
  } else if (cronExpression === '*/15 * * * *') {
    // Every 15 minutes
    return new Date(now.getTime() + 15 * 60000).toISOString();
  } else if (cronExpression === '0 * * * *') {
    // Hourly
    const nextHour = new Date(now);
    nextHour.setHours(now.getHours() + 1, 0, 0, 0);
    return nextHour.toISOString();
  } else if (cronExpression.startsWith('0 ')) {
    // Daily at specific hour
    const nextDay = new Date(now);
    nextDay.setDate(now.getDate() + 1);
    const hour = parseInt(cronExpression.split(' ')[1]);
    nextDay.setHours(hour, 0, 0, 0);
    return nextDay.toISOString();
  }
  
  return new Date(now.getTime() + 3600000).toISOString(); // Default: 1 hour
}

async function logTaskExecution(
  supabase: any, 
  task: ScheduledTask, 
  status: string, 
  executionTime: number, 
  errorMessage?: string
): Promise<void> {
  try {
    await supabase.functions.invoke('log-system-event', {
      body: {
        correlation_id: crypto.randomUUID(),
        service_name: 'automated-recovery-scheduler',
        log_level: status === 'failed' ? 'error' : 'info',
        message: `Task ${task.name} ${status}`,
        metadata: {
          task_id: task.id,
          task_name: task.name,
          function_name: task.function_name,
          status,
          execution_time_ms: executionTime,
          error_message: errorMessage
        }
      }
    });
  } catch (error) {
    console.error('[LOG-TASK] Error logging task execution:', error);
  }
}