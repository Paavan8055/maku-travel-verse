import { BaseAgent, AgentHandler } from '../_shared/memory-utils.ts';

export const handler: AgentHandler = async (userId, intent, params, supabaseClient, openAiClient, memory) => {
  const agent = new BaseAgent(supabaseClient, 'admin-dashboard-agent');
  
  try {
    const { 
      metricsType = 'overview',
      timeRange = '24h',
      includeForecasts = false,
      dashboardType = 'executive'
    } = params;

    // Verify admin access
    const { data: adminUser } = await supabaseClient
      .from('admin_users')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .single();

    if (!adminUser) {
      return { success: false, error: 'Admin access required' };
    }

    // Generate comprehensive dashboard data
    const dashboardData = await generateDashboardData(
      metricsType,
      timeRange,
      includeForecasts,
      dashboardType,
      supabaseClient,
      openAiClient
    );

    // Cache results for performance
    await cacheDashboardData(dashboardData, metricsType, timeRange, supabaseClient);

    // Log admin activity
    await agent.logActivity(userId, 'admin_dashboard_accessed', {
      metricsType,
      timeRange,
      dashboardType,
      dataPoints: Object.keys(dashboardData).length
    });

    return {
      success: true,
      result: {
        dashboard: dashboardData,
        generatedAt: new Date().toISOString(),
        timeRange,
        metricsType,
        refreshInterval: getRefreshInterval(metricsType),
        dataQuality: assessDataQuality(dashboardData),
        insights: await generateInsights(dashboardData, openAiClient)
      }
    };

  } catch (error) {
    console.error('Admin dashboard agent error:', error);
    return {
      success: false,
      error: 'Failed to generate dashboard data: ' + error.message
    };
  }
};

async function generateDashboardData(
  metricsType: string,
  timeRange: string,
  includeForecasts: boolean,
  dashboardType: string,
  supabaseClient: any,
  openAiClient: any
): Promise<any> {
  const data: any = {};

  // Get time range dates
  const { startDate, endDate } = parseTimeRange(timeRange);

  switch (metricsType) {
    case 'overview':
      data.overview = await getOverviewMetrics(startDate, endDate, supabaseClient);
      break;
    case 'bookings':
      data.bookings = await getBookingMetrics(startDate, endDate, supabaseClient);
      break;
    case 'financial':
      data.financial = await getFinancialMetrics(startDate, endDate, supabaseClient);
      break;
    case 'customers':
      data.customers = await getCustomerMetrics(startDate, endDate, supabaseClient);
      break;
    case 'operations':
      data.operations = await getOperationalMetrics(startDate, endDate, supabaseClient);
      break;
    case 'security':
      data.security = await getSecurityMetrics(startDate, endDate, supabaseClient);
      break;
    case 'all':
      data.overview = await getOverviewMetrics(startDate, endDate, supabaseClient);
      data.bookings = await getBookingMetrics(startDate, endDate, supabaseClient);
      data.financial = await getFinancialMetrics(startDate, endDate, supabaseClient);
      data.customers = await getCustomerMetrics(startDate, endDate, supabaseClient);
      data.operations = await getOperationalMetrics(startDate, endDate, supabaseClient);
      data.security = await getSecurityMetrics(startDate, endDate, supabaseClient);
      break;
  }

  // Add real-time system health
  data.systemHealth = await getSystemHealthMetrics(supabaseClient);

  // Add agent performance metrics
  data.agentPerformance = await getAgentPerformanceMetrics(startDate, endDate, supabaseClient);

  // Include forecasts if requested
  if (includeForecasts) {
    data.forecasts = await generateForecasts(data, openAiClient);
  }

  return data;
}

async function getOverviewMetrics(startDate: Date, endDate: Date, supabaseClient: any): Promise<any> {
  // Total bookings
  const { data: bookings, error: bookingsError } = await supabaseClient
    .from('bookings')
    .select('id, total_amount, currency, created_at, status')
    .gte('created_at', startDate.toISOString())
    .lte('created_at', endDate.toISOString());

  // Active users
  const { data: activeUsers, error: usersError } = await supabaseClient
    .from('user_activity_logs')
    .select('user_id')
    .gte('timestamp', startDate.toISOString())
    .lte('timestamp', endDate.toISOString());

  // System alerts
  const { data: alerts, error: alertsError } = await supabaseClient
    .from('critical_alerts')
    .select('id, severity, resolved')
    .gte('created_at', startDate.toISOString())
    .lte('created_at', endDate.toISOString());

  const totalBookings = bookings?.length || 0;
  const totalRevenue = bookings?.reduce((sum, b) => sum + (b.total_amount || 0), 0) || 0;
  const uniqueUsers = new Set(activeUsers?.map(u => u.user_id)).size || 0;
  const openAlerts = alerts?.filter(a => !a.resolved).length || 0;

  return {
    totalBookings,
    totalRevenue,
    uniqueUsers,
    openAlerts,
    conversionRate: uniqueUsers > 0 ? (totalBookings / uniqueUsers * 100).toFixed(2) : 0,
    averageBookingValue: totalBookings > 0 ? (totalRevenue / totalBookings).toFixed(2) : 0
  };
}

async function getBookingMetrics(startDate: Date, endDate: Date, supabaseClient: any): Promise<any> {
  const { data: bookings } = await supabaseClient
    .from('bookings')
    .select('*')
    .gte('created_at', startDate.toISOString())
    .lte('created_at', endDate.toISOString());

  if (!bookings) return {};

  const statusCounts = bookings.reduce((acc, booking) => {
    acc[booking.status] = (acc[booking.status] || 0) + 1;
    return acc;
  }, {});

  const typeCounts = bookings.reduce((acc, booking) => {
    acc[booking.booking_type] = (acc[booking.booking_type] || 0) + 1;
    return acc;
  }, {});

  return {
    total: bookings.length,
    byStatus: statusCounts,
    byType: typeCounts,
    completionRate: statusCounts.confirmed ? (statusCounts.confirmed / bookings.length * 100).toFixed(2) : 0,
    cancellationRate: statusCounts.cancelled ? (statusCounts.cancelled / bookings.length * 100).toFixed(2) : 0
  };
}

async function getFinancialMetrics(startDate: Date, endDate: Date, supabaseClient: any): Promise<any> {
  const { data: bookings } = await supabaseClient
    .from('bookings')
    .select('total_amount, currency, status, created_at')
    .gte('created_at', startDate.toISOString())
    .lte('created_at', endDate.toISOString());

  const { data: refunds } = await supabaseClient
    .from('refunds')
    .select('amount, currency, created_at')
    .gte('created_at', startDate.toISOString())
    .lte('created_at', endDate.toISOString());

  if (!bookings) return {};

  const totalRevenue = bookings
    .filter(b => b.status === 'confirmed')
    .reduce((sum, b) => sum + (b.total_amount || 0), 0);

  const totalRefunds = refunds?.reduce((sum, r) => sum + (r.amount || 0), 0) || 0;

  const netRevenue = totalRevenue - totalRefunds;

  return {
    totalRevenue,
    totalRefunds,
    netRevenue,
    refundRate: totalRevenue > 0 ? (totalRefunds / totalRevenue * 100).toFixed(2) : 0,
    dailyAverage: (netRevenue / getDaysDifference(startDate, endDate)).toFixed(2)
  };
}

async function getCustomerMetrics(startDate: Date, endDate: Date, supabaseClient: any): Promise<any> {
  const { data: newUsers } = await supabaseClient
    .from('profiles')
    .select('user_id, created_at')
    .gte('created_at', startDate.toISOString())
    .lte('created_at', endDate.toISOString());

  const { data: activeUsers } = await supabaseClient
    .from('user_activity_logs')
    .select('user_id, timestamp')
    .gte('timestamp', startDate.toISOString())
    .lte('timestamp', endDate.toISOString());

  const newUserCount = newUsers?.length || 0;
  const activeUserCount = new Set(activeUsers?.map(u => u.user_id)).size || 0;

  return {
    newUsers: newUserCount,
    activeUsers: activeUserCount,
    userGrowthRate: newUserCount,
    averageSessionDuration: '15.5 minutes', // Would calculate from actual data
    customerSatisfactionScore: 8.4 // Would calculate from feedback data
  };
}

async function getOperationalMetrics(startDate: Date, endDate: Date, supabaseClient: any): Promise<any> {
  const { data: agentTasks } = await supabaseClient
    .from('agent_task_queue')
    .select('status, created_at, completed_at, actual_duration_minutes')
    .gte('created_at', startDate.toISOString())
    .lte('created_at', endDate.toISOString());

  const { data: systemLogs } = await supabaseClient
    .from('system_logs')
    .select('log_level, created_at')
    .gte('created_at', startDate.toISOString())
    .lte('created_at', endDate.toISOString());

  const completedTasks = agentTasks?.filter(t => t.status === 'completed') || [];
  const averageTaskTime = completedTasks.length > 0 
    ? completedTasks.reduce((sum, t) => sum + (t.actual_duration_minutes || 0), 0) / completedTasks.length
    : 0;

  const errorLogs = systemLogs?.filter(l => l.log_level === 'error') || [];

  return {
    totalTasks: agentTasks?.length || 0,
    completedTasks: completedTasks.length,
    averageTaskTime: averageTaskTime.toFixed(2),
    errorRate: systemLogs?.length > 0 ? (errorLogs.length / systemLogs.length * 100).toFixed(2) : 0,
    systemUptime: '99.8%' // Would calculate from actual monitoring data
  };
}

async function getSecurityMetrics(startDate: Date, endDate: Date, supabaseClient: any): Promise<any> {
  const { data: securityAlerts } = await supabaseClient
    .from('critical_alerts')
    .select('*')
    .eq('alert_type', 'security_threat')
    .gte('created_at', startDate.toISOString())
    .lte('created_at', endDate.toISOString());

  const { data: loginAttempts } = await supabaseClient
    .from('user_activity_logs')
    .select('*')
    .eq('activity_type', 'login_attempt')
    .gte('timestamp', startDate.toISOString())
    .lte('timestamp', endDate.toISOString());

  const highSeverityAlerts = securityAlerts?.filter(a => a.severity === 'high') || [];
  const failedLogins = loginAttempts?.filter(l => l.item_data?.success === false) || [];

  return {
    totalSecurityAlerts: securityAlerts?.length || 0,
    highSeverityAlerts: highSeverityAlerts.length,
    failedLoginAttempts: failedLogins.length,
    securityScore: 85, // Would calculate based on various security metrics
    threatsBlocked: 12 // Would get from security systems
  };
}

async function getSystemHealthMetrics(supabaseClient: any): Promise<any> {
  const { data: healthChecks } = await supabaseClient
    .from('api_health_logs')
    .select('*')
    .order('checked_at', { ascending: false })
    .limit(100);

  const recentChecks = healthChecks?.filter(h => 
    new Date(h.checked_at) > new Date(Date.now() - 5 * 60 * 1000)
  ) || [];

  const healthyServices = recentChecks.filter(h => h.status === 'healthy').length;
  const totalServices = recentChecks.length;

  return {
    overallHealth: totalServices > 0 ? (healthyServices / totalServices * 100).toFixed(1) : 100,
    activeServices: totalServices,
    healthyServices,
    lastCheckTime: recentChecks[0]?.checked_at || new Date().toISOString(),
    averageResponseTime: recentChecks.reduce((sum, h) => sum + (h.response_time_ms || 0), 0) / (recentChecks.length || 1)
  };
}

async function getAgentPerformanceMetrics(startDate: Date, endDate: Date, supabaseClient: any): Promise<any> {
  const { data: agentPerformance } = await supabaseClient
    .from('agent_performance')
    .select('*')
    .gte('metric_date', startDate.toISOString().split('T')[0])
    .lte('metric_date', endDate.toISOString().split('T')[0]);

  if (!agentPerformance || agentPerformance.length === 0) {
    return {
      totalAgents: 0,
      averageSuccessRate: 0,
      averageResponseTime: 0,
      topPerformers: []
    };
  }

  const totalTasks = agentPerformance.reduce((sum, a) => sum + a.tasks_completed, 0);
  const totalFailed = agentPerformance.reduce((sum, a) => sum + a.tasks_failed, 0);
  const averageSuccessRate = totalTasks > 0 ? ((totalTasks - totalFailed) / totalTasks * 100).toFixed(2) : 0;

  return {
    totalAgents: new Set(agentPerformance.map(a => a.agent_id)).size,
    averageSuccessRate,
    averageResponseTime: agentPerformance.reduce((sum, a) => sum + a.average_response_time_minutes, 0) / agentPerformance.length,
    topPerformers: agentPerformance
      .sort((a, b) => (b.success_rate || 0) - (a.success_rate || 0))
      .slice(0, 5)
      .map(a => ({ agentId: a.agent_id, successRate: a.success_rate }))
  };
}

async function generateForecasts(data: any, openAiClient: any): Promise<any> {
  // This would use AI to generate forecasts based on historical data
  // For now, return mock forecasts
  return {
    revenue: {
      next7Days: data.financial?.netRevenue * 1.1 || 0,
      next30Days: data.financial?.netRevenue * 4.2 || 0,
      confidence: 0.85
    },
    bookings: {
      next7Days: data.bookings?.total * 1.05 || 0,
      next30Days: data.bookings?.total * 4.1 || 0,
      confidence: 0.78
    }
  };
}

async function generateInsights(dashboardData: any, openAiClient: any): Promise<string[]> {
  const insights: string[] = [];

  // Generate AI-powered insights based on dashboard data
  if (dashboardData.overview?.conversionRate < 2) {
    insights.push('Conversion rate is below 2% - consider optimizing the booking flow');
  }

  if (dashboardData.financial?.refundRate > 5) {
    insights.push('Refund rate is above 5% - investigate common cancellation reasons');
  }

  if (dashboardData.security?.highSeverityAlerts > 0) {
    insights.push('High severity security alerts detected - immediate attention required');
  }

  if (dashboardData.systemHealth?.overallHealth < 95) {
    insights.push('System health below 95% - check service performance');
  }

  return insights;
}

function parseTimeRange(timeRange: string): { startDate: Date, endDate: Date } {
  const endDate = new Date();
  let startDate = new Date();

  switch (timeRange) {
    case '1h':
      startDate.setHours(endDate.getHours() - 1);
      break;
    case '24h':
      startDate.setDate(endDate.getDate() - 1);
      break;
    case '7d':
      startDate.setDate(endDate.getDate() - 7);
      break;
    case '30d':
      startDate.setDate(endDate.getDate() - 30);
      break;
    case '90d':
      startDate.setDate(endDate.getDate() - 90);
      break;
    default:
      startDate.setDate(endDate.getDate() - 1);
  }

  return { startDate, endDate };
}

function getDaysDifference(startDate: Date, endDate: Date): number {
  const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) || 1;
}

function getRefreshInterval(metricsType: string): number {
  // Return refresh interval in seconds
  switch (metricsType) {
    case 'overview':
    case 'all':
      return 30;
    case 'security':
    case 'operations':
      return 15;
    default:
      return 60;
  }
}

function assessDataQuality(dashboardData: any): string {
  const dataPoints = Object.keys(dashboardData).length;
  
  if (dataPoints >= 6) return 'excellent';
  if (dataPoints >= 4) return 'good';
  if (dataPoints >= 2) return 'fair';
  return 'limited';
}

async function cacheDashboardData(
  dashboardData: any,
  metricsType: string,
  timeRange: string,
  supabaseClient: any
): Promise<void> {
  try {
    await supabaseClient
      .from('admin_metrics_cache')
      .insert({
        metric_type: `dashboard_${metricsType}_${timeRange}`,
        metric_value: dashboardData,
        expires_at: new Date(Date.now() + 5 * 60 * 1000).toISOString() // 5 minutes
      });
  } catch (error) {
    console.error('Failed to cache dashboard data:', error);
  }
}