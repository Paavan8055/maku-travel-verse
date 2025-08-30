-- Reset all circuit breakers to allow fresh provider attempts
UPDATE provider_health 
SET status = 'healthy', 
    error_message = NULL, 
    consecutive_failures = 0, 
    last_success = NOW(), 
    last_checked = NOW()
WHERE status != 'healthy';

-- Reset provider quotas to clear any rate limiting
UPDATE provider_quotas 
SET status = 'healthy', 
    percentage_used = 0, 
    updated_at = NOW()
WHERE status != 'healthy';

-- Clear old error tracking that might be affecting provider rotation
DELETE FROM error_tracking 
WHERE created_at < NOW() - INTERVAL '1 hour' 
AND error_type LIKE '%provider%';