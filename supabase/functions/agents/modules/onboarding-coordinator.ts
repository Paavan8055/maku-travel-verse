import { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.53.0';
import { BaseAgent, StructuredLogger, AgentHandler } from '../_shared/memory-utils.ts';

export const handler: AgentHandler = async (
  userId: string,
  intent: string,
  params: any,
  supabaseClient: SupabaseClient,
  openAiClient: string,
  memory
) => {
  const agent = new BaseAgent(supabaseClient, 'onboarding-coordinator');
  
  try {
    StructuredLogger.info('Onboarding coordinator processing request', {
      userId,
      intent,
      agentId: 'onboarding-coordinator'
    });

    switch (intent) {
      case 'create_onboarding_plan':
        return await createOnboardingPlan(agent, userId, params);
      
      case 'assign_training_tasks':
        return await assignTrainingTasks(agent, userId, params);
      
      case 'track_training_progress':
        return await trackTrainingProgress(agent, userId, params);
      
      case 'send_completion_reminders':
        return await sendCompletionReminders(agent, userId, params);
      
      default:
        StructuredLogger.warn('Unknown intent for onboarding coordinator', { intent });
        return {
          success: false,
          error: 'Unknown intent for onboarding coordinator'
        };
    }
  } catch (error) {
    StructuredLogger.error('Onboarding coordinator error', { error: error.message, userId });
    return {
      success: false,
      error: error.message
    };
  }
};

async function createOnboardingPlan(
  agent: BaseAgent,
  userId: string,
  params: { role: string; department: string; customRequirements?: any }
): Promise<any> {
  try {
    // Get role-specific training tasks
    const { data: trainingTasks, error: tasksError } = await agent['supabase']
      .from('training_tasks')
      .select('*')
      .contains('required_for_roles', [params.role])
      .eq('is_mandatory', true);

    if (tasksError) throw tasksError;

    // Create onboarding plan
    const onboardingPlan = {
      userId,
      role: params.role,
      department: params.department,
      trainingTasks: trainingTasks || [],
      customRequirements: params.customRequirements || {},
      estimatedCompletionDays: calculateEstimatedDays(trainingTasks || []),
      createdAt: new Date().toISOString()
    };

    // Log the activity
    await agent.logActivity(userId, 'onboarding_plan_created', {
      role: params.role,
      taskCount: trainingTasks?.length || 0
    });

    StructuredLogger.info('Onboarding plan created', {
      userId,
      role: params.role,
      taskCount: trainingTasks?.length || 0
    });

    return {
      success: true,
      result: onboardingPlan,
      memoryUpdates: [{
        key: 'onboarding_plan',
        data: onboardingPlan,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days
      }]
    };
  } catch (error) {
    StructuredLogger.error('Failed to create onboarding plan', { error: error.message, userId });
    throw error;
  }
}

async function assignTrainingTasks(
  agent: BaseAgent,
  userId: string,
  params: { targetUserId: string; taskIds: string[]; dueDate?: string }
): Promise<any> {
  try {
    const assignments = [];

    for (const taskId of params.taskIds) {
      const { data: assignment, error } = await agent['supabase']
        .from('user_training_completion')
        .insert({
          user_id: params.targetUserId,
          training_task_id: taskId,
          status: 'assigned'
        })
        .select()
        .single();

      if (error && error.code !== '23505') { // Ignore duplicate key errors
        throw error;
      }

      if (assignment) {
        assignments.push(assignment);
      }
    }

    await agent.logActivity(userId, 'training_tasks_assigned', {
      targetUserId: params.targetUserId,
      assignedTasks: assignments.length
    });

    return {
      success: true,
      result: { assignments },
      memoryUpdates: [{
        key: 'recent_assignments',
        data: { assignments, timestamp: new Date().toISOString() }
      }]
    };
  } catch (error) {
    StructuredLogger.error('Failed to assign training tasks', { error: error.message, userId });
    throw error;
  }
}

async function trackTrainingProgress(
  agent: BaseAgent,
  userId: string,
  params: { targetUserId?: string }
): Promise<any> {
  try {
    const targetUser = params.targetUserId || userId;

    const { data: progress, error } = await agent['supabase']
      .from('user_training_completion')
      .select(`
        *,
        training_tasks (
          task_name,
          description,
          estimated_duration_minutes
        )
      `)
      .eq('user_id', targetUser);

    if (error) throw error;

    const progressSummary = {
      totalTasks: progress?.length || 0,
      completedTasks: progress?.filter(p => p.status === 'completed').length || 0,
      inProgressTasks: progress?.filter(p => p.status === 'in_progress').length || 0,
      notStartedTasks: progress?.filter(p => p.status === 'not_started').length || 0,
      overdueTasks: progress?.filter(p => 
        p.status !== 'completed' && 
        p.started_at && 
        new Date(p.started_at) < new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      ).length || 0
    };

    return {
      success: true,
      result: {
        progress: progress || [],
        summary: progressSummary
      }
    };
  } catch (error) {
    StructuredLogger.error('Failed to track training progress', { error: error.message, userId });
    throw error;
  }
}

async function sendCompletionReminders(
  agent: BaseAgent,
  userId: string,
  params: { targetUserId?: string }
): Promise<any> {
  try {
    const { data: overdueUsers, error } = await agent['supabase']
      .from('user_training_completion')
      .select(`
        user_id,
        training_tasks (task_name, description)
      `)
      .eq('status', 'in_progress')
      .lt('started_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

    if (error) throw error;

    const reminders = [];
    const userGroups = groupBy(overdueUsers || [], 'user_id');

    for (const [targetUserId, tasks] of Object.entries(userGroups)) {
      const reminder = {
        userId: targetUserId,
        overdueTasks: tasks,
        reminderSent: new Date().toISOString()
      };
      reminders.push(reminder);

      // Here you would typically send an actual notification/email
      await agent.logActivity(userId, 'completion_reminder_sent', {
        targetUserId,
        overdueTasks: tasks.length
      });
    }

    return {
      success: true,
      result: { remindersSent: reminders.length, reminders }
    };
  } catch (error) {
    StructuredLogger.error('Failed to send completion reminders', { error: error.message, userId });
    throw error;
  }
}

function calculateEstimatedDays(tasks: any[]): number {
  const totalMinutes = tasks.reduce((sum, task) => sum + (task.estimated_duration_minutes || 0), 0);
  return Math.ceil(totalMinutes / (8 * 60)); // Assuming 8 hours per day
}

function groupBy<T>(array: T[], key: keyof T): Record<string, T[]> {
  return array.reduce((groups, item) => {
    const groupKey = String(item[key]);
    groups[groupKey] = groups[groupKey] || [];
    groups[groupKey].push(item);
    return groups;
  }, {} as Record<string, T[]>);
}