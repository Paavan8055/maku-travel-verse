import { BaseManagerAgent, ManagerCapability, ManagerHierarchy } from '../_shared/base-manager-agent.ts';
import { AgentHandler, StructuredLogger } from '../_shared/memory-utils.ts';
import { OpenAIServiceWrapper } from '../_shared/openai-service-wrapper.ts';
import { UserAnalyticsUtils } from '../_shared/user-analytics-utils.ts';

const capabilities: ManagerCapability[] = [
  {
    name: 'customer_segmentation',
    description: 'Advanced customer segmentation and profiling',
    requiredParams: ['segmentationCriteria'],
    delegateAgents: ['user-profiler', 'behavior-analyzer']
  },
  {
    name: 'loyalty_management',
    description: 'Comprehensive loyalty program management',
    requiredParams: ['loyaltyProgram'],
    delegateAgents: ['loyalty-agent', 'rewards-manager']
  },
  {
    name: 'personalization_engine',
    description: 'AI-driven personalization and recommendations',
    requiredParams: ['userProfile', 'preferences'],
    delegateAgents: ['recommendation-engine', 'personalization-agent']
  }
];

const hierarchy: ManagerHierarchy = {
  tier: 1, // Executive level
  supervises: ['loyalty-manager', 'business-travel-manager', 'customer-support-agent', 'personalization-agent']
};

export const handler: AgentHandler = async (userId, intent, params, supabaseClient, openAiClient, memory) => {
  const manager = new BaseManagerAgent(supabaseClient, 'customer-relationship-manager', capabilities, hierarchy);
  const openAI = new OpenAIServiceWrapper(openAiClient);
  const userAnalytics = new UserAnalyticsUtils(supabaseClient);
  
  try {
    switch (intent) {
      case 'customer_segment_analysis':
        const userSegment = await userAnalytics.segmentUser(userId);
        const segmentAnalysis = await openAI.analyze('customer segment', userSegment, 'customer_analytics');
        
        return {
          success: true,
          result: {
            user_segment: userSegment,
            segment_analysis: segmentAnalysis.content,
            personalization_strategy: userSegment.recommendations
          }
        };
      
      case 'loyalty_optimization':
        const behaviorProfile = await userAnalytics.getUserBehaviorProfile(userId);
        const loyaltyRecommendations = await openAI.analyze('loyalty optimization', 
          { profile: behaviorProfile }, 'loyalty_management');
        
        return {
          success: true,
          result: {
            behavior_profile: behaviorProfile,
            loyalty_recommendations: loyaltyRecommendations.content,
            engagement_strategy: 'Personalized loyalty program'
          }
        };
      
      default:
        const response = await openAI.chat({
          systemPrompt: `You are the Customer Relationship Manager for MAKU.Travel. Handle: ${intent}`,
          userPrompt: JSON.stringify(params),
          maxTokens: 1000
        });
        
        return {
          success: true,
          result: { analysis: response.content, handled_by: 'customer-relationship-manager' }
        };
    }
  } catch (error) {
    return { success: false, error: error.message };
  }
};