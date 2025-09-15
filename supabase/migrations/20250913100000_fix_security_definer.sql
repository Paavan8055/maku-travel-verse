-- This file fixes functions that use SECURITY DEFINER.

-- In migration 20250831173313_a40a7847-4ceb-4e89-94b3-ec2d63f15ea1.sql
ALTER FUNCTION public.update_fund_totals() SECURITY INVOKER;
ALTER FUNCTION public.add_fund_creator_as_member() SECURITY INVOKER;

-- In migration 20250908070901_7a13c40f-d41c-4448-9417-fc197ce0c789.sql
ALTER FUNCTION public.update_updated_at_notifications() SECURITY INVOKER;
ALTER FUNCTION public.update_updated_at_communication_preferences() SECURITY INVOKER;
ALTER FUNCTION public.update_updated_at_booking_updates() SECURITY INVOKER;
ALTER FUNCTION public.update_ai_workplace_updated_at() SECURITY INVOKER;
ALTER FUNCTION public.update_provider_quotas_updated_at() SECURITY INVOKER;
ALTER FUNCTION public.update_api_configuration_updated_at() SECURITY INVOKER;

-- In migration 20250815081526_80045f82-0089-4e8e-bb19-3983e1285b7b.sql
ALTER FUNCTION public.get_user_bookings() SECURITY INVOKER;

-- In migration 20250827050059_ca0942cc-85f1-464f-abd4-696affa16067.sql
ALTER FUNCTION public.emergency_cleanup_payments() SECURITY INVOKER;

-- In migration 20250824052347_d94b3ec5-5133-42c2-80f1-5ca6824349e5.sql
ALTER FUNCTION public.log_api_health(p_provider TEXT, p_endpoint TEXT, p_status TEXT, p_response_time_ms INTEGER, p_error_message TEXT, p_metadata JSONB) SECURITY INVOKER;
ALTER FUNCTION public.process_webhook_event(p_event_id TEXT, p_event_type TEXT, p_provider TEXT, p_payload JSONB) SECURITY INVOKER;

-- In migration 20250908070719_dbb65d19-d769-4b42-9a0b-925188bdcd23.sql
ALTER FUNCTION public.update_updated_at_column() SECURITY INVOKER;
ALTER FUNCTION public.update_agent_management_updated_at() SECURITY INVOKER;
ALTER FUNCTION public.update_manager_hierarchies_updated_at() SECURITY INVOKER;
ALTER FUNCTION public.cleanup_old_tasks() SECURITY INVOKER;
ALTER FUNCTION public.update_task_status_on_progress() SECURITY INVOKER;
ALTER FUNCTION public.update_agent_consolidated_updated_at() SECURITY INVOKER;

-- In migration 20250908135531_c9befd9a-1742-45c2-8aa8-d0d47f2ba426.sql
ALTER FUNCTION public.has_role(uuid, text) SECURITY INVOKER;
ALTER FUNCTION public.handle_new_user() SECURITY INVOKER;

-- In migration 20250824080833_96009550-bd93-4d46-a697-18f5f73fdc12.sql
ALTER FUNCTION public.has_role(uuid, app_role) SECURITY INVOKER;
ALTER FUNCTION public.is_admin(uuid) SECURITY INVOKER;
ALTER FUNCTION public.handle_new_user_role() SECURITY INVOKER;

-- In migration 20250823111539_98ec8880-5495-4b20-a47c-62dfefd7a576.sql
ALTER FUNCTION public.save_transfer_search(p_search_key text, p_origin jsonb, p_destination jsonb, p_pickup timestamp with time zone, p_passengers integer, p_luggage jsonb, p_offers jsonb, p_ttl timestamp with time zone) SECURITY INVOKER;
ALTER FUNCTION public.upsert_market_analytics(p_metric text, p_scope jsonb, p_data jsonb) SECURITY INVOKER;
ALTER FUNCTION public.log_system_event(p_correlation_id text, p_service_name text, p_log_level text, p_message text, p_metadata jsonb, p_request_id text, p_user_id uuid, p_duration_ms integer, p_status_code integer, p_error_details jsonb) SECURITY INVOKER;

-- In migration 20250816161430_30811497-33d6-46f7-9195-26c0d8b522fb.sql
ALTER FUNCTION public.generate_gift_card_code() SECURITY INVOKER;
ALTER FUNCTION public.update_gift_card_updated_at() SECURITY INVOKER;
ALTER FUNCTION public.redeem_gift_card(p_code TEXT, p_amount NUMERIC, p_user_id UUID, p_booking_id UUID) SECURITY INVOKER;

-- In migration 20250825164031_dd23ae00-b4c6-4375-aa90-6efcf1c48d89.sql
ALTER FUNCTION public.create_stuck_booking_alert() SECURITY INVOKER;
