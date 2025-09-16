import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Play, Pause, Square, RefreshCw, Filter, Search, 
  Clock, Users, Zap, AlertTriangle, CheckCircle,
  ArrowRight, MoreHorizontal, Archive
} from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface Task {
  id: string;
  taskType: string;
  agentId: string;
  agentName: string;
  status: 'queued' | 'running' | 'completed' | 'failed' | 'paused';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  progress: number;
  estimatedDuration: number;
  actualDuration?: number;
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
  customerId?: string;
  taskData: any;
  errorMessage?: string;
}

interface BulkOperation {
  id: string;
  operationType: string;
  operationName: string;
  targetAgents: string[];
  totalTargets: number;
  completedTargets: number;
  failedTargets: number;
  status: 'pending' | 'running' | 'completed' | 'failed';
  createdAt: string;
  estimatedCompletion?: string;
}

const StatusIcon = ({ status }: { status: Task['status'] }) => {
  switch (status) {
    case 'queued': return <Clock className="w-4 h-4 text-yellow-500" />;
    case 'running': return <Play className="w-4 h-4 text-blue-500" />;
    case 'completed': return <CheckCircle className="w-4 h-4 text-green-500" />;
    case 'failed': return <AlertTriangle className="w-4 h-4 text-red-500" />;
    case 'paused': return <Pause className="w-4 h-4 text-gray-500" />;
    default: return <Clock className="w-4 h-4" />;
  }
};

const PriorityBadge = ({ priority }: { priority: Task['priority'] }) => {
  const variants = {
    low: 'secondary',
    medium: 'default',
    high: 'destructive',
    urgent: 'destructive'
  } as const;
  
  return <Badge variant={variants[priority]}>{priority.toUpperCase()}</Badge>;
};

interface SmartTaskManagerProps {
  agents: any[];
  onTaskAssign: (agentId: string, taskData: any) => void;
  onBulkOperation: (agentIds: string[], operation: any) => void;
}

export const SmartTaskManager: React.FC<SmartTaskManagerProps> = ({
  agents,
  onTaskAssign,
  onBulkOperation,
}) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [bulkOperations, setBulkOperations] = useState<BulkOperation[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [selectedTasks, setSelectedTasks] = useState<string[]>([]);

  // Mock data generation
  useEffect(() => {
    const mockTasks: Task[] = Array.from({ length: 20 }, (_, i) => ({
      id: `task-${i + 1}`,
      taskType: ['booking_analysis', 'customer_support', 'data_processing', 'compliance_check'][Math.floor(Math.random() * 4)],
      agentId: agents[Math.floor(Math.random() * agents.length)]?.agent_id || 'unknown',
      agentName: agents[Math.floor(Math.random() * agents.length)]?.display_name || 'Unknown Agent',
      status: ['queued', 'running', 'completed', 'failed', 'paused'][Math.floor(Math.random() * 5)] as Task['status'],
      priority: ['low', 'medium', 'high', 'urgent'][Math.floor(Math.random() * 4)] as Task['priority'],
      progress: Math.floor(Math.random() * 100),
      estimatedDuration: Math.floor(Math.random() * 300 + 60),
      actualDuration: Math.random() > 0.5 ? Math.floor(Math.random() * 400 + 30) : undefined,
      createdAt: new Date(Date.now() - Math.random() * 86400000).toISOString(),
      startedAt: Math.random() > 0.3 ? new Date(Date.now() - Math.random() * 3600000).toISOString() : undefined,
      completedAt: Math.random() > 0.7 ? new Date().toISOString() : undefined,
      customerId: Math.random() > 0.5 ? `customer-${Math.floor(Math.random() * 100)}` : undefined,
      taskData: { type: 'analysis', input: 'sample data' },
      errorMessage: Math.random() > 0.8 ? 'Connection timeout' : undefined,
    }));
    
    setTasks(mockTasks);

    const mockBulkOps: BulkOperation[] = Array.from({ length: 5 }, (_, i) => ({
      id: `bulk-${i + 1}`,
      operationType: ['config_update', 'health_check', 'restart', 'backup'][Math.floor(Math.random() * 4)],
      operationName: `Bulk Operation ${i + 1}`,
      targetAgents: agents.slice(0, Math.floor(Math.random() * 5 + 2)).map(a => a.agent_id),
      totalTargets: Math.floor(Math.random() * 10 + 5),
      completedTargets: Math.floor(Math.random() * 8),
      failedTargets: Math.floor(Math.random() * 2),
      status: ['pending', 'running', 'completed'][Math.floor(Math.random() * 3)] as BulkOperation['status'],
      createdAt: new Date(Date.now() - Math.random() * 86400000).toISOString(),
      estimatedCompletion: new Date(Date.now() + Math.random() * 3600000).toISOString(),
    }));
    
    setBulkOperations(mockBulkOps);
  }, [agents]);

  const filteredTasks = tasks.filter(task => {
    const matchesSearch = task.taskType.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         task.agentName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || task.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || task.priority === priorityFilter;
    
    return matchesSearch && matchesStatus && matchesPriority;
  });

  const taskCounts = {
    total: tasks.length,
    queued: tasks.filter(t => t.status === 'queued').length,
    running: tasks.filter(t => t.status === 'running').length,
    completed: tasks.filter(t => t.status === 'completed').length,
    failed: tasks.filter(t => t.status === 'failed').length,
  };

  const handleTaskAction = (taskId: string, action: 'start' | 'pause' | 'stop' | 'retry') => {
    setTasks(prev => prev.map(task => {
      if (task.id === taskId) {
        switch (action) {
          case 'start':
            return { ...task, status: 'running', startedAt: new Date().toISOString() };
          case 'pause':
            return { ...task, status: 'paused' };
          case 'stop':
            return { ...task, status: 'failed', completedAt: new Date().toISOString() };
          case 'retry':
            return { ...task, status: 'queued', errorMessage: undefined };
          default:
            return task;
        }
      }
      return task;
    }));
  };

  const handleBulkTaskAction = (action: string) => {
    if (selectedTasks.length === 0) return;
    
    const agentIds = [...new Set(tasks.filter(t => selectedTasks.includes(t.id)).map(t => t.agentId))];
    
    onBulkOperation(agentIds, {
      type: action,
      taskIds: selectedTasks,
      operationName: `Bulk ${action} for ${selectedTasks.length} tasks`
    });
    
    setSelectedTasks([]);
  };

  return (
    <div className="space-y-6">
      {/* Task Overview */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold">{taskCounts.total}</div>
            <div className="text-sm text-muted-foreground">Total Tasks</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-yellow-600">{taskCounts.queued}</div>
            <div className="text-sm text-muted-foreground">Queued</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{taskCounts.running}</div>
            <div className="text-sm text-muted-foreground">Running</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">{taskCounts.completed}</div>
            <div className="text-sm text-muted-foreground">Completed</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-red-600">{taskCounts.failed}</div>
            <div className="text-sm text-muted-foreground">Failed</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="queue" className="space-y-4">
        <TabsList>
          <TabsTrigger value="queue">Task Queue</TabsTrigger>
          <TabsTrigger value="bulk">Bulk Operations</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
        </TabsList>

        <TabsContent value="queue" className="space-y-4">
          {/* Filters and Search */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm">Task Management</CardTitle>
                <div className="flex gap-2">
                  {selectedTasks.length > 0 && (
                    <>
                      <Button size="sm" variant="outline" onClick={() => handleBulkTaskAction('start')}>
                        <Play className="w-4 h-4 mr-2" />
                        Start Selected
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => handleBulkTaskAction('pause')}>
                        <Pause className="w-4 h-4 mr-2" />
                        Pause Selected
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => handleBulkTaskAction('stop')}>
                        <Square className="w-4 h-4 mr-2" />
                        Stop Selected
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4 mb-4">
                <div className="flex-1">
                  <Input
                    placeholder="Search tasks..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="max-w-sm"
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="queued">Queued</SelectItem>
                    <SelectItem value="running">Running</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="failed">Failed</SelectItem>
                    <SelectItem value="paused">Paused</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Priority</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Task List */}
              <div className="space-y-2">
                {filteredTasks.map((task) => (
                  <div
                    key={task.id}
                    className="p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={selectedTasks.includes(task.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedTasks(prev => [...prev, task.id]);
                            } else {
                              setSelectedTasks(prev => prev.filter(id => id !== task.id));
                            }
                          }}
                          className="rounded"
                        />
                        <StatusIcon status={task.status} />
                        <div>
                          <div className="font-medium text-sm">{task.taskType}</div>
                          <div className="text-xs text-muted-foreground">{task.id}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <PriorityBadge priority={task.priority} />
                        <Badge variant="outline">{task.agentName}</Badge>
                        <div className="flex gap-1">
                          {task.status === 'queued' && (
                            <Button size="sm" variant="ghost" onClick={() => handleTaskAction(task.id, 'start')}>
                              <Play className="w-3 h-3" />
                            </Button>
                          )}
                          {task.status === 'running' && (
                            <Button size="sm" variant="ghost" onClick={() => handleTaskAction(task.id, 'pause')}>
                              <Pause className="w-3 h-3" />
                            </Button>
                          )}
                          {task.status === 'failed' && (
                            <Button size="sm" variant="ghost" onClick={() => handleTaskAction(task.id, 'retry')}>
                              <RefreshCw className="w-3 h-3" />
                            </Button>
                          )}
                          <Button size="sm" variant="ghost" onClick={() => handleTaskAction(task.id, 'stop')}>
                            <Square className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                    
                    {task.status === 'running' && (
                      <div className="mb-2">
                        <div className="flex justify-between text-xs mb-1">
                          <span>Progress</span>
                          <span>{task.progress}%</span>
                        </div>
                        <Progress value={task.progress} className="h-2" />
                      </div>
                    )}
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                      <div>
                        <div className="text-muted-foreground">Created</div>
                        <div>{new Date(task.createdAt).toLocaleString()}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Duration</div>
                        <div>
                          {task.actualDuration 
                            ? `${Math.round(task.actualDuration / 60)}m` 
                            : `~${Math.round(task.estimatedDuration / 60)}m`
                          }
                        </div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Customer</div>
                        <div>{task.customerId || 'System'}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Error</div>
                        <div className="text-red-600">{task.errorMessage || '—'}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="bulk" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Bulk Operations</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {bulkOperations.map((operation) => (
                  <div key={operation.id} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <div className="font-medium text-sm">{operation.operationName}</div>
                        <div className="text-xs text-muted-foreground">{operation.operationType}</div>
                      </div>
                      <Badge variant={operation.status === 'completed' ? 'default' : 'secondary'}>
                        {operation.status}
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-4 text-xs mb-3">
                      <div>
                        <div className="text-muted-foreground">Total Targets</div>
                        <div>{operation.totalTargets}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Completed</div>
                        <div className="text-green-600">{operation.completedTargets}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Failed</div>
                        <div className="text-red-600">{operation.failedTargets}</div>
                      </div>
                    </div>
                    
                    <div className="mb-2">
                      <div className="flex justify-between text-xs mb-1">
                        <span>Progress</span>
                        <span>{Math.round((operation.completedTargets / operation.totalTargets) * 100)}%</span>
                      </div>
                      <Progress value={(operation.completedTargets / operation.totalTargets) * 100} className="h-2" />
                    </div>
                    
                    <div className="text-xs text-muted-foreground">
                      Created: {new Date(operation.createdAt).toLocaleString()}
                      {operation.estimatedCompletion && (
                        <> • Est. completion: {new Date(operation.estimatedCompletion).toLocaleString()}</>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="templates" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Task Templates</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[
                  { name: 'Daily Health Check', description: 'Run health checks on all agents', agents: 'All Agents' },
                  { name: 'Customer Data Processing', description: 'Process pending customer data', agents: 'Data Agents' },
                  { name: 'Compliance Audit', description: 'Run compliance checks', agents: 'Compliance Agents' },
                  { name: 'Performance Optimization', description: 'Optimize agent performance', agents: 'All Agents' },
                ].map((template, index) => (
                  <div key={index} className="p-4 border rounded-lg hover:bg-accent/50 cursor-pointer">
                    <div className="font-medium text-sm mb-2">{template.name}</div>
                    <div className="text-xs text-muted-foreground mb-3">{template.description}</div>
                    <div className="flex justify-between items-center">
                      <Badge variant="outline" className="text-xs">{template.agents}</Badge>
                      <Button size="sm" variant="ghost">
                        <Play className="w-3 h-3 mr-1" />
                        Run
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};