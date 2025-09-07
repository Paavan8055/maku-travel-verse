import { BaseManagerAgent, ManagerCapability, ManagerHierarchy } from '../_shared/base-manager-agent.ts';
import { AgentHandler, StructuredLogger } from '../_shared/memory-utils.ts';
import { RiskCalculationUtils, RiskFactors } from '../_shared/risk-calculation-utils.ts';
import { OpenAIServiceWrapper } from '../_shared/openai-service-wrapper.ts';

const capabilities: ManagerCapability[] = [
  {
    name: 'fraud_detection',
    description: 'Comprehensive fraud detection and prevention',
    requiredParams: ['transactionData', 'userProfile'],
    delegateAgents: ['fraud-analyzer', 'payment-validator']
  },
  {
    name: 'risk_assessment',
    description: 'Multi-dimensional risk analysis',
    requiredParams: ['riskType', 'data'],
    delegateAgents: ['risk-analyzer', 'compliance-checker']
  },
  {
    name: 'security_monitoring',
    description: 'Real-time security threat monitoring',
    requiredParams: ['securityContext'],
    delegateAgents: ['security-scanner', 'threat-detector']
  },
  {
    name: 'compliance_management',
    description: 'Regulatory compliance and audit management',
    requiredParams: ['complianceType', 'requirements'],
    delegateAgents: ['compliance-auditor', 'regulatory-monitor']
  }
];

const hierarchy: ManagerHierarchy = {
  tier: 1, // Executive level
  supervises: ['fraud-detection-agent', 'advanced-fraud-detection', 'security-monitor', 'compliance-agent']
};

export const handler: AgentHandler = async (userId, intent, params, supabaseClient, openAiClient, memory) => {
  const manager = new BaseManagerAgent(supabaseClient, 'risk-management-manager', capabilities, hierarchy);
  const openAI = new OpenAIServiceWrapper(openAiClient);
  
  StructuredLogger.info('Risk Management Manager activated', { userId, intent, params });

  try {
    switch (intent) {
      case 'comprehensive_fraud_analysis':
        return await comprehensiveFraudAnalysis(manager, userId, params, openAI, memory);
      
      case 'multi_dimensional_risk_assessment':
        return await multiDimensionalRiskAssessment(manager, userId, params, openAI, memory);
      
      case 'security_threat_monitoring':
        return await securityThreatMonitoring(manager, userId, params, openAI, memory);
      
      case 'compliance_audit':
        return await complianceAudit(manager, userId, params, openAI, memory);
      
      case 'risk_portfolio_analysis':
        return await riskPortfolioAnalysis(manager, userId, params, openAI, memory);
        
      case 'emergency_risk_response':
        return await emergencyRiskResponse(manager, userId, params, openAI, memory);

      default:
        return await defaultRiskManagement(manager, userId, intent, params, openAI, memory);
    }
  } catch (error) {
    StructuredLogger.error('Risk Management Manager error', { error: error.message, userId, intent });
    
    await manager.createAlert(userId, 'risk_manager_error', 
      `Risk management analysis failed: ${error.message}`, 'high', {
        intent,
        params,
        error: error.message
      });

    return {
      success: false,
      error: error.message
    };
  }
};

async function comprehensiveFraudAnalysis(
  manager: BaseManagerAgent,
  userId: string,
  params: any,
  openAI: OpenAIServiceWrapper,
  memory: any
): Promise<any> {
  const { transactionData, userProfile, riskFactors, paymentMethod, investigationLevel = 'standard' } = params;
  
  // Get fraud history
  const fraudHistory = await memory.getMemory('risk-management-manager', userId, 'fraud_history') || [];
  
  // Calculate consolidated risk score using both legacy algorithms
  const riskAssessment = RiskCalculationUtils.calculateFinancialRisk({
    amount: transactionData.amount,
    userAccountAge: userProfile.accountAge,
    unusualLocation: riskFactors.unusualLocation,
    vpnDetected: riskFactors.vpnDetected,
    newPaymentMethod: riskFactors.newPaymentMethod,
    failedPayments: riskFactors.failedPayments,
    rapidBookings: riskFactors.rapidBookings,
    suspiciousDevice: riskFactors.suspiciousDevice,
    timeAnomaly: riskFactors.timeAnomaly,
    velocityAnomaly: riskFactors.velocityAnomaly,
    geoAnomaly: riskFactors.geoAnomaly
  });

  // Enhanced AI analysis
  const analysisResponse = await openAI.analyze(
    'fraud transaction',
    {
      transaction: transactionData,
      user: userProfile,
      riskFactors,
      riskAssessment,
      fraudHistory: fraudHistory.slice(-5),
      investigationLevel
    },
    'fraud_detection',
    `Perform comprehensive fraud analysis with ${investigationLevel} investigation level.
    Focus on transaction patterns, user behavior anomalies, and security threats.
    Provide specific fraud indicators and actionable security recommendations.`
  );

  if (!analysisResponse.success) {
    throw new Error('Failed to generate fraud analysis');
  }

  // Create alert if high risk
  if (riskAssessment.level === 'HIGH' || riskAssessment.level === 'CRITICAL') {
    await manager.createAlert(userId, 'high_fraud_risk', 
      `${riskAssessment.level} fraud risk detected - Score: ${riskAssessment.score}/100`,
      riskAssessment.level === 'CRITICAL' ? 'critical' : 'high',
      {
        transaction_id: transactionData.id,
        risk_score: riskAssessment.score,
        risk_factors: riskAssessment.factors,
        recommendations: riskAssessment.recommendations
      });
  }

  // Update fraud history
  const updatedHistory = [
    ...fraudHistory.slice(-9),
    {
      timestamp: new Date().toISOString(),
      transaction_id: transactionData.id,
      risk_assessment: riskAssessment,
      analysis: analysisResponse.content.substring(0, 1000),
      investigation_level: investigationLevel
    }
  ];
  
  await memory.setMemory('risk-management-manager', userId, 'fraud_history', updatedHistory);
  
  await manager.logActivity(userId, 'comprehensive_fraud_analysis', {
    risk_level: riskAssessment.level,
    risk_score: riskAssessment.score,
    factors_detected: riskAssessment.factors.length
  });

  return {
    success: true,
    result: {
      risk_assessment: riskAssessment,
      fraud_analysis: analysisResponse.content,
      investigation_level: investigationLevel,
      recommended_actions: riskAssessment.level === 'CRITICAL' ? 
        ['BLOCK_TRANSACTION', 'ESCALATE_TO_SECURITY', 'MANUAL_INVESTIGATION'] :
        riskAssessment.level === 'HIGH' ?
        ['ADDITIONAL_VERIFICATION', 'MANUAL_REVIEW', 'ENHANCED_MONITORING'] :
        riskAssessment.level === 'MEDIUM' ?
        ['ENHANCED_MONITORING', 'PERIODIC_REVIEW'] : 
        ['APPROVE', 'STANDARD_MONITORING'],
      requires_manual_review: riskAssessment.score >= 60,
      security_measures: riskAssessment.recommendations
    }
  };
}

async function multiDimensionalRiskAssessment(
  manager: BaseManagerAgent,
  userId: string,
  params: any,
  openAI: OpenAIServiceWrapper,
  memory: any
): Promise<any> {
  const { assessmentScope, businessContext, timeframe = '30d' } = params;
  
  const assessments: any[] = [];
  
  // Financial risk assessment
  if (assessmentScope.includes('financial')) {
    const financialRisk = RiskCalculationUtils.calculateFinancialRisk(params.financialFactors || {});
    assessments.push({ type: 'financial', assessment: financialRisk });
  }
  
  // Business risk assessment
  if (assessmentScope.includes('business')) {
    const businessRisk = RiskCalculationUtils.calculateBusinessRisk(params.businessFactors || {});
    assessments.push({ type: 'business', assessment: businessRisk });
  }
  
  // Combined assessment
  const combinedRisk = RiskCalculationUtils.combineRiskAssessments(
    assessments.map(a => a.assessment)
  );
  
  // AI strategic analysis
  const strategyResponse = await openAI.generateReport(
    'Multi-Dimensional Risk Assessment',
    {
      individual_assessments: assessments,
      combined_risk: combinedRisk,
      business_context: businessContext,
      timeframe
    },
    'executives',
    'executive'
  );

  await manager.logActivity(userId, 'multi_dimensional_risk_assessment', {
    scope: assessmentScope,
    overall_risk_level: combinedRisk.level,
    risk_score: combinedRisk.score
  });

  return {
    success: true,
    result: {
      individual_assessments: assessments,
      combined_risk_assessment: combinedRisk,
      strategic_analysis: strategyResponse.content,
      executive_summary: {
        overall_risk: combinedRisk.level,
        key_concerns: combinedRisk.factors.slice(0, 5),
        priority_actions: combinedRisk.recommendations.slice(0, 3)
      }
    }
  };
}

async function securityThreatMonitoring(
  manager: BaseManagerAgent,
  userId: string,
  params: any,
  openAI: OpenAIServiceWrapper,
  memory: any
): Promise<any> {
  const { monitoringScope = 'comprehensive', alertThresholds, autoResponse = false } = params;
  
  // Get recent security events
  const threatHistory = await memory.getMemory('risk-management-manager', userId, 'threat_monitoring') || [];
  
  // Mock threat detection (in real implementation, this would integrate with security tools)
  const detectedThreats = [
    { type: 'suspicious_login_pattern', severity: 'medium', source: 'authentication_system' },
    { type: 'unusual_api_access', severity: 'low', source: 'api_gateway' }
  ];
  
  const threatAnalysis = await openAI.analyze(
    'security threats',
    {
      detected_threats: detectedThreats,
      monitoring_scope: monitoringScope,
      threat_history: threatHistory.slice(-10),
      alert_thresholds: alertThresholds
    },
    'security_analysis',
    'Analyze current security threats and provide immediate response recommendations. Focus on threat prioritization and containment strategies.'
  );

  // Update threat monitoring history
  const updatedThreatHistory = [
    ...threatHistory.slice(-19),
    {
      timestamp: new Date().toISOString(),
      threats_detected: detectedThreats.length,
      highest_severity: detectedThreats.reduce((max, t) => 
        t.severity === 'critical' ? 'critical' : 
        t.severity === 'high' ? 'high' : max, 'low'),
      analysis: threatAnalysis.content.substring(0, 500)
    }
  ];
  
  await memory.setMemory('risk-management-manager', userId, 'threat_monitoring', updatedThreatHistory);

  return {
    success: true,
    result: {
      threats_detected: detectedThreats,
      threat_analysis: threatAnalysis.content,
      monitoring_status: 'active',
      auto_response_enabled: autoResponse,
      recommendations: [
        'Increase monitoring frequency',
        'Review access permissions',
        'Update security protocols'
      ]
    }
  };
}

async function complianceAudit(
  manager: BaseManagerAgent,
  userId: string,
  params: any,
  openAI: OpenAIServiceWrapper,
  memory: any
): Promise<any> {
  const { auditScope, regulations, complianceFramework } = params;
  
  const auditResponse = await openAI.generateReport(
    'Compliance Audit Report',
    {
      audit_scope: auditScope,
      applicable_regulations: regulations,
      compliance_framework: complianceFramework,
      audit_date: new Date().toISOString()
    },
    'compliance_team',
    'detailed'
  );

  return {
    success: true,
    result: {
      audit_report: auditResponse.content,
      compliance_status: 'under_review',
      audit_scope: auditScope,
      next_audit_date: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString()
    }
  };
}

async function riskPortfolioAnalysis(
  manager: BaseManagerAgent,
  userId: string,
  params: any,
  openAI: OpenAIServiceWrapper,
  memory: any
): Promise<any> {
  const portfolioResponse = await openAI.generateReport(
    'Risk Portfolio Analysis',
    params,
    'executives',
    'executive'
  );

  return {
    success: true,
    result: {
      portfolio_analysis: portfolioResponse.content,
      risk_distribution: 'Comprehensive analysis provided',
      strategic_recommendations: 'See full report'
    }
  };
}

async function emergencyRiskResponse(
  manager: BaseManagerAgent,
  userId: string,
  params: any,
  openAI: OpenAIServiceWrapper,
  memory: any
): Promise<any> {
  const { emergencyType, severity, context } = params;
  
  // Escalate to executives
  await manager.escalateToSupervisor(userId, 
    `Emergency risk response required: ${emergencyType}`, 
    context, 
    severity as any
  );

  const responseResponse = await openAI.chat({
    systemPrompt: `You are the emergency risk response coordinator for MAKU.Travel. 
    Provide immediate action plan for ${emergencyType} emergency with ${severity} severity.`,
    userPrompt: `Emergency Context: ${JSON.stringify(context)}. Provide immediate response plan.`,
    maxTokens: 1500
  });

  return {
    success: true,
    result: {
      emergency_response_plan: responseResponse.content,
      escalation_status: 'escalated_to_executives',
      immediate_actions: ['Containment', 'Assessment', 'Communication'],
      response_coordinator: 'risk-management-manager'
    }
  };
}

async function defaultRiskManagement(
  manager: BaseManagerAgent,
  userId: string,
  intent: string,
  params: any,
  openAI: OpenAIServiceWrapper,
  memory: any
): Promise<any> {
  const response = await openAI.chat({
    systemPrompt: `You are the Risk Management Manager for MAKU.Travel. Handle the request: ${intent}`,
    userPrompt: `Request details: ${JSON.stringify(params)}`,
    maxTokens: 1000
  });

  return {
    success: true,
    result: {
      analysis: response.content,
      handled_by: 'risk-management-manager',
      intent
    }
  };
}