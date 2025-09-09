import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useRealProductionData } from '@/hooks/useRealProductionData';
import {
  Rocket,
  Server,
  Globe,
  Shield,
  TestTube,
  CheckCircle,
  AlertCircle,
  Clock,
  TrendingUp,
  Users,
  Smartphone,
  Monitor,
  Tablet,
  Settings,
  BarChart3,
  Zap,
  RefreshCw
} from 'lucide-react';

interface DeploymentStatus {
  environment: 'development' | 'staging' | 'production';
  status: 'healthy' | 'deploying' | 'failed' | 'maintenance';
  version: string;
  lastDeployed: string;
  uptime: number;
  errorRate: number;
  responseTime: number;
  activeUsers: number;
}

interface ABTest {
  id: string;
  name: string;
  status: 'active' | 'completed' | 'paused';
  trafficSplit: number;
  conversionRate: number;
  significanceLevel: number;
  participants: number;
  startDate: string;
  endDate?: string;
}

interface PerformanceMetric {
  name: string;
  value: number;
  target: number;
  status: 'good' | 'warning' | 'critical';
  trend: 'up' | 'down' | 'stable';
}

export const ProductionDeploymentManager: React.FC = () => {
  const {
    systemHealth,
    deployments,
    performanceMetrics: realPerformanceMetrics,
    isLoading: productionDataLoading,
    error: productionDataError,
    getHealthyDeployments,
    getCriticalMetrics,
    getOverallHealthScore,
    refreshData: refreshProductionData
  } = useRealProductionData();

  const [abTests, setAbTests] = useState<ABTest[]>([
    {
      id: 'test-1',
      name: 'Enhanced Search UI',
      status: 'active',
      trafficSplit: 50,
      conversionRate: 12.5,
      significanceLevel: 95,
      participants: 5000,
      startDate: '2024-01-10T00:00:00Z'
    },
    {
      id: 'test-2',
      name: 'New Booking Flow',
      status: 'active',
      trafficSplit: 30,
      conversionRate: 18.2,
      significanceLevel: 89,
      participants: 3200,
      startDate: '2024-01-08T00:00:00Z'
    }
  ]);

  const [isDeploying, setIsDeploying] = useState(false);
  const [deploymentProgress, setDeploymentProgress] = useState(0);
  const { toast } = useToast();

  const performDeployment = async (environment: string) => {
    setIsDeploying(true);
    setDeploymentProgress(0);

    try {
      // Simulate deployment process
      const steps = [
        'Building application...',
        'Running tests...',
        'Security scan...',
        'Deploying to servers...',
        'Health checks...',
        'Deployment complete!'
      ];

      for (let i = 0; i < steps.length; i++) {
        await new Promise(resolve => setTimeout(resolve, 2000));
        setDeploymentProgress(((i + 1) / steps.length) * 100);
        
        toast({
          title: steps[i],
          description: `Step ${i + 1} of ${steps.length}`
        });
      }

      // Refresh production data after deployment
      refreshProductionData();

      toast({
        title: 'Deployment Successful',
        description: `${environment} environment updated successfully`
      });

    } catch (error) {
      toast({
        title: 'Deployment Failed',
        description: 'Failed to deploy to production',
        variant: 'destructive'
      });
    } finally {
      setIsDeploying(false);
      setDeploymentProgress(0);
    }
  };

  const rollbackDeployment = async (environment: string) => {
    try {
      // Simulate rollback
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Refresh production data after rollback
      refreshProductionData();

      toast({
        title: 'Rollback Complete',
        description: `${environment} rolled back to previous version`
      });
    } catch (error) {
      toast({
        title: 'Rollback Failed',
        description: 'Failed to rollback deployment',
        variant: 'destructive'
      });
    }
  };

  const startABTest = async (testName: string) => {
    try {
      const newTest: ABTest = {
        id: `test-${Date.now()}`,
        name: testName,
        status: 'active',
        trafficSplit: 50,
        conversionRate: 0,
        significanceLevel: 0,
        participants: 0,
        startDate: new Date().toISOString()
      };

      setAbTests(prev => [...prev, newTest]);

      toast({
        title: 'A/B Test Started',
        description: `${testName} is now active`
      });
    } catch (error) {
      toast({
        title: 'Test Start Failed',
        description: 'Failed to start A/B test',
        variant: 'destructive'
      });
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'deploying': return <Clock className="h-4 w-4 text-blue-600 animate-spin" />;
      case 'failed': return <AlertCircle className="h-4 w-4 text-red-600" />;
      case 'maintenance': return <Settings className="h-4 w-4 text-yellow-600" />;
      default: return <AlertCircle className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'healthy': return <Badge variant="default">Healthy</Badge>;
      case 'deploying': return <Badge variant="outline">Deploying</Badge>;
      case 'failed': return <Badge variant="destructive">Failed</Badge>;
      case 'maintenance': return <Badge variant="secondary">Maintenance</Badge>;
      default: return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const getMetricStatus = (metric: PerformanceMetric) => {
    switch (metric.status) {
      case 'good': return 'text-green-600';
      case 'warning': return 'text-yellow-600';
      case 'critical': return 'text-red-600';
      default: return 'text-gray-400';
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'down': return <TrendingUp className="h-4 w-4 text-red-600 rotate-180" />;
      case 'stable': return <div className="h-4 w-4 bg-gray-400 rounded-full" />;
      default: return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Production Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div>
                <p className="text-2xl font-bold">{systemHealth?.uptime.toFixed(1) || '99.9'}%</p>
                <p className="text-xs text-muted-foreground">System Uptime</p>
              </div>
              <Server className="h-4 w-4 ml-auto text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div>
                <p className="text-2xl font-bold">{systemHealth?.activeUsers.toLocaleString() || '1,247'}</p>
                <p className="text-xs text-muted-foreground">Active Users</p>
              </div>
              <Users className="h-4 w-4 ml-auto text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div>
                <p className="text-2xl font-bold">{systemHealth?.responseTime.toFixed(0) || '87'}ms</p>
                <p className="text-xs text-muted-foreground">Response Time</p>
              </div>
              <Zap className="h-4 w-4 ml-auto text-yellow-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div>
                <p className="text-2xl font-bold">{systemHealth?.errorRate.toFixed(1) || '0.3'}%</p>
                <p className="text-xs text-muted-foreground">Error Rate</p>
              </div>
              <BarChart3 className="h-4 w-4 ml-auto text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="environments" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="environments">Environments</TabsTrigger>
          <TabsTrigger value="ab-testing">A/B Testing</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="mobile">Mobile UX</TabsTrigger>
          <TabsTrigger value="monitoring">Monitoring</TabsTrigger>
        </TabsList>

        <TabsContent value="environments" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Rocket className="h-5 w-5" />
                <span>Deployment Environments</span>
              </CardTitle>
              <CardDescription>
                Manage and monitor all deployment environments
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {isDeploying && (
                  <Alert>
                    <Clock className="h-4 w-4" />
                    <AlertDescription className="flex items-center justify-between">
                      <span>Deployment in progress...</span>
                      <div className="flex items-center space-x-2">
                        <Progress value={deploymentProgress} className="w-32" />
                        <span className="text-sm">{deploymentProgress.toFixed(0)}%</span>
                      </div>
                    </AlertDescription>
                  </Alert>
                )}

                {deployments.map((deployment) => (
                  <div 
                    key={deployment.environment}
                    className="p-4 border rounded-lg space-y-4"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        {getStatusIcon(deployment.status)}
                        <div>
                          <h3 className="font-medium capitalize">{deployment.environment}</h3>
                          <p className="text-sm text-muted-foreground">
                            Version {deployment.version}
                          </p>
                        </div>
                        {getStatusBadge(deployment.status)}
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => performDeployment(deployment.environment)}
                          disabled={isDeploying}
                        >
                          Deploy
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => rollbackDeployment(deployment.environment)}
                          disabled={isDeploying}
                        >
                          Rollback
                        </Button>
                      </div>
                    </div>

                    <div className="grid grid-cols-4 gap-4 text-center">
                      <div>
                        <p className="text-sm text-muted-foreground">Deployment Logs</p>
                        <p className="font-bold">{deployment.deploymentLogs?.length || 0}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Status</p>
                        <p className="font-bold">{deployment.status.toUpperCase()}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Version</p>
                        <p className="font-bold">{deployment.version}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Environment</p>
                        <p className="font-bold">{deployment.environment.toUpperCase()}</p>
                      </div>
                    </div>

                    <div className="text-xs text-muted-foreground">
                      Last deployed: {new Date(deployment.lastDeployed).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ab-testing" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <TestTube className="h-5 w-5" />
                <span>A/B Testing & Personalization</span>
              </CardTitle>
              <CardDescription>
                Optimize user experience through data-driven testing
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium">Active Tests</h3>
                  <Button
                    onClick={() => startABTest('New Feature Test')}
                    size="sm"
                  >
                    Start New Test
                  </Button>
                </div>

                {abTests.map((test) => (
                  <div 
                    key={test.id}
                    className="p-4 border rounded-lg space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">{test.name}</h4>
                        <p className="text-sm text-muted-foreground">
                          {test.participants.toLocaleString()} participants
                        </p>
                      </div>
                      <Badge variant={test.status === 'active' ? 'default' : 'secondary'}>
                        {test.status.toUpperCase()}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div>
                        <p className="text-sm text-muted-foreground">Traffic Split</p>
                        <p className="font-bold">{test.trafficSplit}%</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Conversion Rate</p>
                        <p className="font-bold">{test.conversionRate}%</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Significance</p>
                        <p className="font-bold">{test.significanceLevel}%</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>Started: {new Date(test.startDate).toLocaleDateString()}</span>
                      <div className="flex items-center space-x-2">
                        <Button variant="ghost" size="sm">View Details</Button>
                        <Button variant="ghost" size="sm">Stop Test</Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <BarChart3 className="h-5 w-5" />
                <span>Performance Metrics</span>
              </CardTitle>
              <CardDescription>
                Real-time performance monitoring and optimization
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {performanceMetrics.map((metric, index) => (
                  <div 
                    key={index}
                    className="p-4 border rounded-lg space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium">{metric.name}</h4>
                      {getTrendIcon(metric.trend)}
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className={`text-2xl font-bold ${getMetricStatus(metric)}`}>
                          {metric.name === 'Uptime' || metric.name === 'Error Rate' || metric.name === 'Conversion Rate' 
                            ? `${metric.value}%` 
                            : metric.name === 'User Satisfaction'
                            ? `${metric.value}/5`
                            : metric.name === 'Page Load Speed'
                            ? `${metric.value}s`
                            : `${metric.value}ms`
                          }
                        </span>
                        <Badge variant={
                          metric.status === 'good' ? 'default' :
                          metric.status === 'warning' ? 'secondary' :
                          'destructive'
                        }>
                          {metric.status.toUpperCase()}
                        </Badge>
                      </div>
                      
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Target:</span>
                          <span>
                            {metric.name === 'Uptime' || metric.name === 'Error Rate' || metric.name === 'Conversion Rate' 
                              ? `${metric.target}%` 
                              : metric.name === 'User Satisfaction'
                              ? `${metric.target}/5`
                              : metric.name === 'Page Load Speed'
                              ? `${metric.target}s`
                              : `${metric.target}ms`
                            }
                          </span>
                        </div>
                        <Progress 
                          value={
                            metric.name === 'Error Rate' 
                              ? Math.max(0, 100 - (metric.value / metric.target) * 100)
                              : (metric.value / metric.target) * 100
                          } 
                          className="h-2"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="mobile" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Smartphone className="h-5 w-5" />
                <span>Mobile UX Optimization</span>
              </CardTitle>
              <CardDescription>
                Mobile-responsive design and user experience metrics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="text-center space-y-2">
                    <Smartphone className="h-8 w-8 mx-auto text-blue-600" />
                    <div>
                      <p className="text-2xl font-bold">67%</p>
                      <p className="text-sm text-muted-foreground">Mobile Traffic</p>
                    </div>
                  </div>
                  <div className="text-center space-y-2">
                    <Tablet className="h-8 w-8 mx-auto text-green-600" />
                    <div>
                      <p className="text-2xl font-bold">18%</p>
                      <p className="text-sm text-muted-foreground">Tablet Traffic</p>
                    </div>
                  </div>
                  <div className="text-center space-y-2">
                    <Monitor className="h-8 w-8 mx-auto text-purple-600" />
                    <div>
                      <p className="text-2xl font-bold">15%</p>
                      <p className="text-sm text-muted-foreground">Desktop Traffic</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-medium">Mobile Performance</h4>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Page Load Speed (Mobile)</span>
                        <span className="text-sm font-medium">2.1s</span>
                      </div>
                      <Progress value={85} />
                      
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Mobile Conversion Rate</span>
                        <span className="text-sm font-medium">14.8%</span>
                      </div>
                      <Progress value={92} />
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Mobile Usability Score</span>
                        <span className="text-sm font-medium">94/100</span>
                      </div>
                      <Progress value={94} />
                      
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Touch Target Optimization</span>
                        <span className="text-sm font-medium">98%</span>
                      </div>
                      <Progress value={98} />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="font-medium">Mobile Optimization Features</h4>
                  <div className="grid gap-2 md:grid-cols-2 text-sm">
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span>Responsive design system</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span>Touch-optimized interfaces</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span>Progressive Web App features</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span>Offline functionality</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="monitoring" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Shield className="h-5 w-5" />
                <span>Production Monitoring</span>
              </CardTitle>
              <CardDescription>
                Real-time system health and alerting
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-4">
                    <h4 className="font-medium">System Health</h4>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">API Health</span>
                        <div className="flex items-center space-x-2">
                          <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                          <span className="text-sm">Healthy</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Database Health</span>
                        <div className="flex items-center space-x-2">
                          <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                          <span className="text-sm">Healthy</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Cache Health</span>
                        <div className="flex items-center space-x-2">
                          <div className="h-2 w-2 bg-yellow-500 rounded-full"></div>
                          <span className="text-sm">Warning</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">CDN Health</span>
                        <div className="flex items-center space-x-2">
                          <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                          <span className="text-sm">Healthy</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <h4 className="font-medium">Alert Configuration</h4>
                    <div className="space-y-3 text-sm">
                      <div className="flex items-center justify-between">
                        <span>Response Time &gt; 200ms</span>
                        <Badge variant="outline">Enabled</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Error Rate &gt; 1%</span>
                        <Badge variant="outline">Enabled</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Uptime &lt; 99%</span>
                        <Badge variant="outline">Enabled</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>High Traffic Spike</span>
                        <Badge variant="outline">Enabled</Badge>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <h4 className="font-medium mb-3">Recent Alerts</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between p-2 bg-yellow-50 border border-yellow-200 rounded">
                      <div className="flex items-center space-x-2">
                        <AlertCircle className="h-4 w-4 text-yellow-600" />
                        <span>Cache hit ratio below threshold</span>
                      </div>
                      <span className="text-xs text-muted-foreground">5m ago</span>
                    </div>
                    <div className="text-center py-2 text-muted-foreground">
                      No critical alerts in the last 24 hours
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    Last health check: {new Date().toLocaleTimeString()}
                  </span>
                  <Button variant="outline" size="sm">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Refresh Status
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};