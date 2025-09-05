import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface AIAnalysisResult {
  explanation: string;
  suggestedActions?: Array<{
    label: string;
    type: 'recovery' | 'explanation' | 'navigation';
    recoveryType?: string;
    issueType?: string;
    severity?: 'low' | 'medium' | 'high';
  }>;
  confidence: number;
}

export interface SystemContext {
  criticalAlerts: any[];
  providerHealth: any[];
  systemLogs: any[];
  metrics: any;
  healthStatus: string;
}

export const useAdminAI = () => {
  const [isProcessing, setIsProcessing] = useState(false);

  // Common issue patterns and their solutions
  const knowledgeBase = {
    payment_issues: {
      keywords: ['payment', 'stripe', 'transaction', 'card', 'billing'],
      solutions: [
        'Check Stripe webhook endpoint status',
        'Verify API keys are valid',
        'Review recent payment failures in logs',
        'Test payment flow with test card'
      ],
      recovery: 'restart_payment_service'
    },
    booking_failures: {
      keywords: ['booking', 'reservation', 'failed', 'error', 'timeout'],
      solutions: [
        'Check provider API connectivity',
        'Review timeout settings',
        'Verify inventory availability',
        'Check for rate limiting'
      ],
      recovery: 'reset_booking_service'
    },
    provider_connectivity: {
      keywords: ['provider', 'api', 'connection', 'timeout', 'unreachable'],
      solutions: [
        'Test provider endpoints',
        'Check API quotas and limits',
        'Verify authentication tokens',
        'Switch to backup provider if available'
      ],
      recovery: 'reset_provider_connections'
    },
    database_issues: {
      keywords: ['database', 'query', 'slow', 'connection', 'timeout'],
      solutions: [
        'Check database connection pool',
        'Review slow query logs',
        'Verify database health metrics',
        'Consider scaling database resources'
      ],
      recovery: 'optimize_database'
    }
  };

  const analyzeIssue = useCallback(async (userInput: string, context: SystemContext): Promise<AIAnalysisResult> => {
    setIsProcessing(true);
    
    try {
      const input = userInput.toLowerCase();
      
      // Pattern matching for common issues
      let matchedPattern = null;
      let confidence = 0;
      
      for (const [patternKey, pattern] of Object.entries(knowledgeBase)) {
        const matchScore = pattern.keywords.reduce((score, keyword) => {
          return input.includes(keyword) ? score + 1 : score;
        }, 0);
        
        if (matchScore > confidence) {
          confidence = matchScore;
          matchedPattern = { key: patternKey, ...pattern };
        }
      }

      // Analyze current system state
      const systemAnalysis = analyzeSystemState(context);
      
      // Generate response based on pattern match and system state
      if (matchedPattern && confidence > 0) {
        const explanation = generateExplanation(matchedPattern, systemAnalysis, userInput);
        const suggestedActions = generateSuggestedActions(matchedPattern, systemAnalysis);
        
        return {
          explanation,
          suggestedActions,
          confidence: Math.min(confidence / matchedPattern.keywords.length, 1)
        };
      }
      
      // Fallback for unrecognized issues
      return {
        explanation: generateGeneralGuidance(userInput, systemAnalysis),
        suggestedActions: generateGeneralActions(systemAnalysis),
        confidence: 0.3
      };
      
    } catch (error) {
      console.error('AI analysis error:', error);
      return {
        explanation: "I'm having trouble analyzing this issue. Let me help you with some general troubleshooting steps.",
        confidence: 0
      };
    } finally {
      setIsProcessing(false);
    }
  }, []);

  const suggestSolution = useCallback(async (issueType: string): Promise<string> => {
    const pattern = knowledgeBase[issueType as keyof typeof knowledgeBase];
    if (pattern) {
      return `Here's how to resolve ${issueType.replace('_', ' ')}:\n\n${pattern.solutions.map((s, i) => `${i + 1}. ${s}`).join('\n')}`;
    }
    return "I don't have specific guidance for this issue type. Please contact technical support.";
  }, []);

  const executeRecovery = useCallback(async (recoveryType: string): Promise<{ success: boolean; message: string }> => {
    try {
      // Call the appropriate recovery edge function
      const { data, error } = await supabase.functions.invoke('system-recovery-orchestrator', {
        body: { action: recoveryType }
      });

      if (error) throw error;

      toast.success(`Recovery action "${recoveryType}" completed successfully`);
      return { success: true, message: data?.message || 'Recovery completed' };
    } catch (error) {
      console.error('Recovery execution error:', error);
      toast.error(`Recovery action failed: ${(error as Error).message}`);
      return { success: false, message: (error as Error).message };
    }
  }, []);

  const detectPatterns = useCallback((logs: any[]): string[] => {
    const patterns = [];
    
    // Detect error spikes
    const recentErrors = logs.filter(log => 
      log.log_level === 'error' && 
      new Date(log.created_at) > new Date(Date.now() - 3600000) // Last hour
    );
    
    if (recentErrors.length > 10) {
      patterns.push('High error rate detected in the last hour');
    }
    
    // Detect provider issues
    const providerErrors = logs.filter(log => 
      log.message?.includes('provider') && log.log_level === 'error'
    );
    
    if (providerErrors.length > 5) {
      patterns.push('Multiple provider connectivity issues detected');
    }
    
    return patterns;
  }, []);

  return {
    analyzeIssue,
    suggestSolution,
    executeRecovery,
    detectPatterns,
    isProcessing
  };
};

// Helper functions
function analyzeSystemState(context: SystemContext) {
  return {
    hasAlerts: context.criticalAlerts.length > 0,
    unhealthyProviders: context.providerHealth.filter(p => p.status !== 'healthy').length,
    recentErrors: context.systemLogs.filter(log => log.log_level === 'error').length,
    overallHealth: context.healthStatus
  };
}

function generateExplanation(pattern: any, systemAnalysis: any, userInput: string): string {
  const issueType = pattern.key.replace('_', ' ');
  let explanation = `I understand you're having ${issueType} issues. `;
  
  if (systemAnalysis.hasAlerts) {
    explanation += "I can see there are active alerts in the system that might be related. ";
  }
  
  if (systemAnalysis.unhealthyProviders > 0) {
    explanation += `${systemAnalysis.unhealthyProviders} provider(s) are currently unhealthy, which could be causing issues. `;
  }
  
  explanation += `Here's what I recommend to resolve this:`;
  
  return explanation;
}

function generateSuggestedActions(pattern: any, systemAnalysis: any) {
  const actions = [
    {
      label: `Fix ${pattern.key.replace('_', ' ')}`,
      type: 'recovery' as const,
      recoveryType: pattern.recovery,
      severity: systemAnalysis.hasAlerts ? 'high' as const : 'medium' as const
    },
    {
      label: 'Explain this issue',
      type: 'explanation' as const,
      issueType: pattern.key,
      severity: 'low' as const
    }
  ];

  if (systemAnalysis.unhealthyProviders > 0) {
    actions.unshift({
      label: 'Reset provider connections',
      type: 'recovery' as const,
      recoveryType: 'reset_provider_connections',
      severity: 'high' as const
    });
  }

  return actions;
}

function generateGeneralGuidance(userInput: string, systemAnalysis: any): string {
  if (systemAnalysis.hasAlerts) {
    return "I can see there are active alerts in the system. Let me help you understand what's happening and how to resolve these issues.";
  }
  
  if (systemAnalysis.overallHealth !== 'healthy') {
    return "The system health shows some issues. I can help you identify the problems and guide you through the resolution steps.";
  }
  
  return "I'm here to help with any admin tasks. You can ask me about system health, booking issues, payment problems, or any alerts you're seeing.";
}

function generateGeneralActions(systemAnalysis: any) {
  const actions = [
    {
      label: 'Check system health',
      type: 'explanation' as const,
      issueType: 'system_health',
      severity: 'low' as const
    }
  ];

  if (systemAnalysis.hasAlerts) {
    actions.unshift({
      label: 'Review active alerts',
      type: 'explanation' as const,
      issueType: 'active_alerts',
      severity: 'low' as const
    });
  }

  return actions;
}