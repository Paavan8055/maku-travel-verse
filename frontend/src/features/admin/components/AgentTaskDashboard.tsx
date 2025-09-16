import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  RefreshCw, 
  Search,
  Bot,
  User,
  Shield,
  Trash2
} from 'lucide-react';

interface AgenticTask {
  id: string;
  user_id: string;
  agent_id: string;
  intent: string;
  params: any;
  status: string;
  progress: number;
  result: any;
  error_message: string;
  created_at: string;
  updated_at: string;
}

const statusIcons = {
  pending: Clock,
  running: RefreshCw,
  completed: CheckCircle,
  cancelled: XCircle,
  failed: AlertTriangle,
};

const statusColors = {
  pending: 'bg-muted text-muted-foreground',
  running: 'bg-travel-sunset text-white animate-pulse',
  completed: 'bg-travel-forest text-white',
  cancelled: 'bg-muted text-muted-foreground',
  failed: 'bg-destructive text-destructive-foreground',
};

const AgentTaskDashboard = () => {
  const [tasks, setTasks] = useState<AgenticTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [agentFilter, setAgentFilter] = useState('all');
  const [userFilter, setUserFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTask, setSelectedTask] = useState<AgenticTask | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchAllTasks();
    setupRealtimeSubscription();
  }, []);

  const fetchAllTasks = async () => {
    try {
      const { data, error } = await supabase
        .from('agentic_tasks')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(200); // Admin can see up to 200 recent tasks

      if (error) throw error;
      setTasks(data || []);
    } catch (error) {
      console.error('Error fetching tasks:', error);
      toast({
        title: "Error loading tasks",
        description: "Failed to load agent tasks",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const setupRealtimeSubscription = () => {
    const channel = supabase
      .channel('admin-agentic-tasks')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'agentic_tasks'
        },
        (payload) => {
          const task = payload.new as AgenticTask;
          if (task) {
            setTasks(prevTasks => {
              const existingIndex = prevTasks.findIndex(t => t.id === task.id);
              if (existingIndex >= 0) {
                const updated = [...prevTasks];
                updated[existingIndex] = task;
                return updated;
              } else {
                return [task, ...prevTasks.slice(0, 199)]; // Keep only 200 tasks
              }
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const filteredTasks = tasks.filter(task => {
    const matchesStatus = statusFilter === 'all' || task.status === statusFilter;
    const matchesAgent = agentFilter === 'all' || task.agent_id === agentFilter;
    const matchesUser = userFilter === '' || task.user_id.includes(userFilter);
    const matchesSearch = searchTerm === '' || 
      task.intent.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task.agent_id.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesAgent && matchesUser && matchesSearch;
  });

  const getAgentDisplayName = (agentId: string) => {
    const agentNames = {
      'trip-planner': 'Trip Planner',
      'price-monitor': 'Price Monitor', 
      'booking-assistant': 'Booking Assistant',
      'itinerary-optimizer': 'Itinerary Optimizer',
      'password-reset': 'Password Reset',
      'booking-modification': 'Booking Modification',
      'refund-processing': 'Refund Processing',
      'security-alert': 'Security Alert',
      'user-support': 'User Support',
      'fraud-detection': 'Fraud Detection',
      'compliance-check': 'Compliance Check',
      'system-health': 'System Health',
      'performance-tracker': 'Performance Tracker'
    };
    return agentNames[agentId] || agentId.replace('-', ' ').toUpperCase();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const uniqueAgents = [...new Set(tasks.map(task => task.agent_id))];

  const taskStats = {
    total: tasks.length,
    pending: tasks.filter(t => t.status === 'pending').length,
    running: tasks.filter(t => t.status === 'running').length,
    completed: tasks.filter(t => t.status === 'completed').length,
    failed: tasks.filter(t => t.status === 'failed').length,
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Agent Task Dashboard</h2>
          <p className="text-muted-foreground">
            Monitor and manage all 70-agent system tasks across users
          </p>
        </div>
        <Button onClick={fetchAllTasks} variant="outline" className="gap-2">
          <RefreshCw className="h-4 w-4" />
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Bot className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm font-medium">Total Tasks</p>
                <p className="text-2xl font-bold">{taskStats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Clock className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Pending</p>
                <p className="text-2xl font-bold">{taskStats.pending}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <RefreshCw className="h-5 w-5 text-travel-sunset" />
              <div>
                <p className="text-sm font-medium">Running</p>
                <p className="text-2xl font-bold">{taskStats.running}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-travel-forest" />
              <div>
                <p className="text-sm font-medium">Completed</p>
                <p className="text-2xl font-bold">{taskStats.completed}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              <div>
                <p className="text-sm font-medium">Failed</p>
                <p className="text-2xl font-bold">{taskStats.failed}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search tasks..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 w-64"
          />
        </div>
        
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="running">Running</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
            <SelectItem value="failed">Failed</SelectItem>
          </SelectContent>
        </Select>

        <Select value={agentFilter} onValueChange={setAgentFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by agent" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Agents</SelectItem>
            {uniqueAgents.map(agentId => (
              <SelectItem key={agentId} value={agentId}>
                {getAgentDisplayName(agentId)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Input
          placeholder="Filter by User ID..."
          value={userFilter}
          onChange={(e) => setUserFilter(e.target.value)}
          className="w-64"
        />
      </div>

      {/* Tasks Table */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Tasks ({filteredTasks.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredTasks.map((task) => {
              const StatusIcon = statusIcons[task.status] || Clock;
              return (
                <div key={task.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      <Bot className="h-5 w-5" />
                      <div>
                        <p className="font-medium">{getAgentDisplayName(task.agent_id)}</p>
                        <p className="text-sm text-muted-foreground">{task.intent.replace('_', ' ')}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-mono">{task.user_id.substring(0, 8)}...</span>
                    </div>
                    
                    {task.status === 'running' && (
                      <div className="flex items-center space-x-2">
                        <div className="w-24 bg-muted rounded-full h-2">
                          <div 
                            className="bg-primary h-2 rounded-full transition-all duration-300"
                            style={{ width: `${task.progress}%` }}
                          ></div>
                        </div>
                        <span className="text-sm">{task.progress}%</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    <Badge className={statusColors[task.status]}>
                      <StatusIcon className="h-3 w-3 mr-1" />
                      {task.status}
                    </Badge>
                    
                    <span className="text-sm text-muted-foreground">
                      {formatDate(task.created_at)}
                    </span>
                    
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedTask(task)}
                      >
                        View
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
            
            {filteredTasks.length === 0 && (
              <div className="text-center py-12">
                <Bot className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No tasks found</h3>
                <p className="text-muted-foreground">
                  Try adjusting your filters or search terms
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Task Detail Modal */}
      {selectedTask && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Task Details - {getAgentDisplayName(selectedTask.agent_id)}
              </CardTitle>
              <Button variant="outline" onClick={() => setSelectedTask(null)}>
                Close
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold mb-2">Task Information</h3>
                <div className="space-y-2 text-sm">
                  <div><strong>ID:</strong> {selectedTask.id}</div>
                  <div><strong>User ID:</strong> {selectedTask.user_id}</div>
                  <div><strong>Agent:</strong> {selectedTask.agent_id}</div>
                  <div><strong>Intent:</strong> {selectedTask.intent}</div>
                  <div><strong>Status:</strong> {selectedTask.status}</div>
                  <div><strong>Progress:</strong> {selectedTask.progress}%</div>
                  <div><strong>Created:</strong> {formatDate(selectedTask.created_at)}</div>
                  <div><strong>Updated:</strong> {formatDate(selectedTask.updated_at)}</div>
                </div>
              </div>
              
              <div>
                <h3 className="font-semibold mb-2">Parameters</h3>
                <pre className="text-sm bg-muted p-3 rounded overflow-auto max-h-40">
                  {JSON.stringify(selectedTask.params, null, 2)}
                </pre>
              </div>
            </div>

            {selectedTask.result && (
              <div>
                <h3 className="font-semibold mb-2">Result</h3>
                <div className="bg-muted p-4 rounded max-h-60 overflow-auto">
                  {typeof selectedTask.result === 'string' ? (
                    <p>{selectedTask.result}</p>
                  ) : (
                    <pre className="text-sm">
                      {JSON.stringify(selectedTask.result, null, 2)}
                    </pre>
                  )}
                </div>
              </div>
            )}

            {selectedTask.error_message && (
              <div>
                <h3 className="font-semibold mb-2 text-destructive">Error</h3>
                <div className="bg-destructive/10 border border-destructive/20 p-4 rounded">
                  <p className="text-destructive">{selectedTask.error_message}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AgentTaskDashboard;