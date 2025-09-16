import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Activity, 
  Users, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  Play,
  Pause,
  Square,
  ArrowRight,
  MessageSquare,
  Brain,
  Zap,
  Target
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface AgentStatus {
  id: string;
  type: 'travel-expert' | 'booking-specialist' | 'payment-handler' | 'customer-service' | 'general';
  status: 'active' | 'busy' | 'paused' | 'terminated';
  currentTask?: string;
  workload: number;
  performance: {
    tasksCompleted: number;
    averageResponseTime: number;
    successRate: number;
  };
  specialization: string[];
  lastActivity: Date;
}

interface TaskExecution {
  id: string;
  name: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'paused';
  assignedAgent: string;
  progress: number;
  startedAt: Date;
  estimatedCompletion?: Date;
  dependencies: string[];
  priority: 'low' | 'normal' | 'high' | 'urgent';
}

interface SystemMetrics {
  totalAgents: number;
  activeAgents: number;
  busyAgents: number;
  averageWorkload: number;
  queuedTasks: number;
  completedTasks: number;
  systemHealth: 'healthy' | 'warning' | 'critical';
}

export function AgentCoordinationDashboard() {
  const [agents, setAgents] = useState<AgentStatus[]>([]);
  const [tasks, setTasks] = useState<TaskExecution[]>([]);
  const [metrics, setMetrics] = useState<SystemMetrics>({
    totalAgents: 0,
    activeAgents: 0,
    busyAgents: 0,
    averageWorkload: 0,
    queuedTasks: 0,
    completedTasks: 0,
    systemHealth: 'healthy'
  });
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    // Initialize with mock data - in real app, this would come from the orchestrator
    initializeMockData();
    
    // Set up real-time updates
    const interval = setInterval(updateMetrics, 2000);
    return () => clearInterval(interval);
  }, []);

  const initializeMockData = () => {
    const mockAgents: AgentStatus[] = [
      {
        id: 'agent-1',
        type: 'travel-expert',
        status: 'active',
        currentTask: 'Analyzing destination preferences',
        workload: 3,
        performance: {
          tasksCompleted: 45,
          averageResponseTime: 1200,
          successRate: 0.94
        },
        specialization: ['destination-research', 'itinerary-planning'],
        lastActivity: new Date()
      },
      {
        id: 'agent-2',
        type: 'booking-specialist',
        status: 'busy',
        currentTask: 'Processing hotel reservation',
        workload: 5,
        performance: {
          tasksCompleted: 28,
          averageResponseTime: 2100,
          successRate: 0.97
        },
        specialization: ['hotel-booking', 'flight-booking'],
        lastActivity: new Date()
      },
      {
        id: 'agent-3',
        type: 'customer-service',
        status: 'active',
        workload: 1,
        performance: {
          tasksCompleted: 67,
          averageResponseTime: 850,
          successRate: 0.96
        },
        specialization: ['support-chat', 'issue-resolution'],
        lastActivity: new Date(Date.now() - 30000)
      }
    ];

    const mockTasks: TaskExecution[] = [
      {
        id: 'task-1',
        name: 'Complete Travel Booking Workflow',
        status: 'running',
        assignedAgent: 'agent-1',
        progress: 65,
        startedAt: new Date(Date.now() - 180000),
        estimatedCompletion: new Date(Date.now() + 120000),
        dependencies: [],
        priority: 'high'
      },
      {
        id: 'task-2',
        name: 'Process Payment',
        status: 'pending',
        assignedAgent: 'agent-2',
        progress: 0,
        startedAt: new Date(),
        dependencies: ['task-1'],
        priority: 'normal'
      },
      {
        id: 'task-3',
        name: 'Send Confirmation Email',
        status: 'pending',
        assignedAgent: 'agent-3',
        progress: 0,
        startedAt: new Date(),
        dependencies: ['task-2'],
        priority: 'normal'
      }
    ];

    setAgents(mockAgents);
    setTasks(mockTasks);
    updateMetricsFromData(mockAgents, mockTasks);
  };

  const updateMetrics = () => {
    // Simulate real-time updates
    setTasks(prev => prev.map(task => {
      if (task.status === 'running' && task.progress < 100) {
        return {
          ...task,
          progress: Math.min(100, task.progress + Math.random() * 5)
        };
      }
      return task;
    }));

    setAgents(prev => prev.map(agent => ({
      ...agent,
      workload: Math.max(0, agent.workload + (Math.random() - 0.5)),
      lastActivity: agent.status === 'active' ? new Date() : agent.lastActivity
    })));
  };

  const updateMetricsFromData = (agentData: AgentStatus[], taskData: TaskExecution[]) => {
    const activeAgents = agentData.filter(a => a.status === 'active').length;
    const busyAgents = agentData.filter(a => a.status === 'busy').length;
    const avgWorkload = agentData.reduce((sum, a) => sum + a.workload, 0) / agentData.length;
    const queuedTasks = taskData.filter(t => t.status === 'pending').length;
    const completedTasks = taskData.filter(t => t.status === 'completed').length;

    setMetrics({
      totalAgents: agentData.length,
      activeAgents,
      busyAgents,
      averageWorkload: avgWorkload,
      queuedTasks,
      completedTasks,
      systemHealth: avgWorkload > 8 ? 'critical' : avgWorkload > 5 ? 'warning' : 'healthy'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500';
      case 'busy': return 'bg-yellow-500';
      case 'paused': return 'bg-orange-500';
      case 'terminated': return 'bg-red-500';
      case 'running': return 'bg-blue-500';
      case 'completed': return 'bg-green-500';
      case 'failed': return 'bg-red-500';
      case 'pending': return 'bg-gray-500';
      default: return 'bg-gray-400';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'destructive';
      case 'high': return 'destructive';
      case 'normal': return 'secondary';
      case 'low': return 'outline';
      default: return 'secondary';
    }
  };

  const handleAgentAction = (agentId: string, action: 'pause' | 'resume' | 'terminate') => {
    setAgents(prev => prev.map(agent => {
      if (agent.id === agentId) {
        switch (action) {
          case 'pause':
            return { ...agent, status: 'paused' as const };
          case 'resume':
            return { ...agent, status: 'active' as const };
          case 'terminate':
            return { ...agent, status: 'terminated' as const };
          default:
            return agent;
        }
      }
      return agent;
    }));

    toast({
      title: 'Agent Action',
      description: `Agent ${agentId} has been ${action}d`,
    });
  };

  const handleTaskAction = (taskId: string, action: 'start' | 'pause' | 'cancel') => {
    setTasks(prev => prev.map(task => {
      if (task.id === taskId) {
        switch (action) {
          case 'start':
            return { ...task, status: 'running' as const };
          case 'pause':
            return { ...task, status: 'paused' as const };
          case 'cancel':
            return { ...task, status: 'failed' as const };
          default:
            return task;
        }
      }
      return task;
    }));

    toast({
      title: 'Task Action',
      description: `Task ${taskId} has been ${action}ed`,
    });
  };

  return (
    <div className="space-y-6 p-6">
      {/* System Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Agents</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalAgents}</div>
            <p className="text-xs text-muted-foreground">
              {metrics.activeAgents} active, {metrics.busyAgents} busy
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Workload</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.averageWorkload.toFixed(1)}</div>
            <Progress 
              value={(metrics.averageWorkload / 10) * 100} 
              className="mt-2"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Task Queue</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.queuedTasks}</div>
            <p className="text-xs text-muted-foreground">
              {metrics.completedTasks} completed today
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System Health</CardTitle>
            {metrics.systemHealth === 'healthy' && <CheckCircle className="h-4 w-4 text-green-500" />}
            {metrics.systemHealth === 'warning' && <AlertTriangle className="h-4 w-4 text-yellow-500" />}
            {metrics.systemHealth === 'critical' && <XCircle className="h-4 w-4 text-red-500" />}
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold capitalize">{metrics.systemHealth}</div>
            <Badge 
              variant={
                metrics.systemHealth === 'healthy' ? 'secondary' : 
                metrics.systemHealth === 'warning' ? 'destructive' : 'destructive'
              }
            >
              {metrics.systemHealth.toUpperCase()}
            </Badge>
          </CardContent>
        </Card>
      </div>

      {/* Main Dashboard */}
      <Tabs defaultValue="agents" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="agents">Agents</TabsTrigger>
          <TabsTrigger value="tasks">Tasks</TabsTrigger>
          <TabsTrigger value="workflows">Workflows</TabsTrigger>
        </TabsList>

        <TabsContent value="agents">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Agents List */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Active Agents
                </CardTitle>
                <CardDescription>
                  Real-time agent status and performance monitoring
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[400px] pr-4">
                  <div className="space-y-4">
                    {agents.map((agent) => (
                      <div
                        key={agent.id}
                        className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                          selectedAgent === agent.id ? 'bg-muted' : 'hover:bg-muted/50'
                        }`}
                        onClick={() => setSelectedAgent(agent.id)}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <div className={`w-3 h-3 rounded-full ${getStatusColor(agent.status)}`} />
                            <span className="font-medium">{agent.type}</span>
                            <Badge variant="outline" className="text-xs">
                              {agent.id}
                            </Badge>
                          </div>
                          <Badge variant="secondary">
                            Workload: {agent.workload.toFixed(1)}
                          </Badge>
                        </div>
                        
                        {agent.currentTask && (
                          <p className="text-sm text-muted-foreground mb-2">
                            {agent.currentTask}
                          </p>
                        )}
                        
                        <div className="flex gap-2 mb-2">
                          {agent.specialization.map((spec) => (
                            <Badge key={spec} variant="outline" className="text-xs">
                              {spec}
                            </Badge>
                          ))}
                        </div>
                        
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>Success: {(agent.performance.successRate * 100).toFixed(1)}%</span>
                          <span>Avg: {agent.performance.averageResponseTime}ms</span>
                        </div>
                        
                        <div className="flex gap-1 mt-2">
                          {agent.status === 'active' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleAgentAction(agent.id, 'pause');
                              }}
                            >
                              <Pause className="h-3 w-3" />
                            </Button>
                          )}
                          {agent.status === 'paused' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleAgentAction(agent.id, 'resume');
                              }}
                            >
                              <Play className="h-3 w-3" />
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleAgentAction(agent.id, 'terminate');
                            }}
                          >
                            <Square className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            {/* Agent Details */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="h-5 w-5" />
                  Agent Details
                </CardTitle>
                <CardDescription>
                  {selectedAgent ? `Details for ${selectedAgent}` : 'Select an agent to view details'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {selectedAgent ? (
                  <div className="space-y-4">
                    {agents
                      .filter(agent => agent.id === selectedAgent)
                      .map(agent => (
                        <div key={agent.id} className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <h4 className="font-medium mb-1">Status</h4>
                              <Badge variant="secondary">{agent.status}</Badge>
                            </div>
                            <div>
                              <h4 className="font-medium mb-1">Type</h4>
                              <span className="text-sm">{agent.type}</span>
                            </div>
                            <div>
                              <h4 className="font-medium mb-1">Tasks Completed</h4>
                              <span className="text-sm">{agent.performance.tasksCompleted}</span>
                            </div>
                            <div>
                              <h4 className="font-medium mb-1">Success Rate</h4>
                              <span className="text-sm">{(agent.performance.successRate * 100).toFixed(1)}%</span>
                            </div>
                          </div>
                          
                          <div>
                            <h4 className="font-medium mb-2">Specializations</h4>
                            <div className="flex flex-wrap gap-2">
                              {agent.specialization.map(spec => (
                                <Badge key={spec} variant="outline">{spec}</Badge>
                              ))}
                            </div>
                          </div>
                          
                          {agent.currentTask && (
                            <div>
                              <h4 className="font-medium mb-1">Current Task</h4>
                              <p className="text-sm text-muted-foreground">{agent.currentTask}</p>
                            </div>
                          )}
                          
                          <div>
                            <h4 className="font-medium mb-2">Performance</h4>
                            <div className="space-y-2">
                              <div className="flex justify-between text-sm">
                                <span>Response Time</span>
                                <span>{agent.performance.averageResponseTime}ms</span>
                              </div>
                              <Progress 
                                value={Math.max(0, 100 - (agent.performance.averageResponseTime / 50))} 
                              />
                              <div className="flex justify-between text-sm">
                                <span>Workload</span>
                                <span>{agent.workload.toFixed(1)}/10</span>
                              </div>
                              <Progress value={(agent.workload / 10) * 100} />
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                    <div className="text-center">
                      <Brain className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p>Select an agent to view detailed information</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="tasks">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Task Queue Management
              </CardTitle>
              <CardDescription>
                Monitor and control task execution across all agents
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {tasks.map((task) => (
                  <div key={task.id} className="p-4 rounded-lg border">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full ${getStatusColor(task.status)}`} />
                        <span className="font-medium">{task.name}</span>
                        <Badge variant={getPriorityColor(task.priority)}>
                          {task.priority}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span>Agent: {task.assignedAgent}</span>
                        <ArrowRight className="h-3 w-3" />
                        <span>{task.progress}%</span>
                      </div>
                    </div>
                    
                    <Progress value={task.progress} className="mb-3" />
                    
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>Started: {task.startedAt.toLocaleTimeString()}</span>
                      {task.estimatedCompletion && (
                        <span>ETA: {task.estimatedCompletion.toLocaleTimeString()}</span>
                      )}
                    </div>
                    
                    {task.dependencies.length > 0 && (
                      <div className="mt-2">
                        <span className="text-xs text-muted-foreground">
                          Dependencies: {task.dependencies.join(', ')}
                        </span>
                      </div>
                    )}
                    
                    <div className="flex gap-1 mt-3">
                      {task.status === 'pending' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleTaskAction(task.id, 'start')}
                        >
                          <Play className="h-3 w-3" />
                        </Button>
                      )}
                      {task.status === 'running' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleTaskAction(task.id, 'pause')}
                        >
                          <Pause className="h-3 w-3" />
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleTaskAction(task.id, 'cancel')}
                      >
                        <Square className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="workflows">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Workflow Templates
              </CardTitle>
              <CardDescription>
                Manage and execute complex multi-agent workflows
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-muted-foreground">
                <Zap className="h-8 w-8 mx-auto mb-4 opacity-50" />
                <p>Workflow management interface coming soon</p>
                <p className="text-sm">This will show active workflows, templates, and execution status</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}