import { BaseAgent, AgentHandler, StructuredLogger } from '../_shared/memory-utils.ts';
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.53.0";

export class LogsAuditAgent extends BaseAgent {
  constructor(supabaseClient: any) {
    super('logs-audit-agent', supabaseClient);
  }

  async analyzeSystemLogs(userId: string, timeRange: string, logLevel?: string): Promise<any> {
    try {
      StructuredLogger.info('Starting system logs analysis', { userId, timeRange, logLevel });

      // Calculate time range
      const endTime = new Date();
      const startTime = new Date();
      
      switch (timeRange) {
        case '1hour':
          startTime.setHours(startTime.getHours() - 1);
          break;
        case '24hours':
          startTime.setDate(startTime.getDate() - 1);
          break;
        case '7days':
          startTime.setDate(startTime.getDate() - 7);
          break;
        case '30days':
          startTime.setDate(startTime.getDate() - 30);
          break;
        default:
          startTime.setHours(startTime.getHours() - 1);
      }

      // Query system logs
      let query = this.supabaseClient
        .from('system_logs')
        .select('*')
        .gte('created_at', startTime.toISOString())
        .lte('created_at', endTime.toISOString())
        .order('created_at', { ascending: false });

      if (logLevel) {
        query = query.eq('log_level', logLevel);
      }

      const { data: logs, error } = await query.limit(1000);

      if (error) throw error;

      // Analyze logs
      const analysis = {
        time_range: {
          start: startTime.toISOString(),
          end: endTime.toISOString(),
          duration_hours: (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60)
        },
        total_logs: logs?.length || 0,
        log_levels: this.aggregateByField(logs || [], 'log_level'),
        services: this.aggregateByField(logs || [], 'service_name'),
        error_patterns: this.analyzeErrorPatterns(logs || []),
        performance_metrics: this.analyzePerformanceMetrics(logs || []),
        security_events: this.findSecurityEvents(logs || []),
        trends: this.analyzeTrends(logs || [])
      };

      // Create alerts for critical issues
      if (analysis.error_patterns.critical_errors > 0) {
        await this.createAlert(
          userId,
          'critical_errors_detected',
          `${analysis.error_patterns.critical_errors} critical errors detected in system logs`,
          'high',
          { analysis_summary: analysis.error_patterns }
        );
      }

      if (analysis.security_events.length > 0) {
        await this.createAlert(
          userId,
          'security_events_detected',
          `${analysis.security_events.length} security events detected in system logs`,
          'high',
          { security_events: analysis.security_events }
        );
      }

      await this.logActivity(userId, 'logs_analysis_completed', analysis);
      return analysis;

    } catch (error) {
      await this.createAlert(userId, 'logs_analysis_failed', error.message, 'medium');
      throw error;
    }
  }

  async auditUserActivity(userId: string, targetUserId?: string, timeRange?: string): Promise<any> {
    try {
      StructuredLogger.info('Starting user activity audit', { userId, targetUserId, timeRange });

      // Calculate time range
      const endTime = new Date();
      const startTime = new Date();
      startTime.setDate(startTime.getDate() - (timeRange === '7days' ? 7 : 1));

      // Query user activity logs
      let query = this.supabaseClient
        .from('user_activity_logs')
        .select('*')
        .gte('created_at', startTime.toISOString())
        .lte('created_at', endTime.toISOString())
        .order('created_at', { ascending: false });

      if (targetUserId) {
        query = query.eq('user_id', targetUserId);
      }

      const { data: activities, error } = await query.limit(1000);

      if (error) throw error;

      // Analyze user activities
      const audit = {
        time_range: {
          start: startTime.toISOString(),
          end: endTime.toISOString()
        },
        total_activities: activities?.length || 0,
        unique_users: new Set(activities?.map(a => a.user_id) || []).size,
        activity_types: this.aggregateByField(activities || [], 'activity_type'),
        suspicious_activities: this.findSuspiciousActivities(activities || []),
        user_patterns: this.analyzeUserPatterns(activities || []),
        peak_activity_hours: this.findPeakActivityHours(activities || [])
      };

      // Create alerts for suspicious activities
      if (audit.suspicious_activities.length > 0) {
        await this.createAlert(
          userId,
          'suspicious_activity_detected',
          `${audit.suspicious_activities.length} suspicious activities detected`,
          'high',
          { suspicious_activities: audit.suspicious_activities }
        );
      }

      await this.logActivity(userId, 'user_activity_audit_completed', audit);
      return audit;

    } catch (error) {
      await this.createAlert(userId, 'user_activity_audit_failed', error.message, 'medium');
      throw error;
    }
  }

  async generateComplianceReport(userId: string, reportType: string, timeRange: string): Promise<any> {
    try {
      StructuredLogger.info('Generating compliance report', { userId, reportType, timeRange });

      const endTime = new Date();
      const startTime = new Date();
      
      switch (timeRange) {
        case 'monthly':
          startTime.setMonth(startTime.getMonth() - 1);
          break;
        case 'quarterly':
          startTime.setMonth(startTime.getMonth() - 3);
          break;
        case 'yearly':
          startTime.setFullYear(startTime.getFullYear() - 1);
          break;
        default:
          startTime.setMonth(startTime.getMonth() - 1);
      }

      let report = {};

      switch (reportType) {
        case 'data_access':
          report = await this.generateDataAccessReport(startTime, endTime);
          break;
        case 'security_events':
          report = await this.generateSecurityEventsReport(startTime, endTime);
          break;
        case 'system_changes':
          report = await this.generateSystemChangesReport(startTime, endTime);
          break;
        case 'user_management':
          report = await this.generateUserManagementReport(startTime, endTime);
          break;
        default:
          throw new Error(`Unknown report type: ${reportType}`);
      }

      const complianceReport = {
        report_type: reportType,
        time_range: {
          start: startTime.toISOString(),
          end: endTime.toISOString()
        },
        generated_at: new Date().toISOString(),
        generated_by: userId,
        ...report
      };

      await this.logActivity(userId, 'compliance_report_generated', { 
        report_type: reportType,
        time_range: timeRange
      });

      return complianceReport;

    } catch (error) {
      await this.createAlert(userId, 'compliance_report_failed', error.message, 'medium');
      throw error;
    }
  }

  private aggregateByField(logs: any[], field: string): any {
    const aggregation = {};
    for (const log of logs) {
      const value = log[field] || 'unknown';
      aggregation[value] = (aggregation[value] || 0) + 1;
    }
    return aggregation;
  }

  private analyzeErrorPatterns(logs: any[]): any {
    const errorLogs = logs.filter(log => log.log_level === 'error');
    const criticalLogs = logs.filter(log => log.log_level === 'error' && log.message?.includes('critical'));
    
    const errorMessages = errorLogs.map(log => log.message);
    const commonErrors = this.findMostCommon(errorMessages);

    return {
      total_errors: errorLogs.length,
      critical_errors: criticalLogs.length,
      common_error_messages: commonErrors,
      error_rate: logs.length > 0 ? (errorLogs.length / logs.length) * 100 : 0
    };
  }

  private analyzePerformanceMetrics(logs: any[]): any {
    const performanceLogs = logs.filter(log => log.duration_ms !== null);
    
    if (performanceLogs.length === 0) {
      return { average_duration: 0, slow_requests: 0 };
    }

    const durations = performanceLogs.map(log => log.duration_ms);
    const averageDuration = durations.reduce((a, b) => a + b, 0) / durations.length;
    const slowRequests = durations.filter(d => d > 5000).length;

    return {
      average_duration: Math.round(averageDuration),
      slow_requests: slowRequests,
      total_requests: performanceLogs.length,
      slow_request_rate: (slowRequests / performanceLogs.length) * 100
    };
  }

  private findSecurityEvents(logs: any[]): any[] {
    const securityKeywords = ['failed login', 'unauthorized', 'security', 'breach', 'attack', 'suspicious'];
    
    return logs.filter(log => {
      const message = (log.message || '').toLowerCase();
      return securityKeywords.some(keyword => message.includes(keyword));
    }).map(log => ({
      timestamp: log.created_at,
      service: log.service_name,
      message: log.message,
      user_id: log.user_id,
      severity: log.log_level
    }));
  }

  private analyzeTrends(logs: any[]): any {
    // Group logs by hour
    const hourlyTrends = {};
    for (const log of logs) {
      const hour = new Date(log.created_at).getHours();
      hourlyTrends[hour] = (hourlyTrends[hour] || 0) + 1;
    }

    return {
      hourly_distribution: hourlyTrends,
      peak_hour: Object.keys(hourlyTrends).reduce((a, b) => 
        hourlyTrends[a] > hourlyTrends[b] ? a : b, '0'
      )
    };
  }

  private findSuspiciousActivities(activities: any[]): any[] {
    const suspicious = [];

    // Group activities by user
    const userActivities = {};
    for (const activity of activities) {
      if (!userActivities[activity.user_id]) {
        userActivities[activity.user_id] = [];
      }
      userActivities[activity.user_id].push(activity);
    }

    // Look for suspicious patterns
    for (const [userId, userActivitiesList] of Object.entries(userActivities) as any) {
      // High frequency activities (more than 100 actions in time range)
      if (userActivitiesList.length > 100) {
        suspicious.push({
          user_id: userId,
          type: 'high_frequency_activity',
          count: userActivitiesList.length,
          activities: userActivitiesList.slice(0, 5) // Sample
        });
      }

      // Failed login attempts
      const failedLogins = userActivitiesList.filter(a => 
        a.activity_type === 'login_attempt' && 
        a.item_data?.success === false
      );

      if (failedLogins.length > 5) {
        suspicious.push({
          user_id: userId,
          type: 'multiple_failed_logins',
          count: failedLogins.length,
          activities: failedLogins
        });
      }
    }

    return suspicious;
  }

  private analyzeUserPatterns(activities: any[]): any {
    const patterns = {
      most_active_users: [],
      common_activities: this.aggregateByField(activities, 'activity_type'),
      activity_timeline: this.createActivityTimeline(activities)
    };

    // Find most active users
    const userCounts = {};
    for (const activity of activities) {
      userCounts[activity.user_id] = (userCounts[activity.user_id] || 0) + 1;
    }

    patterns.most_active_users = Object.entries(userCounts)
      .sort(([,a], [,b]) => (b as number) - (a as number))
      .slice(0, 10)
      .map(([userId, count]) => ({ user_id: userId, activity_count: count }));

    return patterns;
  }

  private findPeakActivityHours(activities: any[]): any {
    const hourlyActivity = {};
    for (const activity of activities) {
      const hour = new Date(activity.created_at).getHours();
      hourlyActivity[hour] = (hourlyActivity[hour] || 0) + 1;
    }

    return Object.entries(hourlyActivity)
      .sort(([,a], [,b]) => (b as number) - (a as number))
      .slice(0, 5)
      .map(([hour, count]) => ({ hour: parseInt(hour), activity_count: count }));
  }

  private createActivityTimeline(activities: any[]): any {
    // Group by day
    const dailyActivity = {};
    for (const activity of activities) {
      const day = new Date(activity.created_at).toISOString().split('T')[0];
      dailyActivity[day] = (dailyActivity[day] || 0) + 1;
    }

    return dailyActivity;
  }

  private findMostCommon(items: string[], limit = 5): any[] {
    const counts = {};
    for (const item of items) {
      counts[item] = (counts[item] || 0) + 1;
    }

    return Object.entries(counts)
      .sort(([,a], [,b]) => (b as number) - (a as number))
      .slice(0, limit)
      .map(([item, count]) => ({ message: item, count }));
  }

  private async generateDataAccessReport(startTime: Date, endTime: Date): Promise<any> {
    // Query booking access audit
    const { data: accessLogs } = await this.supabaseClient
      .from('booking_access_audit')
      .select('*')
      .gte('created_at', startTime.toISOString())
      .lte('created_at', endTime.toISOString());

    return {
      total_access_events: accessLogs?.length || 0,
      successful_access: accessLogs?.filter(log => log.success).length || 0,
      failed_access: accessLogs?.filter(log => !log.success).length || 0,
      access_methods: this.aggregateByField(accessLogs || [], 'access_method'),
      access_types: this.aggregateByField(accessLogs || [], 'access_type')
    };
  }

  private async generateSecurityEventsReport(startTime: Date, endTime: Date): Promise<any> {
    // Query critical alerts
    const { data: alerts } = await this.supabaseClient
      .from('critical_alerts')
      .select('*')
      .gte('created_at', startTime.toISOString())
      .lte('created_at', endTime.toISOString());

    const securityAlerts = alerts?.filter(alert => 
      alert.alert_type.includes('security') || 
      alert.alert_type.includes('unauthorized')
    ) || [];

    return {
      total_security_events: securityAlerts.length,
      alert_types: this.aggregateByField(securityAlerts, 'alert_type'),
      severity_distribution: this.aggregateByField(securityAlerts, 'severity'),
      resolved_alerts: securityAlerts.filter(alert => alert.resolved).length
    };
  }

  private async generateSystemChangesReport(startTime: Date, endTime: Date): Promise<any> {
    // Query migration logs
    const { data: migrations } = await this.supabaseClient
      .from('migration_logs')
      .select('*')
      .gte('created_at', startTime.toISOString())
      .lte('created_at', endTime.toISOString());

    return {
      total_migrations: migrations?.length || 0,
      successful_migrations: migrations?.filter(m => m.status === 'completed').length || 0,
      failed_migrations: migrations?.filter(m => m.status === 'failed').length || 0,
      migration_types: this.aggregateByField(migrations || [], 'migration_name')
    };
  }

  private async generateUserManagementReport(startTime: Date, endTime: Date): Promise<any> {
    // Query user activity logs for admin activities
    const { data: adminActivities } = await this.supabaseClient
      .from('user_activity_logs')
      .select('*')
      .gte('created_at', startTime.toISOString())
      .lte('created_at', endTime.toISOString())
      .in('activity_type', ['user_created', 'user_updated', 'user_deleted', 'role_changed']);

    return {
      total_user_management_activities: adminActivities?.length || 0,
      activity_breakdown: this.aggregateByField(adminActivities || [], 'activity_type'),
      admin_actions: this.aggregateByField(adminActivities || [], 'user_id')
    };
  }
}

export const logsAuditHandler: AgentHandler = async (
  userId: string,
  intent: string,
  params: any,
  supabaseClient: any,
  openaiClient: any,
  memory: any
) => {
  const agent = new LogsAuditAgent(supabaseClient);

  try {
    let result;

    switch (intent) {
      case 'analyze_system_logs':
        result = await agent.analyzeSystemLogs(userId, params.time_range, params.log_level);
        break;

      case 'audit_user_activity':
        result = await agent.auditUserActivity(userId, params.target_user_id, params.time_range);
        break;

      case 'generate_compliance_report':
        result = await agent.generateComplianceReport(userId, params.report_type, params.time_range);
        break;

      default:
        throw new Error(`Unknown intent: ${intent}`);
    }

    return {
      success: true,
      result,
      memory_updates: {
        last_audit: result,
        timestamp: new Date().toISOString()
      }
    };

  } catch (error) {
    StructuredLogger.error('Logs audit agent error', { error: error.message, userId, intent });
    return {
      success: false,
      error: error.message,
      memory_updates: {
        last_error: error.message,
        timestamp: new Date().toISOString()
      }
    };
  }
};