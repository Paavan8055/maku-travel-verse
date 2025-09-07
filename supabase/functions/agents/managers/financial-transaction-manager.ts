import { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.53.0';
import { BaseManagerAgent, ManagerCapability, ManagerHierarchy } from '../_shared/base-manager-agent.ts';
import { OpenAIServiceWrapper } from '../_shared/openai-service-wrapper.ts';
import { RiskCalculationUtils } from '../_shared/risk-calculation-utils.ts';

// Financial Transaction Manager capabilities
const capabilities: ManagerCapability[] = [
  {
    name: 'payment_orchestration',
    description: 'Coordinate complex payment flows across multiple providers',
    requiredParams: ['transaction_data', 'payment_method'],
    delegateAgents: ['stripe-payment-processor', 'fraud-detection']
  },
  {
    name: 'billing_management',
    description: 'Handle recurring billing, invoicing, and payment reconciliation',
    requiredParams: ['billing_data', 'customer_id'],
    delegateAgents: ['invoice-generator', 'payment-tracker']
  },
  {
    name: 'financial_reporting',
    description: 'Generate comprehensive financial reports and analytics',
    requiredParams: ['report_type', 'date_range'],
    delegateAgents: ['financial-analytics', 'revenue-tracker']
  }
];

// Hierarchy definition (Tier 1 - Executive)
const hierarchy: ManagerHierarchy = {
  tier: 1,
  supervises: ['payment-processor', 'billing-agent', 'financial-analyst', 'fraud-detection']
};

export const handler = async (
  userId: string,
  intent: string,
  params: any,
  supabaseClient: SupabaseClient,
  openAiClient: string,
  memory: any
) => {
  const manager = new BaseManagerAgent(supabaseClient, 'financial-transaction-manager', capabilities, hierarchy);
  const openai = new OpenAIServiceWrapper(openAiClient);

  try {
    switch (intent) {
      case 'orchestrate_payment':
        const paymentResult = await manager.coordinateMultiAgentTask(
          userId,
          ['stripe-payment-processor', 'fraud-detection'],
          'process_secure_payment',
          params,
          openAiClient,
          memory
        );

        // Analyze payment risk
        const riskAssessment = RiskCalculationUtils.calculateFinancialRisk({
          transactionAmount: params.amount,
          customerAge: params.customer_age || 30,
          transactionFrequency: params.frequency || 1,
          geographicRisk: params.geographic_risk || 'low',
          paymentMethodRisk: params.payment_method_risk || 'low'
        });

        await manager.logActivity(userId, 'payment_orchestration', {
          payment_result: paymentResult,
          risk_assessment: riskAssessment,
          transaction_amount: params.amount
        });

        return {
          success: true,
          result: paymentResult,
          risk_level: riskAssessment.level,
          recommendations: riskAssessment.recommendations
        };

      case 'financial_analysis':
        const analysisPrompt = `
          As a Financial Transaction Manager, analyze the following financial data:
          ${JSON.stringify(params.financial_data)}
          
          Provide insights on:
          1. Transaction patterns and trends
          2. Revenue optimization opportunities
          3. Risk factors and mitigation strategies
          4. Cash flow projections
          5. Payment method performance
        `;

        const analysis = await openai.analyze(
          'financial_data',
          params.financial_data,
          'financial_analysis',
          analysisPrompt
        );

        return {
          success: true,
          analysis: analysis.content,
          manager_id: 'financial-transaction-manager'
        };

      case 'billing_reconciliation':
        return await manager.delegateTask(
          userId,
          'billing-agent',
          'reconcile_billing',
          params,
          openAiClient,
          memory
        );

      default:
        const defaultResponse = await openai.chat({
          prompt: `As a Financial Transaction Manager, handle this request: ${intent}`,
          context: params,
          model: 'gpt-5-2025-08-07'
        });

        return {
          success: true,
          response: defaultResponse.content,
          manager_id: 'financial-transaction-manager'
        };
    }
  } catch (error) {
    await manager.escalateToSupervisor(
      userId,
      `Financial transaction error: ${error.message}`,
      { intent, params, error: error.message },
      'high'
    );

    return {
      success: false,
      error: error.message,
      manager_id: 'financial-transaction-manager'
    };
  }
};