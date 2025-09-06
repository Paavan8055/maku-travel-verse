export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      activities_offers_cache: {
        Row: {
          bbox: Json | null
          city_iata: string | null
          created_at: string | null
          date_from: string | null
          date_to: string | null
          id: string
          offers: Json
          search_key: string
          ttl_expires_at: string | null
        }
        Insert: {
          bbox?: Json | null
          city_iata?: string | null
          created_at?: string | null
          date_from?: string | null
          date_to?: string | null
          id?: string
          offers: Json
          search_key: string
          ttl_expires_at?: string | null
        }
        Update: {
          bbox?: Json | null
          city_iata?: string | null
          created_at?: string | null
          date_from?: string | null
          date_to?: string | null
          id?: string
          offers?: Json
          search_key?: string
          ttl_expires_at?: string | null
        }
        Relationships: []
      }
      activities_orders: {
        Row: {
          activity_id: string
          created_at: string | null
          currency: string | null
          id: string
          meta: Json | null
          offer_json: Json
          participants: Json | null
          partner_booking_id: string | null
          profile_id: string | null
          scheduled_at: string
          status: string | null
          total_price: number | null
          updated_at: string | null
        }
        Insert: {
          activity_id: string
          created_at?: string | null
          currency?: string | null
          id?: string
          meta?: Json | null
          offer_json: Json
          participants?: Json | null
          partner_booking_id?: string | null
          profile_id?: string | null
          scheduled_at: string
          status?: string | null
          total_price?: number | null
          updated_at?: string | null
        }
        Update: {
          activity_id?: string
          created_at?: string | null
          currency?: string | null
          id?: string
          meta?: Json | null
          offer_json?: Json
          participants?: Json | null
          partner_booking_id?: string | null
          profile_id?: string | null
          scheduled_at?: string
          status?: string | null
          total_price?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "activities_orders_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      admin_metrics_cache: {
        Row: {
          created_at: string
          expires_at: string
          id: string
          metric_type: string
          metric_value: Json
        }
        Insert: {
          created_at?: string
          expires_at?: string
          id?: string
          metric_type: string
          metric_value: Json
        }
        Update: {
          created_at?: string
          expires_at?: string
          id?: string
          metric_type?: string
          metric_value?: Json
        }
        Relationships: []
      }
      admin_mfa_sessions: {
        Row: {
          created_at: string | null
          expires_at: string
          id: string
          mfa_verified: boolean | null
          session_token: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          expires_at?: string
          id?: string
          mfa_verified?: boolean | null
          session_token: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          expires_at?: string
          id?: string
          mfa_verified?: boolean | null
          session_token?: string
          user_id?: string
        }
        Relationships: []
      }
      admin_users: {
        Row: {
          created_at: string
          email: string
          id: string
          is_active: boolean
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          is_active?: boolean
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          is_active?: boolean
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      agent_alerts: {
        Row: {
          acknowledgements: Json
          agent_id: string | null
          alert_data: Json
          alert_type: string
          created_at: string
          id: string
          is_resolved: boolean
          message: string
          resolved_at: string | null
          resolved_by: string | null
          severity: string
          task_id: string | null
          title: string
        }
        Insert: {
          acknowledgements?: Json
          agent_id?: string | null
          alert_data?: Json
          alert_type: string
          created_at?: string
          id?: string
          is_resolved?: boolean
          message: string
          resolved_at?: string | null
          resolved_by?: string | null
          severity?: string
          task_id?: string | null
          title: string
        }
        Update: {
          acknowledgements?: Json
          agent_id?: string | null
          alert_data?: Json
          alert_type?: string
          created_at?: string
          id?: string
          is_resolved?: boolean
          message?: string
          resolved_at?: string | null
          resolved_by?: string | null
          severity?: string
          task_id?: string | null
          title?: string
        }
        Relationships: []
      }
      agent_audit_logs: {
        Row: {
          action_description: string
          action_type: string
          agent_id: string | null
          created_at: string
          id: string
          ip_address: unknown | null
          new_values: Json | null
          old_values: Json | null
          performed_by: string | null
          resource_id: string | null
          resource_type: string | null
          session_id: string | null
          user_agent: string | null
        }
        Insert: {
          action_description: string
          action_type: string
          agent_id?: string | null
          created_at?: string
          id?: string
          ip_address?: unknown | null
          new_values?: Json | null
          old_values?: Json | null
          performed_by?: string | null
          resource_id?: string | null
          resource_type?: string | null
          session_id?: string | null
          user_agent?: string | null
        }
        Update: {
          action_description?: string
          action_type?: string
          agent_id?: string | null
          created_at?: string
          id?: string
          ip_address?: unknown | null
          new_values?: Json | null
          old_values?: Json | null
          performed_by?: string | null
          resource_id?: string | null
          resource_type?: string | null
          session_id?: string | null
          user_agent?: string | null
        }
        Relationships: []
      }
      agent_batch_operations: {
        Row: {
          completed_at: string | null
          completed_targets: number
          created_at: string
          created_by: string | null
          error_details: Json | null
          failed_targets: number
          id: string
          operation_config: Json
          operation_name: string
          operation_type: string
          started_at: string | null
          status: string
          target_agents: string[]
          target_groups: string[]
          total_targets: number
        }
        Insert: {
          completed_at?: string | null
          completed_targets?: number
          created_at?: string
          created_by?: string | null
          error_details?: Json | null
          failed_targets?: number
          id?: string
          operation_config?: Json
          operation_name: string
          operation_type: string
          started_at?: string | null
          status?: string
          target_agents?: string[]
          target_groups?: string[]
          total_targets?: number
        }
        Update: {
          completed_at?: string | null
          completed_targets?: number
          created_at?: string
          created_by?: string | null
          error_details?: Json | null
          failed_targets?: number
          id?: string
          operation_config?: Json
          operation_name?: string
          operation_type?: string
          started_at?: string | null
          status?: string
          target_agents?: string[]
          target_groups?: string[]
          total_targets?: number
        }
        Relationships: []
      }
      agent_context_memory: {
        Row: {
          agent_id: string
          confidence_score: number | null
          context_data: Json
          context_type: string
          created_at: string
          expires_at: string | null
          id: string
          reasoning_summary: string | null
          session_id: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          agent_id: string
          confidence_score?: number | null
          context_data?: Json
          context_type?: string
          created_at?: string
          expires_at?: string | null
          id?: string
          reasoning_summary?: string | null
          session_id?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          agent_id?: string
          confidence_score?: number | null
          context_data?: Json
          context_type?: string
          created_at?: string
          expires_at?: string | null
          id?: string
          reasoning_summary?: string | null
          session_id?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      agent_group_memberships: {
        Row: {
          added_at: string
          added_by: string | null
          agent_id: string
          group_id: string
          id: string
          role: string
        }
        Insert: {
          added_at?: string
          added_by?: string | null
          agent_id: string
          group_id: string
          id?: string
          role?: string
        }
        Update: {
          added_at?: string
          added_by?: string | null
          agent_id?: string
          group_id?: string
          id?: string
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "agent_group_memberships_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "agent_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_groups: {
        Row: {
          configuration: Json
          created_at: string
          created_by: string | null
          description: string | null
          group_name: string
          group_type: string
          id: string
          updated_at: string
        }
        Insert: {
          configuration?: Json
          created_at?: string
          created_by?: string | null
          description?: string | null
          group_name: string
          group_type?: string
          id?: string
          updated_at?: string
        }
        Update: {
          configuration?: Json
          created_at?: string
          created_by?: string | null
          description?: string | null
          group_name?: string
          group_type?: string
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      agent_management: {
        Row: {
          agent_id: string
          capabilities: Json
          category: string
          configuration: Json
          created_at: string
          created_by: string | null
          description: string | null
          display_name: string
          health_status: string
          id: string
          last_health_check: string | null
          performance_settings: Json
          permissions: Json
          status: string
          updated_at: string
          updated_by: string | null
          version: string
        }
        Insert: {
          agent_id: string
          capabilities?: Json
          category?: string
          configuration?: Json
          created_at?: string
          created_by?: string | null
          description?: string | null
          display_name: string
          health_status?: string
          id?: string
          last_health_check?: string | null
          performance_settings?: Json
          permissions?: Json
          status?: string
          updated_at?: string
          updated_by?: string | null
          version?: string
        }
        Update: {
          agent_id?: string
          capabilities?: Json
          category?: string
          configuration?: Json
          created_at?: string
          created_by?: string | null
          description?: string | null
          display_name?: string
          health_status?: string
          id?: string
          last_health_check?: string | null
          performance_settings?: Json
          permissions?: Json
          status?: string
          updated_at?: string
          updated_by?: string | null
          version?: string
        }
        Relationships: []
      }
      agent_performance: {
        Row: {
          agent_id: string
          average_response_time_minutes: number | null
          cost_per_task: number | null
          created_at: string
          customer_satisfaction_score: number | null
          id: string
          metric_date: string
          revenue_generated: number | null
          success_rate: number | null
          tasks_completed: number | null
          tasks_failed: number | null
          updated_at: string
        }
        Insert: {
          agent_id: string
          average_response_time_minutes?: number | null
          cost_per_task?: number | null
          created_at?: string
          customer_satisfaction_score?: number | null
          id?: string
          metric_date?: string
          revenue_generated?: number | null
          success_rate?: number | null
          tasks_completed?: number | null
          tasks_failed?: number | null
          updated_at?: string
        }
        Update: {
          agent_id?: string
          average_response_time_minutes?: number | null
          cost_per_task?: number | null
          created_at?: string
          customer_satisfaction_score?: number | null
          id?: string
          metric_date?: string
          revenue_generated?: number | null
          success_rate?: number | null
          tasks_completed?: number | null
          tasks_failed?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      agent_performance_metrics: {
        Row: {
          agent_id: string
          average_response_time_ms: number
          cost_per_task: number | null
          cpu_usage_percent: number | null
          created_at: string
          error_rate: number
          failed_tasks: number
          id: string
          memory_usage_mb: number | null
          metadata: Json
          metric_date: string
          successful_tasks: number
          throughput_per_hour: number
          total_processing_time_ms: number
          total_tasks: number
          updated_at: string
          user_satisfaction_score: number | null
        }
        Insert: {
          agent_id: string
          average_response_time_ms?: number
          cost_per_task?: number | null
          cpu_usage_percent?: number | null
          created_at?: string
          error_rate?: number
          failed_tasks?: number
          id?: string
          memory_usage_mb?: number | null
          metadata?: Json
          metric_date?: string
          successful_tasks?: number
          throughput_per_hour?: number
          total_processing_time_ms?: number
          total_tasks?: number
          updated_at?: string
          user_satisfaction_score?: number | null
        }
        Update: {
          agent_id?: string
          average_response_time_ms?: number
          cost_per_task?: number | null
          cpu_usage_percent?: number | null
          created_at?: string
          error_rate?: number
          failed_tasks?: number
          id?: string
          memory_usage_mb?: number | null
          metadata?: Json
          metric_date?: string
          successful_tasks?: number
          throughput_per_hour?: number
          total_processing_time_ms?: number
          total_tasks?: number
          updated_at?: string
          user_satisfaction_score?: number | null
        }
        Relationships: []
      }
      agent_scheduled_tasks: {
        Row: {
          agent_id: string
          created_at: string
          created_by: string | null
          description: string | null
          error_count: number
          execution_count: number
          id: string
          last_error: string | null
          last_execution: string | null
          max_executions: number | null
          next_execution: string | null
          schedule_config: Json
          schedule_type: string
          status: string
          task_name: string
          task_parameters: Json
          template_id: string | null
          updated_at: string
        }
        Insert: {
          agent_id: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          error_count?: number
          execution_count?: number
          id?: string
          last_error?: string | null
          last_execution?: string | null
          max_executions?: number | null
          next_execution?: string | null
          schedule_config?: Json
          schedule_type?: string
          status?: string
          task_name: string
          task_parameters?: Json
          template_id?: string | null
          updated_at?: string
        }
        Update: {
          agent_id?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          error_count?: number
          execution_count?: number
          id?: string
          last_error?: string | null
          last_execution?: string | null
          max_executions?: number | null
          next_execution?: string | null
          schedule_config?: Json
          schedule_type?: string
          status?: string
          task_name?: string
          task_parameters?: Json
          template_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "agent_scheduled_tasks_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "agent_task_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_task_queue: {
        Row: {
          actual_duration_minutes: number | null
          agent_id: string
          assigned_at: string | null
          completed_at: string | null
          created_at: string
          customer_id: string | null
          error_message: string | null
          estimated_duration_minutes: number | null
          id: string
          priority: number | null
          result: Json | null
          started_at: string | null
          status: string | null
          task_data: Json
          task_type: string
          updated_at: string
        }
        Insert: {
          actual_duration_minutes?: number | null
          agent_id: string
          assigned_at?: string | null
          completed_at?: string | null
          created_at?: string
          customer_id?: string | null
          error_message?: string | null
          estimated_duration_minutes?: number | null
          id?: string
          priority?: number | null
          result?: Json | null
          started_at?: string | null
          status?: string | null
          task_data: Json
          task_type: string
          updated_at?: string
        }
        Update: {
          actual_duration_minutes?: number | null
          agent_id?: string
          assigned_at?: string | null
          completed_at?: string | null
          created_at?: string
          customer_id?: string | null
          error_message?: string | null
          estimated_duration_minutes?: number | null
          id?: string
          priority?: number | null
          result?: Json | null
          started_at?: string | null
          status?: string | null
          task_data?: Json
          task_type?: string
          updated_at?: string
        }
        Relationships: []
      }
      agent_task_templates: {
        Row: {
          agent_types: string[]
          category: string
          created_at: string
          created_by: string | null
          default_parameters: Json
          description: string | null
          estimated_duration_minutes: number | null
          id: string
          is_active: boolean
          is_system_template: boolean
          required_permissions: string[]
          task_definition: Json
          template_name: string
          updated_at: string
        }
        Insert: {
          agent_types?: string[]
          category?: string
          created_at?: string
          created_by?: string | null
          default_parameters?: Json
          description?: string | null
          estimated_duration_minutes?: number | null
          id?: string
          is_active?: boolean
          is_system_template?: boolean
          required_permissions?: string[]
          task_definition: Json
          template_name: string
          updated_at?: string
        }
        Update: {
          agent_types?: string[]
          category?: string
          created_at?: string
          created_by?: string | null
          default_parameters?: Json
          description?: string | null
          estimated_duration_minutes?: number | null
          id?: string
          is_active?: boolean
          is_system_template?: boolean
          required_permissions?: string[]
          task_definition?: Json
          template_name?: string
          updated_at?: string
        }
        Relationships: []
      }
      agentic_memory: {
        Row: {
          agent_id: string
          created_at: string
          expires_at: string | null
          id: string
          memory_data: Json
          memory_key: string
          session_id: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          agent_id: string
          created_at?: string
          expires_at?: string | null
          id?: string
          memory_data?: Json
          memory_key: string
          session_id?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          agent_id?: string
          created_at?: string
          expires_at?: string | null
          id?: string
          memory_data?: Json
          memory_key?: string
          session_id?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      agentic_orchestrations: {
        Row: {
          config: Json | null
          created_at: string | null
          id: string
          orchestration_type: string
          status: string | null
          trip_id: string | null
          user_id: string
        }
        Insert: {
          config?: Json | null
          created_at?: string | null
          id?: string
          orchestration_type: string
          status?: string | null
          trip_id?: string | null
          user_id: string
        }
        Update: {
          config?: Json | null
          created_at?: string | null
          id?: string
          orchestration_type?: string
          status?: string | null
          trip_id?: string | null
          user_id?: string
        }
        Relationships: []
      }
      agentic_tasks: {
        Row: {
          agent_id: string
          created_at: string | null
          error_message: string | null
          id: string
          intent: string
          params: Json
          progress: number | null
          result: Json | null
          status: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          agent_id: string
          created_at?: string | null
          error_message?: string | null
          id?: string
          intent: string
          params?: Json
          progress?: number | null
          result?: Json | null
          status?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          agent_id?: string
          created_at?: string | null
          error_message?: string | null
          id?: string
          intent?: string
          params?: Json
          progress?: number | null
          result?: Json | null
          status?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      ai_training_bookings: {
        Row: {
          anonymized_at: string | null
          anonymized_data: Json
          behavioral_patterns: Json | null
          booking_flow_data: Json | null
          booking_type: string
          created_at: string | null
          id: string
          location_data: Json | null
          original_booking_id: string
          price_patterns: Json | null
        }
        Insert: {
          anonymized_at?: string | null
          anonymized_data: Json
          behavioral_patterns?: Json | null
          booking_flow_data?: Json | null
          booking_type: string
          created_at?: string | null
          id?: string
          location_data?: Json | null
          original_booking_id: string
          price_patterns?: Json | null
        }
        Update: {
          anonymized_at?: string | null
          anonymized_data?: Json
          behavioral_patterns?: Json | null
          booking_flow_data?: Json | null
          booking_type?: string
          created_at?: string | null
          id?: string
          location_data?: Json | null
          original_booking_id?: string
          price_patterns?: Json | null
        }
        Relationships: []
      }
      air_extras: {
        Row: {
          created_at: string | null
          currency: string | null
          description: string | null
          extra_code: string
          extra_type: string
          flight_segment_id: string | null
          id: string
          metadata: Json | null
          passenger_id: string
          pnr_id: string | null
          quantity: number | null
          sabre_confirmation_code: string | null
          status: string | null
          total_price: number
          unit_price: number
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          currency?: string | null
          description?: string | null
          extra_code: string
          extra_type: string
          flight_segment_id?: string | null
          id?: string
          metadata?: Json | null
          passenger_id: string
          pnr_id?: string | null
          quantity?: number | null
          sabre_confirmation_code?: string | null
          status?: string | null
          total_price: number
          unit_price: number
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          currency?: string | null
          description?: string | null
          extra_code?: string
          extra_type?: string
          flight_segment_id?: string | null
          id?: string
          metadata?: Json | null
          passenger_id?: string
          pnr_id?: string | null
          quantity?: number | null
          sabre_confirmation_code?: string | null
          status?: string | null
          total_price?: number
          unit_price?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "air_extras_pnr_id_fkey"
            columns: ["pnr_id"]
            isOneToOne: false
            referencedRelation: "pnr_records"
            referencedColumns: ["id"]
          },
        ]
      }
      airlines: {
        Row: {
          business_name: string | null
          common_name: string | null
          country_code: string | null
          iata_code: string
          icao_code: string | null
          raw: Json | null
          updated_at: string | null
        }
        Insert: {
          business_name?: string | null
          common_name?: string | null
          country_code?: string | null
          iata_code: string
          icao_code?: string | null
          raw?: Json | null
          updated_at?: string | null
        }
        Update: {
          business_name?: string | null
          common_name?: string | null
          country_code?: string | null
          iata_code?: string
          icao_code?: string | null
          raw?: Json | null
          updated_at?: string | null
        }
        Relationships: []
      }
      airports: {
        Row: {
          city_code: string | null
          country_code: string | null
          iata_code: string
          icao_code: string | null
          latitude: number | null
          longitude: number | null
          name: string | null
          raw: Json | null
          time_zone: string | null
          updated_at: string | null
        }
        Insert: {
          city_code?: string | null
          country_code?: string | null
          iata_code: string
          icao_code?: string | null
          latitude?: number | null
          longitude?: number | null
          name?: string | null
          raw?: Json | null
          time_zone?: string | null
          updated_at?: string | null
        }
        Update: {
          city_code?: string | null
          country_code?: string | null
          iata_code?: string
          icao_code?: string | null
          latitude?: number | null
          longitude?: number | null
          name?: string | null
          raw?: Json | null
          time_zone?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      api_configuration: {
        Row: {
          config_data: Json
          created_at: string | null
          environment: string
          id: string
          is_active: boolean | null
          provider: string
          updated_at: string | null
        }
        Insert: {
          config_data?: Json
          created_at?: string | null
          environment?: string
          id?: string
          is_active?: boolean | null
          provider: string
          updated_at?: string | null
        }
        Update: {
          config_data?: Json
          created_at?: string | null
          environment?: string
          id?: string
          is_active?: boolean | null
          provider?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      api_health_logs: {
        Row: {
          checked_at: string
          endpoint: string
          error_message: string | null
          id: string
          provider: string
          response_time_ms: number | null
          status: string
        }
        Insert: {
          checked_at?: string
          endpoint: string
          error_message?: string | null
          id?: string
          provider: string
          response_time_ms?: number | null
          status: string
        }
        Update: {
          checked_at?: string
          endpoint?: string
          error_message?: string | null
          id?: string
          provider?: string
          response_time_ms?: number | null
          status?: string
        }
        Relationships: []
      }
      api_key_rotations: {
        Row: {
          created_at: string
          id: string
          key_name: string
          metadata: Json | null
          new_key_hash: string | null
          next_rotation_date: string | null
          old_key_hash: string | null
          provider: string
          rotated_by: string | null
          rotation_date: string
          rotation_reason: string | null
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          key_name: string
          metadata?: Json | null
          new_key_hash?: string | null
          next_rotation_date?: string | null
          old_key_hash?: string | null
          provider: string
          rotated_by?: string | null
          rotation_date?: string
          rotation_reason?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          key_name?: string
          metadata?: Json | null
          new_key_hash?: string | null
          next_rotation_date?: string | null
          old_key_hash?: string | null
          provider?: string
          rotated_by?: string | null
          rotation_date?: string
          rotation_reason?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      booking_access_audit: {
        Row: {
          access_method: string | null
          access_type: string
          accessed_data: Json | null
          booking_id: string
          created_at: string | null
          failure_reason: string | null
          id: string
          ip_address: unknown | null
          success: boolean
          user_agent: string | null
        }
        Insert: {
          access_method?: string | null
          access_type: string
          accessed_data?: Json | null
          booking_id: string
          created_at?: string | null
          failure_reason?: string | null
          id?: string
          ip_address?: unknown | null
          success: boolean
          user_agent?: string | null
        }
        Update: {
          access_method?: string | null
          access_type?: string
          accessed_data?: Json | null
          booking_id?: string
          created_at?: string | null
          failure_reason?: string | null
          id?: string
          ip_address?: unknown | null
          success?: boolean
          user_agent?: string | null
        }
        Relationships: []
      }
      booking_addons: {
        Row: {
          addon_id: string
          booking_id: string
          created_at: string
          id: string
          quantity: number
        }
        Insert: {
          addon_id: string
          booking_id: string
          created_at?: string
          id?: string
          quantity?: number
        }
        Update: {
          addon_id?: string
          booking_id?: string
          created_at?: string
          id?: string
          quantity?: number
        }
        Relationships: [
          {
            foreignKeyName: "booking_addons_addon_id_fkey"
            columns: ["addon_id"]
            isOneToOne: false
            referencedRelation: "hotel_addons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_addons_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      booking_items: {
        Row: {
          booking_id: string
          created_at: string | null
          id: string
          item_details: Json
          item_type: string
          quantity: number | null
          total_price: number
          unit_price: number
        }
        Insert: {
          booking_id: string
          created_at?: string | null
          id?: string
          item_details: Json
          item_type: string
          quantity?: number | null
          total_price: number
          unit_price: number
        }
        Update: {
          booking_id?: string
          created_at?: string | null
          id?: string
          item_details?: Json
          item_type?: string
          quantity?: number | null
          total_price?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "booking_items_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      booking_status_history: {
        Row: {
          booking_id: string
          changed_at: string
          changed_by: string | null
          error_details: Json | null
          id: string
          metadata: Json | null
          new_status: string
          previous_status: string
          reason: string | null
        }
        Insert: {
          booking_id: string
          changed_at?: string
          changed_by?: string | null
          error_details?: Json | null
          id?: string
          metadata?: Json | null
          new_status: string
          previous_status: string
          reason?: string | null
        }
        Update: {
          booking_id?: string
          changed_at?: string
          changed_by?: string | null
          error_details?: Json | null
          id?: string
          metadata?: Json | null
          new_status?: string
          previous_status?: string
          reason?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "booking_status_history_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      booking_transactions: {
        Row: {
          booking_data: Json
          booking_id: string
          created_at: string
          currency: string
          failure_reason: string | null
          provider_booking_id: string | null
          rollback_required: boolean | null
          status: string
          stripe_payment_intent_id: string | null
          total_amount: number
          updated_at: string
        }
        Insert: {
          booking_data: Json
          booking_id: string
          created_at?: string
          currency?: string
          failure_reason?: string | null
          provider_booking_id?: string | null
          rollback_required?: boolean | null
          status?: string
          stripe_payment_intent_id?: string | null
          total_amount: number
          updated_at?: string
        }
        Update: {
          booking_data?: Json
          booking_id?: string
          created_at?: string
          currency?: string
          failure_reason?: string | null
          provider_booking_id?: string | null
          rollback_required?: boolean | null
          status?: string
          stripe_payment_intent_id?: string | null
          total_amount?: number
          updated_at?: string
        }
        Relationships: []
      }
      booking_updates: {
        Row: {
          booking_id: string
          booking_reference: string
          booking_type: string
          created_at: string
          id: string
          message: string
          metadata: Json | null
          status: string
          title: string
          update_type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          booking_id: string
          booking_reference: string
          booking_type: string
          created_at?: string
          id?: string
          message: string
          metadata?: Json | null
          status: string
          title: string
          update_type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          booking_id?: string
          booking_reference?: string
          booking_type?: string
          created_at?: string
          id?: string
          message?: string
          metadata?: Json | null
          status?: string
          title?: string
          update_type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      bookings: {
        Row: {
          booking_data: Json
          booking_reference: string
          booking_type: string
          created_at: string | null
          currency: string | null
          id: string
          provider_booking_id: string | null
          provider_confirmation_code: string | null
          status: string
          total_amount: number | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          booking_data: Json
          booking_reference: string
          booking_type: string
          created_at?: string | null
          currency?: string | null
          id?: string
          provider_booking_id?: string | null
          provider_confirmation_code?: string | null
          status?: string
          total_amount?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          booking_data?: Json
          booking_reference?: string
          booking_type?: string
          created_at?: string | null
          currency?: string | null
          id?: string
          provider_booking_id?: string | null
          provider_confirmation_code?: string | null
          status?: string
          total_amount?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      calendar_integrations: {
        Row: {
          access_token_encrypted: string
          calendar_id: string
          created_at: string
          id: string
          is_active: boolean
          last_sync_at: string | null
          provider: string
          refresh_token_encrypted: string | null
          sync_preferences: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          access_token_encrypted: string
          calendar_id: string
          created_at?: string
          id?: string
          is_active?: boolean
          last_sync_at?: string | null
          provider: string
          refresh_token_encrypted?: string | null
          sync_preferences?: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          access_token_encrypted?: string
          calendar_id?: string
          created_at?: string
          id?: string
          is_active?: boolean
          last_sync_at?: string | null
          provider?: string
          refresh_token_encrypted?: string | null
          sync_preferences?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      cancellation_requests: {
        Row: {
          created_at: string | null
          id: string
          order_id: string
          order_type: string | null
          profile_id: string | null
          provider_payload: Json | null
          reason: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          order_id: string
          order_type?: string | null
          profile_id?: string | null
          provider_payload?: Json | null
          reason?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          order_id?: string
          order_type?: string | null
          profile_id?: string | null
          provider_payload?: Json | null
          reason?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cancellation_requests_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      car_rentals: {
        Row: {
          booking_id: string | null
          confirmation_code: string | null
          created_at: string
          currency: string | null
          driver_license: Json | null
          dropoff_date: string
          dropoff_location: Json
          id: string
          insurance_options: Json | null
          pickup_date: string
          pickup_location: Json
          rental_company: string
          status: string | null
          total_cost: number
          updated_at: string
          user_id: string
          vehicle_details: Json
        }
        Insert: {
          booking_id?: string | null
          confirmation_code?: string | null
          created_at?: string
          currency?: string | null
          driver_license?: Json | null
          dropoff_date: string
          dropoff_location: Json
          id?: string
          insurance_options?: Json | null
          pickup_date: string
          pickup_location: Json
          rental_company: string
          status?: string | null
          total_cost: number
          updated_at?: string
          user_id: string
          vehicle_details: Json
        }
        Update: {
          booking_id?: string | null
          confirmation_code?: string | null
          created_at?: string
          currency?: string | null
          driver_license?: Json | null
          dropoff_date?: string
          dropoff_location?: Json
          id?: string
          insurance_options?: Json | null
          pickup_date?: string
          pickup_location?: Json
          rental_company?: string
          status?: string | null
          total_cost?: number
          updated_at?: string
          user_id?: string
          vehicle_details?: Json
        }
        Relationships: [
          {
            foreignKeyName: "car_rentals_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      cities: {
        Row: {
          country_code: string | null
          iata_code: string
          latitude: number | null
          longitude: number | null
          name: string
          raw: Json | null
          updated_at: string | null
        }
        Insert: {
          country_code?: string | null
          iata_code: string
          latitude?: number | null
          longitude?: number | null
          name: string
          raw?: Json | null
          updated_at?: string | null
        }
        Update: {
          country_code?: string | null
          iata_code?: string
          latitude?: number | null
          longitude?: number | null
          name?: string
          raw?: Json | null
          updated_at?: string | null
        }
        Relationships: []
      }
      cleanup_audit: {
        Row: {
          bookings_expired: number | null
          bookings_processed: number | null
          cleanup_type: string
          created_at: string
          details: Json | null
          errors_encountered: number | null
          execution_time_ms: number | null
          id: string
          payments_cancelled: number | null
          triggered_by: string | null
        }
        Insert: {
          bookings_expired?: number | null
          bookings_processed?: number | null
          cleanup_type: string
          created_at?: string
          details?: Json | null
          errors_encountered?: number | null
          execution_time_ms?: number | null
          id?: string
          payments_cancelled?: number | null
          triggered_by?: string | null
        }
        Update: {
          bookings_expired?: number | null
          bookings_processed?: number | null
          cleanup_type?: string
          created_at?: string
          details?: Json | null
          errors_encountered?: number | null
          execution_time_ms?: number | null
          id?: string
          payments_cancelled?: number | null
          triggered_by?: string | null
        }
        Relationships: []
      }
      commission_tracking: {
        Row: {
          booking_id: string | null
          commission_amount: number
          commission_rate: number
          created_at: string
          currency: string
          gross_amount: number
          id: string
          invoice_number: string | null
          metadata: Json | null
          partner_id: string
          payment_date: string | null
          payment_status: string
          transaction_type: string
          updated_at: string
        }
        Insert: {
          booking_id?: string | null
          commission_amount: number
          commission_rate: number
          created_at?: string
          currency?: string
          gross_amount: number
          id?: string
          invoice_number?: string | null
          metadata?: Json | null
          partner_id: string
          payment_date?: string | null
          payment_status?: string
          transaction_type: string
          updated_at?: string
        }
        Update: {
          booking_id?: string | null
          commission_amount?: number
          commission_rate?: number
          created_at?: string
          currency?: string
          gross_amount?: number
          id?: string
          invoice_number?: string | null
          metadata?: Json | null
          partner_id?: string
          payment_date?: string | null
          payment_status?: string
          transaction_type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "commission_tracking_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "commission_tracking_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
        ]
      }
      communication_preferences: {
        Row: {
          created_at: string
          email_frequency: string
          id: string
          language: string
          preferences: Json
          timezone: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email_frequency?: string
          id?: string
          language?: string
          preferences?: Json
          timezone?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email_frequency?: string
          id?: string
          language?: string
          preferences?: Json
          timezone?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      content_images: {
        Row: {
          created_at: string
          destination_id: string
          display_order: number | null
          id: string
          image_caption: string | null
          image_category: string | null
          image_source: string | null
          image_url: string
          is_featured: boolean | null
          supplier_attribution: string | null
        }
        Insert: {
          created_at?: string
          destination_id: string
          display_order?: number | null
          id?: string
          image_caption?: string | null
          image_category?: string | null
          image_source?: string | null
          image_url: string
          is_featured?: boolean | null
          supplier_attribution?: string | null
        }
        Update: {
          created_at?: string
          destination_id?: string
          display_order?: number | null
          id?: string
          image_caption?: string | null
          image_category?: string | null
          image_source?: string | null
          image_url?: string
          is_featured?: boolean | null
          supplier_attribution?: string | null
        }
        Relationships: []
      }
      conversion_events: {
        Row: {
          created_at: string | null
          currency: string | null
          event_name: string
          id: string
          page_url: string
          properties: Json | null
          session_id: string
          user_id: string | null
          value: number | null
        }
        Insert: {
          created_at?: string | null
          currency?: string | null
          event_name: string
          id?: string
          page_url: string
          properties?: Json | null
          session_id: string
          user_id?: string | null
          value?: number | null
        }
        Update: {
          created_at?: string | null
          currency?: string | null
          event_name?: string
          id?: string
          page_url?: string
          properties?: Json | null
          session_id?: string
          user_id?: string | null
          value?: number | null
        }
        Relationships: []
      }
      correlation_tracking: {
        Row: {
          completed_at: string | null
          correlation_id: string
          created_at: string
          duration_ms: number | null
          id: string
          request_data: Json | null
          request_type: string
          response_data: Json | null
          status: string
          user_id: string | null
        }
        Insert: {
          completed_at?: string | null
          correlation_id: string
          created_at?: string
          duration_ms?: number | null
          id?: string
          request_data?: Json | null
          request_type: string
          response_data?: Json | null
          status?: string
          user_id?: string | null
        }
        Update: {
          completed_at?: string | null
          correlation_id?: string
          created_at?: string
          duration_ms?: number | null
          id?: string
          request_data?: Json | null
          request_type?: string
          response_data?: Json | null
          status?: string
          user_id?: string | null
        }
        Relationships: []
      }
      critical_alert_system: {
        Row: {
          alert_type: string
          created_at: string | null
          id: string
          message: string
          metadata: Json | null
          resolved: boolean | null
          resolved_at: string | null
          resolved_by: string | null
          severity: string
          title: string
          updated_at: string | null
        }
        Insert: {
          alert_type: string
          created_at?: string | null
          id?: string
          message: string
          metadata?: Json | null
          resolved?: boolean | null
          resolved_at?: string | null
          resolved_by?: string | null
          severity?: string
          title: string
          updated_at?: string | null
        }
        Update: {
          alert_type?: string
          created_at?: string | null
          id?: string
          message?: string
          metadata?: Json | null
          resolved?: boolean | null
          resolved_at?: string | null
          resolved_by?: string | null
          severity?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      critical_alerts: {
        Row: {
          alert_type: string
          booking_id: string | null
          created_at: string
          id: string
          message: string
          requires_manual_action: boolean | null
          resolved: boolean | null
          resolved_at: string | null
          resolved_by: string | null
          severity: string
        }
        Insert: {
          alert_type: string
          booking_id?: string | null
          created_at?: string
          id?: string
          message: string
          requires_manual_action?: boolean | null
          resolved?: boolean | null
          resolved_at?: string | null
          resolved_by?: string | null
          severity?: string
        }
        Update: {
          alert_type?: string
          booking_id?: string | null
          created_at?: string
          id?: string
          message?: string
          requires_manual_action?: boolean | null
          resolved?: boolean | null
          resolved_at?: string | null
          resolved_by?: string | null
          severity?: string
        }
        Relationships: []
      }
      custom_activities: {
        Row: {
          activity_code: string
          capacity: number | null
          category: string | null
          created_at: string
          currency: string
          description: string | null
          duration_minutes: number | null
          id: string
          location: Json | null
          name: string
          partner_id: string
          price_cents: number
          updated_at: string
        }
        Insert: {
          activity_code: string
          capacity?: number | null
          category?: string | null
          created_at?: string
          currency?: string
          description?: string | null
          duration_minutes?: number | null
          id?: string
          location?: Json | null
          name: string
          partner_id: string
          price_cents: number
          updated_at?: string
        }
        Update: {
          activity_code?: string
          capacity?: number | null
          category?: string | null
          created_at?: string
          currency?: string
          description?: string | null
          duration_minutes?: number | null
          id?: string
          location?: Json | null
          name?: string
          partner_id?: string
          price_cents?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "custom_activities_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partner_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      custom_flights: {
        Row: {
          airline_arc: string | null
          airline_iata: string
          arrival_time: string
          created_at: string
          currency: string
          departure_time: string
          destination_iata: string
          fare_class: string | null
          flight_number: string
          id: string
          origin_iata: string
          partner_id: string
          price_cents: number
          seat_inventory: Json | null
          updated_at: string
        }
        Insert: {
          airline_arc?: string | null
          airline_iata: string
          arrival_time: string
          created_at?: string
          currency?: string
          departure_time: string
          destination_iata: string
          fare_class?: string | null
          flight_number: string
          id?: string
          origin_iata: string
          partner_id: string
          price_cents: number
          seat_inventory?: Json | null
          updated_at?: string
        }
        Update: {
          airline_arc?: string | null
          airline_iata?: string
          arrival_time?: string
          created_at?: string
          currency?: string
          departure_time?: string
          destination_iata?: string
          fare_class?: string | null
          flight_number?: string
          id?: string
          origin_iata?: string
          partner_id?: string
          price_cents?: number
          seat_inventory?: Json | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "custom_flights_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partner_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      custom_hotels: {
        Row: {
          address: Json | null
          base_price_cents: number
          city: string | null
          country: string | null
          created_at: string
          currency: string
          id: string
          inventory: Json | null
          lat: number | null
          lng: number | null
          name: string
          notes: string | null
          partner_id: string
          property_code: string
          room_types: Json | null
          updated_at: string
        }
        Insert: {
          address?: Json | null
          base_price_cents: number
          city?: string | null
          country?: string | null
          created_at?: string
          currency?: string
          id?: string
          inventory?: Json | null
          lat?: number | null
          lng?: number | null
          name: string
          notes?: string | null
          partner_id: string
          property_code: string
          room_types?: Json | null
          updated_at?: string
        }
        Update: {
          address?: Json | null
          base_price_cents?: number
          city?: string | null
          country?: string | null
          created_at?: string
          currency?: string
          id?: string
          inventory?: Json | null
          lat?: number | null
          lng?: number | null
          name?: string
          notes?: string | null
          partner_id?: string
          property_code?: string
          room_types?: Json | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "custom_hotels_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partner_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_behavior_analytics: {
        Row: {
          average_booking_value: number | null
          behavior_pattern: Json
          booking_frequency: string | null
          churn_probability: number | null
          created_at: string
          customer_segment: string
          engagement_score: number | null
          id: string
          last_interaction_date: string | null
          lifetime_value_prediction: number | null
          next_booking_probability: number | null
          personalization_data: Json | null
          preferred_destinations: Json | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          average_booking_value?: number | null
          behavior_pattern?: Json
          booking_frequency?: string | null
          churn_probability?: number | null
          created_at?: string
          customer_segment: string
          engagement_score?: number | null
          id?: string
          last_interaction_date?: string | null
          lifetime_value_prediction?: number | null
          next_booking_probability?: number | null
          personalization_data?: Json | null
          preferred_destinations?: Json | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          average_booking_value?: number | null
          behavior_pattern?: Json
          booking_frequency?: string | null
          churn_probability?: number | null
          created_at?: string
          customer_segment?: string
          engagement_score?: number | null
          id?: string
          last_interaction_date?: string | null
          lifetime_value_prediction?: number | null
          next_booking_probability?: number | null
          personalization_data?: Json | null
          preferred_destinations?: Json | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      data_import_logs: {
        Row: {
          completed_at: string | null
          created_at: string
          error_details: Json | null
          failed_records: number | null
          file_name: string | null
          file_size: number | null
          id: string
          import_source: string
          import_type: string
          metadata: Json | null
          processed_by: string | null
          processed_records: number | null
          started_at: string
          status: string
          total_records: number | null
          updated_at: string
          validation_errors: Json | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          error_details?: Json | null
          failed_records?: number | null
          file_name?: string | null
          file_size?: number | null
          id?: string
          import_source: string
          import_type: string
          metadata?: Json | null
          processed_by?: string | null
          processed_records?: number | null
          started_at?: string
          status?: string
          total_records?: number | null
          updated_at?: string
          validation_errors?: Json | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          error_details?: Json | null
          failed_records?: number | null
          file_name?: string | null
          file_size?: number | null
          id?: string
          import_source?: string
          import_type?: string
          metadata?: Json | null
          processed_by?: string | null
          processed_records?: number | null
          started_at?: string
          status?: string
          total_records?: number | null
          updated_at?: string
          validation_errors?: Json | null
        }
        Relationships: []
      }
      demand_forecasts: {
        Row: {
          accuracy_score: number | null
          confidence_interval: Json
          created_at: string
          destination_code: string
          external_factors: Json | null
          forecast_date: string
          forecast_period: string
          id: string
          model_version: string | null
          predicted_demand: number
          seasonal_factors: Json | null
          updated_at: string
        }
        Insert: {
          accuracy_score?: number | null
          confidence_interval?: Json
          created_at?: string
          destination_code: string
          external_factors?: Json | null
          forecast_date: string
          forecast_period: string
          id?: string
          model_version?: string | null
          predicted_demand: number
          seasonal_factors?: Json | null
          updated_at?: string
        }
        Update: {
          accuracy_score?: number | null
          confidence_interval?: Json
          created_at?: string
          destination_code?: string
          external_factors?: Json | null
          forecast_date?: string
          forecast_period?: string
          id?: string
          model_version?: string | null
          predicted_demand?: number
          seasonal_factors?: Json | null
          updated_at?: string
        }
        Relationships: []
      }
      destination_content: {
        Row: {
          best_time_to_visit: string | null
          content_source: string | null
          content_status: string | null
          continent: string | null
          country: string
          created_at: string
          currency: string | null
          description: string | null
          destination_id: string
          destination_name: string
          highlights: string[] | null
          id: string
          language: string[] | null
          safety_info: Json | null
          seo_description: string | null
          seo_keywords: string[] | null
          seo_title: string | null
          supplier_data: Json | null
          updated_at: string
          weather_info: Json | null
        }
        Insert: {
          best_time_to_visit?: string | null
          content_source?: string | null
          content_status?: string | null
          continent?: string | null
          country: string
          created_at?: string
          currency?: string | null
          description?: string | null
          destination_id: string
          destination_name: string
          highlights?: string[] | null
          id?: string
          language?: string[] | null
          safety_info?: Json | null
          seo_description?: string | null
          seo_keywords?: string[] | null
          seo_title?: string | null
          supplier_data?: Json | null
          updated_at?: string
          weather_info?: Json | null
        }
        Update: {
          best_time_to_visit?: string | null
          content_source?: string | null
          content_status?: string | null
          continent?: string | null
          country?: string
          created_at?: string
          currency?: string | null
          description?: string | null
          destination_id?: string
          destination_name?: string
          highlights?: string[] | null
          id?: string
          language?: string[] | null
          safety_info?: Json | null
          seo_description?: string | null
          seo_keywords?: string[] | null
          seo_title?: string | null
          supplier_data?: Json | null
          updated_at?: string
          weather_info?: Json | null
        }
        Relationships: []
      }
      detailed_reviews: {
        Row: {
          booking_id: string | null
          cleanliness_rating: number | null
          content: string
          created_at: string | null
          helpful_votes: number | null
          id: string
          is_featured: boolean | null
          is_verified: boolean | null
          item_id: string
          item_type: string
          location_rating: number | null
          moderation_status: string | null
          moderator_notes: string | null
          overall_rating: number
          photo_urls: string[] | null
          photos: Json | null
          review_source: string | null
          service_rating: number | null
          supplier_verified: boolean | null
          title: string
          travel_date: string | null
          updated_at: string | null
          user_id: string
          value_rating: number | null
        }
        Insert: {
          booking_id?: string | null
          cleanliness_rating?: number | null
          content: string
          created_at?: string | null
          helpful_votes?: number | null
          id?: string
          is_featured?: boolean | null
          is_verified?: boolean | null
          item_id: string
          item_type: string
          location_rating?: number | null
          moderation_status?: string | null
          moderator_notes?: string | null
          overall_rating: number
          photo_urls?: string[] | null
          photos?: Json | null
          review_source?: string | null
          service_rating?: number | null
          supplier_verified?: boolean | null
          title: string
          travel_date?: string | null
          updated_at?: string | null
          user_id: string
          value_rating?: number | null
        }
        Update: {
          booking_id?: string | null
          cleanliness_rating?: number | null
          content?: string
          created_at?: string | null
          helpful_votes?: number | null
          id?: string
          is_featured?: boolean | null
          is_verified?: boolean | null
          item_id?: string
          item_type?: string
          location_rating?: number | null
          moderation_status?: string | null
          moderator_notes?: string | null
          overall_rating?: number
          photo_urls?: string[] | null
          photos?: Json | null
          review_source?: string | null
          service_rating?: number | null
          supplier_verified?: boolean | null
          title?: string
          travel_date?: string | null
          updated_at?: string | null
          user_id?: string
          value_rating?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "detailed_reviews_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      documentation_versions: {
        Row: {
          author_id: string | null
          change_summary: string | null
          content: string
          content_diff: Json | null
          created_at: string
          document_id: string
          id: string
          published_at: string | null
          reviewed_by: string | null
          status: string
          title: string
          updated_at: string
          version_number: string
        }
        Insert: {
          author_id?: string | null
          change_summary?: string | null
          content: string
          content_diff?: Json | null
          created_at?: string
          document_id: string
          id?: string
          published_at?: string | null
          reviewed_by?: string | null
          status?: string
          title: string
          updated_at?: string
          version_number: string
        }
        Update: {
          author_id?: string | null
          change_summary?: string | null
          content?: string
          content_diff?: Json | null
          created_at?: string
          document_id?: string
          id?: string
          published_at?: string | null
          reviewed_by?: string | null
          status?: string
          title?: string
          updated_at?: string
          version_number?: string
        }
        Relationships: []
      }
      dream_destinations: {
        Row: {
          avg_daily_cost: number | null
          best_time_to_visit: string | null
          budget_range: string | null
          category: string
          continent: string
          country: string
          created_at: string
          description: string | null
          highlights: string[] | null
          id: string
          latitude: number
          longitude: number
          name: string
          photo_url: string | null
          weather_info: Json | null
        }
        Insert: {
          avg_daily_cost?: number | null
          best_time_to_visit?: string | null
          budget_range?: string | null
          category: string
          continent: string
          country: string
          created_at?: string
          description?: string | null
          highlights?: string[] | null
          id?: string
          latitude: number
          longitude: number
          name: string
          photo_url?: string | null
          weather_info?: Json | null
        }
        Update: {
          avg_daily_cost?: number | null
          best_time_to_visit?: string | null
          budget_range?: string | null
          category?: string
          continent?: string
          country?: string
          created_at?: string
          description?: string | null
          highlights?: string[] | null
          id?: string
          latitude?: number
          longitude?: number
          name?: string
          photo_url?: string | null
          weather_info?: Json | null
        }
        Relationships: []
      }
      dynamic_offers: {
        Row: {
          airline: string | null
          created_at: string | null
          description: string | null
          discount_pct: number | null
          hotel_chain: string | null
          id: string
          is_active: boolean | null
          offer_type: string | null
          route: string
          valid_until: string
        }
        Insert: {
          airline?: string | null
          created_at?: string | null
          description?: string | null
          discount_pct?: number | null
          hotel_chain?: string | null
          id?: string
          is_active?: boolean | null
          offer_type?: string | null
          route: string
          valid_until: string
        }
        Update: {
          airline?: string | null
          created_at?: string | null
          description?: string | null
          discount_pct?: number | null
          hotel_chain?: string | null
          id?: string
          is_active?: boolean | null
          offer_type?: string | null
          route?: string
          valid_until?: string
        }
        Relationships: []
      }
      enhanced_favorites: {
        Row: {
          created_at: string | null
          current_price: number | null
          id: string
          is_price_alert_active: boolean | null
          is_shared: boolean | null
          item_data: Json
          item_id: string
          item_type: string
          last_price_check: string | null
          notes: string | null
          original_price: number | null
          price_alert_threshold: number | null
          price_history: Json | null
          share_token: string | null
          tags: string[] | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          current_price?: number | null
          id?: string
          is_price_alert_active?: boolean | null
          is_shared?: boolean | null
          item_data: Json
          item_id: string
          item_type: string
          last_price_check?: string | null
          notes?: string | null
          original_price?: number | null
          price_alert_threshold?: number | null
          price_history?: Json | null
          share_token?: string | null
          tags?: string[] | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          current_price?: number | null
          id?: string
          is_price_alert_active?: boolean | null
          is_shared?: boolean | null
          item_data?: Json
          item_id?: string
          item_type?: string
          last_price_check?: string | null
          notes?: string | null
          original_price?: number | null
          price_alert_threshold?: number | null
          price_history?: Json | null
          share_token?: string | null
          tags?: string[] | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      environment_configs: {
        Row: {
          config_key: string
          config_value: Json
          created_at: string
          environment: string
          id: string
          is_active: boolean
          updated_at: string
        }
        Insert: {
          config_key: string
          config_value: Json
          created_at?: string
          environment: string
          id?: string
          is_active?: boolean
          updated_at?: string
        }
        Update: {
          config_key?: string
          config_value?: Json
          created_at?: string
          environment?: string
          id?: string
          is_active?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      error_tracking: {
        Row: {
          correlation_id: string
          created_at: string
          environment: string
          error_message: string
          error_type: string
          id: string
          request_context: Json | null
          resolved: boolean
          severity: string
          stack_trace: string | null
          updated_at: string
          user_context: Json | null
          user_id: string | null
        }
        Insert: {
          correlation_id: string
          created_at?: string
          environment?: string
          error_message: string
          error_type: string
          id?: string
          request_context?: Json | null
          resolved?: boolean
          severity?: string
          stack_trace?: string | null
          updated_at?: string
          user_context?: Json | null
          user_id?: string | null
        }
        Update: {
          correlation_id?: string
          created_at?: string
          environment?: string
          error_message?: string
          error_type?: string
          id?: string
          request_context?: Json | null
          resolved?: boolean
          severity?: string
          stack_trace?: string | null
          updated_at?: string
          user_context?: Json | null
          user_id?: string | null
        }
        Relationships: []
      }
      feature_flags: {
        Row: {
          conditions: Json | null
          created_at: string
          description: string | null
          enabled: boolean
          flag_name: string
          id: string
          rollout_percentage: number
          target_users: Json | null
          updated_at: string
        }
        Insert: {
          conditions?: Json | null
          created_at?: string
          description?: string | null
          enabled?: boolean
          flag_name: string
          id?: string
          rollout_percentage?: number
          target_users?: Json | null
          updated_at?: string
        }
        Update: {
          conditions?: Json | null
          created_at?: string
          description?: string | null
          enabled?: boolean
          flag_name?: string
          id?: string
          rollout_percentage?: number
          target_users?: Json | null
          updated_at?: string
        }
        Relationships: []
      }
      flight_change_requests: {
        Row: {
          change_fee: number | null
          change_type: string
          created_at: string | null
          currency: string | null
          fare_difference: number | null
          id: string
          metadata: Json | null
          original_flight_data: Json
          pnr_id: string | null
          processed_at: string | null
          reason: string | null
          requested_flight_data: Json
          sabre_change_reference: string | null
          status: string | null
          total_cost: number | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          change_fee?: number | null
          change_type: string
          created_at?: string | null
          currency?: string | null
          fare_difference?: number | null
          id?: string
          metadata?: Json | null
          original_flight_data: Json
          pnr_id?: string | null
          processed_at?: string | null
          reason?: string | null
          requested_flight_data: Json
          sabre_change_reference?: string | null
          status?: string | null
          total_cost?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          change_fee?: number | null
          change_type?: string
          created_at?: string | null
          currency?: string | null
          fare_difference?: number | null
          id?: string
          metadata?: Json | null
          original_flight_data?: Json
          pnr_id?: string | null
          processed_at?: string | null
          reason?: string | null
          requested_flight_data?: Json
          sabre_change_reference?: string | null
          status?: string | null
          total_cost?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "flight_change_requests_pnr_id_fkey"
            columns: ["pnr_id"]
            isOneToOne: false
            referencedRelation: "pnr_records"
            referencedColumns: ["id"]
          },
        ]
      }
      flight_offers_cache: {
        Row: {
          adults: number | null
          cabin: string | null
          children: number | null
          created_at: string | null
          currency: string | null
          departure_date: string | null
          destination: string
          id: string
          infants: number | null
          offers: Json
          origin: string
          return_date: string | null
          search_key: string
          ttl_expires_at: string | null
        }
        Insert: {
          adults?: number | null
          cabin?: string | null
          children?: number | null
          created_at?: string | null
          currency?: string | null
          departure_date?: string | null
          destination: string
          id?: string
          infants?: number | null
          offers: Json
          origin: string
          return_date?: string | null
          search_key: string
          ttl_expires_at?: string | null
        }
        Update: {
          adults?: number | null
          cabin?: string | null
          children?: number | null
          created_at?: string | null
          currency?: string | null
          departure_date?: string | null
          destination?: string
          id?: string
          infants?: number | null
          offers?: Json
          origin?: string
          return_date?: string | null
          search_key?: string
          ttl_expires_at?: string | null
        }
        Relationships: []
      }
      flight_order_events: {
        Row: {
          created_at: string | null
          event_type: string | null
          flights_order_id: string | null
          id: string
          payload: Json | null
        }
        Insert: {
          created_at?: string | null
          event_type?: string | null
          flights_order_id?: string | null
          id?: string
          payload?: Json | null
        }
        Update: {
          created_at?: string | null
          event_type?: string | null
          flights_order_id?: string | null
          id?: string
          payload?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "flight_order_events_flights_order_id_fkey"
            columns: ["flights_order_id"]
            isOneToOne: false
            referencedRelation: "flights_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      flight_passengers: {
        Row: {
          created_at: string | null
          date_of_birth: string | null
          document: Json | null
          first_name: string | null
          gender: string | null
          id: string
          last_name: string | null
          loyalty: Json | null
          profile_id: string | null
          type: string | null
        }
        Insert: {
          created_at?: string | null
          date_of_birth?: string | null
          document?: Json | null
          first_name?: string | null
          gender?: string | null
          id?: string
          last_name?: string | null
          loyalty?: Json | null
          profile_id?: string | null
          type?: string | null
        }
        Update: {
          created_at?: string | null
          date_of_birth?: string | null
          document?: Json | null
          first_name?: string | null
          gender?: string | null
          id?: string
          last_name?: string | null
          loyalty?: Json | null
          profile_id?: string | null
          type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "flight_passengers_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      flights_orders: {
        Row: {
          amadeus_order_id: string | null
          analytics: Json | null
          checkin_links: Json | null
          created_at: string | null
          id: string
          meta: Json | null
          offer_json: Json
          offer_source: string
          passengers: Json | null
          pnr: string | null
          price_currency: string | null
          price_total: number | null
          profile_id: string | null
          seatmaps: Json | null
          status: string | null
          ticket_numbers: string[] | null
          updated_at: string | null
        }
        Insert: {
          amadeus_order_id?: string | null
          analytics?: Json | null
          checkin_links?: Json | null
          created_at?: string | null
          id?: string
          meta?: Json | null
          offer_json: Json
          offer_source: string
          passengers?: Json | null
          pnr?: string | null
          price_currency?: string | null
          price_total?: number | null
          profile_id?: string | null
          seatmaps?: Json | null
          status?: string | null
          ticket_numbers?: string[] | null
          updated_at?: string | null
        }
        Update: {
          amadeus_order_id?: string | null
          analytics?: Json | null
          checkin_links?: Json | null
          created_at?: string | null
          id?: string
          meta?: Json | null
          offer_json?: Json
          offer_source?: string
          passengers?: Json | null
          pnr?: string | null
          price_currency?: string | null
          price_total?: number | null
          profile_id?: string | null
          seatmaps?: Json | null
          status?: string | null
          ticket_numbers?: string[] | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "flights_orders_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      fraud_alerts: {
        Row: {
          alert_reason: string
          alert_type: string
          created_at: string
          detection_method: string
          id: string
          ip_address: unknown | null
          metadata: Json | null
          resolution_notes: string | null
          resolved_at: string | null
          resolved_by: string | null
          risk_score: number
          severity: string
          status: string
          transaction_id: string | null
          updated_at: string
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          alert_reason: string
          alert_type: string
          created_at?: string
          detection_method: string
          id?: string
          ip_address?: unknown | null
          metadata?: Json | null
          resolution_notes?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          risk_score?: number
          severity?: string
          status?: string
          transaction_id?: string | null
          updated_at?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          alert_reason?: string
          alert_type?: string
          created_at?: string
          detection_method?: string
          id?: string
          ip_address?: unknown | null
          metadata?: Json | null
          resolution_notes?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          risk_score?: number
          severity?: string
          status?: string
          transaction_id?: string | null
          updated_at?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      fund_balances: {
        Row: {
          balance: number
          created_at: string
          currency: string
          updated_at: string
          user_id: string
        }
        Insert: {
          balance?: number
          created_at?: string
          currency?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          balance?: number
          created_at?: string
          currency?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fund_balances_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      fund_transactions: {
        Row: {
          amount: number
          billing_category: string | null
          billing_metadata: Json | null
          created_at: string
          external_transaction_id: string | null
          id: string
          invoice_id: string | null
          net_amount: number | null
          payment_method: string | null
          processor_fee: number | null
          status: string
          stripe_session_id: string | null
          tax_amount: number | null
          type: string
          user_id: string
        }
        Insert: {
          amount: number
          billing_category?: string | null
          billing_metadata?: Json | null
          created_at?: string
          external_transaction_id?: string | null
          id?: string
          invoice_id?: string | null
          net_amount?: number | null
          payment_method?: string | null
          processor_fee?: number | null
          status?: string
          stripe_session_id?: string | null
          tax_amount?: number | null
          type: string
          user_id: string
        }
        Update: {
          amount?: number
          billing_category?: string | null
          billing_metadata?: Json | null
          created_at?: string
          external_transaction_id?: string | null
          id?: string
          invoice_id?: string | null
          net_amount?: number | null
          payment_method?: string | null
          processor_fee?: number | null
          status?: string
          stripe_session_id?: string | null
          tax_amount?: number | null
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fund_transactions_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fund_transactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      funds: {
        Row: {
          balance: number | null
          created_at: string | null
          deadline: string | null
          description: string | null
          destination: string | null
          fund_code: string | null
          fund_type: string | null
          id: string
          name: string | null
          status: string | null
          target_amount: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          balance?: number | null
          created_at?: string | null
          deadline?: string | null
          description?: string | null
          destination?: string | null
          fund_code?: string | null
          fund_type?: string | null
          id?: string
          name?: string | null
          status?: string | null
          target_amount?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          balance?: number | null
          created_at?: string | null
          deadline?: string | null
          description?: string | null
          destination?: string | null
          fund_code?: string | null
          fund_type?: string | null
          id?: string
          name?: string | null
          status?: string | null
          target_amount?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      funnel_steps: {
        Row: {
          created_at: string | null
          id: string
          metadata: Json | null
          session_id: string
          step_name: string
          step_order: number
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          metadata?: Json | null
          session_id: string
          step_name: string
          step_order: number
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          metadata?: Json | null
          session_id?: string
          step_name?: string
          step_order?: number
          user_id?: string | null
        }
        Relationships: []
      }
      gift_card_redemptions: {
        Row: {
          amount_redeemed: number
          booking_id: string | null
          created_at: string
          gift_card_id: string
          id: string
          user_id: string | null
        }
        Insert: {
          amount_redeemed: number
          booking_id?: string | null
          created_at?: string
          gift_card_id: string
          id?: string
          user_id?: string | null
        }
        Update: {
          amount_redeemed?: number
          booking_id?: string | null
          created_at?: string
          gift_card_id?: string
          id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "gift_card_redemptions_gift_card_id_fkey"
            columns: ["gift_card_id"]
            isOneToOne: false
            referencedRelation: "gift_cards"
            referencedColumns: ["id"]
          },
        ]
      }
      gift_cards: {
        Row: {
          amount: number
          code: string
          created_at: string
          currency: string
          design_template: string | null
          expires_at: string | null
          id: string
          original_amount: number
          personal_message: string | null
          recipient_email: string
          recipient_name: string
          redeemed_at: string | null
          redeemed_by: string | null
          sender_email: string
          sender_id: string | null
          sender_name: string
          status: string
          updated_at: string
        }
        Insert: {
          amount: number
          code: string
          created_at?: string
          currency?: string
          design_template?: string | null
          expires_at?: string | null
          id?: string
          original_amount: number
          personal_message?: string | null
          recipient_email: string
          recipient_name: string
          redeemed_at?: string | null
          redeemed_by?: string | null
          sender_email: string
          sender_id?: string | null
          sender_name: string
          status?: string
          updated_at?: string
        }
        Update: {
          amount?: number
          code?: string
          created_at?: string
          currency?: string
          design_template?: string | null
          expires_at?: string | null
          id?: string
          original_amount?: number
          personal_message?: string | null
          recipient_email?: string
          recipient_name?: string
          redeemed_at?: string | null
          redeemed_by?: string | null
          sender_email?: string
          sender_id?: string | null
          sender_name?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      group_booking_coordination: {
        Row: {
          booking_preferences: Json
          coordination_status: string
          coordinator_user_id: string
          created_at: string
          final_bookings: Json | null
          group_name: string
          group_size: number
          id: string
          participants: Json
          updated_at: string
          voting_status: Json
        }
        Insert: {
          booking_preferences?: Json
          coordination_status?: string
          coordinator_user_id: string
          created_at?: string
          final_bookings?: Json | null
          group_name: string
          group_size: number
          id?: string
          participants?: Json
          updated_at?: string
          voting_status?: Json
        }
        Update: {
          booking_preferences?: Json
          coordination_status?: string
          coordinator_user_id?: string
          created_at?: string
          final_bookings?: Json | null
          group_name?: string
          group_size?: number
          id?: string
          participants?: Json
          updated_at?: string
          voting_status?: Json
        }
        Relationships: []
      }
      guest_booking_tokens: {
        Row: {
          access_count: number | null
          access_level: string
          access_token: string
          booking_id: string
          created_at: string | null
          email_hash: string
          expires_at: string
          id: string
          last_accessed: string | null
          updated_at: string | null
        }
        Insert: {
          access_count?: number | null
          access_level?: string
          access_token: string
          booking_id: string
          created_at?: string | null
          email_hash: string
          expires_at?: string
          id?: string
          last_accessed?: string | null
          updated_at?: string | null
        }
        Update: {
          access_count?: number | null
          access_level?: string
          access_token?: string
          booking_id?: string
          created_at?: string | null
          email_hash?: string
          expires_at?: string
          id?: string
          last_accessed?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "guest_booking_tokens_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      health_checks: {
        Row: {
          checked_at: string
          created_at: string
          id: string
          performance: Json
          services: Json
          status: string
        }
        Insert: {
          checked_at?: string
          created_at?: string
          id?: string
          performance?: Json
          services?: Json
          status: string
        }
        Update: {
          checked_at?: string
          created_at?: string
          id?: string
          performance?: Json
          services?: Json
          status?: string
        }
        Relationships: []
      }
      hotel_addons: {
        Row: {
          active: boolean
          category: string
          code: string
          created_at: string
          currency: string
          description: string | null
          hotel_id: string
          id: string
          name: string
          per_person: boolean
          price_cents: number
          updated_at: string
        }
        Insert: {
          active?: boolean
          category: string
          code: string
          created_at?: string
          currency?: string
          description?: string | null
          hotel_id: string
          id?: string
          name: string
          per_person?: boolean
          price_cents: number
          updated_at?: string
        }
        Update: {
          active?: boolean
          category?: string
          code?: string
          created_at?: string
          currency?: string
          description?: string | null
          hotel_id?: string
          id?: string
          name?: string
          per_person?: boolean
          price_cents?: number
          updated_at?: string
        }
        Relationships: []
      }
      hotel_offers_cache: {
        Row: {
          adults: number | null
          checkin: string | null
          checkout: string | null
          children: number | null
          city_iata: string | null
          created_at: string | null
          currency: string | null
          hotel_id: string | null
          id: string
          offers: Json
          rooms: number | null
          search_key: string
          sentiments: Json | null
          ttl_expires_at: string | null
        }
        Insert: {
          adults?: number | null
          checkin?: string | null
          checkout?: string | null
          children?: number | null
          city_iata?: string | null
          created_at?: string | null
          currency?: string | null
          hotel_id?: string | null
          id?: string
          offers: Json
          rooms?: number | null
          search_key: string
          sentiments?: Json | null
          ttl_expires_at?: string | null
        }
        Update: {
          adults?: number | null
          checkin?: string | null
          checkout?: string | null
          children?: number | null
          city_iata?: string | null
          created_at?: string | null
          currency?: string | null
          hotel_id?: string | null
          id?: string
          offers?: Json
          rooms?: number | null
          search_key?: string
          sentiments?: Json | null
          ttl_expires_at?: string | null
        }
        Relationships: []
      }
      hotelbeds_monitoring: {
        Row: {
          booking_reference: string | null
          correlation_id: string
          created_at: string
          duration_ms: number | null
          error_message: string | null
          event_type: string
          function_name: string
          hotel_code: string | null
          id: string
          metadata: Json | null
          rate_key: string | null
          status_code: number | null
        }
        Insert: {
          booking_reference?: string | null
          correlation_id: string
          created_at?: string
          duration_ms?: number | null
          error_message?: string | null
          event_type: string
          function_name: string
          hotel_code?: string | null
          id?: string
          metadata?: Json | null
          rate_key?: string | null
          status_code?: number | null
        }
        Update: {
          booking_reference?: string | null
          correlation_id?: string
          created_at?: string
          duration_ms?: number | null
          error_message?: string | null
          event_type?: string
          function_name?: string
          hotel_code?: string | null
          id?: string
          metadata?: Json | null
          rate_key?: string | null
          status_code?: number | null
        }
        Relationships: []
      }
      hotels: {
        Row: {
          address: Json | null
          amenities: string[] | null
          city_iata: string | null
          contact: Json | null
          hotel_id: string
          latitude: number | null
          longitude: number | null
          name: string
          raw: Json | null
          updated_at: string | null
        }
        Insert: {
          address?: Json | null
          amenities?: string[] | null
          city_iata?: string | null
          contact?: Json | null
          hotel_id: string
          latitude?: number | null
          longitude?: number | null
          name: string
          raw?: Json | null
          updated_at?: string | null
        }
        Update: {
          address?: Json | null
          amenities?: string[] | null
          city_iata?: string | null
          contact?: Json | null
          hotel_id?: string
          latitude?: number | null
          longitude?: number | null
          name?: string
          raw?: Json | null
          updated_at?: string | null
        }
        Relationships: []
      }
      hotels_orders: {
        Row: {
          amadeus_booking_id: string | null
          checkin: string | null
          checkout: string | null
          confirmation_code: string | null
          created_at: string | null
          currency: string | null
          guests: Json | null
          hotel_id: string | null
          id: string
          meta: Json | null
          offer_json: Json
          profile_id: string | null
          rooms: number | null
          status: string | null
          total_price: number | null
          updated_at: string | null
        }
        Insert: {
          amadeus_booking_id?: string | null
          checkin?: string | null
          checkout?: string | null
          confirmation_code?: string | null
          created_at?: string | null
          currency?: string | null
          guests?: Json | null
          hotel_id?: string | null
          id?: string
          meta?: Json | null
          offer_json: Json
          profile_id?: string | null
          rooms?: number | null
          status?: string | null
          total_price?: number | null
          updated_at?: string | null
        }
        Update: {
          amadeus_booking_id?: string | null
          checkin?: string | null
          checkout?: string | null
          confirmation_code?: string | null
          created_at?: string | null
          currency?: string | null
          guests?: Json | null
          hotel_id?: string | null
          id?: string
          meta?: Json | null
          offer_json?: Json
          profile_id?: string | null
          rooms?: number | null
          status?: string | null
          total_price?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "hotels_orders_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      intent_routing_rules: {
        Row: {
          agent_id: string
          conditions: Json
          created_at: string
          created_by: string | null
          failure_count: number
          id: string
          intent_pattern: string
          is_active: boolean
          priority: number
          success_count: number
          updated_at: string
        }
        Insert: {
          agent_id: string
          conditions?: Json
          created_at?: string
          created_by?: string | null
          failure_count?: number
          id?: string
          intent_pattern: string
          is_active?: boolean
          priority?: number
          success_count?: number
          updated_at?: string
        }
        Update: {
          agent_id?: string
          conditions?: Json
          created_at?: string
          created_by?: string | null
          failure_count?: number
          id?: string
          intent_pattern?: string
          is_active?: boolean
          priority?: number
          success_count?: number
          updated_at?: string
        }
        Relationships: []
      }
      invoices: {
        Row: {
          amount: number
          billing_address: Json | null
          booking_id: string | null
          created_at: string
          currency: string
          id: string
          invoice_number: string
          invoice_type: string
          issued_date: string | null
          line_items: Json
          metadata: Json | null
          notes: string | null
          paid_date: string | null
          payment_due_date: string | null
          payment_terms: string | null
          status: string
          tax_amount: number | null
          total_amount: number
          updated_at: string
          user_id: string | null
        }
        Insert: {
          amount: number
          billing_address?: Json | null
          booking_id?: string | null
          created_at?: string
          currency?: string
          id?: string
          invoice_number: string
          invoice_type?: string
          issued_date?: string | null
          line_items?: Json
          metadata?: Json | null
          notes?: string | null
          paid_date?: string | null
          payment_due_date?: string | null
          payment_terms?: string | null
          status?: string
          tax_amount?: number | null
          total_amount: number
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          amount?: number
          billing_address?: Json | null
          booking_id?: string | null
          created_at?: string
          currency?: string
          id?: string
          invoice_number?: string
          invoice_type?: string
          issued_date?: string | null
          line_items?: Json
          metadata?: Json | null
          notes?: string | null
          paid_date?: string | null
          payment_due_date?: string | null
          payment_terms?: string | null
          status?: string
          tax_amount?: number | null
          total_amount?: number
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "invoices_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      itineraries: {
        Row: {
          data: Json | null
          id: string
          user_id: string
        }
        Insert: {
          data?: Json | null
          id?: string
          user_id: string
        }
        Update: {
          data?: Json | null
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      knowledge_base_entries: {
        Row: {
          access_level: string
          category: string
          content: string
          created_at: string
          created_by: string | null
          entry_key: string
          id: string
          last_updated_by: string | null
          search_vector: unknown | null
          tags: string[]
          title: string
          updated_at: string
        }
        Insert: {
          access_level?: string
          category?: string
          content: string
          created_at?: string
          created_by?: string | null
          entry_key: string
          id?: string
          last_updated_by?: string | null
          search_vector?: unknown | null
          tags?: string[]
          title: string
          updated_at?: string
        }
        Update: {
          access_level?: string
          category?: string
          content?: string
          created_at?: string
          created_by?: string | null
          entry_key?: string
          id?: string
          last_updated_by?: string | null
          search_vector?: unknown | null
          tags?: string[]
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      local_insights: {
        Row: {
          content: string
          created_at: string | null
          id: string
          is_featured: boolean | null
          location_id: string
          rating: number | null
          source: string | null
          tip_type: string
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          is_featured?: boolean | null
          location_id: string
          rating?: number | null
          source?: string | null
          tip_type: string
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          is_featured?: boolean | null
          location_id?: string
          rating?: number | null
          source?: string | null
          tip_type?: string
        }
        Relationships: []
      }
      local_tips: {
        Row: {
          budget_level: string | null
          content: string
          coordinates: Json | null
          created_at: string | null
          helpful_votes: number | null
          id: string
          is_verified: boolean | null
          location_id: string
          photos: Json | null
          tip_category: string
          title: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          budget_level?: string | null
          content: string
          coordinates?: Json | null
          created_at?: string | null
          helpful_votes?: number | null
          id?: string
          is_verified?: boolean | null
          location_id: string
          photos?: Json | null
          tip_category: string
          title: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          budget_level?: string | null
          content?: string
          coordinates?: Json | null
          created_at?: string | null
          helpful_votes?: number | null
          id?: string
          is_verified?: boolean | null
          location_id?: string
          photos?: Json | null
          tip_category?: string
          title?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      loyalty_points: {
        Row: {
          created_at: string | null
          current_tier: string | null
          id: string
          lifetime_points: number | null
          points_to_next_tier: number | null
          total_points: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          current_tier?: string | null
          id?: string
          lifetime_points?: number | null
          points_to_next_tier?: number | null
          total_points?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          current_tier?: string | null
          id?: string
          lifetime_points?: number | null
          points_to_next_tier?: number | null
          total_points?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      market_analytics: {
        Row: {
          created_at: string | null
          data: Json
          id: string
          metric: string
          scope: Json
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          data: Json
          id?: string
          metric: string
          scope: Json
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          data?: Json
          id?: string
          metric?: string
          scope?: Json
          updated_at?: string | null
        }
        Relationships: []
      }
      market_insights: {
        Row: {
          confidence_score: number | null
          created_at: string
          description: string
          destination_code: string | null
          expiry_date: string | null
          id: string
          impact_level: string | null
          insight_type: string
          is_actionable: boolean | null
          market_segment: string
          recommendation: string | null
          supporting_data: Json | null
          title: string
          updated_at: string
        }
        Insert: {
          confidence_score?: number | null
          created_at?: string
          description: string
          destination_code?: string | null
          expiry_date?: string | null
          id?: string
          impact_level?: string | null
          insight_type: string
          is_actionable?: boolean | null
          market_segment: string
          recommendation?: string | null
          supporting_data?: Json | null
          title: string
          updated_at?: string
        }
        Update: {
          confidence_score?: number | null
          created_at?: string
          description?: string
          destination_code?: string | null
          expiry_date?: string | null
          id?: string
          impact_level?: string | null
          insight_type?: string
          is_actionable?: boolean | null
          market_segment?: string
          recommendation?: string | null
          supporting_data?: Json | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      migration_logs: {
        Row: {
          applied_by: string | null
          completed_at: string | null
          created_at: string
          error_message: string | null
          id: string
          metadata: Json | null
          migration_name: string
          migration_version: string
          rollback_sql: string | null
          started_at: string
          status: string
          updated_at: string
        }
        Insert: {
          applied_by?: string | null
          completed_at?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          metadata?: Json | null
          migration_name: string
          migration_version: string
          rollback_sql?: string | null
          started_at?: string
          status?: string
          updated_at?: string
        }
        Update: {
          applied_by?: string | null
          completed_at?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          metadata?: Json | null
          migration_name?: string
          migration_version?: string
          rollback_sql?: string | null
          started_at?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          action_url: string | null
          created_at: string
          id: string
          is_read: boolean
          message: string
          metadata: Json | null
          priority: string
          title: string
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          action_url?: string | null
          created_at?: string
          id?: string
          is_read?: boolean
          message: string
          metadata?: Json | null
          priority?: string
          title: string
          type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          action_url?: string | null
          created_at?: string
          id?: string
          is_read?: boolean
          message?: string
          metadata?: Json | null
          priority?: string
          title?: string
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      orchestration_workflows: {
        Row: {
          agent_sequence: Json
          created_at: string
          created_by: string | null
          description: string | null
          execution_count: number
          id: string
          is_active: boolean
          success_rate: number | null
          trigger_conditions: Json
          updated_at: string
          workflow_config: Json
          workflow_name: string
        }
        Insert: {
          agent_sequence?: Json
          created_at?: string
          created_by?: string | null
          description?: string | null
          execution_count?: number
          id?: string
          is_active?: boolean
          success_rate?: number | null
          trigger_conditions?: Json
          updated_at?: string
          workflow_config?: Json
          workflow_name: string
        }
        Update: {
          agent_sequence?: Json
          created_at?: string
          created_by?: string | null
          description?: string | null
          execution_count?: number
          id?: string
          is_active?: boolean
          success_rate?: number | null
          trigger_conditions?: Json
          updated_at?: string
          workflow_config?: Json
          workflow_name?: string
        }
        Relationships: []
      }
      partner_analytics: {
        Row: {
          avg_booking_value: number | null
          conversion_rate: number | null
          created_at: string | null
          id: string
          month: number
          partner_id: string
          total_bookings: number | null
          total_commission: number | null
          total_payout: number | null
          total_revenue: number | null
          updated_at: string | null
          year: number
        }
        Insert: {
          avg_booking_value?: number | null
          conversion_rate?: number | null
          created_at?: string | null
          id?: string
          month: number
          partner_id: string
          total_bookings?: number | null
          total_commission?: number | null
          total_payout?: number | null
          total_revenue?: number | null
          updated_at?: string | null
          year: number
        }
        Update: {
          avg_booking_value?: number | null
          conversion_rate?: number | null
          created_at?: string | null
          id?: string
          month?: number
          partner_id?: string
          total_bookings?: number | null
          total_commission?: number | null
          total_payout?: number | null
          total_revenue?: number | null
          updated_at?: string | null
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "partner_analytics_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partner_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      partner_bookings: {
        Row: {
          booking_id: string
          booking_value: number
          commission_amount: number
          commission_rate: number
          created_at: string | null
          id: string
          partner_id: string
          partner_payout_amount: number
          payout_date: string | null
          payout_status: Database["public"]["Enums"]["payout_status"] | null
          property_id: string
          updated_at: string | null
        }
        Insert: {
          booking_id: string
          booking_value: number
          commission_amount: number
          commission_rate: number
          created_at?: string | null
          id?: string
          partner_id: string
          partner_payout_amount: number
          payout_date?: string | null
          payout_status?: Database["public"]["Enums"]["payout_status"] | null
          property_id: string
          updated_at?: string | null
        }
        Update: {
          booking_id?: string
          booking_value?: number
          commission_amount?: number
          commission_rate?: number
          created_at?: string | null
          id?: string
          partner_id?: string
          partner_payout_amount?: number
          payout_date?: string | null
          payout_status?: Database["public"]["Enums"]["payout_status"] | null
          property_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "partner_bookings_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "partner_bookings_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partner_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "partner_bookings_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "partner_properties"
            referencedColumns: ["id"]
          },
        ]
      }
      partner_codes: {
        Row: {
          activity_supplier_code: string | null
          airline_arc: string | null
          airline_iata: string | null
          created_at: string
          hotel_chain_code: string | null
          id: string
          partner_id: string
          property_code: string | null
          updated_at: string
        }
        Insert: {
          activity_supplier_code?: string | null
          airline_arc?: string | null
          airline_iata?: string | null
          created_at?: string
          hotel_chain_code?: string | null
          id?: string
          partner_id: string
          property_code?: string | null
          updated_at?: string
        }
        Update: {
          activity_supplier_code?: string | null
          airline_arc?: string | null
          airline_iata?: string | null
          created_at?: string
          hotel_chain_code?: string | null
          id?: string
          partner_id?: string
          property_code?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "partner_codes_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partner_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      partner_integrations: {
        Row: {
          api_credentials: Json | null
          api_endpoint: string | null
          created_at: string | null
          error_log: Json | null
          id: string
          integration_type: string
          last_sync: string | null
          partner_id: string
          status: Database["public"]["Enums"]["integration_status"] | null
          sync_frequency: string | null
          updated_at: string | null
          webhook_url: string | null
        }
        Insert: {
          api_credentials?: Json | null
          api_endpoint?: string | null
          created_at?: string | null
          error_log?: Json | null
          id?: string
          integration_type: string
          last_sync?: string | null
          partner_id: string
          status?: Database["public"]["Enums"]["integration_status"] | null
          sync_frequency?: string | null
          updated_at?: string | null
          webhook_url?: string | null
        }
        Update: {
          api_credentials?: Json | null
          api_endpoint?: string | null
          created_at?: string | null
          error_log?: Json | null
          id?: string
          integration_type?: string
          last_sync?: string | null
          partner_id?: string
          status?: Database["public"]["Enums"]["integration_status"] | null
          sync_frequency?: string | null
          updated_at?: string | null
          webhook_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "partner_integrations_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partner_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      partner_notifications: {
        Row: {
          action_url: string | null
          created_at: string | null
          id: string
          is_read: boolean | null
          message: string
          partner_id: string
          priority: string | null
          title: string
          type: string
        }
        Insert: {
          action_url?: string | null
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message: string
          partner_id: string
          priority?: string | null
          title: string
          type: string
        }
        Update: {
          action_url?: string | null
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message?: string
          partner_id?: string
          priority?: string | null
          title?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "partner_notifications_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partner_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      partner_onboarding_payments: {
        Row: {
          amount: number
          created_at: string
          currency: string
          id: string
          partner_id: string | null
          payment_type: string
          status: string
          stripe_payment_intent_id: string | null
          stripe_setup_intent_id: string | null
          updated_at: string
        }
        Insert: {
          amount: number
          created_at?: string
          currency?: string
          id?: string
          partner_id?: string | null
          payment_type: string
          status?: string
          stripe_payment_intent_id?: string | null
          stripe_setup_intent_id?: string | null
          updated_at?: string
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: string
          id?: string
          partner_id?: string | null
          payment_type?: string
          status?: string
          stripe_payment_intent_id?: string | null
          stripe_setup_intent_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "partner_onboarding_payments_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partner_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      partner_profiles: {
        Row: {
          address: Json | null
          business_license: string | null
          business_name: string
          business_type: Database["public"]["Enums"]["partner_type"]
          commission_rate: number | null
          contact_person: string | null
          created_at: string | null
          description: string | null
          documents_verified: boolean | null
          id: string
          is_active: boolean | null
          onboarding_choice: string | null
          onboarding_fee_paid: boolean | null
          payment_status: string | null
          phone: string | null
          stripe_customer_id: string | null
          stripe_payment_intent_id: string | null
          stripe_setup_intent_id: string | null
          tax_id: string | null
          trial_expires_at: string | null
          trial_start_date: string | null
          trial_status: string | null
          updated_at: string | null
          user_id: string
          verification_status:
            | Database["public"]["Enums"]["verification_status"]
            | null
          website_url: string | null
        }
        Insert: {
          address?: Json | null
          business_license?: string | null
          business_name: string
          business_type: Database["public"]["Enums"]["partner_type"]
          commission_rate?: number | null
          contact_person?: string | null
          created_at?: string | null
          description?: string | null
          documents_verified?: boolean | null
          id?: string
          is_active?: boolean | null
          onboarding_choice?: string | null
          onboarding_fee_paid?: boolean | null
          payment_status?: string | null
          phone?: string | null
          stripe_customer_id?: string | null
          stripe_payment_intent_id?: string | null
          stripe_setup_intent_id?: string | null
          tax_id?: string | null
          trial_expires_at?: string | null
          trial_start_date?: string | null
          trial_status?: string | null
          updated_at?: string | null
          user_id: string
          verification_status?:
            | Database["public"]["Enums"]["verification_status"]
            | null
          website_url?: string | null
        }
        Update: {
          address?: Json | null
          business_license?: string | null
          business_name?: string
          business_type?: Database["public"]["Enums"]["partner_type"]
          commission_rate?: number | null
          contact_person?: string | null
          created_at?: string | null
          description?: string | null
          documents_verified?: boolean | null
          id?: string
          is_active?: boolean | null
          onboarding_choice?: string | null
          onboarding_fee_paid?: boolean | null
          payment_status?: string | null
          phone?: string | null
          stripe_customer_id?: string | null
          stripe_payment_intent_id?: string | null
          stripe_setup_intent_id?: string | null
          tax_id?: string | null
          trial_expires_at?: string | null
          trial_start_date?: string | null
          trial_status?: string | null
          updated_at?: string | null
          user_id?: string
          verification_status?:
            | Database["public"]["Enums"]["verification_status"]
            | null
          website_url?: string | null
        }
        Relationships: []
      }
      partner_properties: {
        Row: {
          amenities: Json | null
          availability_calendar: Json | null
          cancellation_policy: Json | null
          check_in_time: string | null
          check_out_time: string | null
          created_at: string | null
          description: string | null
          external_id: string | null
          id: string
          location: Json
          max_booking_days: number | null
          min_booking_days: number | null
          partner_id: string
          photos: Json | null
          pricing_info: Json | null
          property_name: string
          property_type: Database["public"]["Enums"]["partner_type"]
          status: Database["public"]["Enums"]["property_status"] | null
          updated_at: string | null
        }
        Insert: {
          amenities?: Json | null
          availability_calendar?: Json | null
          cancellation_policy?: Json | null
          check_in_time?: string | null
          check_out_time?: string | null
          created_at?: string | null
          description?: string | null
          external_id?: string | null
          id?: string
          location: Json
          max_booking_days?: number | null
          min_booking_days?: number | null
          partner_id: string
          photos?: Json | null
          pricing_info?: Json | null
          property_name: string
          property_type: Database["public"]["Enums"]["partner_type"]
          status?: Database["public"]["Enums"]["property_status"] | null
          updated_at?: string | null
        }
        Update: {
          amenities?: Json | null
          availability_calendar?: Json | null
          cancellation_policy?: Json | null
          check_in_time?: string | null
          check_out_time?: string | null
          created_at?: string | null
          description?: string | null
          external_id?: string | null
          id?: string
          location?: Json
          max_booking_days?: number | null
          min_booking_days?: number | null
          partner_id?: string
          photos?: Json | null
          pricing_info?: Json | null
          property_name?: string
          property_type?: Database["public"]["Enums"]["partner_type"]
          status?: Database["public"]["Enums"]["property_status"] | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "partner_properties_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partner_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      partner_revenue: {
        Row: {
          amount: number
          booking_id: string | null
          commission_amount: number
          created_at: string | null
          id: string
          partner_id: string
          payout_batch_id: string | null
          payout_date: string | null
          payout_status: Database["public"]["Enums"]["payout_status"] | null
          transaction_type: string
        }
        Insert: {
          amount: number
          booking_id?: string | null
          commission_amount: number
          created_at?: string | null
          id?: string
          partner_id: string
          payout_batch_id?: string | null
          payout_date?: string | null
          payout_status?: Database["public"]["Enums"]["payout_status"] | null
          transaction_type: string
        }
        Update: {
          amount?: number
          booking_id?: string | null
          commission_amount?: number
          created_at?: string | null
          id?: string
          partner_id?: string
          payout_batch_id?: string | null
          payout_date?: string | null
          payout_status?: Database["public"]["Enums"]["payout_status"] | null
          transaction_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "partner_revenue_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "partner_revenue_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partner_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      partners: {
        Row: {
          api_credentials: Json | null
          commission_rate: number
          contact_info: Json
          created_at: string
          id: string
          metadata: Json | null
          partner_name: string
          partner_type: string
          payment_terms: string | null
          status: string
          updated_at: string
        }
        Insert: {
          api_credentials?: Json | null
          commission_rate?: number
          contact_info?: Json
          created_at?: string
          id?: string
          metadata?: Json | null
          partner_name: string
          partner_type: string
          payment_terms?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          api_credentials?: Json | null
          commission_rate?: number
          contact_info?: Json
          created_at?: string
          id?: string
          metadata?: Json | null
          partner_name?: string
          partner_type?: string
          payment_terms?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      passport_info: {
        Row: {
          country: string
          created_at: string | null
          document_url: string | null
          expiry_date: string | null
          id: string
          passport_number: string | null
          updated_at: string | null
          user_id: string
          verified: boolean | null
        }
        Insert: {
          country: string
          created_at?: string | null
          document_url?: string | null
          expiry_date?: string | null
          id?: string
          passport_number?: string | null
          updated_at?: string | null
          user_id: string
          verified?: boolean | null
        }
        Update: {
          country?: string
          created_at?: string | null
          document_url?: string | null
          expiry_date?: string | null
          id?: string
          passport_number?: string | null
          updated_at?: string | null
          user_id?: string
          verified?: boolean | null
        }
        Relationships: []
      }
      payment_events: {
        Row: {
          created_at: string
          event_type: string
          id: string
          payload: Json
          payment_id: string | null
          processed: boolean
          stripe_event_id: string
        }
        Insert: {
          created_at?: string
          event_type: string
          id?: string
          payload: Json
          payment_id?: string | null
          processed?: boolean
          stripe_event_id: string
        }
        Update: {
          created_at?: string
          event_type?: string
          id?: string
          payload?: Json
          payment_id?: string | null
          processed?: boolean
          stripe_event_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_events_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "payments"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_methods: {
        Row: {
          created_at: string | null
          expiry_month: number | null
          expiry_year: number | null
          id: string
          is_default: boolean | null
          last4: string | null
          provider: string
          type: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          expiry_month?: number | null
          expiry_year?: number | null
          id?: string
          is_default?: boolean | null
          last4?: string | null
          provider: string
          type?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          expiry_month?: number | null
          expiry_year?: number | null
          id?: string
          is_default?: boolean | null
          last4?: string | null
          provider?: string
          type?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      payments: {
        Row: {
          amount: number
          billing_address: Json | null
          booking_id: string
          chargeback_liability: string | null
          created_at: string | null
          currency: string | null
          failure_reason: string | null
          fraud_check_status: string | null
          id: string
          invoice_id: string | null
          payment_method_details: Json | null
          payment_method_id: string | null
          processor_fee: number | null
          refund_policy: string | null
          risk_score: number | null
          status: Database["public"]["Enums"]["payment_status"]
          stripe_payment_intent_id: string | null
          stripe_session_id: string | null
          tax_amount: number | null
          updated_at: string | null
        }
        Insert: {
          amount: number
          billing_address?: Json | null
          booking_id: string
          chargeback_liability?: string | null
          created_at?: string | null
          currency?: string | null
          failure_reason?: string | null
          fraud_check_status?: string | null
          id?: string
          invoice_id?: string | null
          payment_method_details?: Json | null
          payment_method_id?: string | null
          processor_fee?: number | null
          refund_policy?: string | null
          risk_score?: number | null
          status?: Database["public"]["Enums"]["payment_status"]
          stripe_payment_intent_id?: string | null
          stripe_session_id?: string | null
          tax_amount?: number | null
          updated_at?: string | null
        }
        Update: {
          amount?: number
          billing_address?: Json | null
          booking_id?: string
          chargeback_liability?: string | null
          created_at?: string | null
          currency?: string | null
          failure_reason?: string | null
          fraud_check_status?: string | null
          id?: string
          invoice_id?: string | null
          payment_method_details?: Json | null
          payment_method_id?: string | null
          processor_fee?: number | null
          refund_policy?: string | null
          risk_score?: number | null
          status?: Database["public"]["Enums"]["payment_status"]
          stripe_payment_intent_id?: string | null
          stripe_session_id?: string | null
          tax_amount?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      performance_metrics: {
        Row: {
          correlation_id: string | null
          created_at: string | null
          duration_ms: number
          error_message: string | null
          id: string
          metadata: Json | null
          metric_type: string
          operation: string
          success: boolean | null
          user_id: string | null
        }
        Insert: {
          correlation_id?: string | null
          created_at?: string | null
          duration_ms: number
          error_message?: string | null
          id?: string
          metadata?: Json | null
          metric_type: string
          operation: string
          success?: boolean | null
          user_id?: string | null
        }
        Update: {
          correlation_id?: string | null
          created_at?: string | null
          duration_ms?: number
          error_message?: string | null
          id?: string
          metadata?: Json | null
          metric_type?: string
          operation?: string
          success?: boolean | null
          user_id?: string | null
        }
        Relationships: []
      }
      pnr_records: {
        Row: {
          booking_id: string | null
          booking_status: string
          created_at: string | null
          expires_at: string | null
          flight_segments: Json
          id: string
          metadata: Json | null
          passenger_data: Json
          pnr_locator: string
          sabre_record_locator: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          booking_id?: string | null
          booking_status?: string
          created_at?: string | null
          expires_at?: string | null
          flight_segments?: Json
          id?: string
          metadata?: Json | null
          passenger_data?: Json
          pnr_locator: string
          sabre_record_locator?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          booking_id?: string | null
          booking_status?: string
          created_at?: string | null
          expires_at?: string | null
          flight_segments?: Json
          id?: string
          metadata?: Json | null
          passenger_data?: Json
          pnr_locator?: string
          sabre_record_locator?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pnr_records_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      poi_content: {
        Row: {
          admission_fee: Json | null
          category: string
          coordinates: Json | null
          created_at: string
          description: string | null
          destination_id: string
          id: string
          image_urls: string[] | null
          name: string
          opening_hours: Json | null
          poi_id: string
          rating: number | null
          review_count: number | null
          supplier_data: Json | null
          updated_at: string
        }
        Insert: {
          admission_fee?: Json | null
          category: string
          coordinates?: Json | null
          created_at?: string
          description?: string | null
          destination_id: string
          id?: string
          image_urls?: string[] | null
          name: string
          opening_hours?: Json | null
          poi_id: string
          rating?: number | null
          review_count?: number | null
          supplier_data?: Json | null
          updated_at?: string
        }
        Update: {
          admission_fee?: Json | null
          category?: string
          coordinates?: Json | null
          created_at?: string
          description?: string | null
          destination_id?: string
          id?: string
          image_urls?: string[] | null
          name?: string
          opening_hours?: Json | null
          poi_id?: string
          rating?: number | null
          review_count?: number | null
          supplier_data?: Json | null
          updated_at?: string
        }
        Relationships: []
      }
      points_transactions: {
        Row: {
          booking_id: string | null
          created_at: string | null
          expires_at: string | null
          id: string
          points: number
          reason: string
          transaction_type: string
          user_id: string
        }
        Insert: {
          booking_id?: string | null
          created_at?: string | null
          expires_at?: string | null
          id?: string
          points: number
          reason: string
          transaction_type: string
          user_id: string
        }
        Update: {
          booking_id?: string | null
          created_at?: string | null
          expires_at?: string | null
          id?: string
          points?: number
          reason?: string
          transaction_type?: string
          user_id?: string
        }
        Relationships: []
      }
      predictive_alerts: {
        Row: {
          affected_metrics: Json | null
          alert_type: string
          confidence_level: number | null
          created_at: string
          id: string
          is_actionable: boolean | null
          is_read: boolean | null
          message: string
          potential_impact: Json | null
          predicted_event_date: string | null
          recommended_actions: Json | null
          resolved_at: string | null
          resolved_by: string | null
          severity: string
          title: string
          updated_at: string
        }
        Insert: {
          affected_metrics?: Json | null
          alert_type: string
          confidence_level?: number | null
          created_at?: string
          id?: string
          is_actionable?: boolean | null
          is_read?: boolean | null
          message: string
          potential_impact?: Json | null
          predicted_event_date?: string | null
          recommended_actions?: Json | null
          resolved_at?: string | null
          resolved_by?: string | null
          severity?: string
          title: string
          updated_at?: string
        }
        Update: {
          affected_metrics?: Json | null
          alert_type?: string
          confidence_level?: number | null
          created_at?: string
          id?: string
          is_actionable?: boolean | null
          is_read?: boolean | null
          message?: string
          potential_impact?: Json | null
          predicted_event_date?: string | null
          recommended_actions?: Json | null
          resolved_at?: string | null
          resolved_by?: string | null
          severity?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      price_adjustments: {
        Row: {
          adjustment_type: string
          completed_at: string | null
          created_at: string
          id: string
          new_booking_id: string | null
          new_price: number
          original_booking_id: string | null
          original_price: number
          processed_by: string | null
          reason: string | null
          savings_amount: number | null
          status: string | null
          user_id: string
        }
        Insert: {
          adjustment_type: string
          completed_at?: string | null
          created_at?: string
          id?: string
          new_booking_id?: string | null
          new_price: number
          original_booking_id?: string | null
          original_price: number
          processed_by?: string | null
          reason?: string | null
          savings_amount?: number | null
          status?: string | null
          user_id: string
        }
        Update: {
          adjustment_type?: string
          completed_at?: string | null
          created_at?: string
          id?: string
          new_booking_id?: string | null
          new_price?: number
          original_booking_id?: string | null
          original_price?: number
          processed_by?: string | null
          reason?: string | null
          savings_amount?: number | null
          status?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "price_adjustments_new_booking_id_fkey"
            columns: ["new_booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "price_adjustments_original_booking_id_fkey"
            columns: ["original_booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      price_alerts: {
        Row: {
          created_at: string
          current_price: number
          id: string
          is_active: boolean
          last_checked: string | null
          last_triggered: string | null
          notification_method: string
          search_criteria: Json
          target_price: number
          threshold_percentage: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          current_price: number
          id?: string
          is_active?: boolean
          last_checked?: string | null
          last_triggered?: string | null
          notification_method?: string
          search_criteria: Json
          target_price: number
          threshold_percentage?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          current_price?: number
          id?: string
          is_active?: boolean
          last_checked?: string | null
          last_triggered?: string | null
          notification_method?: string
          search_criteria?: Json
          target_price?: number
          threshold_percentage?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      price_monitors: {
        Row: {
          booking_reference: string | null
          created_at: string
          current_price: number | null
          expires_at: string | null
          id: string
          last_checked: string | null
          monitor_type: string
          original_price: number
          search_criteria: Json
          status: string | null
          threshold_percentage: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          booking_reference?: string | null
          created_at?: string
          current_price?: number | null
          expires_at?: string | null
          id?: string
          last_checked?: string | null
          monitor_type: string
          original_price: number
          search_criteria: Json
          status?: string | null
          threshold_percentage?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          booking_reference?: string | null
          created_at?: string
          current_price?: number | null
          expires_at?: string | null
          id?: string
          last_checked?: string | null
          monitor_type?: string
          original_price?: number
          search_criteria?: Json
          status?: string | null
          threshold_percentage?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      pricing_optimization: {
        Row: {
          competitor_pricing: Json | null
          created_at: string
          currency: string
          current_price: number
          demand_sensitivity: number | null
          destination_code: string
          expected_conversion_lift: number | null
          id: string
          implementation_date: string | null
          optimization_factors: Json | null
          price_elasticity: number | null
          product_type: string
          recommended_price: number
          revenue_impact_estimate: number | null
          status: string | null
          updated_at: string
        }
        Insert: {
          competitor_pricing?: Json | null
          created_at?: string
          currency?: string
          current_price: number
          demand_sensitivity?: number | null
          destination_code: string
          expected_conversion_lift?: number | null
          id?: string
          implementation_date?: string | null
          optimization_factors?: Json | null
          price_elasticity?: number | null
          product_type: string
          recommended_price: number
          revenue_impact_estimate?: number | null
          status?: string | null
          updated_at?: string
        }
        Update: {
          competitor_pricing?: Json | null
          created_at?: string
          currency?: string
          current_price?: number
          demand_sensitivity?: number | null
          destination_code?: string
          expected_conversion_lift?: number | null
          id?: string
          implementation_date?: string | null
          optimization_factors?: Json | null
          price_elasticity?: number | null
          product_type?: string
          recommended_price?: number
          revenue_impact_estimate?: number | null
          status?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          country_code: string | null
          created_at: string | null
          currency: string | null
          email: string | null
          first_name: string | null
          full_name: string | null
          id: string
          last_name: string | null
          phone: string | null
          points: number | null
          total_distance: number | null
          trips_booked: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          country_code?: string | null
          created_at?: string | null
          currency?: string | null
          email?: string | null
          first_name?: string | null
          full_name?: string | null
          id?: string
          last_name?: string | null
          phone?: string | null
          points?: number | null
          total_distance?: number | null
          trips_booked?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          country_code?: string | null
          created_at?: string | null
          currency?: string | null
          email?: string | null
          first_name?: string | null
          full_name?: string | null
          id?: string
          last_name?: string | null
          phone?: string | null
          points?: number | null
          total_distance?: number | null
          trips_booked?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      property_availability: {
        Row: {
          available_units: number
          base_price: number | null
          created_at: string | null
          date: string
          id: string
          is_blocked: boolean | null
          minimum_stay: number | null
          property_id: string
          special_price: number | null
          updated_at: string | null
        }
        Insert: {
          available_units?: number
          base_price?: number | null
          created_at?: string | null
          date: string
          id?: string
          is_blocked?: boolean | null
          minimum_stay?: number | null
          property_id: string
          special_price?: number | null
          updated_at?: string | null
        }
        Update: {
          available_units?: number
          base_price?: number | null
          created_at?: string | null
          date?: string
          id?: string
          is_blocked?: boolean | null
          minimum_stay?: number | null
          property_id?: string
          special_price?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "property_availability_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "partner_properties"
            referencedColumns: ["id"]
          },
        ]
      }
      provider_configs: {
        Row: {
          base_url: string | null
          circuit_breaker: Json
          circuit_breaker_state: string | null
          created_at: string
          enabled: boolean
          health_score: number
          id: string
          name: string
          priority: number
          response_time: number
          type: string
          updated_at: string
        }
        Insert: {
          base_url?: string | null
          circuit_breaker?: Json
          circuit_breaker_state?: string | null
          created_at?: string
          enabled?: boolean
          health_score?: number
          id: string
          name: string
          priority?: number
          response_time?: number
          type: string
          updated_at?: string
        }
        Update: {
          base_url?: string | null
          circuit_breaker?: Json
          circuit_breaker_state?: string | null
          created_at?: string
          enabled?: boolean
          health_score?: number
          id?: string
          name?: string
          priority?: number
          response_time?: number
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      provider_health: {
        Row: {
          circuit_breaker_opened_at: string | null
          created_at: string
          error_count: number | null
          error_message: string | null
          failure_count: number | null
          id: string
          last_checked: string
          last_reset_at: string | null
          metadata: Json | null
          provider: string
          response_time_ms: number | null
          status: string
        }
        Insert: {
          circuit_breaker_opened_at?: string | null
          created_at?: string
          error_count?: number | null
          error_message?: string | null
          failure_count?: number | null
          id?: string
          last_checked?: string
          last_reset_at?: string | null
          metadata?: Json | null
          provider: string
          response_time_ms?: number | null
          status: string
        }
        Update: {
          circuit_breaker_opened_at?: string | null
          created_at?: string
          error_count?: number | null
          error_message?: string | null
          failure_count?: number | null
          id?: string
          last_checked?: string
          last_reset_at?: string | null
          metadata?: Json | null
          provider?: string
          response_time_ms?: number | null
          status?: string
        }
        Relationships: []
      }
      provider_health_logs: {
        Row: {
          endpoint: string
          error_message: string | null
          id: string
          provider_id: string
          response_time_ms: number | null
          status_code: number | null
          test_type: string | null
          tested_at: string | null
        }
        Insert: {
          endpoint: string
          error_message?: string | null
          id?: string
          provider_id: string
          response_time_ms?: number | null
          status_code?: number | null
          test_type?: string | null
          tested_at?: string | null
        }
        Update: {
          endpoint?: string
          error_message?: string | null
          id?: string
          provider_id?: string
          response_time_ms?: number | null
          status_code?: number | null
          test_type?: string | null
          tested_at?: string | null
        }
        Relationships: []
      }
      provider_metrics: {
        Row: {
          created_at: string
          error_message: string | null
          id: string
          provider_id: string
          response_time: number
          success: boolean
          timestamp: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          id?: string
          provider_id: string
          response_time: number
          success: boolean
          timestamp?: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          id?: string
          provider_id?: string
          response_time?: number
          success?: boolean
          timestamp?: string
        }
        Relationships: []
      }
      provider_quotas: {
        Row: {
          created_at: string
          error_type: string | null
          id: string
          is_actual_quota_limit: boolean | null
          last_checked: string
          percentage_used: number
          provider_id: string
          provider_name: string
          quota_limit: number
          quota_used: number
          reset_time: string | null
          service_type: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          error_type?: string | null
          id?: string
          is_actual_quota_limit?: boolean | null
          last_checked?: string
          percentage_used?: number
          provider_id: string
          provider_name: string
          quota_limit?: number
          quota_used?: number
          reset_time?: string | null
          service_type: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          error_type?: string | null
          id?: string
          is_actual_quota_limit?: boolean | null
          last_checked?: string
          percentage_used?: number
          provider_id?: string
          provider_name?: string
          quota_limit?: number
          quota_used?: number
          reset_time?: string | null
          service_type?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      revenue_projections: {
        Row: {
          actual_revenue: number | null
          confidence_level: number | null
          created_at: string
          currency: string
          id: string
          lower_bound: number
          model_factors: Json | null
          projected_revenue: number
          projection_date: string
          projection_period: string
          revenue_category: string
          scenario_type: string | null
          updated_at: string
          upper_bound: number
          variance_percentage: number | null
        }
        Insert: {
          actual_revenue?: number | null
          confidence_level?: number | null
          created_at?: string
          currency?: string
          id?: string
          lower_bound: number
          model_factors?: Json | null
          projected_revenue: number
          projection_date: string
          projection_period: string
          revenue_category: string
          scenario_type?: string | null
          updated_at?: string
          upper_bound: number
          variance_percentage?: number | null
        }
        Update: {
          actual_revenue?: number | null
          confidence_level?: number | null
          created_at?: string
          currency?: string
          id?: string
          lower_bound?: number
          model_factors?: Json | null
          projected_revenue?: number
          projection_date?: string
          projection_period?: string
          revenue_category?: string
          scenario_type?: string | null
          updated_at?: string
          upper_bound?: number
          variance_percentage?: number | null
        }
        Relationships: []
      }
      reviews: {
        Row: {
          booking_id: string | null
          content: string | null
          created_at: string | null
          id: string
          is_verified: boolean | null
          rating: number
          title: string | null
          user_id: string
        }
        Insert: {
          booking_id?: string | null
          content?: string | null
          created_at?: string | null
          id?: string
          is_verified?: boolean | null
          rating: number
          title?: string | null
          user_id: string
        }
        Update: {
          booking_id?: string | null
          content?: string | null
          created_at?: string | null
          id?: string
          is_verified?: boolean | null
          rating?: number
          title?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reviews_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      risk_assessments: {
        Row: {
          created_at: string
          current_controls: Json | null
          id: string
          impact_score: number
          mitigation_timeline: string | null
          probability: number
          recommended_actions: Json | null
          review_date: string | null
          risk_category: string
          risk_description: string
          risk_level: string
          risk_owner: string | null
          risk_title: string
          status: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          current_controls?: Json | null
          id?: string
          impact_score: number
          mitigation_timeline?: string | null
          probability: number
          recommended_actions?: Json | null
          review_date?: string | null
          risk_category: string
          risk_description: string
          risk_level: string
          risk_owner?: string | null
          risk_title: string
          status?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          current_controls?: Json | null
          id?: string
          impact_score?: number
          mitigation_timeline?: string | null
          probability?: number
          recommended_actions?: Json | null
          review_date?: string | null
          risk_category?: string
          risk_description?: string
          risk_level?: string
          risk_owner?: string | null
          risk_title?: string
          status?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      saved_favorites: {
        Row: {
          created_at: string | null
          id: string
          item_data: Json | null
          item_id: string
          item_type: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          item_data?: Json | null
          item_id: string
          item_type?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          item_data?: Json | null
          item_id?: string
          item_type?: string | null
          user_id?: string
        }
        Relationships: []
      }
      search_audit: {
        Row: {
          created_at: string | null
          id: string
          ip_address: unknown | null
          params: Json
          product: string
          result_count: number | null
          session_id: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          ip_address?: unknown | null
          params: Json
          product: string
          result_count?: number | null
          session_id?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          ip_address?: unknown | null
          params?: Json
          product?: string
          result_count?: number | null
          session_id?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      seat_assignments: {
        Row: {
          cabin_class: string | null
          created_at: string | null
          currency: string | null
          fee_amount: number | null
          flight_segment_id: string
          id: string
          passenger_id: string
          pnr_id: string | null
          seat_number: string
          seat_type: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          cabin_class?: string | null
          created_at?: string | null
          currency?: string | null
          fee_amount?: number | null
          flight_segment_id: string
          id?: string
          passenger_id: string
          pnr_id?: string | null
          seat_number: string
          seat_type?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          cabin_class?: string | null
          created_at?: string | null
          currency?: string | null
          fee_amount?: number | null
          flight_segment_id?: string
          id?: string
          passenger_id?: string
          pnr_id?: string | null
          seat_number?: string
          seat_type?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "seat_assignments_pnr_id_fkey"
            columns: ["pnr_id"]
            isOneToOne: false
            referencedRelation: "pnr_records"
            referencedColumns: ["id"]
          },
        ]
      }
      security_configurations: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          setting_name: string
          setting_value: Json
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          setting_name: string
          setting_value: Json
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          setting_name?: string
          setting_value?: Json
          updated_at?: string | null
        }
        Relationships: []
      }
      security_events: {
        Row: {
          created_at: string | null
          details: Json | null
          event_type: string
          id: string
          ip_address: unknown | null
          severity: string
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          details?: Json | null
          event_type: string
          id?: string
          ip_address?: unknown | null
          severity?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          details?: Json | null
          event_type?: string
          id?: string
          ip_address?: unknown | null
          severity?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      session_analytics: {
        Row: {
          created_at: string | null
          currency: string | null
          first_activity: string | null
          funnel_progress: number | null
          id: string
          last_activity: string | null
          session_id: string
          total_events: number | null
          total_value: number | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          currency?: string | null
          first_activity?: string | null
          funnel_progress?: number | null
          id?: string
          last_activity?: string | null
          session_id: string
          total_events?: number | null
          total_value?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          currency?: string | null
          first_activity?: string | null
          funnel_progress?: number | null
          id?: string
          last_activity?: string | null
          session_id?: string
          total_events?: number | null
          total_value?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      supplier_contracts: {
        Row: {
          auto_renewal: boolean | null
          commission_structure: Json
          contract_documents: Json | null
          contract_number: string
          contract_type: string
          created_at: string
          end_date: string | null
          id: string
          partner_id: string
          payment_schedule: string | null
          signed_by: string | null
          start_date: string
          status: string
          terms_and_conditions: Json
          updated_at: string
        }
        Insert: {
          auto_renewal?: boolean | null
          commission_structure?: Json
          contract_documents?: Json | null
          contract_number: string
          contract_type: string
          created_at?: string
          end_date?: string | null
          id?: string
          partner_id: string
          payment_schedule?: string | null
          signed_by?: string | null
          start_date: string
          status?: string
          terms_and_conditions?: Json
          updated_at?: string
        }
        Update: {
          auto_renewal?: boolean | null
          commission_structure?: Json
          contract_documents?: Json | null
          contract_number?: string
          contract_type?: string
          created_at?: string
          end_date?: string | null
          id?: string
          partner_id?: string
          payment_schedule?: string | null
          signed_by?: string | null
          start_date?: string
          status?: string
          terms_and_conditions?: Json
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "supplier_contracts_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
        ]
      }
      supplier_negotiations: {
        Row: {
          agent_id: string
          created_at: string
          final_terms: Json | null
          id: string
          negotiated_price: number | null
          negotiation_rounds: number
          negotiation_strategy: Json
          negotiation_type: string
          original_price: number
          product_type: string
          status: string
          supplier_id: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          agent_id: string
          created_at?: string
          final_terms?: Json | null
          id?: string
          negotiated_price?: number | null
          negotiation_rounds?: number
          negotiation_strategy?: Json
          negotiation_type: string
          original_price: number
          product_type: string
          status?: string
          supplier_id: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          agent_id?: string
          created_at?: string
          final_terms?: Json | null
          id?: string
          negotiated_price?: number | null
          negotiation_rounds?: number
          negotiation_strategy?: Json
          negotiation_type?: string
          original_price?: number
          product_type?: string
          status?: string
          supplier_id?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      supplier_rates: {
        Row: {
          base_rate: number
          booking_conditions: Json | null
          created_at: string
          currency: string
          id: string
          markup_percentage: number | null
          partner_id: string
          service_type: string
          updated_at: string
          valid_from: string
          valid_to: string | null
        }
        Insert: {
          base_rate: number
          booking_conditions?: Json | null
          created_at?: string
          currency?: string
          id?: string
          markup_percentage?: number | null
          partner_id: string
          service_type: string
          updated_at?: string
          valid_from: string
          valid_to?: string | null
        }
        Update: {
          base_rate?: number
          booking_conditions?: Json | null
          created_at?: string
          currency?: string
          id?: string
          markup_percentage?: number | null
          partner_id?: string
          service_type?: string
          updated_at?: string
          valid_from?: string
          valid_to?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "supplier_rates_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
        ]
      }
      support_messages: {
        Row: {
          attachments: Json
          content: string
          created_at: string
          id: string
          is_internal: boolean
          message_type: string
          sender_id: string | null
          sender_type: string
          ticket_id: string
        }
        Insert: {
          attachments?: Json
          content: string
          created_at?: string
          id?: string
          is_internal?: boolean
          message_type?: string
          sender_id?: string | null
          sender_type?: string
          ticket_id: string
        }
        Update: {
          attachments?: Json
          content?: string
          created_at?: string
          id?: string
          is_internal?: boolean
          message_type?: string
          sender_id?: string | null
          sender_type?: string
          ticket_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "support_messages_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "support_tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      support_tickets: {
        Row: {
          assigned_agent: string | null
          category: string
          created_at: string
          customer_satisfaction: number | null
          description: string
          escalation_level: number
          id: string
          metadata: Json
          priority: string
          resolution_notes: string | null
          resolved_at: string | null
          status: string
          subject: string
          ticket_number: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          assigned_agent?: string | null
          category?: string
          created_at?: string
          customer_satisfaction?: number | null
          description: string
          escalation_level?: number
          id?: string
          metadata?: Json
          priority?: string
          resolution_notes?: string | null
          resolved_at?: string | null
          status?: string
          subject: string
          ticket_number: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          assigned_agent?: string | null
          category?: string
          created_at?: string
          customer_satisfaction?: number | null
          description?: string
          escalation_level?: number
          id?: string
          metadata?: Json
          priority?: string
          resolution_notes?: string | null
          resolved_at?: string | null
          status?: string
          subject?: string
          ticket_number?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      sustainability_metrics: {
        Row: {
          accommodation_emissions: number | null
          activity_emissions: number | null
          booking_id: string | null
          calculation_method: string
          carbon_footprint_kg: number | null
          created_at: string
          eco_alternatives: Json | null
          id: string
          offset_recommendations: Json | null
          sustainability_score: number | null
          transportation_emissions: number | null
          user_id: string | null
        }
        Insert: {
          accommodation_emissions?: number | null
          activity_emissions?: number | null
          booking_id?: string | null
          calculation_method?: string
          carbon_footprint_kg?: number | null
          created_at?: string
          eco_alternatives?: Json | null
          id?: string
          offset_recommendations?: Json | null
          sustainability_score?: number | null
          transportation_emissions?: number | null
          user_id?: string | null
        }
        Update: {
          accommodation_emissions?: number | null
          activity_emissions?: number | null
          booking_id?: string | null
          calculation_method?: string
          carbon_footprint_kg?: number | null
          created_at?: string
          eco_alternatives?: Json | null
          id?: string
          offset_recommendations?: Json | null
          sustainability_score?: number | null
          transportation_emissions?: number | null
          user_id?: string | null
        }
        Relationships: []
      }
      system_health_snapshots: {
        Row: {
          circuit_breakers_open: string[] | null
          created_at: string
          critical_quota_providers: string[] | null
          degraded_providers: number
          healthy_providers: number
          id: string
          outage_providers: number
          overall_status: string
          recommendations: string[] | null
          timestamp: string
          total_providers: number
        }
        Insert: {
          circuit_breakers_open?: string[] | null
          created_at?: string
          critical_quota_providers?: string[] | null
          degraded_providers?: number
          healthy_providers?: number
          id?: string
          outage_providers?: number
          overall_status: string
          recommendations?: string[] | null
          timestamp?: string
          total_providers?: number
        }
        Update: {
          circuit_breakers_open?: string[] | null
          created_at?: string
          critical_quota_providers?: string[] | null
          degraded_providers?: number
          healthy_providers?: number
          id?: string
          outage_providers?: number
          overall_status?: string
          recommendations?: string[] | null
          timestamp?: string
          total_providers?: number
        }
        Relationships: []
      }
      system_logs: {
        Row: {
          correlation_id: string | null
          created_at: string | null
          duration_ms: number | null
          error_details: Json | null
          id: string
          level: string | null
          log_level: string
          message: string
          metadata: Json | null
          request_id: string | null
          service_name: string
          status_code: number | null
          user_id: string | null
        }
        Insert: {
          correlation_id?: string | null
          created_at?: string | null
          duration_ms?: number | null
          error_details?: Json | null
          id?: string
          level?: string | null
          log_level?: string
          message: string
          metadata?: Json | null
          request_id?: string | null
          service_name: string
          status_code?: number | null
          user_id?: string | null
        }
        Update: {
          correlation_id?: string | null
          created_at?: string | null
          duration_ms?: number | null
          error_details?: Json | null
          id?: string
          level?: string | null
          log_level?: string
          message?: string
          metadata?: Json | null
          request_id?: string | null
          service_name?: string
          status_code?: number | null
          user_id?: string | null
        }
        Relationships: []
      }
      system_validation_tests: {
        Row: {
          created_at: string | null
          execution_time_ms: number | null
          id: string
          last_run_at: string | null
          last_run_by: string | null
          test_category: string
          test_description: string | null
          test_name: string
          test_result: Json | null
          test_status: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          execution_time_ms?: number | null
          id?: string
          last_run_at?: string | null
          last_run_by?: string | null
          test_category: string
          test_description?: string | null
          test_name: string
          test_result?: Json | null
          test_status?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          execution_time_ms?: number | null
          id?: string
          last_run_at?: string | null
          last_run_by?: string | null
          test_category?: string
          test_description?: string | null
          test_name?: string
          test_result?: Json | null
          test_status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      test_results: {
        Row: {
          created_at: string | null
          environment: string | null
          error_message: string | null
          execution_time_ms: number | null
          id: string
          status: string
          test_category: string
          test_data: Json | null
          test_name: string
        }
        Insert: {
          created_at?: string | null
          environment?: string | null
          error_message?: string | null
          execution_time_ms?: number | null
          id?: string
          status: string
          test_category: string
          test_data?: Json | null
          test_name: string
        }
        Update: {
          created_at?: string | null
          environment?: string | null
          error_message?: string | null
          execution_time_ms?: number | null
          id?: string
          status?: string
          test_category?: string
          test_data?: Json | null
          test_name?: string
        }
        Relationships: []
      }
      training_tasks: {
        Row: {
          completion_criteria: Json
          content_url: string | null
          created_at: string
          created_by: string | null
          description: string | null
          estimated_duration_minutes: number | null
          id: string
          is_mandatory: boolean
          required_for_roles: string[]
          task_name: string
          task_type: string
          updated_at: string
        }
        Insert: {
          completion_criteria?: Json
          content_url?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          estimated_duration_minutes?: number | null
          id?: string
          is_mandatory?: boolean
          required_for_roles?: string[]
          task_name: string
          task_type?: string
          updated_at?: string
        }
        Update: {
          completion_criteria?: Json
          content_url?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          estimated_duration_minutes?: number | null
          id?: string
          is_mandatory?: boolean
          required_for_roles?: string[]
          task_name?: string
          task_type?: string
          updated_at?: string
        }
        Relationships: []
      }
      transfers_offers_cache: {
        Row: {
          created_at: string | null
          destination: Json
          id: string
          luggage: Json | null
          offers: Json
          origin: Json
          passengers: number | null
          pickup_at: string
          search_key: string
          ttl_expires_at: string | null
        }
        Insert: {
          created_at?: string | null
          destination: Json
          id?: string
          luggage?: Json | null
          offers: Json
          origin: Json
          passengers?: number | null
          pickup_at: string
          search_key: string
          ttl_expires_at?: string | null
        }
        Update: {
          created_at?: string | null
          destination?: Json
          id?: string
          luggage?: Json | null
          offers?: Json
          origin?: Json
          passengers?: number | null
          pickup_at?: string
          search_key?: string
          ttl_expires_at?: string | null
        }
        Relationships: []
      }
      transfers_orders: {
        Row: {
          amadeus_transfer_order_id: string | null
          created_at: string | null
          currency: string | null
          id: string
          meta: Json | null
          offer_json: Json
          passengers: Json | null
          pickup_at: string
          profile_id: string | null
          status: string | null
          total_price: number | null
          updated_at: string | null
        }
        Insert: {
          amadeus_transfer_order_id?: string | null
          created_at?: string | null
          currency?: string | null
          id?: string
          meta?: Json | null
          offer_json: Json
          passengers?: Json | null
          pickup_at: string
          profile_id?: string | null
          status?: string | null
          total_price?: number | null
          updated_at?: string | null
        }
        Update: {
          amadeus_transfer_order_id?: string | null
          created_at?: string | null
          currency?: string | null
          id?: string
          meta?: Json | null
          offer_json?: Json
          passengers?: Json | null
          pickup_at?: string
          profile_id?: string | null
          status?: string | null
          total_price?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "transfers_orders_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      translation_cache: {
        Row: {
          cache_key: string
          created_at: string
          id: string
          last_used_at: string
          provider: string
          source_language: string
          source_text: string
          target_language: string
          translated_text: string
          translation_quality_score: number | null
          usage_count: number
        }
        Insert: {
          cache_key: string
          created_at?: string
          id?: string
          last_used_at?: string
          provider?: string
          source_language: string
          source_text: string
          target_language: string
          translated_text: string
          translation_quality_score?: number | null
          usage_count?: number
        }
        Update: {
          cache_key?: string
          created_at?: string
          id?: string
          last_used_at?: string
          provider?: string
          source_language?: string
          source_text?: string
          target_language?: string
          translated_text?: string
          translation_quality_score?: number | null
          usage_count?: number
        }
        Relationships: []
      }
      travel_alerts: {
        Row: {
          acknowledged: boolean | null
          acknowledged_at: string | null
          alert_type: string
          created_at: string | null
          expires_at: string | null
          flight_segment_id: string | null
          id: string
          message: string
          metadata: Json | null
          original_data: Json | null
          pnr_id: string | null
          severity: string | null
          title: string
          updated_data: Json | null
          user_id: string | null
        }
        Insert: {
          acknowledged?: boolean | null
          acknowledged_at?: string | null
          alert_type: string
          created_at?: string | null
          expires_at?: string | null
          flight_segment_id?: string | null
          id?: string
          message: string
          metadata?: Json | null
          original_data?: Json | null
          pnr_id?: string | null
          severity?: string | null
          title: string
          updated_data?: Json | null
          user_id?: string | null
        }
        Update: {
          acknowledged?: boolean | null
          acknowledged_at?: string | null
          alert_type?: string
          created_at?: string | null
          expires_at?: string | null
          flight_segment_id?: string | null
          id?: string
          message?: string
          metadata?: Json | null
          original_data?: Json | null
          pnr_id?: string | null
          severity?: string | null
          title?: string
          updated_data?: Json | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "travel_alerts_pnr_id_fkey"
            columns: ["pnr_id"]
            isOneToOne: false
            referencedRelation: "pnr_records"
            referencedColumns: ["id"]
          },
        ]
      }
      travel_analytics: {
        Row: {
          carbon_footprint: number | null
          countries_visited: string[] | null
          created_at: string | null
          favorite_destinations: string[] | null
          id: string
          preferred_trip_length: number | null
          total_spent: number | null
          total_trips: number | null
          travel_months: number[] | null
          updated_at: string | null
          user_id: string
          year: number
        }
        Insert: {
          carbon_footprint?: number | null
          countries_visited?: string[] | null
          created_at?: string | null
          favorite_destinations?: string[] | null
          id?: string
          preferred_trip_length?: number | null
          total_spent?: number | null
          total_trips?: number | null
          travel_months?: number[] | null
          updated_at?: string | null
          user_id: string
          year: number
        }
        Update: {
          carbon_footprint?: number | null
          countries_visited?: string[] | null
          created_at?: string | null
          favorite_destinations?: string[] | null
          id?: string
          preferred_trip_length?: number | null
          total_spent?: number | null
          total_trips?: number | null
          travel_months?: number[] | null
          updated_at?: string | null
          user_id?: string
          year?: number
        }
        Relationships: []
      }
      travel_journal: {
        Row: {
          budget_range: string | null
          created_at: string | null
          description: string | null
          destination: string
          end_date: string | null
          highlights: string[] | null
          id: string
          is_public: boolean | null
          photos: Json | null
          start_date: string | null
          tags: string[] | null
          travel_companions: number | null
          trip_title: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          budget_range?: string | null
          created_at?: string | null
          description?: string | null
          destination: string
          end_date?: string | null
          highlights?: string[] | null
          id?: string
          is_public?: boolean | null
          photos?: Json | null
          start_date?: string | null
          tags?: string[] | null
          travel_companions?: number | null
          trip_title: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          budget_range?: string | null
          created_at?: string | null
          description?: string | null
          destination?: string
          end_date?: string | null
          highlights?: string[] | null
          id?: string
          is_public?: boolean | null
          photos?: Json | null
          start_date?: string | null
          tags?: string[] | null
          travel_companions?: number | null
          trip_title?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      trips: {
        Row: {
          activities_count: number | null
          budget: number | null
          created_at: string
          destination: string
          end_date: string
          id: string
          photos: Json | null
          rating: number | null
          spent: number | null
          start_date: string
          status: string
          trip_type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          activities_count?: number | null
          budget?: number | null
          created_at?: string
          destination: string
          end_date: string
          id?: string
          photos?: Json | null
          rating?: number | null
          spent?: number | null
          start_date: string
          status: string
          trip_type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          activities_count?: number | null
          budget?: number | null
          created_at?: string
          destination?: string
          end_date?: string
          id?: string
          photos?: Json | null
          rating?: number | null
          spent?: number | null
          start_date?: string
          status?: string
          trip_type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_activity_logs: {
        Row: {
          activity_type: string
          created_at: string | null
          id: string
          item_data: Json | null
          item_id: string | null
          item_type: string | null
          location: string | null
          session_id: string | null
          user_id: string | null
        }
        Insert: {
          activity_type: string
          created_at?: string | null
          id?: string
          item_data?: Json | null
          item_id?: string | null
          item_type?: string | null
          location?: string | null
          session_id?: string | null
          user_id?: string | null
        }
        Update: {
          activity_type?: string
          created_at?: string | null
          id?: string
          item_data?: Json | null
          item_id?: string | null
          item_type?: string | null
          location?: string | null
          session_id?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      user_documents: {
        Row: {
          created_at: string
          description: string | null
          document_number: string | null
          document_type: string
          expiry_date: string | null
          file_path: string | null
          file_size: number | null
          id: string
          issue_date: string | null
          issuing_authority: string | null
          metadata: Json | null
          mime_type: string | null
          status: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          document_number?: string | null
          document_type: string
          expiry_date?: string | null
          file_path?: string | null
          file_size?: number | null
          id?: string
          issue_date?: string | null
          issuing_authority?: string | null
          metadata?: Json | null
          mime_type?: string | null
          status?: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          document_number?: string | null
          document_type?: string
          expiry_date?: string | null
          file_path?: string | null
          file_size?: number | null
          id?: string
          issue_date?: string | null
          issuing_authority?: string | null
          metadata?: Json | null
          mime_type?: string | null
          status?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_dream_bookmarks: {
        Row: {
          created_at: string
          destination_id: string
          id: string
          notes: string | null
          priority: number | null
          user_id: string
        }
        Insert: {
          created_at?: string
          destination_id: string
          id?: string
          notes?: string | null
          priority?: number | null
          user_id: string
        }
        Update: {
          created_at?: string
          destination_id?: string
          id?: string
          notes?: string | null
          priority?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_dream_bookmarks_destination_id_fkey"
            columns: ["destination_id"]
            isOneToOne: false
            referencedRelation: "dream_destinations"
            referencedColumns: ["id"]
          },
        ]
      }
      user_preferences: {
        Row: {
          created_at: string | null
          currency: string | null
          id: string
          language: string | null
          meal_preferences: string[] | null
          preferred_airlines: string[] | null
          profile_id: string
          room_type: string | null
          seat_class: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          currency?: string | null
          id?: string
          language?: string | null
          meal_preferences?: string[] | null
          preferred_airlines?: string[] | null
          profile_id: string
          room_type?: string | null
          seat_class?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          currency?: string | null
          id?: string
          language?: string | null
          meal_preferences?: string[] | null
          preferred_airlines?: string[] | null
          profile_id?: string
          room_type?: string | null
          seat_class?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_preferences_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string | null
          expires_at: string | null
          granted_at: string | null
          granted_by: string | null
          id: string
          is_active: boolean | null
          role: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          expires_at?: string | null
          granted_at?: string | null
          granted_by?: string | null
          id?: string
          is_active?: boolean | null
          role: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          expires_at?: string | null
          granted_at?: string | null
          granted_by?: string | null
          id?: string
          is_active?: boolean | null
          role?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_training_completion: {
        Row: {
          completed_at: string | null
          completion_evidence: Json | null
          created_at: string
          id: string
          score: number | null
          started_at: string | null
          status: string
          training_task_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          completion_evidence?: Json | null
          created_at?: string
          id?: string
          score?: number | null
          started_at?: string | null
          status?: string
          training_task_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          completion_evidence?: Json | null
          created_at?: string
          id?: string
          score?: number | null
          started_at?: string | null
          status?: string
          training_task_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_training_completion_training_task_id_fkey"
            columns: ["training_task_id"]
            isOneToOne: false
            referencedRelation: "training_tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      visa_documents: {
        Row: {
          country: string
          created_at: string | null
          doc_type: string
          document_url: string | null
          expiry_date: string | null
          id: string
          status: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          country: string
          created_at?: string | null
          doc_type: string
          document_url?: string | null
          expiry_date?: string | null
          id?: string
          status?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          country?: string
          created_at?: string | null
          doc_type?: string
          document_url?: string | null
          expiry_date?: string | null
          id?: string
          status?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      voice_interface_sessions: {
        Row: {
          audio_duration_seconds: number | null
          conversation_transcript: Json
          created_at: string
          id: string
          language_code: string
          recognition_accuracy: number | null
          session_id: string
          status: string
          updated_at: string
          user_id: string | null
          voice_preferences: Json
        }
        Insert: {
          audio_duration_seconds?: number | null
          conversation_transcript?: Json
          created_at?: string
          id?: string
          language_code?: string
          recognition_accuracy?: number | null
          session_id: string
          status?: string
          updated_at?: string
          user_id?: string | null
          voice_preferences?: Json
        }
        Update: {
          audio_duration_seconds?: number | null
          conversation_transcript?: Json
          created_at?: string
          id?: string
          language_code?: string
          recognition_accuracy?: number | null
          session_id?: string
          status?: string
          updated_at?: string
          user_id?: string | null
          voice_preferences?: Json
        }
        Relationships: []
      }
      webhook_events: {
        Row: {
          created_at: string
          event_type: string
          id: string
          processed_at: string
          stripe_event_id: string
        }
        Insert: {
          created_at?: string
          event_type: string
          id?: string
          processed_at?: string
          stripe_event_id: string
        }
        Update: {
          created_at?: string
          event_type?: string
          id?: string
          processed_at?: string
          stripe_event_id?: string
        }
        Relationships: []
      }
      webhook_idempotency: {
        Row: {
          created_at: string
          id: string
          idempotency_key: string
          processed_at: string
          response_data: Json | null
          webhook_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          idempotency_key: string
          processed_at?: string
          response_data?: Json | null
          webhook_id: string
        }
        Update: {
          created_at?: string
          id?: string
          idempotency_key?: string
          processed_at?: string
          response_data?: Json | null
          webhook_id?: string
        }
        Relationships: []
      }
      workflow_sessions: {
        Row: {
          completed_at: string | null
          created_at: string
          current_step: number
          customer_satisfaction: number | null
          escalation_level: number
          id: string
          session_data: Json
          status: string
          step_history: Json
          updated_at: string
          user_id: string | null
          workflow_type: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          current_step?: number
          customer_satisfaction?: number | null
          escalation_level?: number
          id?: string
          session_data?: Json
          status?: string
          step_history?: Json
          updated_at?: string
          user_id?: string | null
          workflow_type: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          current_step?: number
          customer_satisfaction?: number | null
          escalation_level?: number
          id?: string
          session_data?: Json
          status?: string
          step_history?: Json
          updated_at?: string
          user_id?: string | null
          workflow_type?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      anonymize_booking_for_ai: {
        Args: { _booking_id: string }
        Returns: undefined
      }
      auto_anonymize_old_guest_bookings: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      calculate_days_until_trip: {
        Args: { start_date: string }
        Returns: number
      }
      calculate_fraud_risk_score: {
        Args: {
          p_amount: number
          p_ip_address?: unknown
          p_payment_method: string
          p_user_id: string
        }
        Returns: number
      }
      cancel_booking: {
        Args: { p_booking_id: string }
        Returns: Json
      }
      check_document_expiry: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      cleanup_expired_agent_memory: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      cleanup_expired_guest_tokens: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      cleanup_guest_data: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      cleanup_old_audit_data: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      cleanup_old_health_data: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      create_activity_order: {
        Args: {
          p_activity_id: string
          p_currency: string
          p_meta: Json
          p_offer_json: Json
          p_participants: Json
          p_partner_booking_id: string
          p_profile_id: string
          p_scheduled: string
          p_status: string
          p_total_price: number
        }
        Returns: string
      }
      create_flight_order: {
        Args: {
          p_amadeus_order_id: string
          p_analytics: Json
          p_checkin_links: Json
          p_meta: Json
          p_offer_json: Json
          p_offer_source: string
          p_passengers: Json
          p_pnr: string
          p_price_currency: string
          p_price_total: number
          p_profile_id: string
          p_seatmaps: Json
          p_status: string
          p_ticket_numbers: string[]
        }
        Returns: string
      }
      create_hotel_order: {
        Args: {
          p_amadeus_booking_id: string
          p_checkin: string
          p_checkout: string
          p_confirmation_code: string
          p_currency: string
          p_guests: Json
          p_hotel_id: string
          p_meta: Json
          p_offer_json: Json
          p_profile_id: string
          p_rooms: number
          p_status: string
          p_total_price: number
        }
        Returns: string
      }
      create_partner_property: {
        Args: { p_partner_id: string; p_property_data: Json }
        Returns: Json
      }
      create_transfer_order: {
        Args: {
          p_amadeus_transfer_order_id: string
          p_currency: string
          p_meta: Json
          p_offer_json: Json
          p_passengers: Json
          p_pickup: string
          p_profile_id: string
          p_status: string
          p_total_price: number
        }
        Returns: string
      }
      emergency_cleanup_payments: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      generate_booking_reference: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      generate_fund_code: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      generate_gift_card_code: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      generate_guest_booking_token: {
        Args: { _booking_id: string; _email: string }
        Returns: string
      }
      generate_invoice_number: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_admin_status: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      get_cleanup_monitoring: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      get_cleanup_stats: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      get_database_performance_stats: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      get_partner_dashboard_data: {
        Args: { p_partner_id: string }
        Returns: Json
      }
      get_payment_timeout_metrics: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      get_quota_aware_providers: {
        Args: { p_excluded_providers?: string[]; p_search_type: string }
        Returns: {
          percentage_used: number
          priority: number
          provider_id: string
          provider_name: string
          quota_status: string
        }[]
      }
      get_user_booking_updates: {
        Args: { p_user_id: string }
        Returns: {
          booking_id: string
          booking_reference: string
          booking_type: string
          created_at: string
          id: string
          message: string
          metadata: Json
          status: string
          title: string
          update_type: string
        }[]
      }
      get_user_bookings: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      get_user_communication_preferences: {
        Args: { p_user_id: string }
        Returns: {
          created_at: string
          email_frequency: string
          id: string
          language: string
          preferences: Json
          timezone: string
          updated_at: string
          user_id: string
        }[]
      }
      get_user_fund_balance: {
        Args: { p_user_id: string }
        Returns: Json
      }
      get_user_fund_transactions: {
        Args: { p_limit?: number; p_user_id: string }
        Returns: Json
      }
      grant_admin_role: {
        Args: { _target_user_id: string }
        Returns: boolean
      }
      has_role: {
        Args: { _role: string; _user_id: string }
        Returns: boolean
      }
      is_admin: {
        Args: { user_id_param: string }
        Returns: boolean
      }
      is_emergency_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      is_mfa_verified_admin: {
        Args: { _user_id: string }
        Returns: boolean
      }
      is_secure_admin: {
        Args: { _user_id: string }
        Returns: boolean
      }
      is_user_admin: {
        Args: { check_user_id: string }
        Returns: boolean
      }
      log_admin_access_attempt: {
        Args: { _action: string; _success: boolean; _user_id: string }
        Returns: undefined
      }
      log_booking_access: {
        Args: {
          _access_method?: string
          _access_type: string
          _accessed_data?: Json
          _booking_id: string
          _failure_reason?: string
          _ip_address?: unknown
          _success?: boolean
          _user_agent?: string
        }
        Returns: undefined
      }
      log_system_event: {
        Args: {
          p_correlation_id: string
          p_duration_ms?: number
          p_error_details?: Json
          p_log_level: string
          p_message: string
          p_metadata?: Json
          p_request_id?: string
          p_service_name: string
          p_status_code?: number
          p_user_id?: string
        }
        Returns: string
      }
      redeem_gift_card: {
        Args: {
          p_amount: number
          p_booking_id?: string
          p_code: string
          p_user_id?: string
        }
        Returns: Json
      }
      run_validation_test: {
        Args: { p_test_id: string }
        Returns: Json
      }
      save_activity_search: {
        Args: {
          p_bbox: Json
          p_city_iata: string
          p_from: string
          p_offers: Json
          p_search_key: string
          p_to: string
          p_ttl: string
        }
        Returns: string
      }
      save_flight_search: {
        Args: {
          p_adults: number
          p_cabin: string
          p_children: number
          p_currency: string
          p_departure: string
          p_destination: string
          p_infants: number
          p_offers: Json
          p_origin: string
          p_return: string
          p_search_key: string
          p_ttl: string
        }
        Returns: string
      }
      save_hotel_search: {
        Args: {
          p_adults: number
          p_checkin: string
          p_checkout: string
          p_children: number
          p_city_iata: string
          p_currency: string
          p_hotel_id: string
          p_offers: Json
          p_rooms: number
          p_search_key: string
          p_sentiments: Json
          p_ttl: string
        }
        Returns: string
      }
      save_transfer_search: {
        Args: {
          p_destination: Json
          p_luggage: Json
          p_offers: Json
          p_origin: Json
          p_passengers: number
          p_pickup: string
          p_search_key: string
          p_ttl: string
        }
        Returns: string
      }
      update_session_funnel_progress: {
        Args: {
          p_session_id: string
          p_step_order: number
          p_timestamp: string
        }
        Returns: undefined
      }
      upsert_communication_preferences: {
        Args: {
          p_email_frequency: string
          p_language: string
          p_preferences: Json
          p_timezone: string
          p_user_id: string
        }
        Returns: string
      }
      upsert_market_analytics: {
        Args: { p_data: Json; p_metric: string; p_scope: Json }
        Returns: string
      }
      verify_guest_booking_access: {
        Args: { _booking_id: string; _email: string; _token?: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "partner" | "user"
      booking_status: "pending" | "confirmed" | "cancelled" | "expired"
      integration_status: "connected" | "disconnected" | "error" | "pending"
      partner_type:
        | "hotel"
        | "airline"
        | "car_rental"
        | "activity_provider"
        | "restaurant"
      payment_status:
        | "requires_payment"
        | "processing"
        | "succeeded"
        | "failed"
        | "refunded"
      payout_status: "pending" | "processing" | "completed" | "failed"
      property_status: "active" | "inactive" | "maintenance" | "draft"
      verification_status: "pending" | "verified" | "rejected" | "suspended"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "partner", "user"],
      booking_status: ["pending", "confirmed", "cancelled", "expired"],
      integration_status: ["connected", "disconnected", "error", "pending"],
      partner_type: [
        "hotel",
        "airline",
        "car_rental",
        "activity_provider",
        "restaurant",
      ],
      payment_status: [
        "requires_payment",
        "processing",
        "succeeded",
        "failed",
        "refunded",
      ],
      payout_status: ["pending", "processing", "completed", "failed"],
      property_status: ["active", "inactive", "maintenance", "draft"],
      verification_status: ["pending", "verified", "rejected", "suspended"],
    },
  },
} as const
