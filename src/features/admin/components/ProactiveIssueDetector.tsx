import React, { useState, useEffect } from 'react';
import { AlertTriangle, TrendingDown, Zap, Shield, CheckCircle, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useAdminDataContext } from '@/components/admin/RealTimeAdminData';
import { useEnhancedRecovery } from '../hooks/useEnhancedRecovery';
import { toast } from 'sonner';

interface ProactiveIssue {
  id: string;
  type: 'performance' | 'connectivity' | 'business' | 'security' | 'prediction';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  impact: string;
  recommendation: string;
  confidence: number;
  autoFixAvailable: boolean;
  preventive: boolean;
  detectedAt: Date;
  trend?: 'increasing' | 'stable' | 'decreasing';
  metrics?: Record<string, number>;
}

export const ProactiveIssueDetector: React.FC = () => {
  const [detectedIssues, setDetectedIssues] = useState<ProactiveIssue[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [lastAnalysisTime, setLastAnalysisTime] = useState<Date | null>(null);
  const adminData = useAdminDataContext();
  const { executeEnhancedRecovery, isExecuting } = useEnhancedRecovery();

  const analyzeSystemProactively = () => {
    setIsAnalyzing(true);
    const issues: ProactiveIssue[] = [];
    const now = new Date();

    // 1. Booking Conversion Rate Analysis
    const recentBookings = adminData.bookings.filter(b => 
      new Date(b.created_at) > new Date(Date.now() - 24 * 60 * 60 * 1000)
    );
    const confirmedBookings = recentBookings.filter(b => b.status === 'confirmed');
    const conversionRate = recentBookings.length > 0 ? (confirmedBookings.length / recentBookings.length) * 100 : 100;

    if (conversionRate < 80 && recentBookings.length > 10) {
      issues.push({
        id: `conversion-trend-${now.getTime()}`,
        type: 'business',
        severity: conversionRate < 60 ? 'high' : 'medium',
        title: 'Declining Booking Conversion Rate',
        description: `Conversion rate has dropped to ${conversionRate.toFixed(1)}% (target: >80%)`,
        impact: `Potential revenue loss: ${((80 - conversionRate) * recentBookings.length * 0.01 * 150).toFixed(0)} USD`,
        recommendation: 'Investigate payment flow, provider availability, and checkout process',
        confidence: 0.85,
        autoFixAvailable: true,
        preventive: false,
        detectedAt: now,
        trend: 'decreasing',
        metrics: { conversionRate, totalBookings: recentBookings.length }
      });
    }

    // 2. Payment Processing Anomaly Detection
    const paymentErrors = adminData.systemLogs.filter(log => 
      log.message?.toLowerCase().includes('payment') && 
      log.log_level === 'error' &&
      new Date(log.created_at) > new Date(Date.now() - 2 * 60 * 60 * 1000)
    );

    if (paymentErrors.length > 3) {
      issues.push({
        id: `payment-anomaly-${now.getTime()}`,
        type: 'business',
        severity: paymentErrors.length > 10 ? 'critical' : 'high',
        title: 'Payment Processing Anomaly',
        description: `${paymentErrors.length} payment errors detected in last 2 hours`,
        impact: 'Customer checkout failures leading to abandoned bookings',
        recommendation: 'Check Stripe webhook status and payment service health',
        confidence: 0.92,
        autoFixAvailable: true,
        preventive: false,
        detectedAt: now,
        trend: 'increasing',
        metrics: { errorCount: paymentErrors.length }
      });
    }

    // 3. Provider Health Degradation Prediction
    const degradedProviders = adminData.providerHealth.filter(p => 
      p.response_time > 3000 || p.error_count > 5
    );

    if (degradedProviders.length > 0) {
      issues.push({
        id: `provider-degradation-${now.getTime()}`,
        type: 'connectivity',
        severity: degradedProviders.length > 2 ? 'high' : 'medium',
        title: 'Provider Performance Degradation',
        description: `${degradedProviders.length} provider(s) showing performance issues`,
        impact: 'Slower search results and potential booking failures',
        recommendation: 'Proactively reset connections before full outage occurs',
        confidence: 0.78,
        autoFixAvailable: true,
        preventive: true,
        detectedAt: now,
        trend: 'stable',
        metrics: { 
          avgResponseTime: degradedProviders.reduce((sum, p) => sum + p.response_time, 0) / degradedProviders.length,
          totalErrors: degradedProviders.reduce((sum, p) => sum + p.error_count, 0)
        }
      });
    }

    // 4. Security Pattern Detection
    const recentFailedLogins = adminData.systemLogs.filter(log => 
      log.message?.toLowerCase().includes('failed') && 
      log.message?.toLowerCase().includes('login') &&
      new Date(log.created_at) > new Date(Date.now() - 60 * 60 * 1000)
    );

    if (recentFailedLogins.length > 5) {
      issues.push({
        id: `security-pattern-${now.getTime()}`,
        type: 'security',
        severity: recentFailedLogins.length > 20 ? 'critical' : 'medium',
        title: 'Suspicious Login Activity',
        description: `${recentFailedLogins.length} failed login attempts in last hour`,
        impact: 'Potential brute force attack or compromised accounts',
        recommendation: 'Review access logs and consider temporary IP restrictions',
        confidence: 0.65,
        autoFixAvailable: false,
        preventive: false,
        detectedAt: now,
        trend: 'increasing',
        metrics: { failedAttempts: recentFailedLogins.length }
      });
    }

    // 5. Performance Prediction Based on Load
    const recentRequests = adminData.systemLogs.filter(log => 
      new Date(log.created_at) > new Date(Date.now() - 15 * 60 * 1000)
    ).length;

    if (recentRequests > 1000) { // High load threshold
      issues.push({
        id: `performance-prediction-${now.getTime()}`,
        type: 'performance',
        severity: 'medium',
        title: 'High Load Predicted',
        description: `System load increasing: ${recentRequests} requests in 15 minutes`,
        impact: 'Potential slowdowns and timeouts if trend continues',
        recommendation: 'Consider scaling resources or enabling rate limiting',
        confidence: 0.72,
        autoFixAvailable: true,
        preventive: true,
        detectedAt: now,
        trend: 'increasing',
        metrics: { requestCount: recentRequests }
      });
    }

    setDetectedIssues(issues);
    setLastAnalysisTime(now);
    setIsAnalyzing(false);
  };

  const handleAutoFix = async (issue: ProactiveIssue) => {
    try {
      let recoveryPlan = '';
      
      switch (issue.type) {
        case 'business':
          if (issue.title.includes('Payment')) {
            recoveryPlan = 'payment_system_recovery';
          } else {
            recoveryPlan = 'booking_optimization';
          }
          break;
        case 'connectivity':
          recoveryPlan = 'provider_health_optimization';
          break;
        case 'performance':
          recoveryPlan = 'performance_optimization';
          break;
        default:
          recoveryPlan = 'general_system_recovery';
      }

      const result = await executeEnhancedRecovery(recoveryPlan, issue);
      
      if (result.success) {
        setDetectedIssues(prev => prev.filter(i => i.id !== issue.id));
        toast.success(`Successfully resolved: ${issue.title}`);
      } else {
        toast.error(`Resolution failed: ${result.message}`);
      }
    } catch (error) {
      toast.error('Auto-fix failed. Manual intervention may be required.');
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-600 bg-red-50 border-red-200';
      case 'high': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      default: return 'text-blue-600 bg-blue-50 border-blue-200';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'performance': return TrendingDown;
      case 'connectivity': return Zap;
      case 'business': return AlertTriangle;
      case 'security': return Shield;
      default: return AlertCircle;
    }
  };

  const getTrendIcon = (trend?: string) => {
    switch (trend) {
      case 'increasing': return '📈';
      case 'decreasing': return '📉';
      case 'stable': return '➡️';
      default: return '';
    }
  };

  useEffect(() => {
    analyzeSystemProactively();
    const interval = setInterval(analyzeSystemProactively, 30000); // Check every 30 seconds
    return () => clearInterval(interval);
  }, [adminData]);

  const criticalIssues = detectedIssues.filter(i => i.severity === 'critical');
  const preventiveIssues = detectedIssues.filter(i => i.preventive);

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              <div>
                <p className="text-sm font-medium">Active Issues</p>
                <p className="text-2xl font-bold">{detectedIssues.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <AlertCircle className="h-5 w-5 text-red-500" />
              <div>
                <p className="text-sm font-medium">Critical</p>
                <p className="text-2xl font-bold text-red-600">{criticalIssues.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Shield className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-sm font-medium">Preventive</p>
                <p className="text-2xl font-bold text-blue-600">{preventiveIssues.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-sm font-medium">System Health</p>
                <p className="text-sm font-bold text-green-600">{adminData.getHealthStatus()}</p>
                {lastAnalysisTime && (
                  <p className="text-xs text-muted-foreground">
                    Last scan: {lastAnalysisTime.toLocaleTimeString()}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Issues Display */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-primary" />
              Proactive Issue Detection
            </CardTitle>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={analyzeSystemProactively}
              disabled={isAnalyzing}
            >
              {isAnalyzing ? 'Scanning...' : 'Scan Now'}
            </Button>
          </div>
        </CardHeader>
        
        <CardContent>
          {detectedIssues.length === 0 ? (
            <div className="text-center py-8">
              <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-green-600 mb-2">
                All Systems Operating Normally
              </h3>
              <p className="text-muted-foreground">
                No issues detected. Continuous monitoring is active.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {detectedIssues
                .sort((a, b) => {
                  const severityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
                  return severityOrder[b.severity] - severityOrder[a.severity];
                })
                .map((issue) => {
                  const TypeIcon = getTypeIcon(issue.type);
                  return (
                    <div key={issue.id} className={`border rounded-lg p-4 space-y-3 ${getSeverityColor(issue.severity)}`}>
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3 flex-1">
                          <TypeIcon className="h-5 w-5 mt-0.5" />
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-medium">{issue.title}</h4>
                              {issue.preventive && (
                                <Badge variant="outline" className="text-xs">Preventive</Badge>
                              )}
                              {issue.trend && (
                                <span className="text-sm">{getTrendIcon(issue.trend)}</span>
                              )}
                            </div>
                            
                            <p className="text-sm mb-2">{issue.description}</p>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                              <div>
                                <span className="font-medium">Impact:</span> {issue.impact}
                              </div>
                              <div>
                                <span className="font-medium">Recommendation:</span> {issue.recommendation}
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-4 mt-2">
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-medium">Confidence:</span>
                                <Progress value={issue.confidence * 100} className="w-16 h-2" />
                                <span className="text-xs">{(issue.confidence * 100).toFixed(0)}%</span>
                              </div>
                              
                              {issue.metrics && (
                                <div className="text-xs text-muted-foreground">
                                  {Object.entries(issue.metrics).map(([key, value]) => (
                                    <span key={key} className="mr-3">
                                      {key}: {typeof value === 'number' ? value.toFixed(1) : value}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex flex-col gap-2">
                          <Badge className={getSeverityColor(issue.severity)}>
                            {issue.severity}
                          </Badge>
                          
                          {issue.autoFixAvailable && (
                            <Button
                              size="sm"
                              onClick={() => handleAutoFix(issue)}
                              disabled={isExecuting}
                              className="min-w-[80px]"
                            >
                              {isExecuting ? 'Fixing...' : 'Auto Fix'}
                            </Button>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>Detected: {issue.detectedAt.toLocaleString()}</span>
                        <span>Type: {issue.type.charAt(0).toUpperCase() + issue.type.slice(1)}</span>
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};