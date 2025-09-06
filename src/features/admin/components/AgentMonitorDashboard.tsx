import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { 
  Activity, 
  Users, 
  Bot, 
  TrendingUp, 
  AlertTriangle,
  CheckCircle,
  Clock,
  XCircle
} from 'lucide-react';

interface AgentTask {
  id: string;
  agent_id: string;
  user_id: string;
  intent: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  progress: number;
  created_at: string;
  updated_at: string;
  result?: any;
  error?: string;
}

interface AgentStats {
  total_tasks: number;
  active_tasks: number;
  success_rate: number;
  avg_completion_time: number;
  last_activity: string;
}

const AgentMonitorDashboard: React.FC = () => {
  const [tasks, setTasks] = useState<AgentTask[]>([]);
  const [agentStats, setAgentStats] = useState<Record<string, AgentStats>>({});
  const [activeTab, setActiveTab] = useState('overview');
  const [isLoading, setIsLoading] = useState(true);

  // Primary agents that users interact with
  const primaryAgents = [
    'family-travel-planner',
    'solo-travel-planner', 
    'pet-travel-planner',
    'spiritual-travel-planner'
  ];

  // Admin-only agents
  const adminAgents = [
    'booking-modification',
    'refund-processing',
    'security-alert',
    'user-support',
    'fraud-detection'
  ];

  useEffect(() => {
    // Mock data - replace with real API calls
    const mockTasks: AgentTask[] = [
      {
        id: '1',
        agent_id: 'family-travel-planner',
        user_id: 'user123',
        intent: 'plan_complete_trip',
        status: 'running',
        progress: 65,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: '2',
        agent_id: 'solo-travel-planner',
        user_id: 'user456',
        intent: 'find_accommodation',
        status: 'completed',
        progress: 100,
        created_at: new Date(Date.now() - 300000).toISOString(),
        updated_at: new Date().toISOString(),
        result: { message: 'Found 12 solo-friendly accommodations' }
      }
    ];

    const mockStats: Record<string, AgentStats> = {
      'family-travel-planner': {
        total_tasks: 24,
        active_tasks: 3,
        success_rate: 95.8,
        avg_completion_time: 4.2,
        last_activity: new Date().toISOString()
      },
      'solo-travel-planner': {
        total_tasks: 18,
        active_tasks: 1,
        success_rate: 98.1,
        avg_completion_time: 3.8,
        last_activity: new Date().toISOString()
      }
    };

    setTasks(mockTasks);
    setAgentStats(mockStats);
    setIsLoading(false);
  }, []);

  const getStatusBadge = (status: string) => {
    const variants = {
      'running': { variant: 'secondary' as const, icon: Clock, text: 'Running' },
      'completed': { variant: 'default' as const, icon: CheckCircle, text: 'Completed' },
      'failed': { variant: 'destructive' as const, icon: XCircle, text: 'Failed' },
      'pending': { variant: 'outline' as const, icon: Clock, text: 'Pending' },
      'cancelled': { variant: 'outline' as const, icon: XCircle, text: 'Cancelled' }
    };
    
    const config = variants[status] || variants.pending;
    const Icon = config.icon;
    
    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {config.text}
      </Badge>
    );
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Agent Monitor</h1>
          <p className="text-muted-foreground">
            Monitor all 70 agents and their task execution
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="text-sm">
            <Activity className="h-3 w-3 mr-1" />
            {tasks.filter(t => t.status === 'running').length} Active
          </Badge>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tasks</CardTitle>
            <Bot className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Object.values(agentStats).reduce((sum, stats) => sum + stats.total_tasks, 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Across all agents
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Tasks</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {tasks.filter(t => t.status === 'running').length}
            </div>
            <p className="text-xs text-muted-foreground">
              Currently running
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Object.values(agentStats).length > 0
                ? (Object.values(agentStats).reduce((sum, stats) => sum + stats.success_rate, 0) / Object.values(agentStats).length).toFixed(1)
                : 0}%
            </div>
            <p className="text-xs text-muted-foreground">
              Average across agents
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Primary Agents</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{primaryAgents.length}</div>
            <p className="text-xs text-muted-foreground">
              User-facing agents
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Agent Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="primary">Primary Agents</TabsTrigger>
          <TabsTrigger value="admin">Admin Agents</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Active Tasks</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                <div className="space-y-4">
                  {tasks.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Bot className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>No active tasks</p>
                    </div>
                  ) : (
                    tasks.map((task) => (
                      <div key={task.id} className="border rounded-lg p-4 space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">{task.agent_id}</Badge>
                            {getStatusBadge(task.status)}
                          </div>
                          <span className="text-sm text-muted-foreground">
                            {new Date(task.created_at).toLocaleTimeString()}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium">{task.intent}</p>
                          <p className="text-sm text-muted-foreground">User: {task.user_id}</p>
                        </div>
                        {task.status === 'running' && (
                          <Progress value={task.progress} className="h-2" />
                        )}
                        {task.result && (
                          <div className="text-sm bg-muted p-2 rounded">
                            {JSON.stringify(task.result, null, 2)}
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="primary" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {primaryAgents.map((agentId) => {
              const stats = agentStats[agentId];
              return (
                <Card key={agentId}>
                  <CardHeader>
                    <CardTitle className="capitalize">
                      {agentId.replace('-', ' ')}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {stats ? (
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm">Total Tasks:</span>
                          <span className="font-medium">{stats.total_tasks}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm">Active:</span>
                          <span className="font-medium">{stats.active_tasks}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm">Success Rate:</span>
                          <span className="font-medium">{stats.success_rate}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm">Avg Time:</span>
                          <span className="font-medium">{stats.avg_completion_time}s</span>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">No data available</p>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="admin" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {adminAgents.map((agentId) => (
              <Card key={agentId}>
                <CardHeader>
                  <CardTitle className="text-sm capitalize">
                    {agentId.replace('-', ' ')}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-xs text-muted-foreground">
                    Admin access only
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AgentMonitorDashboard;