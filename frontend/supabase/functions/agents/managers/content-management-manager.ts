import { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.53.0';
import { BaseManagerAgent, ManagerCapability, ManagerHierarchy } from '../_shared/base-manager-agent.ts';
import { OpenAIServiceWrapper } from '../_shared/openai-service-wrapper.ts';

// Content Management Manager capabilities
const capabilities: ManagerCapability[] = [
  {
    name: 'content_lifecycle',
    description: 'Manage content creation, review, approval, and publishing workflows',
    requiredParams: ['content_type', 'workflow_stage'],
    delegateAgents: ['content-creator', 'content-reviewer', 'content-publisher']
  },
  {
    name: 'marketing_coordination',
    description: 'Coordinate marketing campaigns and promotional content',
    requiredParams: ['campaign_type', 'target_audience'],
    delegateAgents: ['marketing-agent', 'social-media-manager', 'email-marketer']
  },
  {
    name: 'policy_updates',
    description: 'Manage policy updates and compliance content across all channels',
    requiredParams: ['policy_type', 'update_scope'],
    delegateAgents: ['policy-writer', 'compliance-checker', 'documentation-updater']
  }
];

// Hierarchy definition (Tier 1 - Executive)
const hierarchy: ManagerHierarchy = {
  tier: 1,
  supervises: ['content-creator', 'marketing-agent', 'social-media-manager', 'policy-writer']
};

export const handler = async (
  userId: string,
  intent: string,
  params: any,
  supabaseClient: SupabaseClient,
  openAiClient: string,
  memory: any
) => {
  const manager = new BaseManagerAgent(supabaseClient, 'content-management-manager', capabilities, hierarchy);
  const openai = new OpenAIServiceWrapper(openAiClient);

  try {
    switch (intent) {
      case 'create_marketing_campaign':
        const campaignResult = await manager.coordinateMultiAgentTask(
          userId,
          ['marketing-agent', 'content-creator', 'social-media-manager'],
          'execute_campaign',
          params,
          openAiClient,
          memory
        );

        const campaignAnalysis = await openai.generateReport(
          'marketing_campaign',
          params,
          'marketing',
          'executive'
        );

        await manager.logActivity(userId, 'campaign_creation', {
          campaign_result: campaignResult,
          campaign_type: params.campaign_type,
          target_audience: params.target_audience
        });

        return {
          success: true,
          campaign_result: campaignResult,
          analysis: campaignAnalysis.content,
          manager_id: 'content-management-manager'
        };

      case 'content_approval_workflow':
        const approvalPrompt = `
          As a Content Management Manager, review and approve this content:
          Content Type: ${params.content_type}
          Content: ${params.content}
          Target Audience: ${params.target_audience}
          
          Evaluate:
          1. Brand consistency and voice
          2. Accuracy and compliance
          3. SEO optimization
          4. Audience engagement potential
          5. Legal and regulatory compliance
        `;

        const approval = await openai.analyze(
          'content_review',
          params.content,
          'content_approval',
          approvalPrompt
        );

        return {
          success: true,
          approval_status: approval.content,
          manager_id: 'content-management-manager'
        };

      case 'policy_update_cascade':
        return await manager.coordinateMultiAgentTask(
          userId,
          ['policy-writer', 'compliance-checker', 'documentation-updater'],
          'update_policies',
          params,
          openAiClient,
          memory
        );

      case 'content_performance_analysis':
        const performanceAnalysis = await openai.generateReport(
          'content_performance',
          params.analytics_data,
          'management',
          'detailed'
        );

        return {
          success: true,
          performance_report: performanceAnalysis.content,
          manager_id: 'content-management-manager'
        };

      default:
        const defaultResponse = await openai.chat({
          prompt: `As a Content Management Manager, handle this request: ${intent}`,
          context: params,
          model: 'gpt-5-2025-08-07'
        });

        return {
          success: true,
          response: defaultResponse.content,
          manager_id: 'content-management-manager'
        };
    }
  } catch (error) {
    await manager.escalateToSupervisor(
      userId,
      `Content management error: ${error.message}`,
      { intent, params, error: error.message },
      'medium'
    );

    return {
      success: false,
      error: error.message,
      manager_id: 'content-management-manager'
    };
  }
};