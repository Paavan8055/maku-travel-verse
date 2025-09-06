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
  const agent = new BaseAgent(supabaseClient, 'compliance-trainer');
  
  try {
    StructuredLogger.info('Compliance trainer processing request', {
      userId,
      intent,
      agentId: 'compliance-trainer'
    });

    switch (intent) {
      case 'create_compliance_training':
        return await createComplianceTraining(agent, userId, params);
      
      case 'assign_compliance_training':
        return await assignComplianceTraining(agent, userId, params);
      
      case 'track_certifications':
        return await trackCertifications(agent, userId, params);
      
      case 'send_renewal_reminders':
        return await sendRenewalReminders(agent, userId, params);
      
      case 'generate_compliance_report':
        return await generateComplianceReport(agent, userId, params);
      
      default:
        StructuredLogger.warn('Unknown intent for compliance trainer', { intent });
        return {
          success: false,
          error: 'Unknown intent for compliance trainer'
        };
    }
  } catch (error) {
    StructuredLogger.error('Compliance trainer error', { error: error.message, userId });
    return {
      success: false,
      error: error.message
    };
  }
};

async function createComplianceTraining(
  agent: BaseAgent,
  userId: string,
  params: { 
    title: string; 
    complianceType: string; 
    requirements: any; 
    validityPeriodMonths: number;
    mandatoryRoles: string[];
  }
): Promise<any> {
  try {
    const { data: trainingTask, error } = await agent['supabase']
      .from('training_tasks')
      .insert({
        task_name: params.title,
        description: `Compliance training for ${params.complianceType}`,
        task_type: 'compliance',
        required_for_roles: params.mandatoryRoles,
        completion_criteria: {
          passingScore: 80,
          maxAttempts: 3,
          complianceType: params.complianceType,
          validityPeriodMonths: params.validityPeriodMonths,
          requirements: params.requirements
        },
        is_mandatory: true,
        created_by: userId
      })
      .select()
      .single();

    if (error) throw error;

    await agent.logActivity(userId, 'compliance_training_created', {
      trainingId: trainingTask.id,
      complianceType: params.complianceType,
      mandatoryRoles: params.mandatoryRoles
    });

    return {
      success: true,
      result: { trainingTask },
      memoryUpdates: [{
        key: 'compliance_training_created',
        data: {
          trainingId: trainingTask.id,
          complianceType: params.complianceType,
          createdAt: new Date().toISOString()
        }
      }]
    };
  } catch (error) {
    StructuredLogger.error('Failed to create compliance training', { error: error.message, userId });
    throw error;
  }
}

async function assignComplianceTraining(
  agent: BaseAgent,
  userId: string,
  params: { 
    trainingTaskId: string; 
    targetUsers: string[]; 
    dueDate: string;
    reason: string;
  }
): Promise<any> {
  try {
    const assignments = [];

    for (const targetUserId of params.targetUsers) {
      const { data: assignment, error } = await agent['supabase']
        .from('user_training_completion')
        .insert({
          user_id: targetUserId,
          training_task_id: params.trainingTaskId,
          status: 'assigned',
          completion_evidence: {
            assignedBy: userId,
            dueDate: params.dueDate,
            reason: params.reason
          }
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

    await agent.logActivity(userId, 'compliance_training_assigned', {
      trainingTaskId: params.trainingTaskId,
      assignedUsers: params.targetUsers.length,
      dueDate: params.dueDate
    });

    return {
      success: true,
      result: { 
        assignments,
        assignedCount: assignments.length 
      }
    };
  } catch (error) {
    StructuredLogger.error('Failed to assign compliance training', { error: error.message, userId });
    throw error;
  }
}

async function trackCertifications(
  agent: BaseAgent,
  userId: string,
  params: { targetUserId?: string; complianceType?: string }
): Promise<any> {
  try {
    let query = agent['supabase']
      .from('user_training_completion')
      .select(`
        *,
        training_tasks!inner (
          task_name,
          completion_criteria,
          task_type
        )
      `)
      .eq('training_tasks.task_type', 'compliance')
      .eq('status', 'completed');

    if (params.targetUserId) {
      query = query.eq('user_id', params.targetUserId);
    }

    if (params.complianceType) {
      query = query.eq('training_tasks.completion_criteria->complianceType', params.complianceType);
    }

    const { data: certifications, error } = await query;

    if (error) throw error;

    // Calculate certification status and expiry
    const processedCertifications = (certifications || []).map(cert => {
      const validityMonths = cert.training_tasks.completion_criteria?.validityPeriodMonths || 12;
      const completedDate = new Date(cert.completed_at!);
      const expiryDate = new Date(completedDate);
      expiryDate.setMonth(expiryDate.getMonth() + validityMonths);
      
      const now = new Date();
      const daysUntilExpiry = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      
      return {
        ...cert,
        expiryDate: expiryDate.toISOString(),
        daysUntilExpiry,
        isExpired: daysUntilExpiry < 0,
        isExpiringSoon: daysUntilExpiry > 0 && daysUntilExpiry <= 30
      };
    });

    const summary = {
      totalCertifications: processedCertifications.length,
      expiredCertifications: processedCertifications.filter(c => c.isExpired).length,
      expiringSoon: processedCertifications.filter(c => c.isExpiringSoon).length,
      validCertifications: processedCertifications.filter(c => !c.isExpired && !c.isExpiringSoon).length
    };

    return {
      success: true,
      result: {
        certifications: processedCertifications,
        summary
      }
    };
  } catch (error) {
    StructuredLogger.error('Failed to track certifications', { error: error.message, userId });
    throw error;
  }
}

async function sendRenewalReminders(
  agent: BaseAgent,
  userId: string,
  params: { daysBeforeExpiry?: number }
): Promise<any> {
  try {
    const daysBeforeExpiry = params.daysBeforeExpiry || 30;
    
    // Get all compliance certifications that are expiring soon
    const { data: expiringCertifications, error } = await agent['supabase']
      .from('user_training_completion')
      .select(`
        *,
        training_tasks!inner (
          task_name,
          completion_criteria,
          task_type
        )
      `)
      .eq('training_tasks.task_type', 'compliance')
      .eq('status', 'completed');

    if (error) throw error;

    const reminders = [];
    const now = new Date();

    for (const cert of expiringCertifications || []) {
      const validityMonths = cert.training_tasks.completion_criteria?.validityPeriodMonths || 12;
      const completedDate = new Date(cert.completed_at!);
      const expiryDate = new Date(completedDate);
      expiryDate.setMonth(expiryDate.getMonth() + validityMonths);
      
      const daysUntilExpiry = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysUntilExpiry > 0 && daysUntilExpiry <= daysBeforeExpiry) {
        const reminder = {
          userId: cert.user_id,
          trainingTaskId: cert.training_task_id,
          trainingName: cert.training_tasks.task_name,
          expiryDate: expiryDate.toISOString(),
          daysUntilExpiry,
          reminderSent: new Date().toISOString()
        };
        
        reminders.push(reminder);

        // Log the reminder activity
        await agent.logActivity(userId, 'compliance_renewal_reminder_sent', {
          targetUserId: cert.user_id,
          trainingName: cert.training_tasks.task_name,
          daysUntilExpiry
        });
      }
    }

    await agent.createAlert(
      userId,
      'compliance_renewals_due',
      `${reminders.length} compliance certifications require renewal`,
      reminders.length > 10 ? 'high' : 'medium',
      { reminders: reminders.slice(0, 10) }
    );

    return {
      success: true,
      result: {
        remindersSent: reminders.length,
        reminders
      }
    };
  } catch (error) {
    StructuredLogger.error('Failed to send renewal reminders', { error: error.message, userId });
    throw error;
  }
}

async function generateComplianceReport(
  agent: BaseAgent,
  userId: string,
  params: { 
    reportType: 'summary' | 'detailed' | 'by_department';
    timeframe?: string;
    department?: string;
  }
): Promise<any> {
  try {
    // Get all compliance training data
    const { data: allComplianceData, error } = await agent['supabase']
      .from('user_training_completion')
      .select(`
        *,
        training_tasks!inner (
          task_name,
          completion_criteria,
          task_type,
          required_for_roles
        )
      `)
      .eq('training_tasks.task_type', 'compliance');

    if (error) throw error;

    const report = generateReportData(allComplianceData || [], params);

    await agent.logActivity(userId, 'compliance_report_generated', {
      reportType: params.reportType,
      recordsProcessed: allComplianceData?.length || 0
    });

    return {
      success: true,
      result: {
        report,
        generatedAt: new Date().toISOString(),
        reportType: params.reportType
      },
      memoryUpdates: [{
        key: 'last_compliance_report',
        data: {
          reportType: params.reportType,
          generatedAt: new Date().toISOString(),
          recordCount: allComplianceData?.length || 0
        }
      }]
    };
  } catch (error) {
    StructuredLogger.error('Failed to generate compliance report', { error: error.message, userId });
    throw error;
  }
}

function generateReportData(data: any[], params: any): any {
  const now = new Date();
  
  const processedData = data.map(item => {
    const validityMonths = item.training_tasks.completion_criteria?.validityPeriodMonths || 12;
    let expiryDate = null;
    let isExpired = false;
    let isExpiringSoon = false;
    
    if (item.completed_at) {
      const completedDate = new Date(item.completed_at);
      expiryDate = new Date(completedDate);
      expiryDate.setMonth(expiryDate.getMonth() + validityMonths);
      
      const daysUntilExpiry = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      isExpired = daysUntilExpiry < 0;
      isExpiringSoon = daysUntilExpiry > 0 && daysUntilExpiry <= 30;
    }
    
    return {
      ...item,
      expiryDate,
      isExpired,
      isExpiringSoon
    };
  });

  const summary = {
    totalEmployees: new Set(processedData.map(d => d.user_id)).size,
    totalComplianceItems: processedData.length,
    completedTrainings: processedData.filter(d => d.status === 'completed').length,
    pendingTrainings: processedData.filter(d => d.status === 'assigned' || d.status === 'in_progress').length,
    expiredCertifications: processedData.filter(d => d.isExpired).length,
    expiringSoon: processedData.filter(d => d.isExpiringSoon).length,
    complianceRate: processedData.length > 0 
      ? Math.round((processedData.filter(d => d.status === 'completed' && !d.isExpired).length / processedData.length) * 100)
      : 0
  };

  switch (params.reportType) {
    case 'summary':
      return { summary };
    
    case 'detailed':
      return {
        summary,
        detailedData: processedData,
        riskAreas: processedData.filter(d => d.isExpired || d.isExpiringSoon)
      };
    
    case 'by_department':
      const departmentGroups = groupByDepartment(processedData);
      return {
        summary,
        departmentBreakdown: departmentGroups
      };
    
    default:
      return { summary };
  }
}

function groupByDepartment(data: any[]): any {
  // This would ideally join with user profile data to get department info
  // For now, we'll group by required roles as a proxy
  const groups: Record<string, any> = {};
  
  data.forEach(item => {
    const roles = item.training_tasks.required_for_roles || ['general'];
    roles.forEach((role: string) => {
      if (!groups[role]) {
        groups[role] = {
          role,
          employees: new Set(),
          totalTrainings: 0,
          completedTrainings: 0,
          expiredCertifications: 0
        };
      }
      
      groups[role].employees.add(item.user_id);
      groups[role].totalTrainings++;
      if (item.status === 'completed') groups[role].completedTrainings++;
      if (item.isExpired) groups[role].expiredCertifications++;
    });
  });
  
  // Convert sets to counts
  Object.values(groups).forEach((group: any) => {
    group.employeeCount = group.employees.size;
    delete group.employees;
    group.complianceRate = group.totalTrainings > 0 
      ? Math.round((group.completedTrainings / group.totalTrainings) * 100)
      : 0;
  });
  
  return groups;
}