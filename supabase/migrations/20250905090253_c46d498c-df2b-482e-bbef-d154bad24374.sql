-- Fix the remaining function that needs search_path
-- Based on the query results, these functions need the search_path fix

ALTER FUNCTION public.is_mfa_verified_admin(uuid) SECURITY DEFINER SET search_path TO 'public';
ALTER FUNCTION public.cleanup_guest_data() SECURITY DEFINER SET search_path TO 'public';