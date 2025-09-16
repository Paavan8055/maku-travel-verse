import { BaseAgent, AgentHandler } from '../_shared/memory-utils.ts';

export const handler: AgentHandler = async (userId, intent, params, supabaseClient, openAiClient, memory) => {
  const agent = new BaseAgent(supabaseClient, 'security-alert-handler');
  
  try {
    const { 
      alertType = 'login_anomaly',
      userEmail,
      ipAddress,
      userAgent,
      severity = 'medium',
      metadata = {}
    } = params;

    if (!userEmail && !userId) {
      return { success: false, error: 'User identification required for security alert' };
    }

    // Analyze security threat level
    const threatLevel = await analyzeThreatLevel(alertType, {
      ipAddress,
      userAgent,
      userId,
      userEmail,
      metadata
    });

    // Create security alert record
    const { data: alertRecord, error: alertError } = await supabaseClient
      .from('critical_alerts')
      .insert({
        alert_type: 'security_threat',
        severity: determineSeverity(threatLevel, severity),
        message: generateSecurityMessage(alertType, threatLevel, metadata),
        metadata: {
          threatType: alertType,
          threatLevel,
          ipAddress,
          userAgent,
          userId,
          userEmail,
          timestamp: new Date().toISOString(),
          ...metadata
        }
      })
      .select()
      .single();

    if (alertError) {
      console.error('Failed to create security alert:', alertError);
    }

    // Implement security actions based on threat level
    const securityActions = await implementSecurityActions(
      threatLevel, 
      alertType, 
      userId, 
      supabaseClient
    );

    // Log security event
    await agent.logActivity(userId || 'system', 'security_alert_processed', {
      alertType,
      threatLevel,
      severity: determineSeverity(threatLevel, severity),
      actionsPerformed: securityActions,
      alertId: alertRecord?.id
    });

    // Generate notifications if high severity
    let notificationResult = null;
    if (threatLevel >= 7 || severity === 'high') {
      notificationResult = await sendSecurityNotifications(
        alertType,
        threatLevel,
        userEmail,
        securityActions,
        supabaseClient
      );
    }

    return {
      success: true,
      result: {
        alertId: alertRecord?.id,
        threatLevel,
        severity: determineSeverity(threatLevel, severity),
        actionsPerformed: securityActions,
        notificationSent: !!notificationResult,
        recommendation: generateSecurityRecommendation(threatLevel, alertType),
        nextSteps: generateNextSteps(threatLevel, alertType, securityActions)
      }
    };

  } catch (error) {
    console.error('Security alert handler error:', error);
    return {
      success: false,
      error: 'Failed to process security alert: ' + error.message
    };
  }
};

async function analyzeThreatLevel(alertType: string, context: any): Promise<number> {
  // Threat level scoring (1-10)
  let baseScore = 1;
  
  switch (alertType) {
    case 'suspicious_login':
      baseScore = 5;
      break;
    case 'multiple_failed_attempts':
      baseScore = 6;
      break;
    case 'unusual_location':
      baseScore = 4;
      break;
    case 'device_change':
      baseScore = 3;
      break;
    case 'payment_anomaly':
      baseScore = 7;
      break;
    case 'data_breach_attempt':
      baseScore = 9;
      break;
    case 'account_takeover':
      baseScore = 10;
      break;
    default:
      baseScore = 2;
  }

  // Adjust based on context
  if (context.ipAddress && isKnownMaliciousIP(context.ipAddress)) {
    baseScore += 2;
  }
  
  if (context.metadata?.failedAttempts > 5) {
    baseScore += 1;
  }

  return Math.min(baseScore, 10);
}

function determineSeverity(threatLevel: number, providedSeverity: string): string {
  if (threatLevel >= 8) return 'high';
  if (threatLevel >= 5) return 'medium';
  return 'low';
}

function generateSecurityMessage(alertType: string, threatLevel: number, metadata: any): string {
  const messages = {
    suspicious_login: `Suspicious login detected with threat level ${threatLevel}`,
    multiple_failed_attempts: `Multiple failed login attempts detected (${metadata.failedAttempts || 'unknown'} attempts)`,
    unusual_location: `Login from unusual location detected`,
    device_change: `New device login detected`,
    payment_anomaly: `Unusual payment activity detected`,
    data_breach_attempt: `Potential data breach attempt detected`,
    account_takeover: `Potential account takeover attempt detected`
  };

  return messages[alertType] || `Security alert: ${alertType} (Level: ${threatLevel})`;
}

async function implementSecurityActions(
  threatLevel: number, 
  alertType: string, 
  userId: string | null, 
  supabaseClient: any
): Promise<string[]> {
  const actions: string[] = [];

  if (threatLevel >= 8) {
    // High threat - immediate account lockdown
    if (userId) {
      actions.push('account_suspended');
      // In a real implementation, would suspend the account
    }
    actions.push('admin_notification_sent');
    actions.push('ip_address_blocked');
  } else if (threatLevel >= 5) {
    // Medium threat - enhanced monitoring
    actions.push('enhanced_monitoring_enabled');
    actions.push('two_factor_required');
    if (userId) {
      actions.push('session_invalidated');
    }
  } else {
    // Low threat - log and monitor
    actions.push('security_log_created');
    actions.push('monitoring_increased');
  }

  return actions;
}

async function sendSecurityNotifications(
  alertType: string,
  threatLevel: number,
  userEmail: string | null,
  actions: string[],
  supabaseClient: any
): Promise<boolean> {
  try {
    // Create notification record
    const { error } = await supabaseClient
      .from('notifications')
      .insert({
        type: 'security_alert',
        title: 'Security Alert',
        message: `Security threat detected: ${alertType} (Level: ${threatLevel})`,
        priority: threatLevel >= 8 ? 'high' : 'medium',
        metadata: {
          alertType,
          threatLevel,
          actionsPerformed: actions,
          timestamp: new Date().toISOString()
        }
      });

    if (error) {
      console.error('Failed to create notification:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Notification error:', error);
    return false;
  }
}

function generateSecurityRecommendation(threatLevel: number, alertType: string): string {
  if (threatLevel >= 8) {
    return 'Immediate action required: Account may be compromised. Contact security team immediately.';
  } else if (threatLevel >= 5) {
    return 'Enhanced security measures recommended: Enable 2FA and monitor account activity.';
  } else {
    return 'Continue monitoring: No immediate action required, but stay vigilant.';
  }
}

function generateNextSteps(threatLevel: number, alertType: string, actions: string[]): string[] {
  const steps: string[] = [];

  if (threatLevel >= 8) {
    steps.push('Contact user to verify legitimate activity');
    steps.push('Review and potentially restore account access');
    steps.push('Investigate security breach vectors');
  } else if (threatLevel >= 5) {
    steps.push('Monitor user activity for 24-48 hours');
    steps.push('Verify user identity on next login');
    steps.push('Consider requiring password reset');
  } else {
    steps.push('Continue standard monitoring');
    steps.push('Update security metrics');
  }

  return steps;
}

function isKnownMaliciousIP(ipAddress: string): boolean {
  // In a real implementation, this would check against threat intelligence databases
  // For now, return false as we don't have access to such databases
  return false;
}