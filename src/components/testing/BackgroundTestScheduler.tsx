import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useTestingPreferences } from '@/hooks/useTestingPreferences';
import { useToast } from '@/hooks/use-toast';
import { Calendar, Clock, Play, Pause, Loader2 } from 'lucide-react';

interface ScheduledTask {
  id: string;
  task_name: string;
  status: string;
  schedule_type: string;
  next_execution: string;
  last_execution: string;
  execution_count: number;
  error_count: number;
  task_parameters?: any;
}

export const BackgroundTestScheduler: React.FC = () => {
  const [scheduledTasks, setScheduledTasks] = useState<ScheduledTask[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { preferences } = useTestingPreferences();
  const { toast } = useToast();

  const loadScheduledTasks = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('agent_scheduled_tasks')
        .select('*')
        .eq('agent_id', 'testing-framework')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setScheduledTasks(data || []);
    } catch (error) {
      console.error('Error loading scheduled tasks:', error);
      toast({
        title: "Error loading scheduled tasks",
        description: "Please try again",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createScheduledTask = async (testSuite: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('agent_scheduled_tasks')
        .insert({
          agent_id: 'testing-framework',
          task_name: `Automated ${testSuite} Testing`,
          description: `Automated testing for ${testSuite} suite`,
          schedule_type: 'recurring',
          schedule_config: {
            interval_minutes: preferences.test_interval_minutes,
            enabled: preferences.auto_run_enabled,
          },
          task_parameters: {
            test_suite: testSuite,
            user_id: user.id,
            automated: true,
          },
          status: preferences.auto_run_enabled ? 'scheduled' : 'paused',
          created_by: user.id,
        });

      if (error) throw error;

      toast({
        title: "Scheduled task created",
        description: `${testSuite} testing has been scheduled`,
      });

      loadScheduledTasks();
    } catch (error) {
      console.error('Error creating scheduled task:', error);
      toast({
        title: "Error creating scheduled task",
        description: "Please try again",
        variant: "destructive",
      });
    }
  };

  const toggleTaskStatus = async (taskId: string, currentStatus: string) => {
    try {
      const newStatus = currentStatus === 'scheduled' ? 'paused' : 'scheduled';
      
      const { error } = await supabase
        .from('agent_scheduled_tasks')
        .update({ status: newStatus })
        .eq('id', taskId);

      if (error) throw error;

      toast({
        title: `Task ${newStatus}`,
        description: `Scheduled task has been ${newStatus}`,
      });

      loadScheduledTasks();
    } catch (error) {
      console.error('Error updating task status:', error);
      toast({
        title: "Error updating task",
        description: "Please try again",
        variant: "destructive",
      });
    }
  };

  const runTaskNow = async (taskId: string, taskName: string) => {
    try {
      // Trigger immediate execution via task queue
      const { error } = await supabase
        .from('agent_task_queue')
        .insert({
          agent_id: 'testing-framework',
          task_type: 'immediate_test_run',
          task_data: {
            scheduled_task_id: taskId,
            immediate_execution: true,
          },
          priority: 1,
        });

      if (error) throw error;

      toast({
        title: "Task queued",
        description: `${taskName} will run immediately`,
      });
    } catch (error) {
      console.error('Error queuing immediate task:', error);
      toast({
        title: "Error running task",
        description: "Please try again",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    loadScheduledTasks();
  }, [user]);

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'scheduled': return 'default';
      case 'running': return 'secondary';
      case 'paused': return 'outline';
      case 'failed': return 'destructive';
      default: return 'outline';
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Background Test Scheduler
        </CardTitle>
        <CardDescription>
          Manage automated testing schedules and background execution
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Auto-create tasks for preferred test suites */}
        {preferences.auto_run_enabled && preferences.preferred_test_suites.length > 0 && (
          <div className="space-y-2">
            {preferences.preferred_test_suites
              .filter(suite => !scheduledTasks.some(task => {
                const params = task.task_parameters as any;
                return params?.test_suite === suite;
              }))
              .map(suite => (
                <div key={suite} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <div className="font-medium">{suite}</div>
                    <div className="text-sm text-muted-foreground">
                      Ready to schedule automated testing
                    </div>
                  </div>
                  <Button 
                    size="sm" 
                    onClick={() => createScheduledTask(suite)}
                  >
                    Schedule
                  </Button>
                </div>
              ))
            }
          </div>
        )}

        {/* Existing scheduled tasks */}
        <div className="space-y-3">
          {scheduledTasks.map((task) => (
            <div key={task.id} className="p-4 border rounded-lg space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">{task.task_name}</div>
                  <div className="text-sm text-muted-foreground flex items-center gap-4">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      Every {preferences.test_interval_minutes}m
                    </span>
                    <span>
                      Executed {task.execution_count} times
                    </span>
                    {task.error_count > 0 && (
                      <span className="text-destructive">
                        {task.error_count} errors
                      </span>
                    )}
                  </div>
                </div>
                <Badge variant={getStatusBadgeVariant(task.status)}>
                  {task.status}
                </Badge>
              </div>

              <div className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                  {task.next_execution && (
                    <span>
                      Next: {new Date(task.next_execution).toLocaleString()}
                    </span>
                  )}
                  {task.last_execution && (
                    <span className="ml-4">
                      Last: {new Date(task.last_execution).toLocaleString()}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => runTaskNow(task.id, task.task_name)}
                    disabled={task.status === 'running'}
                  >
                    <Play className="h-3 w-3 mr-1" />
                    Run Now
                  </Button>
                  
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={task.status === 'scheduled'}
                      onCheckedChange={() => toggleTaskStatus(task.id, task.status)}
                    />
                    <Label className="text-sm">
                      {task.status === 'scheduled' ? 'Active' : 'Paused'}
                    </Label>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {scheduledTasks.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No scheduled tasks yet</p>
            <p className="text-sm">Enable auto-run in preferences to create scheduled tests</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
