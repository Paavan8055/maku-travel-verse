-- This file consolidates all previous attempts to fix SECURITY DEFINER vulnerabilities.

-- Functions from 20250913100000_fix_security_definer.sql
ALTER FUNCTION public.update_fund_totals() SECURITY INVOKER;
ALTER FUNCTION public.add_fund_creator_as_member() SECURITY INVOKER;
ALTER FUNCTION public.update_updated_at_notifications() SECURITY INVOKER;
ALTER FUNCTION public.update_updated_at_communication_preferences() SECURITY INVOKER;
ALTER FUNCTION public.update_updated_at_booking_updates() SECURITY INVOKER;
ALTER FUNCTION public.update_ai_workplace_updated_at() SECURITY INVOKER;
ALTER FUNCTION public.update_provider_quotas_updated_at() SECURITY INVOKER;
ALTER FUNCTION public.update_api_configuration_updated_at() SECURITY INVOKER;
ALTER FUNCTION public.get_user_bookings() SECURITY INVOKER;
ALTER FUNCTION public.emergency_cleanup_payments() SECURITY INVOKER;
ALTER FUNCTION public.log_api_health(p_provider TEXT, p_endpoint TEXT, p_status TEXT, p_response_time_ms INTEGER, p_error_message TEXT, p_metadata JSONB) SECURITY INVOKER;
ALTER FUNCTION public.process_webhook_event(p_event_id TEXT, p_event_type TEXT, p_provider TEXT, p_payload JSONB) SECURITY INVOKER;
ALTER FUNCTION public.update_updated_at_column() SECURITY INVOKER;
ALTER FUNCTION public.update_agent_management_updated_at() SECURITY INVOKER;
ALTER FUNCTION public.update_manager_hierarchies_updated_at() SECURITY INVOKER;
ALTER FUNCTION public.cleanup_old_tasks() SECURITY INVOKER;
ALTER FUNCTION public.update_task_status_on_progress() SECURITY INVOKER;
ALTER FUNCTION public.update_agent_consolidated_updated_at() SECURITY INVOKER;
ALTER FUNCTION public.has_role(uuid, text) SECURITY INVOKER;
ALTER FUNCTION public.handle_new_user() SECURITY INVOKER;
ALTER FUNCTION public.is_admin(uuid) SECURITY INVOKER;
ALTER FUNCTION public.handle_new_user_role() SECURITY INVOKER;
ALTER FUNCTION public.save_transfer_search(p_search_key text, p_origin jsonb, p_destination jsonb, p_pickup timestamp with time zone, p_passengers integer, p_luggage jsonb, p_offers jsonb, p_ttl timestamp with time zone) SECURITY INVOKER;
ALTER FUNCTION public.upsert_market_analytics(p_metric text, p_scope jsonb, p_data jsonb) SECURITY INVOKER;
ALTER FUNCTION public.log_system_event(p_correlation_id text, p_service_name text, p_log_level text, p_message text, p_metadata jsonb, p_request_id text, p_user_id uuid, p_duration_ms integer, p_status_code integer, p_error_details jsonb) SECURITY INVOKER;
ALTER FUNCTION public.generate_gift_card_code() SECURITY INVOKER;
ALTER FUNCTION public.update_gift_card_updated_at() SECURITY INVOKER;
ALTER FUNCTION public.redeem_gift_card(p_code TEXT, p_amount NUMERIC, p_user_id UUID, p_booking_id UUID) SECURITY INVOKER;
ALTER FUNCTION public.create_stuck_booking_alert() SECURITY INVOKER;

-- Functions from 20250913100001_fix_security_definer_again.sql
ALTER FUNCTION public.cleanup_old_health_data() SECURITY INVOKER;
ALTER FUNCTION public.is_secure_admin(UUID) SECURITY INVOKER;
ALTER FUNCTION public.log_admin_access_attempt(UUID, TEXT, BOOLEAN) SECURITY INVOKER;
ALTER FUNCTION public.get_admin_status() SECURITY INVOKER;
ALTER FUNCTION public.grant_admin_role(UUID) SECURITY INVOKER;
ALTER FUNCTION public.update_document_search_vector() SECURITY INVOKER;
ALTER FUNCTION public.update_knowledge_base_search_vector() SECURITY INVOKER;
ALTER FUNCTION public.update_partner_analytics() SECURITY INVOKER;
ALTER FUNCTION public.update_session_funnel_progress(text, integer, timestamp with time zone) SECURITY INVOKER;
ALTER FUNCTION public.track_booking_status_change() SECURITY INVOKER;
ALTER FUNCTION public.get_user_fund_balance(uuid) SECURITY INVOKER;
ALTER FUNCTION public.get_user_fund_transactions(uuid) SECURITY INVOKER;
