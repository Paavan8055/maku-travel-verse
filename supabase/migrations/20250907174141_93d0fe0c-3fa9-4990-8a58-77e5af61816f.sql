-- Fix function search path security issues for the functions we just created
-- Set search_path for the status update function
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
$$ LANGUAGE plpgsql 
SET search_path = public;

-- Fix the cleanup function with proper search path
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
$$ LANGUAGE plpgsql 
SET search_path = public;