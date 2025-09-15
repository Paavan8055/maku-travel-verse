import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  Calendar,
  MapPin,
  DollarSign,
  User,
  Bot
} from 'lucide-react';
import { Helmet } from 'react-helmet-async';

interface AgenticTask {
  id: string;
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

const MyTrips = () => {
  const [tasks, setTasks] = useState<AgenticTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTask, setSelectedTask] = useState<AgenticTask | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchTasks();
    setupRealtimeSubscription();
  }, []);

  const fetchTasks = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('agentic_tasks')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTasks(data || []);
    } catch (error) {
      console.error('Error fetching tasks:', error);
      toast({
        title: "Error loading tasks",
        description: "Failed to load your trip planning tasks",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const setupRealtimeSubscription = () => {
    const channel = supabase
      .channel('agentic-tasks-changes')
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
                return [task, ...prevTasks];
              }
            });

            // Show toast for task completion
            if (task.status === 'completed') {
              toast({
                title: "Task Completed",
                description: `Your ${task.intent.replace('_', ' ')} task has finished!`,
              });
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const filteredTasks = tasks.filter(task => {
    const matchesFilter = filter === 'all' || task.status === filter;
    const matchesSearch = searchTerm === '' || 
      task.intent.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task.agent_id.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const getAgentDisplayName = (agentId: string) => {
    const agentNames = {
      'trip-planner': 'Trip Planner',
      'price-monitor': 'Price Monitor', 
      'booking-assistant': 'Booking Assistant',
      'itinerary-optimizer': 'Itinerary Optimizer'
    };
    return agentNames[agentId] || agentId.replace('-', ' ').toUpperCase();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-6">
        <Helmet>
          <title>My Trips - Maku Travel</title>
          <meta name="description" content="Track your travel planning tasks and trip bookings with Maku's AI agents" />
        </Helmet>
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-96">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <Helmet>
        <title>My Trips - Maku Travel</title>
        <meta name="description" content="Track your travel planning tasks and trip bookings with Maku's AI agents" />
      </Helmet>
      
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">My Trips & Tasks</h1>
            <p className="text-muted-foreground">
              Track your AI-powered travel planning and booking tasks
            </p>
          </div>
          <Button onClick={fetchTasks} variant="outline" className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
        </div>

        {/* Filters */}
        <div className="flex gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search tasks..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-md pl-10"
            />
          </div>
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Tasks</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="running">Running</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Tabs defaultValue="grid" className="space-y-6">
          <TabsList>
            <TabsTrigger value="grid">Grid View</TabsTrigger>
            <TabsTrigger value="list">List View</TabsTrigger>
            <TabsTrigger value="detail">Task Details</TabsTrigger>
          </TabsList>

          <TabsContent value="grid">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredTasks.map((task) => {
                const StatusIcon = statusIcons[task.status] || Clock;
                return (
                  <Card key={task.id} className="cursor-pointer hover:shadow-md transition-shadow" 
                        onClick={() => setSelectedTask(task)}>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg flex items-center gap-2">
                          <Bot className="h-5 w-5" />
                          {getAgentDisplayName(task.agent_id)}
                        </CardTitle>
                        <Badge className={statusColors[task.status]}>
                          <StatusIcon className="h-3 w-3 mr-1" />
                          {task.status}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div>
                          <p className="font-medium">{task.intent.replace('_', ' ').toUpperCase()}</p>
                          <p className="text-sm text-muted-foreground">
                            Created: {formatDate(task.created_at)}
                          </p>
                        </div>
                        
                        {task.status === 'running' && (
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span>Progress</span>
                              <span>{task.progress}%</span>
                            </div>
                            <div className="w-full bg-muted rounded-full h-2">
                              <div 
                                className="bg-primary h-2 rounded-full transition-all duration-300"
                                style={{ width: `${task.progress}%` }}
                              ></div>
                            </div>
                          </div>
                        )}

                        {task.params && (
                          <div className="text-sm space-y-1">
                            {task.params.destination && (
                              <div className="flex items-center gap-2">
                                <MapPin className="h-3 w-3" />
                                <span>{task.params.destination}</span>
                              </div>
                            )}
                            {task.params.dates && (
                              <div className="flex items-center gap-2">
                                <Calendar className="h-3 w-3" />
                                <span>{task.params.dates}</span>
                              </div>
                            )}
                            {task.params.budget && (
                              <div className="flex items-center gap-2">
                                <DollarSign className="h-3 w-3" />
                                <span>${task.params.budget}</span>
                              </div>
                            )}
                          </div>
                        )}

                        {(task.status === 'pending' || task.status === 'running') && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                            }}
                            className="w-full"
                          >
                            Cancel Task
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
            {filteredTasks.length === 0 && (
              <div className="text-center py-12">
                <Bot className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No tasks found</h3>
                <p className="text-muted-foreground">
                  {searchTerm || filter !== 'all' 
                    ? 'Try adjusting your filters or search terms'
                    : 'Start planning your next trip to see tasks here'}
                </p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="list">
            <div className="space-y-4">
              {filteredTasks.map((task) => {
                const StatusIcon = statusIcons[task.status] || Clock;
                return (
                  <Card key={task.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="flex items-center space-x-2">
                            <Bot className="h-5 w-5" />
                            <div>
                              <p className="font-medium">{getAgentDisplayName(task.agent_id)}</p>
                              <p className="text-sm text-muted-foreground">{task.intent.replace('_', ' ')}</p>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-4">
                          <Badge className={statusColors[task.status]}>
                            <StatusIcon className="h-3 w-3 mr-1" />
                            {task.status}
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            {formatDate(task.created_at)}
                          </span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedTask(task)}
                          >
                            View Details
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          <TabsContent value="detail">
            {selectedTask ? (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Bot className="h-5 w-5" />
                    {getAgentDisplayName(selectedTask.agent_id)} - Task Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="font-semibold mb-2">Task Information</h3>
                      <div className="space-y-2 text-sm">
                        <div><strong>Intent:</strong> {selectedTask.intent}</div>
                        <div><strong>Status:</strong> {selectedTask.status}</div>
                        <div><strong>Progress:</strong> {selectedTask.progress}%</div>
                        <div><strong>Created:</strong> {formatDate(selectedTask.created_at)}</div>
                        <div><strong>Updated:</strong> {formatDate(selectedTask.updated_at)}</div>
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="font-semibold mb-2">Parameters</h3>
                      <pre className="text-sm bg-muted p-3 rounded overflow-auto">
                        {JSON.stringify(selectedTask.params, null, 2)}
                      </pre>
                    </div>
                  </div>

                  {selectedTask.result && (
                    <div>
                      <h3 className="font-semibold mb-2">Result</h3>
                      <div className="bg-muted p-4 rounded">
                        {typeof selectedTask.result === 'string' ? (
                          <p>{selectedTask.result}</p>
                        ) : (
                          <pre className="text-sm overflow-auto">
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
            ) : (
              <div className="text-center py-12">
                <User className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No task selected</h3>
                <p className="text-muted-foreground">
                  Select a task from the grid or list view to see detailed information
                </p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default MyTrips;