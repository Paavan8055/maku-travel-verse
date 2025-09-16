-- Clean up stale tasks that have 100% progress but are still pending
UPDATE agentic_tasks 
SET status = 'completed', updated_at = now()
WHERE status = 'pending' AND progress = 100;

-- Cancel old test tasks that are stuck in pending (older than 1 hour)
UPDATE agentic_tasks 
SET status = 'cancelled', updated_at = now()
WHERE status = 'pending' 
  AND created_at < (now() - interval '1 hour')
  AND progress < 100;

-- Add function to automatically update task status based on progress
CREATE OR REPLACE FUNCTION update_task_status_on_progress()
RETURNS TRIGGER AS $$
BEGIN
  -- If progress reaches 100%, mark as completed
  IF NEW.progress = 100 AND OLD.status != 'completed' THEN
    NEW.status = 'completed';
    NEW.updated_at = now();
  END IF;
  
  -- If task is older than 2 hours and still pending, mark as failed
  IF NEW.status = 'pending' 
     AND NEW.created_at < (now() - interval '2 hours')
     AND OLD.status = 'pending' THEN
    NEW.status = 'failed';
    NEW.error_message = 'Task timed out after 2 hours';
    NEW.updated_at = now();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic status updates
DROP TRIGGER IF EXISTS trigger_update_task_status ON agentic_tasks;
CREATE TRIGGER trigger_update_task_status
  BEFORE UPDATE ON agentic_tasks
  FOR EACH ROW
  EXECUTE FUNCTION update_task_status_on_progress();

-- Add function to clean up old completed/cancelled tasks (older than 24 hours)
CREATE OR REPLACE FUNCTION cleanup_old_tasks()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM agentic_tasks 
  WHERE status IN ('completed', 'cancelled', 'failed')
    AND updated_at < (now() - interval '24 hours');
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Add index for better performance on status and created_at queries
CREATE INDEX IF NOT EXISTS idx_agentic_tasks_status_created 
ON agentic_tasks(status, created_at);

-- Add index for cleanup queries
CREATE INDEX IF NOT EXISTS idx_agentic_tasks_status_updated 
ON agentic_tasks(status, updated_at);