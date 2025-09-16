import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, AreaChart, Area
} from 'recharts';
import { 
  TrendingUp, TrendingDown, Activity, Clock, DollarSign, Users,
  AlertTriangle, CheckCircle, Target, Zap
} from 'lucide-react';

interface AgentPerformanceData {
  agentId: string;
  agentName: string;
  successRate: number;
  avgResponseTime: number;
  tasksCompleted: number;
  costPerTask: number;
  revenueGenerated: number;
  uptime: number;
  errorRate: number;
  customerSatisfaction: number;
}

interface MetricCardProps {
  title: string;
  value: string;
  change: number;
  icon: React.ReactNode;
  trend: 'up' | 'down';
}

const MetricCard: React.FC<MetricCardProps> = ({ title, value, change, icon, trend }) => (
  <Card>
    <CardContent className="p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="text-2xl font-bold">{value}</p>
          <p className={`text-xs flex items-center ${trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
            {trend === 'up' ? <TrendingUp className="w-3 h-3 mr-1" /> : <TrendingDown className="w-3 h-3 mr-1" />}
            {Math.abs(change)}% from last month
          </p>
        </div>
        <div className="text-primary">{icon}</div>
      </div>
    </CardContent>
  </Card>
);

interface AgentAnalyticsDashboardProps {
  agents: any[];
  selectedAgent?: string;
  onAgentSelect: (agentId: string) => void;
}

export const AgentAnalyticsDashboard: React.FC<AgentAnalyticsDashboardProps> = ({
  agents,
  selectedAgent,
  onAgentSelect,
}) => {
  const [performanceData, setPerformanceData] = useState<AgentPerformanceData[]>([]);
  const [timeRange, setTimeRange] = useState<'24h' | '7d' | '30d' | '90d'>('7d');

  // Mock data generation - replace with real API calls
  useEffect(() => {
    const mockData: AgentPerformanceData[] = agents.map(agent => ({
      agentId: agent.agent_id,
      agentName: agent.display_name,
      successRate: Math.round(Math.random() * 20 + 80),
      avgResponseTime: Math.round(Math.random() * 200 + 100),
      tasksCompleted: Math.round(Math.random() * 500 + 100),
      costPerTask: Math.round((Math.random() * 0.5 + 0.1) * 100) / 100,
      revenueGenerated: Math.round(Math.random() * 10000 + 1000),
      uptime: Math.round(Math.random() * 10 + 90),
      errorRate: Math.round(Math.random() * 5 + 1),
      customerSatisfaction: Math.round(Math.random() * 1.5 + 3.5 * 10) / 10,
    }));
    setPerformanceData(mockData);
  }, [agents, timeRange]);

  const overallMetrics = {
    totalTasks: performanceData.reduce((sum, agent) => sum + agent.tasksCompleted, 0),
    avgSuccessRate: Math.round(performanceData.reduce((sum, agent) => sum + agent.successRate, 0) / performanceData.length),
    totalRevenue: performanceData.reduce((sum, agent) => sum + agent.revenueGenerated, 0),
    avgResponseTime: Math.round(performanceData.reduce((sum, agent) => sum + agent.avgResponseTime, 0) / performanceData.length),
  };

  const chartData = performanceData.map(agent => ({
    name: agent.agentName,
    tasks: agent.tasksCompleted,
    success: agent.successRate,
    revenue: agent.revenueGenerated,
    response: agent.avgResponseTime,
  }));

  const pieData = [
    { name: 'Successful', value: overallMetrics.avgSuccessRate, color: '#10b981' },
    { name: 'Failed', value: 100 - overallMetrics.avgSuccessRate, color: '#ef4444' },
  ];

  const timeSeriesData = Array.from({ length: 24 }, (_, i) => ({
    time: `${i}:00`,
    tasks: Math.round(Math.random() * 50 + 20),
    errors: Math.round(Math.random() * 5),
    response: Math.round(Math.random() * 100 + 150),
  }));

  return (
    <div className="space-y-6">
      {/* Overview Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Total Tasks"
          value={overallMetrics.totalTasks.toLocaleString()}
          change={12.5}
          trend="up"
          icon={<Activity className="w-8 h-8" />}
        />
        <MetricCard
          title="Success Rate"
          value={`${overallMetrics.avgSuccessRate}%`}
          change={3.2}
          trend="up"
          icon={<CheckCircle className="w-8 h-8" />}
        />
        <MetricCard
          title="Revenue Generated"
          value={`$${(overallMetrics.totalRevenue / 1000).toFixed(1)}k`}
          change={8.7}
          trend="up"
          icon={<DollarSign className="w-8 h-8" />}
        />
        <MetricCard
          title="Avg Response"
          value={`${overallMetrics.avgResponseTime}ms`}
          change={5.1}
          trend="down"
          icon={<Clock className="w-8 h-8" />}
        />
      </div>

      <Tabs defaultValue="performance" className="space-y-4">
        <div className="flex justify-between items-center">
          <TabsList>
            <TabsTrigger value="performance">Performance</TabsTrigger>
            <TabsTrigger value="costs">Costs & Revenue</TabsTrigger>
            <TabsTrigger value="errors">Error Analysis</TabsTrigger>
            <TabsTrigger value="trends">Trends</TabsTrigger>
          </TabsList>
          
          <div className="flex gap-2">
            {(['24h', '7d', '30d', '90d'] as const).map((range) => (
              <Button
                key={range}
                variant={timeRange === range ? 'default' : 'outline'}
                size="sm"
                onClick={() => setTimeRange(range)}
              >
                {range}
              </Button>
            ))}
          </div>
        </div>

        <TabsContent value="performance" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Agent Performance Comparison</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="success" fill="hsl(var(--primary))" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Success Rate Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      dataKey="value"
                      label={({ name, value }) => `${name}: ${value}%`}
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Agent Details Table */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Detailed Agent Metrics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {performanceData.map((agent) => (
                  <div
                    key={agent.agentId}
                    className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                      selectedAgent === agent.agentId ? 'bg-accent' : 'hover:bg-muted/50'
                    }`}
                    onClick={() => onAgentSelect(agent.agentId)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full ${
                          agent.uptime > 95 ? 'bg-green-500' : 
                          agent.uptime > 90 ? 'bg-yellow-500' : 'bg-red-500'
                        }`} />
                        <h3 className="font-medium">{agent.agentName}</h3>
                        <Badge variant="secondary">{agent.agentId}</Badge>
                      </div>
                      <div className="flex gap-4 text-sm">
                        <span className="text-green-600">{agent.successRate}% success</span>
                        <span className="text-blue-600">{agent.avgResponseTime}ms avg</span>
                        <span className="text-purple-600">${agent.costPerTask}/task</span>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-4 text-xs">
                      <div>
                        <div className="text-muted-foreground">Tasks Completed</div>
                        <div className="font-medium">{agent.tasksCompleted.toLocaleString()}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Revenue Generated</div>
                        <div className="font-medium">${agent.revenueGenerated.toLocaleString()}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Customer Satisfaction</div>
                        <div className="font-medium">{agent.customerSatisfaction}/5.0</div>
                      </div>
                    </div>
                    
                    <div className="mt-3">
                      <div className="flex justify-between text-xs mb-1">
                        <span>Uptime</span>
                        <span>{agent.uptime}%</span>
                      </div>
                      <Progress value={agent.uptime} className="h-2" />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="costs" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Cost per Task by Agent</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                    <YAxis />
                    <Tooltip formatter={(value) => [`$${value}`, 'Cost per Task']} />
                    <Bar dataKey="revenue" fill="hsl(var(--secondary))" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Revenue vs Cost Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {performanceData.slice(0, 5).map((agent) => {
                    const roi = ((agent.revenueGenerated - (agent.costPerTask * agent.tasksCompleted)) / (agent.costPerTask * agent.tasksCompleted)) * 100;
                    return (
                      <div key={agent.agentId} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <div className="font-medium text-sm">{agent.agentName}</div>
                          <div className="text-xs text-muted-foreground">
                            Cost: ${(agent.costPerTask * agent.tasksCompleted).toFixed(2)} | 
                            Revenue: ${agent.revenueGenerated.toFixed(2)}
                          </div>
                        </div>
                        <Badge variant={roi > 0 ? "default" : "destructive"}>
                          {roi > 0 ? '+' : ''}{roi.toFixed(1)}% ROI
                        </Badge>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="errors" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Error Trends Over Time</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={timeSeriesData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="time" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="errors" stroke="#ef4444" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trends" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Response Time Trends</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={timeSeriesData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="time" />
                  <YAxis />
                  <Tooltip />
                  <Area type="monotone" dataKey="response" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.3} />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};