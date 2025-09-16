-- Fix remaining database functions with missing search_path security
-- Complete the security hardening for all affected functions

-- Fix update_manager_hierarchies_updated_at function
CREATE OR REPLACE FUNCTION public.update_manager_hierarchies_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public', 'pg_catalog'  -- Added missing search_path
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

-- Fix update_knowledge_base_search_vector function  
CREATE OR REPLACE FUNCTION public.update_knowledge_base_search_vector()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public', 'pg_catalog'  -- Added missing search_path
AS $function$
BEGIN
  NEW.search_vector := to_tsvector('english', COALESCE(NEW.title, '') || ' ' || COALESCE(NEW.content, ''));
  RETURN NEW;
END;
$function$;

-- Fix update_agent_management_updated_at function
CREATE OR REPLACE FUNCTION public.update_agent_management_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql  
 SECURITY DEFINER
 SET search_path = 'public', 'pg_catalog'  -- Added missing search_path
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;