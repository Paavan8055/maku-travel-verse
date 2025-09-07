-- Add workflow_id and token_usage to usage logs first
ALTER TABLE public.gpt_bot_usage_logs 
ADD COLUMN IF NOT EXISTS workflow_id UUID,
ADD COLUMN IF NOT EXISTS token_usage JSONB;