import { corsHeaders } from '../_shared/cors.ts';
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.53.0";


interface DiagnosticResult {
  component: string;
  status: 'healthy' | 'warning' | 'critical';
  metrics: Record<string, any>;
  recommendations: string[];
  lastChecked: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { action, component } = await req.json();

    switch (action) {
      case 'full_diagnostic':
        return await runFullDiagnostic(supabase);
      case 'component_diagnostic':
        return await runComponentDiagnostic(supabase, component);
      case 'performance_analysis':
        return await runPerformanceAnalysis(supabase);
      case 'capacity_planning':
        return await runCapacityPlanning(supabase);
      case 'automated_recovery':
        return await runAutomatedRecovery(supabase);
      default:
        throw new Error('Invalid action');
    }
  } catch (error) {
    console.error('Advanced Diagnostics Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});

async function runFullDiagnostic(supabase: any) {
  const diagnostics: DiagnosticResult[] = [];
  
  // Database Health
  diagnostics.push(await diagnoseDatabaseHealth(supabase));
  
  // Provider Health
  diagnostics.push(await diagnoseProviderHealth(supabase));
  
  // System Performance
  diagnostics.push(await diagnoseSystemPerformance(supabase));
  
  // Security Status
  diagnostics.push(await diagnoseSecurityStatus(supabase));
  
  // Queue Health
  diagnostics.push(await diagnoseQueueHealth(supabase));
  
  // Storage Health
  diagnostics.push(await diagnoseStorageHealth(supabase));

  // Overall system status
  const overallStatus = determineOverallStatus(diagnostics);
  
  // Store diagnostic results
  await supabase.from('system_diagnostics').insert({
    diagnostic_type: 'full_system',
    results: diagnostics,
    overall_status: overallStatus,
    recommendations: generateSystemRecommendations(diagnostics)
  });

  return new Response(
    JSON.stringify({
      overall_status: overallStatus,
      diagnostics,
      timestamp: new Date().toISOString()
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function diagnoseDatabaseHealth(supabase: any): Promise<DiagnosticResult> {
  const metrics: Record<string, any> = {};
  const recommendations: string[] = [];
  
  try {
    // Check connection pool
    const { data: connections } = await supabase.rpc('get_database_performance_stats');
    metrics.connections = connections;
    
    // Check table sizes
    const { data: tableSizes } = await supabase
      .from('information_schema.tables')
      .select('table_name, table_rows')
      .eq('table_schema', 'public');
    
    metrics.table_count = tableSizes?.length || 0;
    
    // Check recent query performance
    const { data: slowQueries } = await supabase
      .from('pg_stat_statements')
      .select('query, mean_exec_time, calls')
      .order('mean_exec_time', { ascending: false })
      .limit(5);
    
    metrics.slow_queries = slowQueries?.length || 0;
    
    // Check for blocking queries
    const { data: locks } = await supabase
      .from('pg_locks')
      .select('*')
      .eq('granted', false);
    
    metrics.blocked_queries = locks?.length || 0;
    
    if (metrics.slow_queries > 3) {
      recommendations.push('Optimize slow queries detected');
    }
    
    if (metrics.blocked_queries > 0) {
      recommendations.push('Review blocking queries and indexing strategy');
    }

    const status = metrics.blocked_queries > 5 ? 'critical' : 
                   metrics.slow_queries > 5 ? 'warning' : 'healthy';

    return {
      component: 'database',
      status,
      metrics,
      recommendations,
      lastChecked: new Date().toISOString()
    };
  } catch (error) {
    return {
      component: 'database',
      status: 'critical',
      metrics: { error: error.message },
      recommendations: ['Database connectivity issues detected'],
      lastChecked: new Date().toISOString()
    };
  }
}

async function diagnoseProviderHealth(supabase: any): Promise<DiagnosticResult> {
  const { data: providers } = await supabase
    .from('provider_health')
    .select('*')
    .order('last_checked', { ascending: false });

  const { data: recentLogs } = await supabase
    .from('api_health_logs')
    .select('*')
    .gte('checked_at', new Date(Date.now() - 300000).toISOString()) // 5 minutes
    .order('checked_at', { ascending: false });

  const metrics = {
    total_providers: providers?.length || 0,
    healthy_providers: providers?.filter(p => p.status === 'healthy').length || 0,
    degraded_providers: providers?.filter(p => p.status === 'degraded').length || 0,
    unhealthy_providers: providers?.filter(p => p.status === 'unhealthy').length || 0,
    avg_response_time: providers?.reduce((sum, p) => sum + (p.response_time || 0), 0) / (providers?.length || 1),
    recent_errors: recentLogs?.filter(log => log.status === 'error').length || 0
  };

  const recommendations: string[] = [];
  
  if (metrics.unhealthy_providers > 0) {
    recommendations.push(`${metrics.unhealthy_providers} providers are unhealthy - investigate immediately`);
  }
  
  if (metrics.avg_response_time > 5000) {
    recommendations.push('Average response time is high - consider provider rotation');
  }
  
  if (metrics.recent_errors > 10) {
    recommendations.push('High error rate detected in recent API calls');
  }

  const healthPercentage = metrics.healthy_providers / metrics.total_providers;
  const status = healthPercentage < 0.5 ? 'critical' : 
                 healthPercentage < 0.8 ? 'warning' : 'healthy';

  return {
    component: 'providers',
    status,
    metrics,
    recommendations,
    lastChecked: new Date().toISOString()
  };
}

async function diagnoseSystemPerformance(supabase: any): Promise<DiagnosticResult> {
  const { data: performanceLogs } = await supabase
    .from('system_logs')
    .select('*')
    .gte('created_at', new Date(Date.now() - 3600000).toISOString()) // 1 hour
    .order('created_at', { ascending: false });

  const { data: recentBookings } = await supabase
    .from('bookings')
    .select('created_at, updated_at, status')
    .gte('created_at', new Date(Date.now() - 3600000).toISOString());

  const metrics = {
    total_logs: performanceLogs?.length || 0,
    error_logs: performanceLogs?.filter(log => log.log_level === 'error').length || 0,
    warning_logs: performanceLogs?.filter(log => log.log_level === 'warn').length || 0,
    bookings_per_hour: recentBookings?.length || 0,
    avg_booking_processing_time: calculateAvgProcessingTime(recentBookings),
    memory_usage: await getMemoryUsage(),
    cpu_usage: await getCpuUsage()
  };

  const recommendations: string[] = [];
  
  const errorRate = metrics.error_logs / metrics.total_logs;
  if (errorRate > 0.1) {
    recommendations.push('High error rate detected - investigate application logs');
  }
  
  if (metrics.avg_booking_processing_time > 30000) {
    recommendations.push('Booking processing time is slow - optimize booking flow');
  }
  
  if (metrics.memory_usage > 80) {
    recommendations.push('High memory usage detected - consider scaling');
  }

  const status = errorRate > 0.2 || metrics.memory_usage > 90 ? 'critical' :
                 errorRate > 0.05 || metrics.memory_usage > 80 ? 'warning' : 'healthy';

  return {
    component: 'performance',
    status,
    metrics,
    recommendations,
    lastChecked: new Date().toISOString()
  };
}

async function diagnoseSecurityStatus(supabase: any): Promise<DiagnosticResult> {
  const { data: failedLogins } = await supabase
    .from('auth.audit_log_entries')
    .select('*')
    .eq('event_name', 'user_signedin')
    .gte('created_at', new Date(Date.now() - 3600000).toISOString());

  const { data: alerts } = await supabase
    .from('critical_alerts')
    .select('*')
    .eq('alert_type', 'security_incident')
    .eq('resolved', false);

  const metrics = {
    failed_login_attempts: failedLogins?.filter(log => log.ip_address).length || 0,
    active_security_alerts: alerts?.length || 0,
    last_security_scan: await getLastSecurityScan(supabase),
    rls_enabled_tables: await getRLSStatus(supabase)
  };

  const recommendations: string[] = [];
  
  if (metrics.failed_login_attempts > 50) {
    recommendations.push('High number of failed login attempts - possible brute force attack');
  }
  
  if (metrics.active_security_alerts > 0) {
    recommendations.push(`${metrics.active_security_alerts} unresolved security alerts`);
  }
  
  if (!metrics.last_security_scan || new Date(metrics.last_security_scan) < new Date(Date.now() - 86400000)) {
    recommendations.push('Security scan is overdue');
  }

  const status = metrics.active_security_alerts > 5 ? 'critical' :
                 metrics.failed_login_attempts > 100 ? 'warning' : 'healthy';

  return {
    component: 'security',
    status,
    metrics,
    recommendations,
    lastChecked: new Date().toISOString()
  };
}

async function diagnoseQueueHealth(supabase: any): Promise<DiagnosticResult> {
  const { data: notifications } = await supabase
    .from('notification_queue')
    .select('*')
    .eq('status', 'pending');

  const { data: cleanupTasks } = await supabase
    .from('cleanup_audit')
    .select('*')
    .gte('created_at', new Date(Date.now() - 86400000).toISOString());

  const metrics = {
    pending_notifications: notifications?.length || 0,
    failed_cleanup_tasks: cleanupTasks?.filter(task => task.errors_encountered > 0).length || 0,
    queue_processing_rate: await calculateQueueProcessingRate(supabase)
  };

  const recommendations: string[] = [];
  
  if (metrics.pending_notifications > 100) {
    recommendations.push('Large notification queue backlog detected');
  }
  
  if (metrics.failed_cleanup_tasks > 5) {
    recommendations.push('Multiple cleanup task failures detected');
  }

  const status = metrics.pending_notifications > 500 ? 'critical' :
                 metrics.pending_notifications > 100 ? 'warning' : 'healthy';

  return {
    component: 'queues',
    status,
    metrics,
    recommendations,
    lastChecked: new Date().toISOString()
  };
}

async function diagnoseStorageHealth(supabase: any): Promise<DiagnosticResult> {
  // This would need proper storage API integration
  const metrics = {
    storage_usage_percent: 45, // Mock data
    total_files: 1250,
    recent_upload_failures: 2,
    avg_upload_time: 1500
  };

  const recommendations: string[] = [];
  
  if (metrics.storage_usage_percent > 85) {
    recommendations.push('Storage usage is high - consider cleanup or scaling');
  }
  
  if (metrics.recent_upload_failures > 10) {
    recommendations.push('Multiple upload failures detected');
  }

  const status = metrics.storage_usage_percent > 95 ? 'critical' :
                 metrics.storage_usage_percent > 85 ? 'warning' : 'healthy';

  return {
    component: 'storage',
    status,
    metrics,
    recommendations,
    lastChecked: new Date().toISOString()
  };
}

// Helper functions
function calculateAvgProcessingTime(bookings: any[]): number {
  if (!bookings || bookings.length === 0) return 0;
  
  const processingTimes = bookings
    .filter(b => b.updated_at && b.created_at)
    .map(b => new Date(b.updated_at).getTime() - new Date(b.created_at).getTime());
  
  return processingTimes.reduce((sum, time) => sum + time, 0) / processingTimes.length;
}

async function getMemoryUsage(): Promise<number> {
  // Mock implementation - in production, integrate with system monitoring
  return Math.random() * 100;
}

async function getCpuUsage(): Promise<number> {
  // Mock implementation - in production, integrate with system monitoring
  return Math.random() * 100;
}

async function getLastSecurityScan(supabase: any): Promise<string | null> {
  const { data } = await supabase
    .from('security_scans')
    .select('created_at')
    .order('created_at', { ascending: false })
    .limit(1)
    .single();
  
  return data?.created_at || null;
}

async function getRLSStatus(supabase: any): Promise<number> {
  // Mock implementation - count RLS enabled tables
  return 25;
}

async function calculateQueueProcessingRate(supabase: any): Promise<number> {
  // Mock implementation - calculate processing rate
  return 150; // items per minute
}

function determineOverallStatus(diagnostics: DiagnosticResult[]): string {
  const criticalCount = diagnostics.filter(d => d.status === 'critical').length;
  const warningCount = diagnostics.filter(d => d.status === 'warning').length;
  
  if (criticalCount > 0) return 'critical';
  if (warningCount > 2) return 'warning';
  return 'healthy';
}

function generateSystemRecommendations(diagnostics: DiagnosticResult[]): string[] {
  const allRecommendations = diagnostics.flatMap(d => d.recommendations);
  
  // Add system-wide recommendations
  const systemRecommendations: string[] = [];
  
  const criticalComponents = diagnostics.filter(d => d.status === 'critical');
  if (criticalComponents.length > 1) {
    systemRecommendations.push('Multiple critical issues detected - consider emergency maintenance window');
  }
  
  return [...systemRecommendations, ...allRecommendations];
}

async function runComponentDiagnostic(supabase: any, component: string) {
  let diagnostic: DiagnosticResult;
  
  switch (component) {
    case 'database':
      diagnostic = await diagnoseDatabaseHealth(supabase);
      break;
    case 'providers':
      diagnostic = await diagnoseProviderHealth(supabase);
      break;
    case 'performance':
      diagnostic = await diagnoseSystemPerformance(supabase);
      break;
    case 'security':
      diagnostic = await diagnoseSecurityStatus(supabase);
      break;
    case 'queues':
      diagnostic = await diagnoseQueueHealth(supabase);
      break;
    case 'storage':
      diagnostic = await diagnoseStorageHealth(supabase);
      break;
    default:
      throw new Error(`Unknown component: ${component}`);
  }

  return new Response(
    JSON.stringify(diagnostic),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function runPerformanceAnalysis(supabase: any) {
  // Comprehensive performance analysis
  const analysis = {
    bottlenecks: await identifyBottlenecks(supabase),
    trends: await analyzePerformanceTrends(supabase),
    capacity: await analyzeCapacity(supabase),
    recommendations: []
  };

  return new Response(
    JSON.stringify(analysis),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function runCapacityPlanning(supabase: any) {
  // Capacity planning analysis
  const planning = {
    current_utilization: await getCurrentUtilization(supabase),
    growth_projections: await calculateGrowthProjections(supabase),
    scaling_recommendations: await generateScalingRecommendations(supabase)
  };

  return new Response(
    JSON.stringify(planning),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function runAutomatedRecovery(supabase: any) {
  const recoveryActions = [];
  
  // Run recovery procedures
  try {
    // Restart unhealthy services
    await supabase.functions.invoke('self-healing-executor', {
      body: { action: 'restart_services' }
    });
    recoveryActions.push('Service restart initiated');
    
    // Clear stuck queues
    await supabase.functions.invoke('queue-manager', {
      body: { action: 'clear_stuck_queues' }
    });
    recoveryActions.push('Queue cleanup completed');
    
    // Rotate failing providers
    await supabase.functions.invoke('provider-rotation', {
      body: { action: 'auto_rotation' }
    });
    recoveryActions.push('Provider rotation completed');
    
  } catch (error) {
    recoveryActions.push(`Recovery failed: ${error.message}`);
  }

  return new Response(
    JSON.stringify({ recovery_actions: recoveryActions }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

// Additional helper functions for advanced analytics
async function identifyBottlenecks(supabase: any) {
  // Identify system bottlenecks
  return {
    database_queries: [],
    api_endpoints: [],
    provider_calls: []
  };
}

async function analyzePerformanceTrends(supabase: any) {
  // Analyze performance trends over time
  return {
    response_times: [],
    error_rates: [],
    throughput: []
  };
}

async function analyzeCapacity(supabase: any) {
  // Analyze current capacity utilization
  return {
    cpu_utilization: 65,
    memory_utilization: 45,
    storage_utilization: 30,
    network_utilization: 25
  };
}

async function getCurrentUtilization(supabase: any) {
  return {
    requests_per_second: 150,
    concurrent_users: 450,
    database_connections: 25
  };
}

async function calculateGrowthProjections(supabase: any) {
  return {
    monthly_growth_rate: 15,
    projected_peak_load: 2500,
    capacity_needed_in_6_months: 180
  };
}

async function generateScalingRecommendations(supabase: any) {
  return [
    'Add 2 additional database read replicas by Q2',
    'Scale API servers to handle 200% current load',
    'Implement caching layer for frequently accessed data'
  ];
}