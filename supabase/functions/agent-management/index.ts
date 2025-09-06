import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'jsr:@supabase/supabase-js@2'
import logger from '../_shared/logger.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface AgentCommand {
  action: string
  agentId?: string
  groupId?: string
  taskData?: any
  batchData?: any
  scheduleData?: any
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    )

    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('No authorization header')
    }

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(authHeader.replace('Bearer ', ''))
    if (authError || !user) {
      throw new Error('Authentication failed')
    }

    const { data: isAdmin } = await supabaseClient.rpc('is_secure_admin', { check_user_id: user.id })
    if (!isAdmin) {
      throw new Error('Admin access required')
    }

    const command: AgentCommand = await req.json()
    const correlationId = crypto.randomUUID()

    logger.info('Agent management command received', { 
      correlationId, 
      userId: user.id, 
      action: command.action,
      agentId: command.agentId 
    })

    let result: any

    switch (command.action) {
      case 'list_agents':
        result = await listAgents(supabaseClient)
        break
      
      case 'get_agent':
        result = await getAgent(supabaseClient, command.agentId!)
        break
      
      case 'update_agent_config':
        result = await updateAgentConfig(supabaseClient, command.agentId!, command.taskData, user.id)
        break
      
      case 'assign_task':
        result = await assignTask(supabaseClient, command.agentId!, command.taskData, user.id)
        break
      
      case 'bulk_assign_task':
        result = await bulkAssignTask(supabaseClient, command.batchData, user.id)
        break
      
      case 'schedule_task':
        result = await scheduleTask(supabaseClient, command.scheduleData, user.id)
        break
      
      case 'get_agent_performance':
        result = await getAgentPerformance(supabaseClient, command.agentId!)
        break
      
      case 'get_agent_groups':
        result = await getAgentGroups(supabaseClient)
        break
      
      case 'manage_agent_group':
        result = await manageAgentGroup(supabaseClient, command.groupId!, command.taskData, user.id)
        break
      
      case 'emergency_stop':
        result = await emergencyStop(supabaseClient, command.agentId!, user.id)
        break
      
      case 'get_batch_operations':
        result = await getBatchOperations(supabaseClient)
        break
      
      case 'get_agent_alerts':
        result = await getAgentAlerts(supabaseClient)
        break
      
      default:
        throw new Error(`Unknown action: ${command.action}`)
    }

    logger.info('Agent management command completed', { correlationId, action: command.action })

    return new Response(JSON.stringify({ success: true, data: result }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error) {
    logger.error('Agent management error', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || 'Internal server error' 
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})

async function listAgents(supabase: any) {
  const { data: agents, error } = await supabase
    .from('agent_management')
    .select(`
      *,
      agent_group_memberships!inner(
        agent_groups(group_name, description)
      )
    `)
    .order('display_name')

  if (error) throw error
  return agents
}

async function getAgent(supabase: any, agentId: string) {
  const { data: agent, error } = await supabase
    .from('agent_management')
    .select(`
      *,
      agent_group_memberships(
        agent_groups(*)
      )
    `)
    .eq('agent_id', agentId)
    .single()

  if (error) throw error

  // Get recent performance metrics
  const { data: metrics } = await supabase
    .from('agent_performance_metrics')
    .select('*')
    .eq('agent_id', agentId)
    .order('metric_date', { ascending: false })
    .limit(7)

  // Get recent tasks
  const { data: tasks } = await supabase
    .from('agentic_tasks')
    .select('*')
    .eq('agent_id', agentId)
    .order('created_at', { ascending: false })
    .limit(10)

  return { agent, metrics, tasks }
}

async function updateAgentConfig(supabase: any, agentId: string, config: any, userId: string) {
  const { data: currentAgent } = await supabase
    .from('agent_management')
    .select('*')
    .eq('agent_id', agentId)
    .single()

  const { data, error } = await supabase
    .from('agent_management')
    .update({
      configuration: config.configuration,
      permissions: config.permissions,
      performance_settings: config.performance_settings,
      updated_by: userId
    })
    .eq('agent_id', agentId)
    .select()

  if (error) throw error

  // Log the configuration change
  await supabase
    .from('agent_audit_logs')
    .insert({
      action_type: 'config_update',
      action_description: `Updated configuration for agent ${agentId}`,
      agent_id: agentId,
      resource_type: 'agent_config',
      resource_id: agentId,
      old_values: currentAgent,
      new_values: data[0],
      performed_by: userId
    })

  return data[0]
}

async function assignTask(supabase: any, agentId: string, taskData: any, userId: string) {
  const { data, error } = await supabase
    .from('agentic_tasks')
    .insert({
      agent_id: agentId,
      intent: taskData.intent,
      params: taskData.params || {},
      user_id: userId,
      status: 'pending'
    })
    .select()

  if (error) throw error

  // Log task assignment
  await supabase
    .from('agent_audit_logs')
    .insert({
      action_type: 'task_assigned',
      action_description: `Assigned task to agent ${agentId}`,
      agent_id: agentId,
      resource_type: 'task',
      resource_id: data[0].id,
      new_values: data[0],
      performed_by: userId
    })

  return data[0]
}

async function bulkAssignTask(supabase: any, batchData: any, userId: string) {
  const { data: operation, error: opError } = await supabase
    .from('agent_batch_operations')
    .insert({
      operation_name: batchData.name,
      operation_type: 'bulk_task_assignment',
      target_agents: batchData.agentIds,
      operation_config: batchData.taskConfig,
      total_targets: batchData.agentIds.length,
      created_by: userId,
      status: 'running'
    })
    .select()

  if (opError) throw opError

  // Execute bulk assignment
  let completed = 0
  let failed = 0
  
  for (const agentId of batchData.agentIds) {
    try {
      await supabase
        .from('agentic_tasks')
        .insert({
          agent_id: agentId,
          intent: batchData.taskConfig.intent,
          params: batchData.taskConfig.params || {},
          user_id: userId,
          status: 'pending'
        })
      completed++
    } catch (error) {
      failed++
      logger.error(`Failed to assign task to agent ${agentId}`, error)
    }
  }

  // Update operation status
  await supabase
    .from('agent_batch_operations')
    .update({
      completed_targets: completed,
      failed_targets: failed,
      status: 'completed',
      completed_at: new Date().toISOString()
    })
    .eq('id', operation[0].id)

  return { operationId: operation[0].id, completed, failed }
}

async function scheduleTask(supabase: any, scheduleData: any, userId: string) {
  const { data, error } = await supabase
    .from('agent_scheduled_tasks')
    .insert({
      task_name: scheduleData.name,
      description: scheduleData.description,
      agent_id: scheduleData.agentId,
      task_parameters: scheduleData.taskConfig,
      schedule_type: scheduleData.scheduleType,
      schedule_config: scheduleData.scheduleConfig,
      next_execution: scheduleData.nextExecution,
      created_by: userId
    })
    .select()

  if (error) throw error
  return data[0]
}

async function getAgentPerformance(supabase: any, agentId: string) {
  const { data, error } = await supabase
    .from('agent_performance_metrics')
    .select('*')
    .eq('agent_id', agentId)
    .order('metric_date', { ascending: false })
    .limit(30)

  if (error) throw error
  return data
}

async function getAgentGroups(supabase: any) {
  const { data, error } = await supabase
    .from('agent_groups')
    .select(`
      *,
      agent_group_memberships(
        agent_id,
        agent_management(display_name, status)
      )
    `)

  if (error) throw error
  return data
}

async function manageAgentGroup(supabase: any, groupId: string, action: any, userId: string) {
  if (action.type === 'add_agent') {
    const { data, error } = await supabase
      .from('agent_group_memberships')
      .insert({
        agent_id: action.agentId,
        group_id: groupId,
        added_by: userId
      })
      .select()
    
    if (error) throw error
    return data[0]
  }
  
  if (action.type === 'remove_agent') {
    const { error } = await supabase
      .from('agent_group_memberships')
      .delete()
      .eq('agent_id', action.agentId)
      .eq('group_id', groupId)
    
    if (error) throw error
    return { success: true }
  }
}

async function emergencyStop(supabase: any, agentId: string, userId: string) {
  // Update agent status to paused
  const { error: agentError } = await supabase
    .from('agent_management')
    .update({ status: 'paused' })
    .eq('agent_id', agentId)

  if (agentError) throw agentError

  // Cancel pending tasks
  const { data: cancelledTasks, error: taskError } = await supabase
    .from('agentic_tasks')
    .update({ status: 'cancelled', error_message: 'Emergency stop initiated' })
    .eq('agent_id', agentId)
    .eq('status', 'pending')
    .select()

  if (taskError) throw taskError

  // Create alert
  await supabase
    .from('agent_alerts')
    .insert({
      alert_type: 'emergency_stop',
      severity: 'high',
      title: 'Agent Emergency Stop',
      message: `Agent ${agentId} has been emergency stopped by admin`,
      agent_id: agentId,
      alert_data: { initiated_by: userId, cancelled_tasks: cancelledTasks?.length || 0 }
    })

  // Log the emergency stop
  await supabase
    .from('agent_audit_logs')
    .insert({
      action_type: 'emergency_stop',
      action_description: `Emergency stop initiated for agent ${agentId}`,
      agent_id: agentId,
      resource_type: 'agent',
      resource_id: agentId,
      performed_by: userId
    })

  return { stopped: true, cancelledTasks: cancelledTasks?.length || 0 }
}

async function getBatchOperations(supabase: any) {
  const { data, error } = await supabase
    .from('agent_batch_operations')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(50)

  if (error) throw error
  return data
}

async function getAgentAlerts(supabase: any) {
  const { data, error } = await supabase
    .from('agent_alerts')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(100)

  if (error) throw error
  return data
}