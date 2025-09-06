import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Activity, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Cpu, 
  MemoryStick,
  Zap,
  TrendingUp,
  TrendingDown,
  Pause
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface AgentMetrics {
  agent_id: string;
  display_name: string;
  status: string;
  health_status: string;
  cpu_usage: number;
  memory_usage: number;
  task_queue_size: number;
  success_rate: number;
  avg_response_time: number;
  last_activity: string;
  throughput: number;
  error_count: number;
}

interface PerformanceData {
  timestamp: string;
  cpu: number;
  memory: number;
  tasks: number;
  response_time: number;
}

export function RealTimeMonitoring() {
  const [agents, setAgents] = useState<AgentMetrics[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);
  const [performanceData, setPerformanceData] = useState<PerformanceData[]>([]);
  const [isLive, setIsLive] = useState(true);

  useEffect(() => {
    // Simulate real-time data updates
    const interval = setInterval(() => {
      if (isLive) {
        generateMockData();
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [isLive]);

  const generateMockData = () => {
    const mockAgents: AgentMetrics[] = [
      {
        agent_id: 'booking-assistant',
        display_name: 'Booking Assistant',
        status: 'active',
        health_status: 'healthy',
        cpu_usage: Math.random() * 60 + 20,
        memory_usage: Math.random() * 40 + 30,
        task_queue_size: Math.floor(Math.random() * 10),
        success_rate: 95 + Math.random() * 5,
        avg_response_time: 200 + Math.random() * 300,
        last_activity: new Date().toISOString(),
        throughput: Math.floor(Math.random() * 50 + 10),
        error_count: Math.floor(Math.random() * 3)
      },
      {
        agent_id: 'price-monitor',
        display_name: 'Price Monitor',
        status: 'active',
        health_status: 'warning',
        cpu_usage: Math.random() * 80 + 40,
        memory_usage: Math.random() * 60 + 40,
        task_queue_size: Math.floor(Math.random() * 20),
        success_rate: 88 + Math.random() * 7,
        avg_response_time: 150 + Math.random() * 200,
        last_activity: new Date().toISOString(),
        throughput: Math.floor(Math.random() * 80 + 20),
        error_count: Math.floor(Math.random() * 5)
      },
      {
        agent_id: 'fraud-detection',
        display_name: 'Fraud Detection',
        status: 'error',
        health_status: 'critical',
        cpu_usage: Math.random() * 30 + 10,
        memory_usage: Math.random() * 20 + 10,
        task_queue_size: Math.floor(Math.random() * 5),
        success_rate: 70 + Math.random() * 20,
        avg_response_time: 400 + Math.random() * 500,
        last_activity: new Date(Date.now() - 300000).toISOString(),
        throughput: Math.floor(Math.random() * 20 + 5),
        error_count: Math.floor(Math.random() * 10 + 5)
      }
    ];

    setAgents(mockAgents);

    // Update performance data for charts
    const now = new Date();
    setPerformanceData(prev => {
      const newData = {
        timestamp: now.toLocaleTimeString(),
        cpu: mockAgents.reduce((sum, agent) => sum + agent.cpu_usage, 0) / mockAgents.length,
        memory: mockAgents.reduce((sum, agent) => sum + agent.memory_usage, 0) / mockAgents.length,
        tasks: mockAgents.reduce((sum, agent) => sum + agent.task_queue_size, 0),
        response_time: mockAgents.reduce((sum, agent) => sum + agent.avg_response_time, 0) / mockAgents.length
      };
      
      return [...prev.slice(-19), newData];
    });
  };

  const getStatusIcon = (status: string, health: string) => {
    if (status === 'error' || health === 'critical') {
      return <AlertTriangle className="h-4 w-4 text-red-500" />;
    }
    if (health === 'warning') {
      return <Clock className="h-4 w-4 text-yellow-500" />;
    }
    if (status === 'active') {
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    }
    return <Pause className="h-4 w-4 text-gray-500" />;
  };

  const getHealthColor = (health: string) => {
    switch (health) {
      case 'healthy': return 'text-green-600';
      case 'warning': return 'text-yellow-600';
      case 'critical': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Real-Time Monitoring</h2>
        <div className="flex items-center space-x-2">
          <div className={`w-2 h-2 rounded-full ${isLive ? 'bg-green-500' : 'bg-gray-500'} animate-pulse`} />
          <span className="text-sm text-muted-foreground">
            {isLive ? 'Live' : 'Paused'}
          </span>
          <button 
            onClick={() => setIsLive(!isLive)}
            className="text-sm text-primary hover:underline"
          >
            {isLive ? 'Pause' : 'Resume'}
          </button>
        </div>
      </div>

      {/* System Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Activity className="h-4 w-4 text-blue-500" />
              <span className="text-sm font-medium">Active Agents</span>
            </div>
            <div className="mt-2">
              <div className="text-2xl font-bold">
                {agents.filter(a => a.status === 'active').length}
              </div>
              <p className="text-xs text-muted-foreground">
                of {agents.length} total
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Cpu className="h-4 w-4 text-orange-500" />
              <span className="text-sm font-medium">Avg CPU</span>
            </div>
            <div className="mt-2">
              <div className="text-2xl font-bold">
                {Math.round(agents.reduce((sum, a) => sum + a.cpu_usage, 0) / agents.length || 0)}%
              </div>
              <Progress 
                value={agents.reduce((sum, a) => sum + a.cpu_usage, 0) / agents.length || 0} 
                className="mt-1 h-1"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <MemoryStick className="h-4 w-4 text-purple-500" />
              <span className="text-sm font-medium">Avg Memory</span>
            </div>
            <div className="mt-2">
              <div className="text-2xl font-bold">
                {Math.round(agents.reduce((sum, a) => sum + a.memory_usage, 0) / agents.length || 0)}%
              </div>
              <Progress 
                value={agents.reduce((sum, a) => sum + a.memory_usage, 0) / agents.length || 0} 
                className="mt-1 h-1"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Zap className="h-4 w-4 text-green-500" />
              <span className="text-sm font-medium">Queue Size</span>
            </div>
            <div className="mt-2">
              <div className="text-2xl font-bold">
                {agents.reduce((sum, a) => sum + a.task_queue_size, 0)}
              </div>
              <p className="text-xs text-muted-foreground">
                tasks pending
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">System Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={performanceData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="timestamp" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="cpu" stroke="hsl(var(--primary))" strokeWidth={2} />
                <Line type="monotone" dataKey="memory" stroke="hsl(var(--secondary))" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Response Time & Tasks</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={performanceData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="timestamp" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="response_time" stroke="hsl(var(--accent))" strokeWidth={2} />
                <Line type="monotone" dataKey="tasks" stroke="hsl(var(--muted-foreground))" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Agent Status Grid */}
      <Card>
        <CardHeader>
          <CardTitle>Agent Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            {agents.map(agent => (
              <div key={agent.agent_id} className="flex items-center justify-between p-4 border border-border rounded-lg">
                <div className="flex items-center space-x-4">
                  {getStatusIcon(agent.status, agent.health_status)}
                  <div>
                    <h4 className="font-medium">{agent.display_name}</h4>
                    <p className="text-sm text-muted-foreground">{agent.agent_id}</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-6">
                  <div className="text-center">
                    <div className="text-sm font-medium">{Math.round(agent.cpu_usage)}%</div>
                    <div className="text-xs text-muted-foreground">CPU</div>
                  </div>
                  <div className="text-center">
                    <div className="text-sm font-medium">{Math.round(agent.memory_usage)}%</div>
                    <div className="text-xs text-muted-foreground">Memory</div>
                  </div>
                  <div className="text-center">
                    <div className="text-sm font-medium">{agent.task_queue_size}</div>
                    <div className="text-xs text-muted-foreground">Queue</div>
                  </div>
                  <div className="text-center">
                    <div className="text-sm font-medium">{Math.round(agent.success_rate)}%</div>
                    <div className="text-xs text-muted-foreground">Success</div>
                  </div>
                  <Badge 
                    variant={agent.health_status === 'healthy' ? 'default' : 
                            agent.health_status === 'warning' ? 'secondary' : 'destructive'}
                  >
                    {agent.health_status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}