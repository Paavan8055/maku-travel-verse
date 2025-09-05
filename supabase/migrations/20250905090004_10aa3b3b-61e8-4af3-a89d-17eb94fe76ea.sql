-- Fix remaining function search_path security issues by altering existing functions
-- These functions were identified as missing proper search_path protection

-- Fix calculate_days_until_trip function  
ALTER FUNCTION public.calculate_days_until_trip(date) SECURITY DEFINER SET search_path TO 'public';

-- Fix existing update functions with proper search_path (they already have it)
-- The remaining functions already have proper search_path protection