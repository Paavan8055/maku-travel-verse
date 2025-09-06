import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';

// Types
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

  // Initialize empty state; backend polling intentionally disabled until API is ready
  useEffect(() => {
    setTasks([]);
    setProgress(0);
  }, []);

  /**
   * Simulated task lifecycle to avoid 404s from missing backend endpoint.
   * Keeps API parity so we can swap to real endpoints later without touching UI.
   */
  const createTask = useCallback(async (intent: string, params: any) => {
    console.log('[Agentic] createTask called', { intent, params });
    setIsLoading(true);

    // Extract agent ID from params (for primary agent routing)
    const agentId = params.agentId || 'solo-travel-planner'; // fallback
    
    // Create a new task
    const now = new Date().toISOString();
    const newTask: AgenticTask = {
      id: `${Date.now()}`,
      intent: `${agentId}: ${intent}`,
      status: 'running',
      progress: 0,
      created_at: now,
      updated_at: now,
    };

    // Push the task and notify
    setTasks(prev => [newTask, ...prev]);
    toast({
      title: 'Task Started',
      description: `Running: ${intent}`,
    });

    // Simulate progress updates
    const steps = [20, 55, 85, 100];
    steps.forEach((p, idx) => {
      setTimeout(() => {
        setProgress(p);
        setTasks(prev =>
          prev.map(t =>
            t.id === newTask.id
              ? {
                  ...t,
                  progress: p,
                  status: p === 100 ? 'completed' as const : 'running',
                  updated_at: new Date().toISOString(),
                  result:
                    p === 100
                      ? {
                          message: 'Task completed',
                          intent,
                          params,
                        }
                      : t.result,
                }
              : t
          )
        );

        if (p === 100) {
          toast({
            title: 'Task Completed',
            description: `Finished: ${intent}`,
          });
          setIsLoading(false);
        }
      }, 400 + idx * 400);
    });

    // Return a simple result to keep signature usable if awaited
    return { success: true, id: newTask.id };
  }, [toast]);

  const cancelTask = useCallback(async (taskId: string) => {
    console.log('[Agentic] cancelTask called', { taskId });
    // Simulate cancellation locally
    setTasks(prev =>
      prev.map(task =>
        task.id === taskId
          ? { ...task, status: 'cancelled', updated_at: new Date().toISOString() }
          : task
      )
    );
    toast({
      title: 'Task Cancelled',
      description: 'The agentic task has been cancelled.',
    });
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
