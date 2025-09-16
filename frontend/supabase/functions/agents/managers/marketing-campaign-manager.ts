import { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.53.0';
import { BaseManagerAgent, ManagerCapability, ManagerHierarchy } from '../_shared/base-manager-agent.ts';
import { OpenAIServiceWrapper } from '../_shared/openai-service-wrapper.ts';
import { UserAnalyticsUtils } from '../_shared/user-analytics-utils.ts';

// Marketing Campaign Manager capabilities
const capabilities: ManagerCapability[] = [
  {
    name: 'campaign_orchestration',
    description: 'Orchestrate multi-channel marketing campaigns across email, social, and ads',
    requiredParams: ['campaign_type', 'target_audience'],
    delegateAgents: ['email-marketer', 'social-media-manager', 'ad-campaign-optimizer']
  },
  {
    name: 'audience_targeting',
    description: 'Analyze and segment audiences for personalized marketing',
    requiredParams: ['segmentation_criteria', 'campaign_goals'],
    delegateAgents: ['audience-segmenter', 'persona-analyzer', 'targeting-optimizer']
  },
  {
    name: 'campaign_optimization',
    description: 'Monitor, analyze, and optimize campaign performance in real-time',
    requiredParams: ['campaign_id', 'metrics_to_optimize'],
    delegateAgents: ['campaign-analyzer', 'conversion-optimizer', 'roi-tracker']
  }
];

// Hierarchy definition (Tier 2 - Operational)
const hierarchy: ManagerHierarchy = {
  tier: 2,
  reportsTo: 'content-management-manager',
  supervises: ['email-marketer', 'social-media-manager', 'ad-campaign-optimizer', 'audience-segmenter']
};

export const handler = async (
  userId: string,
  intent: string,
  params: any,
  supabaseClient: SupabaseClient,
  openAiClient: string,
  memory: any
) => {
  const manager = new BaseManagerAgent(supabaseClient, 'marketing-campaign-manager', capabilities, hierarchy);
  const openai = new OpenAIServiceWrapper(openAiClient);
  const analytics = new UserAnalyticsUtils(supabaseClient);

  try {
    switch (intent) {
      case 'launch_campaign':
        const campaignResult = await manager.coordinateMultiAgentTask(
          userId,
          ['email-marketer', 'social-media-manager', 'ad-campaign-optimizer'],
          'execute_campaign',
          params,
          openAiClient,
          memory
        );

        const campaignAnalysis = await openai.generateReport(
          'campaign_launch',
          params,
          'marketing',
          'executive'
        );

        await manager.logActivity(userId, 'campaign_launched', {
          campaign_type: params.campaign_type,
          target_audience: params.target_audience,
          channels: params.channels || ['email', 'social', 'ads']
        });

        return {
          success: true,
          campaign_result: campaignResult,
          campaign_analysis: campaignAnalysis.content,
          manager_id: 'marketing-campaign-manager'
        };

      case 'segment_audience':
        const segmentationPrompt = `
          As a Marketing Campaign Manager, perform advanced audience segmentation:
          Campaign Type: ${params.campaign_type}
          Target Criteria: ${JSON.stringify(params.segmentation_criteria)}
          Campaign Goals: ${JSON.stringify(params.campaign_goals)}
          
          Analyze and create:
          1. Primary audience segments with characteristics
          2. Persona profiles for each segment
          3. Personalized messaging strategies
          4. Channel preferences by segment
          5. Timing optimization recommendations
          6. Budget allocation suggestions
          7. Expected conversion rates by segment
        `;

        const segmentation = await openai.analyze(
          'audience_segmentation',
          params.segmentation_criteria,
          'marketing',
          segmentationPrompt
        );

        return {
          success: true,
          audience_segmentation: segmentation.content,
          manager_id: 'marketing-campaign-manager'
        };

      case 'optimize_campaign':
        const optimizationResult = await manager.coordinateMultiAgentTask(
          userId,
          ['campaign-analyzer', 'conversion-optimizer', 'roi-tracker'],
          'optimize_performance',
          params,
          openAiClient,
          memory
        );

        const optimizationReport = await openai.generateReport(
          'campaign_optimization',
          optimizationResult,
          'marketing',
          'detailed'
        );

        return {
          success: true,
          optimization_result: optimizationResult,
          optimization_report: optimizationReport.content,
          manager_id: 'marketing-campaign-manager'
        };

      case 'campaign_performance_analysis':
        const performanceAnalysis = await openai.generateReport(
          'campaign_performance',
          params.campaign_data,
          'marketing',
          'detailed'
        );

        // Get user segments for performance context
        if (params.user_ids) {
          const userMetrics = await analytics.getAggregatedUserMetrics(params.user_ids);
          params.audience_metrics = userMetrics;
        }

        return {
          success: true,
          performance_analysis: performanceAnalysis.content,
          manager_id: 'marketing-campaign-manager'
        };

      case 'cross_channel_coordination':
        return await manager.coordinateMultiAgentTask(
          userId,
          ['email-marketer', 'social-media-manager', 'ad-campaign-optimizer'],
          'coordinate_channels',
          params,
          openAiClient,
          memory
        );

      default:
        const defaultResponse = await openai.chat({
          prompt: `As a Marketing Campaign Manager, handle this request: ${intent}`,
          context: params,
          model: 'gpt-5-2025-08-07'
        });

        return {
          success: true,
          response: defaultResponse.content,
          manager_id: 'marketing-campaign-manager'
        };
    }
  } catch (error) {
    await manager.escalateToSupervisor(
      userId,
      `Marketing campaign error: ${error.message}`,
      { intent, params, error: error.message },
      'medium'
    );

    return {
      success: false,
      error: error.message,
      manager_id: 'marketing-campaign-manager'
    };
  }
};