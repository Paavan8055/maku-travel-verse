-- Security Fix: Remove public access to orchestration_workflows table
-- This prevents unauthorized access to sensitive business workflow configurations

-- Drop the insecure policy that allows public access
DROP POLICY IF EXISTS "Users can view active workflow templates" ON public.orchestration_workflows;

-- Replace with authenticated-only access
CREATE POLICY "Authenticated users can view active workflow templates" 
ON public.orchestration_workflows 
FOR SELECT 
TO authenticated 
USING (is_active = true);

-- Also ensure the "Users can manage their own workflows" policy is restricted to authenticated users
DROP POLICY IF EXISTS "Users can manage their own workflows" ON public.orchestration_workflows;

CREATE POLICY "Authenticated users can manage their own workflows" 
ON public.orchestration_workflows 
FOR ALL 
TO authenticated 
USING (auth.uid() = created_by) 
WITH CHECK (auth.uid() = created_by);