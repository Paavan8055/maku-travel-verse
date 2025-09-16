-- Fix the specific task that has 100% progress but is still marked as running
UPDATE agentic_tasks 
SET status = 'completed', updated_at = now()
WHERE progress = 100 AND status IN ('running', 'pending');

-- Also clean up any other stale tasks
UPDATE agentic_tasks 
SET status = 'failed', updated_at = now(), error_message = 'Task cleanup - old stale task'
WHERE status IN ('running', 'pending') 
  AND created_at < (now() - interval '2 hours');