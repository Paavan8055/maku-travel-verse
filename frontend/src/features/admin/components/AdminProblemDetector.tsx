import React, { useEffect, useState } from 'react';
import { AlertTriangle, TrendingDown, Zap, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAdminDataContext } from '@/components/admin/RealTimeAdminData';
import { useAdminAI } from '../hooks/useAdminAI';
import { toast } from 'sonner';

interface DetectedIssue {
  id: string;
  type: 'performance' | 'connectivity' | 'business' | 'security';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  suggestedAction: string;
  autoFixAvailable: boolean;
  detectedAt: Date;
}

export const AdminProblemDetector: React.FC = () => {
  const [detectedIssues, setDetectedIssues] = useState<DetectedIssue[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const adminData = useAdminDataContext();
  const { detectPatterns, executeRecovery } = useAdminAI();

  const analyzeSystemIssues = () => {
    const issues: DetectedIssue[] = [];
    const now = new Date();

    // Check for booking conversion issues
    const recentBookings = adminData.bookings.filter(b => 
      new Date(b.created_at) > new Date(Date.now() - 24 * 60 * 60 * 1000)
    );
    const confirmedBookings = recentBookings.filter(b => b.status === 'confirmed');
    const conversionRate = recentBookings.length > 0 ? (confirmedBookings.length / recentBookings.length) * 100 : 100;

    if (conversionRate < 70 && recentBookings.length > 5) {
      issues.push({
        id: `conversion-${now.getTime()}`,
        type: 'business',
        severity: conversionRate < 50 ? 'high' : 'medium',
        title: 'Low Booking Conversion Rate',
        description: `Only ${conversionRate.toFixed(1)}% of recent bookings are confirmed. This suggests payment or booking flow issues.`,
        suggestedAction: 'Check payment gateway and provider connectivity',
        autoFixAvailable: true,
        detectedAt: now
      });
    }

    // Check for provider health issues
    const unhealthyProviders = adminData.providerHealth.filter(p => p.status !== 'healthy');
    if (unhealthyProviders.length > 0) {
      issues.push({
        id: `providers-${now.getTime()}`,
        type: 'connectivity',
        severity: unhealthyProviders.length > 2 ? 'high' : 'medium',
        title: 'Provider Connectivity Issues',
        description: `${unhealthyProviders.length} provider(s) are experiencing issues: ${unhealthyProviders.map(p => p.provider).join(', ')}`,
        suggestedAction: 'Reset connections and check API quotas',
        autoFixAvailable: true,
        detectedAt: now
      });
    }

    // Check for error spikes
    const recentErrors = adminData.systemLogs.filter(log => 
      log.log_level === 'error' && 
      new Date(log.created_at) > new Date(Date.now() - 60 * 60 * 1000)
    );

    if (recentErrors.length > 20) {
      issues.push({
        id: `errors-${now.getTime()}`,
        type: 'performance',
        severity: 'high',
        title: 'High Error Rate',
        description: `${recentErrors.length} errors in the last hour. This indicates system instability.`,
        suggestedAction: 'Review error logs and restart affected services',
        autoFixAvailable: true,
        detectedAt: now
      });
    }

    // Check for payment issues
    const failedPayments = adminData.systemLogs.filter(log => 
      log.message?.toLowerCase().includes('payment') && 
      log.log_level === 'error' &&
      new Date(log.created_at) > new Date(Date.now() - 2 * 60 * 60 * 1000)
    );

    if (failedPayments.length > 5) {
      issues.push({
        id: `payments-${now.getTime()}`,
        type: 'business',
        severity: 'high',
        title: 'Payment System Issues',
        description: `${failedPayments.length} payment errors in the last 2 hours. Customers may be unable to complete bookings.`,
        suggestedAction: 'Check Stripe webhook status and payment flow',
        autoFixAvailable: true,
        detectedAt: now
      });
    }

    setDetectedIssues(issues);
  };

  const handleAutoFix = async (issue: DetectedIssue) => {
    setIsAnalyzing(true);
    try {
      let recoveryAction = '';
      
      switch (issue.type) {
        case 'connectivity':
          recoveryAction = 'reset_provider_connections';
          break;
        case 'business':
          if (issue.title.includes('Payment')) {
            recoveryAction = 'restart_payment_service';
          } else {
            recoveryAction = 'reset_booking_service';
          }
          break;
        case 'performance':
          recoveryAction = 'optimize_database';
          break;
        default:
          recoveryAction = 'general_system_check';
      }

      const result = await executeRecovery(recoveryAction);
      
      if (result.success) {
        setDetectedIssues(prev => prev.filter(i => i.id !== issue.id));
        toast.success(`Auto-fix completed for: ${issue.title}`);
      } else {
        toast.error(`Auto-fix failed: ${result.message}`);
      }
    } catch (error) {
      toast.error('Auto-fix failed. Please try manual resolution.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-600 bg-red-50';
      case 'high': return 'text-orange-600 bg-orange-50';
      case 'medium': return 'text-yellow-600 bg-yellow-50';
      default: return 'text-blue-600 bg-blue-50';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'performance': return TrendingDown;
      case 'connectivity': return Zap;
      case 'business': return AlertTriangle;
      default: return Clock;
    }
  };

  useEffect(() => {
    analyzeSystemIssues();
    const interval = setInterval(analyzeSystemIssues, 60000); // Check every minute
    return () => clearInterval(interval);
  }, [adminData]);

  if (detectedIssues.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-green-600 flex items-center gap-2">
            ✅ No Issues Detected
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            System is operating normally. I'm continuously monitoring for potential issues.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-orange-500" />
          Detected Issues ({detectedIssues.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {detectedIssues.map((issue) => {
          const TypeIcon = getTypeIcon(issue.type);
          return (
            <div key={issue.id} className="border rounded-lg p-4 space-y-3">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <TypeIcon className="h-5 w-5 mt-0.5" />
                  <div className="flex-1">
                    <h4 className="font-medium">{issue.title}</h4>
                    <p className="text-sm text-muted-foreground mt-1">
                      {issue.description}
                    </p>
                    <p className="text-sm font-medium mt-2 text-primary">
                      💡 {issue.suggestedAction}
                    </p>
                  </div>
                </div>
                <Badge className={getSeverityColor(issue.severity)}>
                  {issue.severity}
                </Badge>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">
                  Detected: {issue.detectedAt.toLocaleTimeString()}
                </span>
                {issue.autoFixAvailable && (
                  <Button
                    size="sm"
                    onClick={() => handleAutoFix(issue)}
                    disabled={isAnalyzing}
                  >
                    {isAnalyzing ? 'Fixing...' : 'Auto Fix'}
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
};