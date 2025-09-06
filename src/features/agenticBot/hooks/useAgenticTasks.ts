import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

// Types
interface AgenticTask {
  id: string;
  agent_id: string;
  intent: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  progress: number;
  created_at: string;
  updated_at: string;
  result?: any;
  error?: string;
}

export const useAgenticTasks = () => {
  const [tasks, setTasks] = useState<AgenticTask[]>([]);
  const [progress, setProgress] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  // Real-time subscription to task updates
  useEffect(() => {
    const fetchTasks = async () => {
      const { data, error } = await supabase
        .from('agentic_tasks')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) {
        console.error('Error fetching tasks:', error);
        return;
      }

      setTasks((data || []) as AgenticTask[]);
    };

    fetchTasks();

    // Subscribe to real-time updates
    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'agentic_tasks'
        },
        (payload) => {
          console.log('Real-time task update:', payload);
          
          if (payload.eventType === 'INSERT') {
            setTasks(prev => [payload.new as any as AgenticTask, ...prev.slice(0, 9)]);
          } else if (payload.eventType === 'UPDATE') {
            setTasks(prev => prev.map(task => 
              task.id === payload.new.id ? payload.new as any as AgenticTask : task
            ));
            // Update progress for the current task
            if (payload.new.progress !== undefined) {
              setProgress(payload.new.progress);
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  /**
   * Create a real agentic task using Supabase functions
   */
  const createTask = useCallback(async (intent: string, params: any) => {
    console.log('[Agentic] createTask called', { intent, params });
    setIsLoading(true);

    try {
      // Extract agent ID from params (for primary agent routing)
      const agentId = params.agentId || 'solo-travel-planner'; // fallback
      
      // Call the agents Supabase function
      const { data, error } = await supabase.functions.invoke('agents', {
        body: {
          agent_id: agentId,
          intent,
          params
        }
      });

      if (error) {
        console.error('Error creating task:', error);
        toast({
          title: 'Task Failed',
          description: error.message || 'Failed to start task',
          variant: 'destructive'
        });
        setIsLoading(false);
        return { success: false, error: error.message };
      }

      toast({
        title: 'Task Started',
        description: `Running: ${intent}`,
      });

      setIsLoading(false);
      return { success: true, data };
    } catch (error) {
      console.error('Unexpected error:', error);
      toast({
        title: 'Task Failed',
        description: 'An unexpected error occurred',
        variant: 'destructive'
      });
      setIsLoading(false);
      return { success: false, error: error.message };
    }
  }, [toast]);

  const cancelTask = useCallback(async (taskId: string) => {
    console.log('[Agentic] cancelTask called', { taskId });
    
    try {
      // Update task status in database
      const { error } = await supabase
        .from('agentic_tasks')
        .update({ 
          status: 'cancelled',
          updated_at: new Date().toISOString()
        })
        .eq('id', taskId);

      if (error) {
        console.error('Error cancelling task:', error);
        toast({
          title: 'Cancellation Failed',
          description: error.message,
          variant: 'destructive'
        });
        return;
      }

      toast({
        title: 'Task Cancelled',
        description: 'The agentic task has been cancelled.',
      });
    } catch (error) {
      console.error('Unexpected error cancelling task:', error);
      toast({
        title: 'Cancellation Failed',
        description: 'An unexpected error occurred',
        variant: 'destructive'
      });
    }
  }, [toast]);

  const getActiveTaskCount = useCallback(() => {
    return tasks.filter(task => task.status === 'running' || task.status === 'pending').length;
  }, [tasks]);

  const getOverallStatus = useCallback((): 'idle' | 'working' | 'success' | 'error' => {
    if (tasks.some(task => task.status === 'failed')) return 'error';
    if (tasks.some(task => task.status === 'running' || task.status === 'pending')) return 'working';
    if (tasks.some(task => task.status === 'completed')) return 'success';
    return 'idle';
  }, [tasks]);

  return {
    tasks,
    progress,
    isLoading,
    createTask,
    cancelTask,
    activeTaskCount: getActiveTaskCount(),
    overallStatus: getOverallStatus(),
  };
};
