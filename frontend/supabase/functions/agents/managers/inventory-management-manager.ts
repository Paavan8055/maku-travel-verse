import { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.53.0';
import { BaseManagerAgent, ManagerCapability, ManagerHierarchy } from '../_shared/base-manager-agent.ts';
import { OpenAIServiceWrapper } from '../_shared/openai-service-wrapper.ts';

// Inventory Management Manager capabilities
const capabilities: ManagerCapability[] = [
  {
    name: 'dynamic_allocation',
    description: 'Dynamically allocate rooms, seats, and services based on demand',
    requiredParams: ['resource_type', 'demand_forecast'],
    delegateAgents: ['hotel-inventory', 'flight-inventory', 'activity-inventory']
  },
  {
    name: 'availability_optimization',
    description: 'Optimize availability across multiple channels and providers',
    requiredParams: ['channels', 'optimization_criteria'],
    delegateAgents: ['channel-manager', 'rate-optimizer', 'yield-manager']
  },
  {
    name: 'supply_chain_coordination',
    description: 'Coordinate with suppliers and partners for inventory updates',
    requiredParams: ['supplier_data', 'update_type'],
    delegateAgents: ['supplier-sync', 'partner-coordinator', 'inventory-tracker']
  }
];

// Hierarchy definition (Tier 2 - Operational)
const hierarchy: ManagerHierarchy = {
  tier: 2,
  reportsTo: 'revenue-management-manager',
  supervises: ['hotel-inventory', 'flight-inventory', 'activity-inventory', 'channel-manager']
};

export const handler = async (
  userId: string,
  intent: string,
  params: any,
  supabaseClient: SupabaseClient,
  openAiClient: string,
  memory: any
) => {
  const manager = new BaseManagerAgent(supabaseClient, 'inventory-management-manager', capabilities, hierarchy);
  const openai = new OpenAIServiceWrapper(openAiClient);

  try {
    switch (intent) {
      case 'optimize_availability':
        const optimizationResult = await manager.coordinateMultiAgentTask(
          userId,
          ['hotel-inventory', 'flight-inventory', 'activity-inventory'],
          'optimize_inventory',
          params,
          openAiClient,
          memory
        );

        const optimizationAnalysis = await openai.analyze(
          'inventory_optimization',
          params,
          'inventory_analysis',
          `
          Analyze the following inventory optimization request:
          Resource Type: ${params.resource_type}
          Current Demand: ${params.current_demand}
          Forecasted Demand: ${params.demand_forecast}
          Available Inventory: ${params.available_inventory}
          
          Provide recommendations for:
          1. Optimal allocation strategy
          2. Revenue maximization opportunities
          3. Risk mitigation measures
          4. Dynamic pricing adjustments
          5. Channel distribution strategy
          `
        );

        await manager.logActivity(userId, 'inventory_optimization', {
          optimization_result: optimizationResult,
          resource_type: params.resource_type,
          demand_forecast: params.demand_forecast
        });

        return {
          success: true,
          optimization_result: optimizationResult,
          analysis: optimizationAnalysis.content,
          manager_id: 'inventory-management-manager'
        };

      case 'real_time_sync':
        return await manager.coordinateMultiAgentTask(
          userId,
          ['supplier-sync', 'partner-coordinator', 'inventory-tracker'],
          'sync_inventory',
          params,
          openAiClient,
          memory
        );

      case 'demand_forecasting':
        const forecastPrompt = `
          As an Inventory Management Manager, analyze historical data and predict future demand:
          Historical Data: ${JSON.stringify(params.historical_data)}
          Market Conditions: ${JSON.stringify(params.market_conditions)}
          Seasonal Factors: ${JSON.stringify(params.seasonal_factors)}
          
          Provide:
          1. Demand forecast for next 30/60/90 days
          2. Confidence intervals
          3. Key influencing factors
          4. Recommended inventory adjustments
          5. Risk scenarios and mitigation
        `;

        const forecast = await openai.analyze(
          'demand_forecasting',
          params.historical_data,
          'forecasting',
          forecastPrompt
        );

        return {
          success: true,
          forecast: forecast.content,
          manager_id: 'inventory-management-manager'
        };

      case 'channel_optimization':
        const channelResult = await manager.delegateTask(
          userId,
          'channel-manager',
          'optimize_distribution',
          params,
          openAiClient,
          memory
        );

        return {
          success: true,
          channel_optimization: channelResult,
          manager_id: 'inventory-management-manager'
        };

      default:
        const defaultResponse = await openai.chat({
          prompt: `As an Inventory Management Manager, handle this request: ${intent}`,
          context: params,
          model: 'gpt-5-2025-08-07'
        });

        return {
          success: true,
          response: defaultResponse.content,
          manager_id: 'inventory-management-manager'
        };
    }
  } catch (error) {
    await manager.escalateToSupervisor(
      userId,
      `Inventory management error: ${error.message}`,
      { intent, params, error: error.message },
      'high'
    );

    return {
      success: false,
      error: error.message,
      manager_id: 'inventory-management-manager'
    };
  }
};