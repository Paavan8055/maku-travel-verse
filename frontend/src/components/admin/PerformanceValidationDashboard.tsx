import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  Clock, 
  Zap, 
  Database, 
  Server, 
  CheckCircle, 
  AlertTriangle,
  XCircle,
  TrendingUp,
  Activity,
  Target
} from 'lucide-react';

interface PerformanceMetric {
  id: string;
  metric_name: string;
  current_value: number;
  target_value: number;
  unit: string;
  status: 'healthy' | 'warning' | 'critical';
  last_updated: string;
  trend: 'up' | 'down' | 'stable';
}

interface ValidationResult {
  id: string;
  test_name: string;
  category: 'api' | 'database' | 'frontend' | 'agent';
  status: 'passed' | 'failed' | 'warning';
  response_time: number;
  target_time: number;
  message: string;
  tested_at: string;
}

export const PerformanceValidationDashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<PerformanceMetric[]>([]);
  const [validationResults, setValidationResults] = useState<ValidationResult[]>([]);
  const [isValidating, setIsValidating] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchPerformanceMetrics();
    fetchValidationResults();
  }, []);

  const fetchPerformanceMetrics = async () => {
    try {
      // Mock performance metrics for display
      const mockMetrics: PerformanceMetric[] = [
        {
          id: '1',
          metric_name: 'api_response_time',
          current_value: 85,
          target_value: 100,
          unit: 'ms',
          status: 'healthy',
          last_updated: new Date().toISOString(),
          trend: 'stable'
        },
        {
          id: '2',
          metric_name: 'database_query_time',
          current_value: 45,
          target_value: 50,
          unit: 'ms',
          status: 'healthy',
          last_updated: new Date().toISOString(),
          trend: 'down'
        },
        {
          id: '3',
          metric_name: 'success_rate',
          current_value: 99.5,
          target_value: 99.0,
          unit: '%',
          status: 'healthy',
          last_updated: new Date().toISOString(),
          trend: 'up'
        }
      ];
      setMetrics(mockMetrics);
    } catch (error) {
      console.error('Error fetching performance metrics:', error);
    }
  };

  const fetchValidationResults = async () => {
    try {
      // Mock validation results for display
      const mockResults: ValidationResult[] = [
        {
          id: '1',
          test_name: 'API Response Time Test',
          category: 'api',
          status: 'passed',
          response_time: 85,
          target_time: 100,
          message: 'API response times within acceptable limits',
          tested_at: new Date().toISOString()
        },
        {
          id: '2',
          test_name: 'Database Query Performance',
          category: 'database',
          status: 'passed',
          response_time: 45,
          target_time: 50,
          message: 'Database queries executing efficiently',
          tested_at: new Date().toISOString()
        },
        {
          id: '3',
          test_name: 'Agent Response Validation',
          category: 'agent',
          status: 'warning',
          response_time: 150,
          target_time: 100,
          message: 'Agent response slightly slower than target',
          tested_at: new Date().toISOString()
        }
      ];
      setValidationResults(mockResults);
    } catch (error) {
      console.error('Error fetching validation results:', error);
    }
  };

  const runPerformanceValidation = async () => {
    setIsValidating(true);
    try {
      const { data, error } = await supabase.functions.invoke('performance-monitor', {
        body: { type: 'comprehensive_validation' }
      });

      if (error) throw error;

      toast({
        title: "Performance Validation Started",
        description: "Running comprehensive performance tests...",
      });

      // Refresh data after validation
      setTimeout(() => {
        fetchPerformanceMetrics();
        fetchValidationResults();
      }, 3000);
    } catch (error) {
      console.error('Performance validation error:', error);
      toast({
        title: "Validation Failed",
        description: "Failed to run performance validation",
        variant: "destructive"
      });
    } finally {
      setIsValidating(false);
    }
  };

  const getMetricIcon = (category: string) => {
    switch (category) {
      case 'api':
        return <Server className="h-4 w-4" />;
      case 'database':
        return <Database className="h-4 w-4" />;
      case 'frontend':
        return <Activity className="h-4 w-4" />;
      case 'agent':
        return <Target className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
      case 'passed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'critical':
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
      case 'passed':
        return 'default';
      case 'warning':
        return 'secondary';
      case 'critical':
      case 'failed':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="h-3 w-3 text-green-500" />;
      case 'down':
        return <TrendingUp className="h-3 w-3 text-red-500 rotate-180" />;
      default:
        return <Activity className="h-3 w-3 text-gray-500" />;
    }
  };

  const calculateOverallScore = () => {
    if (metrics.length === 0) return 0;
    
    const scores = metrics.map(metric => {
      const percentage = (metric.current_value / metric.target_value) * 100;
      if (metric.metric_name.includes('response_time') || metric.metric_name.includes('latency')) {
        // Lower is better for response times
        return Math.max(0, Math.min(100, (metric.target_value / metric.current_value) * 100));
      }
      return Math.max(0, Math.min(100, percentage));
    });

    return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
  };

  const overallScore = calculateOverallScore();

  return (
    <div className="space-y-6">
      {/* Performance Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Overall Score</p>
                <p className="text-3xl font-bold">{overallScore}%</p>
              </div>
              <div className="h-12 w-12 bg-primary/10 rounded-full flex items-center justify-center">
                <Target className="h-6 w-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">API Response</p>
                <p className="text-3xl font-bold">
                  {metrics.find(m => m.metric_name === 'api_response_time')?.current_value || 0}ms
                </p>
              </div>
              <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
                <Clock className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">DB Queries</p>
                <p className="text-3xl font-bold">
                  {metrics.find(m => m.metric_name === 'database_query_time')?.current_value || 0}ms
                </p>
              </div>
              <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center">
                <Database className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Success Rate</p>
                <p className="text-3xl font-bold">
                  {metrics.find(m => m.metric_name === 'success_rate')?.current_value || 0}%
                </p>
              </div>
              <div className="h-12 w-12 bg-purple-100 rounded-full flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Metrics */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Performance Metrics
              </CardTitle>
              <CardDescription>
                Real-time system performance indicators
              </CardDescription>
            </div>
            <Button onClick={runPerformanceValidation} disabled={isValidating}>
              {isValidating ? (
                <Activity className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Target className="h-4 w-4 mr-2" />
              )}
              {isValidating ? 'Validating...' : 'Run Validation'}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {metrics.map((metric) => (
              <div key={metric.id} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(metric.status)}
                    <div>
                      <h4 className="font-medium">{metric.metric_name.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</h4>
                      <p className="text-sm text-muted-foreground">
                        Current: {metric.current_value}{metric.unit} • Target: {metric.target_value}{metric.unit}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {getTrendIcon(metric.trend)}
                    <Badge variant={getStatusColor(metric.status)}>
                      {metric.status}
                    </Badge>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Performance vs Target</span>
                    <span>
                      {Math.round((metric.current_value / metric.target_value) * 100)}%
                    </span>
                  </div>
                  <Progress 
                    value={Math.min(100, (metric.current_value / metric.target_value) * 100)} 
                    className="h-2"
                  />
                </div>
              </div>
            ))}

            {metrics.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <Target className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No performance metrics available</p>
                <p className="text-sm">Run validation to generate performance data</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Validation Results */}
      <Card>
        <CardHeader>
          <CardTitle>Validation Results</CardTitle>
          <CardDescription>
            Recent performance validation test results
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {validationResults.map((result) => (
              <div key={result.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  {getMetricIcon(result.category)}
                  <div>
                    <p className="font-medium">{result.test_name}</p>
                    <p className="text-sm text-muted-foreground">{result.message}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-right">
                  <div>
                    <p className="text-sm font-medium">
                      {result.response_time}ms / {result.target_time}ms
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(result.tested_at).toLocaleString()}
                    </p>
                  </div>
                  <Badge variant={getStatusColor(result.status)}>
                    {result.status}
                  </Badge>
                </div>
              </div>
            ))}

            {validationResults.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No validation results found</p>
                <p className="text-sm">Run performance validation to see test results</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};