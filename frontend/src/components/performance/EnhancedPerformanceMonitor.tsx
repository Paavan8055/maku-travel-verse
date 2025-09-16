import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle, TrendingUp, Zap, DollarSign, Users, Clock } from 'lucide-react';
import { autoScalingManager } from "@/features/agents/lib/autoScalingManager";
import { predictiveWorkflowManager, PredictiveAlert } from "@/features/agents/lib/predictiveWorkflows";

interface PerformanceMetrics {
  responseTime: number;
  successRate: number;
  throughput: number;
  errorRate: number;
  costEfficiency: number;
  activeAgents: number;
  queueDepth: number;
  memoryUsage: number;
}

interface ScalingStatus {
  currentAction: string;
  lastDecision: Date;
  costImpact: number;
  nextEvaluation: Date;
}

export const EnhancedPerformanceMonitor = () => {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    responseTime: 0,
    successRate: 0,
    throughput: 0,
    errorRate: 0,
    costEfficiency: 0,
    activeAgents: 0,
    queueDepth: 0,
    memoryUsage: 0
  });

  const [scalingStatus, setScalingStatus] = useState<ScalingStatus | null>(null);
  const [predictiveAlerts, setPredictiveAlerts] = useState<PredictiveAlert[]>([]);
  const [isOptimizing, setIsOptimizing] = useState(false);

  useEffect(() => {
    const collectMetrics = async () => {
      try {
        // Collect performance metrics
        const performanceEntries = performance.getEntriesByType('navigation');
        const navigationEntry = performanceEntries[0] as PerformanceNavigationTiming;

        // Simulate real-time metrics (in production, these would come from your backend)
        const newMetrics: PerformanceMetrics = {
          responseTime: navigationEntry?.responseEnd - navigationEntry?.responseStart || 0,
          successRate: 0.95 + Math.random() * 0.05, // 95-100%
          throughput: Math.floor(50 + Math.random() * 50), // 50-100 req/min
          errorRate: Math.random() * 0.05, // 0-5%
          costEfficiency: 0.8 + Math.random() * 0.2, // 80-100%
          activeAgents: Math.floor(30 + Math.random() * 40), // 30-70 agents
          queueDepth: Math.floor(Math.random() * 20), // 0-20 tasks
          memoryUsage: 40 + Math.random() * 40 // 40-80% memory usage
        };

        setMetrics(newMetrics);

        // Get auto-scaling status
        const scalingHistory = autoScalingManager.getScalingHistory();
        if (scalingHistory.length > 0) {
          const lastDecision = scalingHistory[scalingHistory.length - 1];
          setScalingStatus({
            currentAction: lastDecision.decision.action,
            lastDecision: lastDecision.timestamp,
            costImpact: lastDecision.decision.estimatedCostImpact,
            nextEvaluation: new Date(Date.now() + 60000) // Next minute
          });
        }

        // Get predictive alerts
        const alerts = await predictiveWorkflowManager.analyzeSystemHealth();
        setPredictiveAlerts(alerts.slice(0, 5)); // Show top 5 alerts

      } catch (error) {
        console.error('Failed to collect performance metrics:', error);
      }
    };

    collectMetrics();
    const interval = setInterval(collectMetrics, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, []);

  const handleOptimizePerformance = async () => {
    setIsOptimizing(true);
    try {
      // Trigger performance optimization
      const decision = await autoScalingManager.analyzeScalingNeeds();
      if (decision.action !== 'maintain') {
        await autoScalingManager.executeScalingDecision(decision);
      }
      
      // Simulate optimization delay
      setTimeout(() => setIsOptimizing(false), 2000);
    } catch (error) {
      console.error('Optimization failed:', error);
      setIsOptimizing(false);
    }
  };

  const getPerformanceColor = (value: number, type: 'good' | 'bad') => {
    if (type === 'good') {
      return value > 0.9 ? 'text-green-600' : value > 0.7 ? 'text-yellow-600' : 'text-red-600';
    } else {
      return value < 0.1 ? 'text-green-600' : value < 0.3 ? 'text-yellow-600' : 'text-red-600';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'destructive';
      case 'high': return 'destructive';
      case 'medium': return 'default';
      case 'low': return 'secondary';
      default: return 'default';
    }
  };

  return (
    <div className="space-y-6">
      {/* Performance Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Response Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Math.round(metrics.responseTime)}ms</div>
            <p className="text-xs text-muted-foreground">
              Target: &lt;2000ms
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getPerformanceColor(metrics.successRate, 'good')}`}>
              {(metrics.successRate * 100).toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">
              Target: &gt;95%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Agents</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.activeAgents}</div>
            <p className="text-xs text-muted-foreground">
              Queue: {metrics.queueDepth} tasks
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cost Efficiency</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getPerformanceColor(metrics.costEfficiency, 'good')}`}>
              {(metrics.costEfficiency * 100).toFixed(0)}%
            </div>
            <p className="text-xs text-muted-foreground">
              Optimized routing
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Auto-Scaling Status */}
      {scalingStatus && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              Auto-Scaling Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm font-medium mb-1">Current Action</p>
                <Badge variant={scalingStatus.currentAction === 'maintain' ? 'secondary' : 'default'}>
                  {scalingStatus.currentAction.replace('_', ' ')}
                </Badge>
              </div>
              <div>
                <p className="text-sm font-medium mb-1">Cost Impact</p>
                <p className={`text-lg font-bold ${scalingStatus.costImpact > 0 ? 'text-red-600' : 'text-green-600'}`}>
                  {scalingStatus.costImpact > 0 ? '+' : ''}${Math.abs(scalingStatus.costImpact).toFixed(2)}/hr
                </p>
              </div>
              <div>
                <p className="text-sm font-medium mb-1">Next Evaluation</p>
                <p className="text-sm text-muted-foreground">
                  {scalingStatus.nextEvaluation.toLocaleTimeString()}
                </p>
              </div>
            </div>
            
            <div className="mt-4">
              <button
                onClick={handleOptimizePerformance}
                disabled={isOptimizing}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50"
              >
                {isOptimizing ? 'Optimizing...' : 'Optimize Now'}
              </button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* System Health Metrics */}
      <Card>
        <CardHeader>
          <CardTitle>System Health Metrics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Memory Usage</span>
                <span>{metrics.memoryUsage.toFixed(1)}%</span>
              </div>
              <Progress value={metrics.memoryUsage} className="h-2" />
            </div>
            
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Error Rate</span>
                <span className={getPerformanceColor(metrics.errorRate, 'bad')}>
                  {(metrics.errorRate * 100).toFixed(2)}%
                </span>
              </div>
              <Progress value={metrics.errorRate * 100} className="h-2" />
            </div>
            
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Throughput</span>
                <span>{metrics.throughput} req/min</span>
              </div>
              <Progress value={(metrics.throughput / 100) * 100} className="h-2" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Predictive Alerts */}
      {predictiveAlerts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Predictive Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {predictiveAlerts.map((alert) => (
                <Alert key={alert.id} className="border-l-4 border-l-warning">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle className="flex items-center gap-2">
                    {alert.title}
                    <Badge variant={getSeverityColor(alert.severity)}>
                      {alert.severity}
                    </Badge>
                  </AlertTitle>
                  <AlertDescription>
                    <p className="mb-2">{alert.description}</p>
                    <p className="text-xs text-muted-foreground">
                      Confidence: {(alert.confidence * 100).toFixed(0)}% • 
                      Impact: {alert.estimatedImpact}
                    </p>
                    {alert.recommendedActions.length > 0 && (
                      <div className="mt-2">
                        <p className="text-xs font-medium mb-1">Recommended Actions:</p>
                        <ul className="text-xs text-muted-foreground list-disc list-inside">
                          {alert.recommendedActions.slice(0, 2).map((action, index) => (
                            <li key={index}>{action}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </AlertDescription>
                </Alert>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};