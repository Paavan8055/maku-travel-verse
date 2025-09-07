-- Update agentic_tasks RLS policies to allow guest users
DROP POLICY IF EXISTS "Users can create their own tasks" ON public.agentic_tasks;
DROP POLICY IF EXISTS "Users can view their own tasks" ON public.agentic_tasks;
DROP POLICY IF EXISTS "Users can update their own tasks" ON public.agentic_tasks;

-- Create new policies that allow both authenticated users and guests
CREATE POLICY "Users and guests can create tasks" 
ON public.agentic_tasks 
FOR INSERT 
WITH CHECK (
  -- Authenticated users can only create their own tasks
  (auth.uid() IS NOT NULL AND auth.uid() = user_id)
  OR 
  -- Guests can create tasks with user_id = NULL
  (auth.uid() IS NULL AND user_id IS NULL)
);

CREATE POLICY "Users and guests can view their own tasks" 
ON public.agentic_tasks 
FOR SELECT 
USING (
  -- Authenticated users can view their own tasks
  (auth.uid() IS NOT NULL AND auth.uid() = user_id)
  OR 
  -- Guests can view tasks without user_id (but this is limited by session_id in app logic)
  (auth.uid() IS NULL AND user_id IS NULL)
);

CREATE POLICY "Users and guests can update their own tasks" 
ON public.agentic_tasks 
FOR UPDATE 
USING (
  -- Authenticated users can update their own tasks
  (auth.uid() IS NOT NULL AND auth.uid() = user_id)
  OR 
  -- Guests can update tasks without user_id (but this is limited by session_id in app logic)
  (auth.uid() IS NULL AND user_id IS NULL)
);

-- Add session_id column to track guest sessions
ALTER TABLE public.agentic_tasks 
ADD COLUMN IF NOT EXISTS session_id text;

-- Create index for better performance on session_id lookups
CREATE INDEX IF NOT EXISTS idx_agentic_tasks_session_id 
ON public.agentic_tasks(session_id) 
WHERE user_id IS NULL;