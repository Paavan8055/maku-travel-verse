-- Fix the final functions with proper search_path (correct signatures)

-- First, handle emergency_cleanup_payments - it returns json, not void
CREATE OR REPLACE FUNCTION public.emergency_cleanup_payments()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public', 'pg_catalog'
AS $$
DECLARE
    cleanup_result json;
    orphaned_count integer;
    failed_count integer;
BEGIN
    -- Only admins can run emergency cleanup
    IF NOT is_secure_admin(auth.uid()) THEN
        RETURN json_build_object('error', 'Access denied');
    END IF;
    
    -- Clean up orphaned payments older than 24 hours
    DELETE FROM public.payments 
    WHERE booking_id NOT IN (SELECT id FROM public.bookings)
    AND created_at < NOW() - INTERVAL '24 hours';
    GET DIAGNOSTICS orphaned_count = ROW_COUNT;
    
    -- Clean up failed payments older than 7 days
    DELETE FROM public.payments
    WHERE status IN ('failed', 'cancelled')
    AND created_at < NOW() - INTERVAL '7 days';
    GET DIAGNOSTICS failed_count = ROW_COUNT;
    
    -- Return cleanup results
    SELECT json_build_object(
        'orphaned_payments_cleaned', orphaned_count,
        'failed_payments_cleaned', failed_count,
        'cleanup_timestamp', NOW()
    ) INTO cleanup_result;
    
    RETURN cleanup_result;
END;
$$;

-- Update other functions with search_path
CREATE OR REPLACE FUNCTION public.get_user_fund_balance(_user_id uuid)
RETURNS numeric
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public', 'pg_catalog'
AS $$
DECLARE
    balance numeric := 0;
BEGIN
    -- Only allow users to check their own balance or admins to check any
    IF _user_id != auth.uid() AND NOT is_secure_admin(auth.uid()) THEN
        RETURN 0;
    END IF;
    
    SELECT COALESCE(SUM(amount), 0) INTO balance
    FROM public.fund_transactions 
    WHERE user_id = _user_id 
    AND status = 'completed';
    
    RETURN GREATEST(balance, 0);
END;
$$;

CREATE OR REPLACE FUNCTION public.get_user_fund_transactions(_user_id uuid)
RETURNS TABLE(
    id uuid,
    transaction_type text,
    amount numeric,
    status text,
    created_at timestamptz,
    description text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public', 'pg_catalog'
AS $$
BEGIN
    -- Only allow users to see their own transactions or admins to see any
    IF _user_id != auth.uid() AND NOT is_secure_admin(auth.uid()) THEN
        RETURN;
    END IF;
    
    RETURN QUERY
    SELECT 
        ft.id,
        ft.type as transaction_type,
        ft.amount,
        ft.status,
        ft.created_at,
        COALESCE(ft.metadata->>'description', 'Fund transaction') as description
    FROM public.fund_transactions ft
    WHERE ft.user_id = _user_id
    ORDER BY ft.created_at DESC
    LIMIT 100;
END;
$$;