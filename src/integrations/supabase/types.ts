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
          status?: string
          total_amount?: number | null
          updated_at?: string | null
          user_id?: string | null
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
          overall_rating: number
          photos: Json | null
          service_rating: number | null
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
          overall_rating: number
          photos?: Json | null
          service_rating?: number | null
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
          overall_rating?: number
          photos?: Json | null
          service_rating?: number | null
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
          created_at: string
          id: string
          status: string
          stripe_session_id: string | null
          type: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          status?: string
          stripe_session_id?: string | null
          type: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          status?: string
          stripe_session_id?: string | null
          type?: string
          user_id?: string
        }
        Relationships: [
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
          id: string
          user_id: string
        }
        Insert: {
          balance?: number | null
          id?: string
          user_id: string
        }
        Update: {
          balance?: number | null
          id?: string
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
          booking_id: string
          created_at: string | null
          currency: string | null
          failure_reason: string | null
          id: string
          payment_method_id: string | null
          status: Database["public"]["Enums"]["payment_status"]
          stripe_payment_intent_id: string | null
          updated_at: string | null
        }
        Insert: {
          amount: number
          booking_id: string
          created_at?: string | null
          currency?: string | null
          failure_reason?: string | null
          id?: string
          payment_method_id?: string | null
          status?: Database["public"]["Enums"]["payment_status"]
          stripe_payment_intent_id?: string | null
          updated_at?: string | null
        }
        Update: {
          amount?: number
          booking_id?: string
          created_at?: string | null
          currency?: string | null
          failure_reason?: string | null
          id?: string
          payment_method_id?: string | null
          status?: Database["public"]["Enums"]["payment_status"]
          stripe_payment_intent_id?: string | null
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
      cancel_booking: {
        Args: { p_booking_id: string }
        Returns: Json
      }
      check_document_expiry: {
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
      generate_booking_reference: {
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
      get_partner_dashboard_data: {
        Args: { p_partner_id: string }
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
      booking_status: "pending" | "confirmed" | "cancelled"
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
      booking_status: ["pending", "confirmed", "cancelled"],
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
