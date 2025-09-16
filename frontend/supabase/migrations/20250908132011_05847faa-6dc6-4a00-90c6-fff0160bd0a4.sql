-- Fix functions with correct existing return types

CREATE OR REPLACE FUNCTION public.get_user_fund_balance(_user_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public', 'pg_catalog'
AS $$
DECLARE
    balance numeric := 0;
    result json;
BEGIN
    -- Only allow users to check their own balance or admins to check any
    IF _user_id != auth.uid() AND NOT is_secure_admin(auth.uid()) THEN
        RETURN json_build_object('error', 'Access denied');
    END IF;
    
    SELECT COALESCE(SUM(amount), 0) INTO balance
    FROM public.fund_transactions 
    WHERE user_id = _user_id 
    AND status = 'completed';
    
    SELECT json_build_object(
        'user_id', _user_id,
        'balance', GREATEST(balance, 0),
        'currency', 'AUD',
        'last_updated', NOW()
    ) INTO result;
    
    RETURN result;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_user_fund_transactions(_user_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public', 'pg_catalog'
AS $$
DECLARE
    result json;
BEGIN
    -- Only allow users to see their own transactions or admins to see any
    IF _user_id != auth.uid() AND NOT is_secure_admin(auth.uid()) THEN
        RETURN json_build_object('error', 'Access denied');
    END IF;
    
    SELECT json_agg(
        json_build_object(
            'id', ft.id,
            'type', ft.type,
            'amount', ft.amount,
            'status', ft.status,
            'created_at', ft.created_at,
            'description', COALESCE(ft.metadata->>'description', 'Fund transaction')
        ) ORDER BY ft.created_at DESC
    ) INTO result
    FROM public.fund_transactions ft
    WHERE ft.user_id = _user_id
    LIMIT 100;
    
    RETURN COALESCE(result, '[]'::json);
END;
$$;