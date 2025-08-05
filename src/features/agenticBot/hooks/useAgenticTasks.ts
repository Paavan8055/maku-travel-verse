import { useState, useEffect, useCallback } from 'react';
import { runAgenticTask, getAgenticTaskStatus, cancelAgenticTask } from '../lib/agenticClient';
import { useToast } from '@/hooks/use-toast';

interface AgenticTask {
  id: string;
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

  // Fetch tasks status periodically
  useEffect(() => {
    const fetchTasks = async () => {
      try {
        // TODO: Get actual user ID from auth context
        const userTasks = await getAgenticTaskStatus('current_user');
        setTasks(userTasks);
        
        // Calculate overall progress
        const runningTasks = userTasks.filter(task => task.status === 'running');
        if (runningTasks.length > 0) {
          const avgProgress = runningTasks.reduce((sum, task) => sum + task.progress, 0) / runningTasks.length;
          setProgress(avgProgress);
        } else {
          setProgress(0);
        }
      } catch (error) {
        console.error('Failed to fetch agentic tasks:', error);
      }
    };

    // Initial fetch
    fetchTasks();

    // Poll every 3 seconds for active tasks
    const interval = setInterval(fetchTasks, 3000);
    return () => clearInterval(interval);
  }, []);

  const createTask = useCallback(async (intent: string, params: any) => {
    setIsLoading(true);
    
    try {
      const response = await runAgenticTask(intent, params);
      
      if (response.success) {
        toast({
          title: "Task Started",
          description: response.message,
        });
        
        // Refresh tasks
        const userTasks = await getAgenticTaskStatus('current_user');
        setTasks(userTasks);
      } else {
        toast({
          title: "Task Failed",
          description: response.error || "Failed to start task",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create agentic task",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const cancelTask = useCallback(async (taskId: string) => {
    try {
      const success = await cancelAgenticTask(taskId);
      
      if (success) {
        toast({
          title: "Task Cancelled",
          description: "The agentic task has been cancelled",
        });
        
        // Update local state
        setTasks(prev => prev.map(task => 
          task.id === taskId 
            ? { ...task, status: 'cancelled' }
            : task
        ));
      } else {
        toast({
          title: "Cancel Failed",
          description: "Failed to cancel the task",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to cancel agentic task",
        variant: "destructive",
      });
    }
  }, [toast]);

  const getActiveTaskCount = useCallback(() => {
    return tasks.filter(task => task.status === 'running' || task.status === 'pending').length;
  }, [tasks]);

  const getOverallStatus = useCallback((): 'idle' | 'working' | 'success' | 'error' => {
    if (tasks.some(task => task.status === 'failed')) return 'error';
    if (tasks.some(task => task.status === 'running')) return 'working';
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