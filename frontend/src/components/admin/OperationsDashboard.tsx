import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Activity, 
  Settings, 
  Users, 
  Zap, 
  AlertTriangle,
  CheckCircle,
  BarChart3,
  Clock,
  TrendingUp,
  Cpu,
  Database,
  Network
} from 'lucide-react';

interface AgentMetrics {
  id: string;
  name: string;
  status: 'active' | 'busy' | 'idle' | 'error';
  performance: number;
  tasksCompleted: number;
  avgResponseTime: number;
  errorRate: number;
  tier: number;
}

export function OperationsDashboard() {
  const [agents] = useState<AgentMetrics[]>([
    {
      id: 'agent-001',
      name: 'Travel Booking Assistant',
      status: 'active',
      performance: 97,
      tasksCompleted: 156,
      avgResponseTime: 1.2,
      errorRate: 0.8,
      tier: 1
    },
    {
      id: 'agent-002', 
      name: 'Customer Support Agent',
      status: 'busy',
      performance: 94,
      tasksCompleted: 143,
      avgResponseTime: 1.8,
      errorRate: 1.2,
      tier: 2
    },
    {
      id: 'agent-003',
      name: 'Payment Processing Agent',
      status: 'active',
      performance: 99,
      tasksCompleted: 234,
      avgResponseTime: 0.9,
      errorRate: 0.3,
      tier: 1
    },
    {
      id: 'agent-004',
      name: 'Data Analytics Agent',
      status: 'idle',
      performance: 91,
      tasksCompleted: 78,
      avgResponseTime: 2.3,
      errorRate: 2.1,
      tier: 3
    },
    {
      id: 'agent-005',
      name: 'Security Monitor Agent',
      status: 'active',
      performance: 98,
      tasksCompleted: 89,
      avgResponseTime: 0.7,
      errorRate: 0.5,
      tier: 1
    }
  ]);

  const [systemResources] = useState({
    cpuUsage: 68,
    memoryUsage: 72,
    diskUsage: 45,
    networkLoad: 34,
    activeConnections: 1247,
    queuedTasks: 23
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'default';
      case 'busy': return 'secondary';
      case 'idle': return 'outline';
      case 'error': return 'destructive';
      default: return 'outline';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'busy': return <Activity className="h-4 w-4 text-blue-500" />;
      case 'idle': return <Clock className="h-4 w-4 text-gray-500" />;
      case 'error': return <AlertTriangle className="h-4 w-4 text-red-500" />;
      default: return <Activity className="h-4 w-4" />;
    }
  };

  const getTierBadge = (tier: number) => {
    const tierLabels = {
      1: { label: 'Tier 1 - Critical', variant: 'default' as const },
      2: { label: 'Tier 2 - Standard', variant: 'secondary' as const },
      3: { label: 'Tier 3 - Support', variant: 'outline' as const }
    };
    return tierLabels[tier as keyof typeof tierLabels] || { label: 'Unknown', variant: 'outline' as const };
  };

  const activeAgents = agents.filter(agent => agent.status === 'active').length;
  const avgPerformance = Math.round(agents.reduce((sum, agent) => sum + agent.performance, 0) / agents.length);
  const totalTasks = agents.reduce((sum, agent) => sum + agent.tasksCompleted, 0);
  const avgResponseTime = Number((agents.reduce((sum, agent) => sum + agent.avgResponseTime, 0) / agents.length).toFixed(1));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Operations Dashboard</h1>
          <p className="text-muted-foreground">
            Detailed agent management and system performance monitoring
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Settings className="h-4 w-4 mr-2" />
            Agent Settings
          </Button>
          <Button size="sm">
            <TrendingUp className="h-4 w-4 mr-2" />
            Performance Report
          </Button>
        </div>
      </div>

      {/* Operations Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-green-500" />
              <div>
                <p className="text-2xl font-bold">{activeAgents}/{agents.length}</p>
                <p className="text-xs text-muted-foreground">Active Agents</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">{avgPerformance}%</p>
                <p className="text-xs text-muted-foreground">Avg Performance</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-purple-500" />
              <div>
                <p className="text-2xl font-bold">{totalTasks}</p>
                <p className="text-xs text-muted-foreground">Tasks Completed</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-orange-500" />
              <div>
                <p className="text-2xl font-bold">{avgResponseTime}s</p>
                <p className="text-xs text-muted-foreground">Avg Response</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="agents" className="space-y-4">
        <TabsList>
          <TabsTrigger value="agents">Agent Status</TabsTrigger>
          <TabsTrigger value="performance">Performance Metrics</TabsTrigger>
          <TabsTrigger value="resources">System Resources</TabsTrigger>
          <TabsTrigger value="tasks">Task Queue</TabsTrigger>
        </TabsList>

        <TabsContent value="agents" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Agent Fleet Status</CardTitle>
              <CardDescription>Real-time status and performance of all AI agents</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {agents.map((agent) => {
                  const tierInfo = getTierBadge(agent.tier);
                  return (
                    <div key={agent.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-4">
                        {getStatusIcon(agent.status)}
                        <div>
                          <p className="font-medium">{agent.name}</p>
                          <p className="text-sm text-muted-foreground">ID: {agent.id}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <Badge variant={tierInfo.variant}>{tierInfo.label}</Badge>
                        <Badge variant={getStatusColor(agent.status)}>
                          {agent.status.toUpperCase()}
                        </Badge>
                        <div className="text-right min-w-[80px]">
                          <p className="text-sm font-medium">{agent.performance}%</p>
                          <p className="text-xs text-muted-foreground">Performance</p>
                        </div>
                        <Button variant="ghost" size="sm">
                          <Settings className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Response Time Distribution</CardTitle>
                <CardDescription>Average response times by agent</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {agents.map((agent) => (
                  <div key={agent.id} className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>{agent.name}</span>
                      <span>{agent.avgResponseTime}s</span>
                    </div>
                    <Progress value={(5 - agent.avgResponseTime) * 20} />
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Error Rates</CardTitle>
                <CardDescription>Error rates by agent over the last hour</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {agents.map((agent) => (
                  <div key={agent.id} className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>{agent.name}</span>
                      <span className={agent.errorRate > 2 ? 'text-red-500' : 'text-green-500'}>
                        {agent.errorRate}%
                      </span>
                    </div>
                    <Progress 
                      value={Math.min(agent.errorRate * 10, 100)} 
                      className={agent.errorRate > 2 ? 'bg-red-100' : 'bg-green-100'}
                    />
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="resources">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Cpu className="h-5 w-5" />
                  CPU Usage
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">Current</span>
                    <span className="text-sm font-medium">{systemResources.cpuUsage}%</span>
                  </div>
                  <Progress value={systemResources.cpuUsage} />
                  {systemResources.cpuUsage > 80 && (
                    <Alert className="mt-2">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>High CPU usage detected</AlertDescription>
                    </Alert>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  Memory Usage
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">Current</span>
                    <span className="text-sm font-medium">{systemResources.memoryUsage}%</span>
                  </div>
                  <Progress value={systemResources.memoryUsage} />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Network className="h-5 w-5" />
                  Network Load
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">Current</span>
                    <span className="text-sm font-medium">{systemResources.networkLoad}%</span>
                  </div>
                  <Progress value={systemResources.networkLoad} />
                  <div className="text-xs text-muted-foreground">
                    {systemResources.activeConnections} active connections
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="tasks">
          <Card>
            <CardHeader>
              <CardTitle>Task Queue Management</CardTitle>
              <CardDescription>Current task queue status and processing metrics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center space-y-2">
                  <div className="text-2xl font-bold">{systemResources.queuedTasks}</div>
                  <p className="text-sm text-muted-foreground">Queued Tasks</p>
                </div>
                <div className="text-center space-y-2">
                  <div className="text-2xl font-bold">{totalTasks}</div>
                  <p className="text-sm text-muted-foreground">Completed Today</p>
                </div>
                <div className="text-center space-y-2">
                  <div className="text-2xl font-bold">{avgResponseTime}s</div>
                  <p className="text-sm text-muted-foreground">Avg Processing Time</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}