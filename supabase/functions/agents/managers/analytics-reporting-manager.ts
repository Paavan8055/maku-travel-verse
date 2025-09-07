import { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.53.0';
import { BaseManagerAgent, ManagerCapability, ManagerHierarchy } from '../_shared/base-manager-agent.ts';
import { OpenAIServiceWrapper } from '../_shared/openai-service-wrapper.ts';
import { UserAnalyticsUtils } from '../_shared/user-analytics-utils.ts';

// Analytics & Reporting Manager capabilities
const capabilities: ManagerCapability[] = [
  {
    name: 'data_aggregation',
    description: 'Aggregate and analyze booking, user, and performance data',
    requiredParams: ['report_type', 'date_range'],
    delegateAgents: ['data-analyst', 'performance-tracker', 'business-intelligence']
  },
  {
    name: 'performance_reporting',
    description: 'Generate performance reports for agents, revenue, and operations',
    requiredParams: ['metrics_type', 'time_period'],
    delegateAgents: ['agent-performance-tracker', 'revenue-analyzer', 'operational-reporter']
  },
  {
    name: 'predictive_analytics',
    description: 'Forecast trends, demand patterns, and revenue projections',
    requiredParams: ['forecast_type', 'prediction_horizon'],
    delegateAgents: ['demand-forecaster', 'trend-analyzer', 'revenue-predictor']
  }
];

// Hierarchy definition (Tier 2 - Operational)
const hierarchy: ManagerHierarchy = {
  tier: 2,
  reportsTo: 'operations-management-manager',
  supervises: ['data-analyst', 'performance-tracker', 'business-intelligence', 'demand-forecaster']
};

export const handler = async (
  userId: string,
  intent: string,
  params: any,
  supabaseClient: SupabaseClient,
  openAiClient: string,
  memory: any
) => {
  const manager = new BaseManagerAgent(supabaseClient, 'analytics-reporting-manager', capabilities, hierarchy);
  const openai = new OpenAIServiceWrapper(openAiClient);
  const analytics = new UserAnalyticsUtils(supabaseClient);

  try {
    switch (intent) {
      case 'generate_performance_report':
        const performanceData = await manager.coordinateMultiAgentTask(
          userId,
          ['agent-performance-tracker', 'revenue-analyzer'],
          'collect_metrics',
          params,
          openAiClient,
          memory
        );

        const reportAnalysis = await openai.generateReport(
          'performance',
          performanceData,
          'management',
          'executive'
        );

        await manager.logActivity(userId, 'performance_report_generated', {
          report_type: params.report_type,
          time_period: params.time_period,
          metrics_count: Object.keys(performanceData).length
        });

        return {
          success: true,
          performance_report: reportAnalysis.content,
          raw_data: performanceData,
          manager_id: 'analytics-reporting-manager'
        };

      case 'forecast_demand':
        const forecastPrompt = `
          As an Analytics & Reporting Manager, analyze historical data and forecast demand:
          Forecast Type: ${params.forecast_type}
          Time Horizon: ${params.prediction_horizon}
          Historical Data: ${JSON.stringify(params.historical_data)}
          
          Provide:
          1. Demand trend analysis
          2. Seasonal pattern identification
          3. Revenue projections
          4. Capacity recommendations
          5. Risk factors and mitigation strategies
        `;

        const forecast = await openai.analyze(
          'demand_forecasting',
          params.historical_data,
          'predictive',
          forecastPrompt
        );

        return {
          success: true,
          demand_forecast: forecast.content,
          manager_id: 'analytics-reporting-manager'
        };

      case 'user_segmentation_analysis':
        const userMetrics = await analytics.getAggregatedUserMetrics(params.user_ids || []);
        
        const segmentationReport = await openai.generateReport(
          'user_segmentation',
          userMetrics,
          'marketing',
          'detailed'
        );

        return {
          success: true,
          segmentation_analysis: segmentationReport.content,
          user_metrics: userMetrics,
          manager_id: 'analytics-reporting-manager'
        };

      case 'revenue_trend_analysis':
        return await manager.coordinateMultiAgentTask(
          userId,
          ['revenue-analyzer', 'trend-analyzer'],
          'analyze_revenue_trends',
          params,
          openAiClient,
          memory
        );

      default:
        const defaultResponse = await openai.chat({
          prompt: `As an Analytics & Reporting Manager, handle this request: ${intent}`,
          context: params,
          model: 'gpt-5-2025-08-07'
        });

        return {
          success: true,
          response: defaultResponse.content,
          manager_id: 'analytics-reporting-manager'
        };
    }
  } catch (error) {
    await manager.escalateToSupervisor(
      userId,
      `Analytics reporting error: ${error.message}`,
      { intent, params, error: error.message },
      'medium'
    );

    return {
      success: false,
      error: error.message,
      manager_id: 'analytics-reporting-manager'
    };
  }
};