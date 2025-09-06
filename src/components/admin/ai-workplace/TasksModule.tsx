import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { 
  Plus, 
  Calendar,
  Clock, 
  User, 
  CheckCircle, 
  AlertTriangle, 
  Play,
  Pause,
  MoreHorizontal,
  FileText,
  Target,
  Zap
} from 'lucide-react';

interface Task {
  id: string;
  title: string;
  description: string;
  task_type: string;
  priority: string;
  status: string;
  assigned_to_type: string;
  assigned_to_id: string;
  estimated_duration_minutes?: number;
  actual_duration_minutes?: number;
  progress_percentage: number;
  due_date?: string;
  created_at: string;
  updated_at: string;
}

interface Agent {
  agent_id: string;
  display_name: string;
  status: string;
}

export function TasksModule() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  const [newTaskForm, setNewTaskForm] = useState({
    title: '',
    description: '',
    task_type: 'general',
    priority: 'medium',
    assigned_to_type: 'agent',
    assigned_to_id: '',
    estimated_duration_minutes: '',
    due_date: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [tasksRes, agentsRes] = await Promise.all([
        supabase.from('ai_workplace_tasks').select('*').order('created_at', { ascending: false }),
        supabase.from('agent_management').select('agent_id, display_name, status').eq('status', 'active')
      ]);

      if (tasksRes.data) setTasks(tasksRes.data as Task[]);
      if (agentsRes.data) setAgents(agentsRes.data as Agent[]);
    } catch (error) {
      console.error('Error loading tasks:', error);
      toast.error('Failed to load tasks');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTask = async () => {
    try {
      const { data, error } = await supabase
        .from('ai_workplace_tasks')
        .insert({
          title: newTaskForm.title,
          description: newTaskForm.description,
          task_type: newTaskForm.task_type,
          priority: newTaskForm.priority,
          assigned_to_type: newTaskForm.assigned_to_type,
          assigned_to_id: newTaskForm.assigned_to_id || null,
          estimated_duration_minutes: parseInt(newTaskForm.estimated_duration_minutes) || null,
          due_date: newTaskForm.due_date || null,
          status: 'todo'
        })
        .select()
        .single();

      if (error) throw error;

      toast.success('Task created successfully');
      setTasks([data as Task, ...tasks]);
      setIsCreating(false);
      resetForm();
    } catch (error) {
      console.error('Error creating task:', error);
      toast.error('Failed to create task');
    }
  };

  const resetForm = () => {
    setNewTaskForm({
      title: '',
      description: '',
      task_type: 'general',
      priority: 'medium',
      assigned_to_type: 'agent',
      assigned_to_id: '',
      estimated_duration_minutes: '',
      due_date: ''
    });
  };

  const updateTaskStatus = async (taskId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('ai_workplace_tasks')
        .update({ 
          status: newStatus,
          ...(newStatus === 'in_progress' && { started_at: new Date().toISOString() }),
          ...(newStatus === 'completed' && { completed_at: new Date().toISOString() })
        })
        .eq('id', taskId);

      if (error) throw error;

      setTasks(tasks.map(task => 
        task.id === taskId ? { ...task, status: newStatus } : task
      ));
      toast.success('Task status updated');
    } catch (error) {
      console.error('Error updating task:', error);
      toast.error('Failed to update task');
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'low': return 'bg-blue-100 text-blue-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'urgent': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'todo': return 'bg-gray-100 text-gray-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'review': return 'bg-purple-100 text-purple-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      case 'blocked': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTaskTypeIcon = (taskType: string) => {
    switch (taskType) {
      case 'sop_execution': return <FileText className="h-4 w-4" />;
      case 'project_task': return <Target className="h-4 w-4" />;
      case 'maintenance': return <Zap className="h-4 w-4" />;
      default: return <CheckCircle className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">AI Tasks</h2>
          <p className="text-muted-foreground">
            Natural language task creation and intelligent assignment
          </p>
        </div>
        <Button onClick={() => setIsCreating(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Create Task
        </Button>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tasks</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{tasks.length}</div>
            <p className="text-xs text-muted-foreground">
              {tasks.filter(t => t.status === 'in_progress').length} in progress
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {tasks.filter(t => t.status === 'completed').length}
            </div>
            <p className="text-xs text-muted-foreground">
              {tasks.length > 0 
                ? Math.round((tasks.filter(t => t.status === 'completed').length / tasks.length) * 100)
                : 0}% completion rate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">High Priority</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {tasks.filter(t => t.priority === 'high' || t.priority === 'urgent').length}
            </div>
            <p className="text-xs text-muted-foreground">
              Require immediate attention
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Agents</CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{agents.length}</div>
            <p className="text-xs text-muted-foreground">
              Available for assignment
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Task Boards */}
      <div className="grid gap-6 md:grid-cols-3">
        {['todo', 'in_progress', 'completed'].map(status => (
          <Card key={status}>
            <CardHeader>
              <CardTitle className="text-lg capitalize flex items-center gap-2">
                {status === 'todo' && <Clock className="h-5 w-5" />}
                {status === 'in_progress' && <Play className="h-5 w-5" />}
                {status === 'completed' && <CheckCircle className="h-5 w-5" />}
                {status.replace('_', ' ')} ({tasks.filter(t => t.status === status).length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {tasks.filter(task => task.status === status).map(task => (
                  <Card key={task.id} className="p-3 hover:shadow-md transition-shadow cursor-pointer">
                    <div className="space-y-2">
                      <div className="flex items-start justify-between">
                        <h4 className="font-medium text-sm line-clamp-2">{task.title}</h4>
                        <Badge className={getPriorityColor(task.priority)} variant="secondary">
                          {task.priority}
                        </Badge>
                      </div>
                      
                      {task.description && (
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {task.description}
                        </p>
                      )}

                      <div className="flex items-center gap-2 text-xs">
                        {getTaskTypeIcon(task.task_type)}
                        <span className="capitalize">{task.task_type.replace('_', ' ')}</span>
                      </div>

                      {task.assigned_to_id && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <User className="h-3 w-3" />
                          {task.assigned_to_type === 'agent' 
                            ? agents.find(a => a.agent_id === task.assigned_to_id)?.display_name || task.assigned_to_id
                            : task.assigned_to_id
                          }
                        </div>
                      )}

                      {task.progress_percentage > 0 && (
                        <div className="space-y-1">
                          <div className="flex justify-between text-xs">
                            <span>Progress</span>
                            <span>{task.progress_percentage}%</span>
                          </div>
                          <Progress value={task.progress_percentage} className="h-1" />
                        </div>
                      )}

                      {task.due_date && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          Due: {new Date(task.due_date).toLocaleDateString()}
                        </div>
                      )}

                      <div className="flex gap-1 pt-2">
                        {task.status === 'todo' && (
                          <Button 
                            size="sm" 
                            variant="outline" 
                            onClick={() => updateTaskStatus(task.id, 'in_progress')}
                            className="flex-1 text-xs"
                          >
                            <Play className="h-3 w-3 mr-1" />
                            Start
                          </Button>
                        )}
                        {task.status === 'in_progress' && (
                          <>
                            <Button 
                              size="sm" 
                              variant="outline" 
                              onClick={() => updateTaskStatus(task.id, 'completed')}
                              className="flex-1 text-xs"
                            >
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Complete
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline" 
                              onClick={() => updateTaskStatus(task.id, 'todo')}
                              className="text-xs"
                            >
                              <Pause className="h-3 w-3" />
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Create Task Modal */}
      {isCreating && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-2xl">
            <CardHeader>
              <CardTitle>Create New Task</CardTitle>
              <CardDescription>
                Create a task with natural language description and smart assignment
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Title</Label>
                <Input
                  value={newTaskForm.title}
                  onChange={(e) => setNewTaskForm(prev => ({...prev, title: e.target.value}))}
                  placeholder="Enter task title"
                />
              </div>

              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  value={newTaskForm.description}
                  onChange={(e) => setNewTaskForm(prev => ({...prev, description: e.target.value}))}
                  placeholder="Describe what needs to be done"
                  rows={3}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Task Type</Label>
                  <Select
                    value={newTaskForm.task_type}
                    onValueChange={(value) => setNewTaskForm(prev => ({...prev, task_type: value}))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="general">General</SelectItem>
                      <SelectItem value="sop_execution">SOP Execution</SelectItem>
                      <SelectItem value="project_task">Project Task</SelectItem>
                      <SelectItem value="maintenance">Maintenance</SelectItem>
                      <SelectItem value="review">Review</SelectItem>
                      <SelectItem value="training">Training</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Priority</Label>
                  <Select
                    value={newTaskForm.priority}
                    onValueChange={(value) => setNewTaskForm(prev => ({...prev, priority: value}))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Assign To</Label>
                  <Select
                    value={newTaskForm.assigned_to_id}
                    onValueChange={(value) => setNewTaskForm(prev => ({...prev, assigned_to_id: value}))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select agent" />
                    </SelectTrigger>
                    <SelectContent>
                      {agents.map(agent => (
                        <SelectItem key={agent.agent_id} value={agent.agent_id}>
                          {agent.display_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Estimated Duration (minutes)</Label>
                  <Input
                    type="number"
                    value={newTaskForm.estimated_duration_minutes}
                    onChange={(e) => setNewTaskForm(prev => ({...prev, estimated_duration_minutes: e.target.value}))}
                    placeholder="e.g., 30"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Due Date</Label>
                <Input
                  type="datetime-local"
                  value={newTaskForm.due_date}
                  onChange={(e) => setNewTaskForm(prev => ({...prev, due_date: e.target.value}))}
                />
              </div>

              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setIsCreating(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateTask}>
                  Create Task
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}