import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  AlertTriangle, 
  Clock, 
  TrendingUp, 
  Shield, 
  Activity,
  RefreshCw,
  Eye,
  CheckCircle
} from 'lucide-react';
import { advancedAnalytics, PredictiveAlert, IssueResolutionMetrics } from '@/lib/advancedAnalytics';
import ProductionErrorBoundary from '@/components/error/ProductionErrorBoundary';
import { secureLogger } from '@/utils/secureLogger';

const PredictiveMaintenancePanel: React.FC = () => {
  const [alerts, setAlerts] = useState<PredictiveAlert[]>([]);
  const [resolutionMetrics, setResolutionMetrics] = useState<IssueResolutionMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  useEffect(() => {
    loadData();
    
    // Set up periodic refresh
    const interval = setInterval(loadData, 300000); // Every 5 minutes
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    const startTime = Date.now();
    try {
      setLoading(true);
      
      const [alertsData, metricsData] = await Promise.all([
        advancedAnalytics.generatePredictiveAlerts(),
        advancedAnalytics.getIssueResolutionMetrics()
      ]);
      
      setAlerts(alertsData);
      setResolutionMetrics(metricsData);
      setLastUpdate(new Date());
      
      secureLogger.info('Predictive maintenance data loaded', {
        component: 'PredictiveMaintenancePanel',
        alertCount: alertsData.length,
        duration: Date.now() - startTime
      });
    } catch (error) {
      secureLogger.error('Failed to load predictive maintenance data', error as Error, {
        component: 'PredictiveMaintenancePanel'
      });
    } finally {
      setLoading(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-600 bg-red-50';
      case 'high': return 'text-orange-600 bg-orange-50';
      case 'medium': return 'text-yellow-600 bg-yellow-50';
      case 'low': return 'text-blue-600 bg-blue-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical': return <AlertTriangle className="h-4 w-4 text-red-600" />;
      case 'high': return <AlertTriangle className="h-4 w-4 text-orange-600" />;
      case 'medium': return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'low': return <Activity className="h-4 w-4 text-blue-600" />;
      default: return <Activity className="h-4 w-4 text-gray-600" />;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'capacity': return <TrendingUp className="h-5 w-5" />;
      case 'performance': return <Activity className="h-5 w-5" />;
      case 'failure': return <AlertTriangle className="h-5 w-5" />;
      case 'security': return <Shield className="h-5 w-5" />;
      default: return <Activity className="h-5 w-5" />;
    }
  };

  const formatDuration = (seconds: number): string => {
    if (seconds < 60) return `${seconds}s`;
    if (seconds < 3600) return `${Math.round(seconds / 60)}m`;
    return `${Math.round(seconds / 3600)}h`;
  };

  if (loading && !alerts.length && !resolutionMetrics) {
    return (
      <div className="space-y-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="animate-pulse space-y-3">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-8 bg-gray-200 rounded w-1/2"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <ProductionErrorBoundary>
      <div className="space-y-6">
        {/* Header */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Predictive Maintenance Dashboard
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">
                  Last updated: {lastUpdate.toLocaleTimeString()}
                </span>
                <Button onClick={loadData} variant="outline" size="sm" disabled={loading}>
                  <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
        </Card>

        {/* Issue Resolution Metrics */}
        {resolutionMetrics && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <Clock className="h-8 w-8 text-blue-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-muted-foreground">Avg Resolution Time</p>
                    <p className="text-2xl font-bold">{formatDuration(resolutionMetrics.avgResolutionTime / 1000)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <CheckCircle className="h-8 w-8 text-green-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-muted-foreground">First Call Resolution</p>
                    <p className="text-2xl font-bold">{(resolutionMetrics.firstCallResolutionRate * 100).toFixed(1)}%</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <AlertTriangle className="h-8 w-8 text-orange-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-muted-foreground">Escalation Rate</p>
                    <p className="text-2xl font-bold">{(resolutionMetrics.escalationRate * 100).toFixed(1)}%</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <Activity className="h-8 w-8 text-purple-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-muted-foreground">Active Alerts</p>
                    <p className="text-2xl font-bold">{alerts.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Predictive Alerts */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Predictive Alerts
              {alerts.filter(a => a.severity === 'critical').length > 0 && (
                <Badge variant="destructive" className="ml-2">
                  {alerts.filter(a => a.severity === 'critical').length} Critical
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {alerts.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-500" />
                <p>No predictive alerts at this time. System is running optimally.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {alerts
                  .sort((a, b) => {
                    const severityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
                    return severityOrder[b.severity] - severityOrder[a.severity];
                  })
                  .map((alert) => (
                    <div
                      key={alert.id}
                      className={`p-4 rounded-lg border ${getSeverityColor(alert.severity)}`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3">
                          <div className="flex items-center gap-2">
                            {getTypeIcon(alert.type)}
                            {getSeverityIcon(alert.severity)}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <Badge variant="outline" className="capitalize">
                                {alert.type}
                              </Badge>
                              <Badge 
                                variant={alert.severity === 'critical' ? 'destructive' : 'secondary'}
                                className="capitalize"
                              >
                                {alert.severity}
                              </Badge>
                              <span className="text-xs text-muted-foreground">
                                Confidence: {(alert.confidence * 100).toFixed(0)}%
                              </span>
                            </div>
                            <p className="font-medium mb-2">{alert.prediction}</p>
                            <p className="text-sm text-muted-foreground mb-3">
                              Estimated time to impact: {alert.estimatedTime}
                            </p>
                            <div className="space-y-1">
                              <p className="text-sm font-medium">Recommended Actions:</p>
                              <ul className="text-sm space-y-1">
                                {alert.recommendations.map((rec, index) => (
                                  <li key={index} className="flex items-center gap-2">
                                    <div className="w-1 h-1 bg-current rounded-full" />
                                    {rec}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Progress 
                            value={alert.confidence * 100} 
                            className="w-16 h-2"
                          />
                          <Button variant="outline" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Resolution Time by Type */}
        {resolutionMetrics && Object.keys(resolutionMetrics.resolutionTimeByType).length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Resolution Time by Issue Type</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(resolutionMetrics.resolutionTimeByType).map(([type, time]) => (
                  <div key={type} className="flex items-center justify-between">
                    <span className="font-medium capitalize">{type.replace('_', ' ')}</span>
                    <span className="text-muted-foreground">{formatDuration(time / 1000)}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </ProductionErrorBoundary>
  );
};

export default PredictiveMaintenancePanel;