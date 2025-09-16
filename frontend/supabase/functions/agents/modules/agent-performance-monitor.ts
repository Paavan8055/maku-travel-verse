import { BaseAgent, AgentHandler } from '../_shared/memory-utils.ts';

export const handler: AgentHandler = async (userId, intent, params, supabaseClient, openAiClient, memory) => {
  const agent = new BaseAgent(supabaseClient, 'agent-performance-monitor');
  
  try {
    const { 
      agentIds = [],
      monitoringPeriod = '24h',
      performanceMetrics = ['response_time', 'success_rate', 'user_satisfaction'],
      alertThresholds = {},
      detailedAnalysis = true,
      optimizationRecommendations = true
    } = params;

    const userPrefs = await agent.getUserPreferences(userId);
    const monitoringHistory = await memory?.getMemory('agent-performance-monitor', userId, 'monitoring_data') || [];

    // Get agent performance data from database
    const { data: performanceData } = await supabaseClient
      .from('agent_performance_metrics')
      .select('*')
      .in('agent_id', agentIds.length > 0 ? agentIds : ['all'])
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
      .order('created_at', { ascending: false });

    const systemPrompt = `You are an agent performance monitoring system for MAKU Travel's AI infrastructure.
    
    MONITORING REQUEST:
    - Agent IDs to monitor: ${JSON.stringify(agentIds)}
    - Monitoring period: ${monitoringPeriod}
    - Performance metrics: ${JSON.stringify(performanceMetrics)}
    - Alert thresholds: ${JSON.stringify(alertThresholds)}
    - Detailed analysis: ${detailedAnalysis}
    - Optimization recommendations: ${optimizationRecommendations}
    
    CURRENT PERFORMANCE DATA:
    - Active agents monitored: ${performanceData?.length || 0}
    - Performance records: ${JSON.stringify(performanceData?.slice(0, 10) || [])}
    
    USER PROFILE:
    - Preferences: ${JSON.stringify(userPrefs)}
    - Monitoring history: ${JSON.stringify(monitoringHistory.slice(-5))}
    
    Provide comprehensive agent performance monitoring including:
    1. Real-time performance metrics analysis
    2. Response time and throughput monitoring
    3. Success rate and error analysis
    4. User satisfaction scoring trends
    5. Resource utilization monitoring
    6. Cost efficiency analysis
    7. Performance degradation detection
    8. Anomaly identification and alerting
    9. Comparative performance analysis
    10. Load balancing recommendations
    11. Scaling optimization suggestions
    12. Performance trend forecasting
    13. SLA compliance monitoring
    14. Capacity planning insights
    
    Format as comprehensive monitoring report with actionable insights.`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-5-2025-08-07',
        max_completion_tokens: 2000,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Monitor and analyze performance for agents: ${JSON.stringify(agentIds)}` }
        ]
      })
    });

    const data = await response.json();
    const monitoringReport = data.choices[0].message.content;

    await agent.logActivity(userId, 'performance_monitoring', {
      agentsMonitored: agentIds.length,
      monitoringPeriod,
      metricsAnalyzed: performanceMetrics.length,
      recordsProcessed: performanceData?.length || 0
    });

    // Update monitoring history
    const newMonitoringEntry = {
      agentIds,
      monitoringPeriod,
      performanceMetrics,
      recordsAnalyzed: performanceData?.length || 0,
      monitoringDate: new Date().toISOString(),
      alertsGenerated: 0 // Would be calculated based on thresholds
    };
    
    const updatedHistory = [...monitoringHistory, newMonitoringEntry].slice(-30);
    await memory?.setMemory('agent-performance-monitor', userId, 'monitoring_data', updatedHistory);

    return {
      success: true,
      monitoringReport,
      agentsMonitored: agentIds.length,
      performanceRecords: performanceData?.length || 0,
      alertsGenerated: 0,
      optimizationOpportunities: optimizationRecommendations ? 'identified' : 'not_requested',
      memoryUpdates: {
        monitoring_data: updatedHistory
      }
    };
  } catch (error) {
    console.error('Error in agent-performance-monitor:', error);
    return {
      success: false,
      error: 'Failed to monitor agent performance'
    };
  }
};