import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Rocket, 
  GitBranch, 
  Globe, 
  Database, 
  Server,
  CheckCircle,
  AlertTriangle,
  Clock,
  Activity,
  Monitor,
  Settings,
  RefreshCw,
  PlayCircle,
  StopCircle
} from 'lucide-react';
import logger from '@/utils/logger';

interface DeploymentStatus {
  environment: 'development' | 'staging' | 'production';
  status: 'idle' | 'building' | 'deploying' | 'deployed' | 'failed';
  version: string;
  lastDeployed: string;
  uptime: number;
  health: 'healthy' | 'degraded' | 'down';
}

interface DeploymentMetrics {
  buildTime: number;
  deployTime: number;
  successRate: number;
  rollbacks: number;
  totalDeployments: number;
  averageDowntime: number;
}

interface InfrastructureMetrics {
  servers: {
    active: number;
    total: number;
    cpuUsage: number;
    memoryUsage: number;
    diskUsage: number;
  };
  cdn: {
    hitRate: number;
    bandwidth: number;
    requests: number;
    latency: number;
  };
  database: {
    connections: number;
    queryTime: number;
    throughput: number;
    replication: boolean;
  };
}

const DeploymentManager: React.FC = () => {
  const [deploymentStatuses, setDeploymentStatuses] = useState<DeploymentStatus[]>([
    {
      environment: 'development',
      status: 'deployed',
      version: 'v2.1.3-dev',
      lastDeployed: new Date(Date.now() - 3600000).toISOString(),
      uptime: 99.2,
      health: 'healthy'
    },
    {
      environment: 'staging',
      status: 'deployed',
      version: 'v2.1.2',
      lastDeployed: new Date(Date.now() - 7200000).toISOString(),
      uptime: 99.8,
      health: 'healthy'
    },
    {
      environment: 'production',
      status: 'deployed',
      version: 'v2.1.1',
      lastDeployed: new Date(Date.now() - 86400000).toISOString(),
      uptime: 99.95,
      health: 'healthy'
    }
  ]);

  const [metrics, setMetrics] = useState<DeploymentMetrics>({
    buildTime: 4.2,
    deployTime: 2.8,
    successRate: 96.7,
    rollbacks: 3,
    totalDeployments: 127,
    averageDowntime: 0.3
  });

  const [infrastructure, setInfrastructure] = useState<InfrastructureMetrics>({
    servers: {
      active: 8,
      total: 10,
      cpuUsage: 45,
      memoryUsage: 62,
      diskUsage: 34
    },
    cdn: {
      hitRate: 94.3,
      bandwidth: 2.4,
      requests: 45672,
      latency: 23
    },
    database: {
      connections: 127,
      queryTime: 12.5,
      throughput: 1247,
      replication: true
    }
  });

  const [isDeploying, setIsDeploying] = useState(false);
  const [selectedEnvironment, setSelectedEnvironment] = useState<string>('staging');

  useEffect(() => {
    // Update metrics every 30 seconds
    const interval = setInterval(updateMetrics, 30000);
    return () => clearInterval(interval);
  }, []);

  const updateMetrics = useCallback(() => {
    // Simulate real-time infrastructure monitoring
    setInfrastructure(prev => ({
      servers: {
        ...prev.servers,
        cpuUsage: Math.min(100, Math.max(0, prev.servers.cpuUsage + (Math.random() - 0.5) * 10)),
        memoryUsage: Math.min(100, Math.max(0, prev.servers.memoryUsage + (Math.random() - 0.5) * 5)),
        diskUsage: Math.min(100, Math.max(0, prev.servers.diskUsage + (Math.random() - 0.5) * 2))
      },
      cdn: {
        ...prev.cdn,
        hitRate: Math.min(100, Math.max(80, prev.cdn.hitRate + (Math.random() - 0.5) * 2)),
        requests: prev.cdn.requests + Math.floor(Math.random() * 100),
        latency: Math.max(10, prev.cdn.latency + (Math.random() - 0.5) * 10)
      },
      database: {
        ...prev.database,
        connections: Math.max(0, prev.database.connections + Math.floor((Math.random() - 0.5) * 20)),
        queryTime: Math.max(5, prev.database.queryTime + (Math.random() - 0.5) * 5),
        throughput: prev.database.throughput + Math.floor((Math.random() - 0.5) * 100)
      }
    }));
  }, []);

  const deployToEnvironment = async (environment: string) => {
    setIsDeploying(true);
    setSelectedEnvironment(environment);
    
    try {
      // Update status to building
      setDeploymentStatuses(prev =>
        prev.map(status =>
          status.environment === environment
            ? { ...status, status: 'building' as const }
            : status
        )
      );

      await new Promise(resolve => setTimeout(resolve, 2000));

      // Update status to deploying
      setDeploymentStatuses(prev =>
        prev.map(status =>
          status.environment === environment
            ? { ...status, status: 'deploying' as const }
            : status
        )
      );

      await new Promise(resolve => setTimeout(resolve, 3000));

      // Update status to deployed
      setDeploymentStatuses(prev =>
        prev.map(status =>
          status.environment === environment
            ? { 
                ...status, 
                status: 'deployed' as const,
                version: 'v2.1.3',
                lastDeployed: new Date().toISOString()
              }
            : status
        )
      );

      // Update metrics
      setMetrics(prev => ({
        ...prev,
        totalDeployments: prev.totalDeployments + 1,
        successRate: Math.min(100, prev.successRate + 0.1)
      }));

      logger.info(`Deployment to ${environment} completed successfully`);
    } catch (error) {
      // Update status to failed
      setDeploymentStatuses(prev =>
        prev.map(status =>
          status.environment === environment
            ? { ...status, status: 'failed' as const }
            : status
        )
      );
      
      logger.error(`Deployment to ${environment} failed:`, error);
    } finally {
      setIsDeploying(false);
    }
  };

  const rollbackDeployment = async (environment: string) => {
    setIsDeploying(true);
    
    try {
      // Simulate rollback
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setDeploymentStatuses(prev =>
        prev.map(status =>
          status.environment === environment
            ? { 
                ...status, 
                version: 'v2.1.0',
                lastDeployed: new Date().toISOString()
              }
            : status
        )
      );

      setMetrics(prev => ({
        ...prev,
        rollbacks: prev.rollbacks + 1
      }));

      logger.info(`Rollback for ${environment} completed`);
    } catch (error) {
      logger.error(`Rollback for ${environment} failed:`, error);
    } finally {
      setIsDeploying(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'deployed': return 'text-green-600';
      case 'building': case 'deploying': return 'text-yellow-600';
      case 'failed': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'deployed': return 'default';
      case 'building': case 'deploying': return 'secondary';
      case 'failed': return 'destructive';
      default: return 'outline';
    }
  };

  const getHealthColor = (health: string) => {
    switch (health) {
      case 'healthy': return 'text-green-600';
      case 'degraded': return 'text-yellow-600';
      case 'down': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <div className="space-y-6">
      {/* Deployment Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Success Rate</p>
                <p className={`text-2xl font-bold ${
                  metrics.successRate > 95 ? 'text-green-600' : 
                  metrics.successRate > 90 ? 'text-yellow-600' : 'text-red-600'
                }`}>
                  {metrics.successRate.toFixed(1)}%
                </p>
              </div>
              <Rocket className={`h-6 w-6 ${
                metrics.successRate > 95 ? 'text-green-600' : 
                metrics.successRate > 90 ? 'text-yellow-600' : 'text-red-600'
              }`} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Deploy Time</p>
                <p className="text-2xl font-bold">{metrics.deployTime.toFixed(1)}m</p>
                <p className="text-xs text-muted-foreground">Build: {metrics.buildTime.toFixed(1)}m</p>
              </div>
              <Clock className="h-6 w-6 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Servers</p>
                <p className="text-2xl font-bold">{infrastructure.servers.active}/{infrastructure.servers.total}</p>
              </div>
              <Server className="h-6 w-6 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">CDN Hit Rate</p>
                <p className="text-2xl font-bold">{infrastructure.cdn.hitRate.toFixed(1)}%</p>
              </div>
              <Globe className="h-6 w-6 text-green-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="environments" className="space-y-4">
        <TabsList className="grid grid-cols-4 w-full">
          <TabsTrigger value="environments">Environments</TabsTrigger>
          <TabsTrigger value="infrastructure">Infrastructure</TabsTrigger>
          <TabsTrigger value="metrics">Metrics</TabsTrigger>
          <TabsTrigger value="pipeline">Pipeline</TabsTrigger>
        </TabsList>

        <TabsContent value="environments">
          <div className="space-y-4">
            {deploymentStatuses.map((deployment) => (
              <Card key={deployment.environment}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="capitalize">{deployment.environment}</CardTitle>
                    <div className="flex items-center space-x-2">
                      <Badge variant={getStatusBadge(deployment.status)}>
                        {deployment.status}
                      </Badge>
                      <Badge variant="outline" className={getHealthColor(deployment.health)}>
                        {deployment.health}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                    <div>
                      <p className="text-sm font-medium">Version</p>
                      <p className="text-lg font-bold">{deployment.version}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Uptime</p>
                      <p className="text-lg font-bold">{deployment.uptime.toFixed(2)}%</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Last Deployed</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(deployment.lastDeployed).toLocaleString()}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        size="sm"
                        onClick={() => deployToEnvironment(deployment.environment)}
                        disabled={isDeploying || deployment.status === 'building' || deployment.status === 'deploying'}
                      >
                        {isDeploying && selectedEnvironment === deployment.environment ? (
                          <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                        ) : (
                          <PlayCircle className="h-4 w-4 mr-2" />
                        )}
                        Deploy
                      </Button>
                      {deployment.environment !== 'development' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => rollbackDeployment(deployment.environment)}
                          disabled={isDeploying}
                        >
                          <StopCircle className="h-4 w-4 mr-2" />
                          Rollback
                        </Button>
                      )}
                    </div>
                  </div>
                  
                  {(deployment.status === 'building' || deployment.status === 'deploying') && (
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>{deployment.status === 'building' ? 'Building...' : 'Deploying...'}</span>
                        <span>
                          {deployment.status === 'building' ? 
                            `${metrics.buildTime.toFixed(1)}m` : 
                            `${metrics.deployTime.toFixed(1)}m`}
                        </span>
                      </div>
                      <Progress value={deployment.status === 'building' ? 45 : 80} />
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="infrastructure">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Server Resources */}
            <Card>
              <CardHeader>
                <CardTitle>Server Resources</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>CPU Usage</span>
                    <span className="font-bold">{infrastructure.servers.cpuUsage}%</span>
                  </div>
                  <Progress value={infrastructure.servers.cpuUsage} />
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Memory Usage</span>
                    <span className="font-bold">{infrastructure.servers.memoryUsage}%</span>
                  </div>
                  <Progress value={infrastructure.servers.memoryUsage} />
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Disk Usage</span>
                    <span className="font-bold">{infrastructure.servers.diskUsage}%</span>
                  </div>
                  <Progress value={infrastructure.servers.diskUsage} />
                </div>
                
                <div className="flex justify-between items-center">
                  <span>Active Servers</span>
                  <span className="font-bold">{infrastructure.servers.active}/{infrastructure.servers.total}</span>
                </div>
              </CardContent>
            </Card>

            {/* CDN & Database */}
            <Card>
              <CardHeader>
                <CardTitle>CDN & Database</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <h4 className="font-medium">CDN Performance</h4>
                  <div className="flex justify-between">
                    <span>Hit Rate</span>
                    <span className="font-bold">{infrastructure.cdn.hitRate.toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Bandwidth</span>
                    <span className="font-bold">{infrastructure.cdn.bandwidth.toFixed(1)} GB/h</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Latency</span>
                    <span className="font-bold">{infrastructure.cdn.latency}ms</span>
                  </div>
                </div>
                
                <div className="space-y-3 border-t pt-4">
                  <h4 className="font-medium">Database Performance</h4>
                  <div className="flex justify-between">
                    <span>Connections</span>
                    <span className="font-bold">{infrastructure.database.connections}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Query Time</span>
                    <span className="font-bold">{infrastructure.database.queryTime.toFixed(1)}ms</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Replication</span>
                    <Badge variant="default">Active</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="metrics">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Deployment Metrics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span>Total Deployments</span>
                  <span className="font-bold">{metrics.totalDeployments}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Success Rate</span>
                  <span className="font-bold text-green-600">{metrics.successRate.toFixed(1)}%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Rollbacks</span>
                  <span className="font-bold text-orange-600">{metrics.rollbacks}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Average Downtime</span>
                  <span className="font-bold">{metrics.averageDowntime}m</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Performance Trends</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-muted-foreground">
                  <Monitor className="h-12 w-12 mx-auto mb-4" />
                  <p>Performance analytics dashboard</p>
                  <p className="text-sm">Real-time metrics and trends</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="pipeline">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>CI/CD Pipeline</CardTitle>
                <div className="flex items-center space-x-2">
                  <GitBranch className="h-5 w-5" />
                  <span className="text-sm">main</span>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Alert className="border-green-200 bg-green-50">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-800">
                    Pipeline is healthy. All checks passing.
                  </AlertDescription>
                </Alert>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="text-center p-4 border rounded-lg">
                    <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-600" />
                    <p className="font-medium">Build</p>
                    <p className="text-sm text-green-600">✓ Passed</p>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-600" />
                    <p className="font-medium">Tests</p>
                    <p className="text-sm text-green-600">847/847 ✓</p>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-600" />
                    <p className="font-medium">Security</p>
                    <p className="text-sm text-green-600">✓ Passed</p>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-600" />
                    <p className="font-medium">Deploy</p>
                    <p className="text-sm text-green-600">✓ Ready</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export { DeploymentManager };
export default DeploymentManager;