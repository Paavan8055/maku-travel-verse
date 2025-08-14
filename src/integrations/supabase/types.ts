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
          created_at: string | null
          destination: string
          id: string
          is_active: boolean | null
          max_price: number | null
          travel_dates_end: string | null
          travel_dates_start: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          destination: string
          id?: string
          is_active?: boolean | null
          max_price?: number | null
          travel_dates_end?: string | null
          travel_dates_start?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          destination?: string
          id?: string
          is_active?: boolean | null
          max_price?: number | null
          travel_dates_end?: string | null
          travel_dates_start?: string | null
          user_id?: string
        }
        Relationships: []
      }
      price_predictions: {
        Row: {
          confidence_score: number | null
          created_at: string | null
          factors: Json | null
          id: string
          item_id: string
          item_type: string
          predicted_price: number
          recommendation: string
          route: string | null
          valid_until: string
        }
        Insert: {
          confidence_score?: number | null
          created_at?: string | null
          factors?: Json | null
          id?: string
          item_id: string
          item_type: string
          predicted_price: number
          recommendation: string
          route?: string | null
          valid_until: string
        }
        Update: {
          confidence_score?: number | null
          created_at?: string | null
          factors?: Json | null
          id?: string
          item_id?: string
          item_type?: string
          predicted_price?: number
          recommendation?: string
          route?: string | null
          valid_until?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          email: string | null
          first_name: string | null
          id: string
          last_name: string | null
          points: number | null
          total_distance: number | null
          trips_booked: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string | null
          first_name?: string | null
          id?: string
          last_name?: string | null
          points?: number | null
          total_distance?: number | null
          trips_booked?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string | null
          first_name?: string | null
          id?: string
          last_name?: string | null
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
      user_preferences: {
        Row: {
          created_at: string | null
          currency: string | null
          id: string
          language: string | null
          meal_preferences: string[] | null
          preferred_airlines: string[] | null
          room_type: string | null
          seat_class: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          currency?: string | null
          id?: string
          language?: string | null
          meal_preferences?: string[] | null
          preferred_airlines?: string[] | null
          room_type?: string | null
          seat_class?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          currency?: string | null
          id?: string
          language?: string | null
          meal_preferences?: string[] | null
          preferred_airlines?: string[] | null
          room_type?: string | null
          seat_class?: string | null
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      cancel_booking: {
        Args: { p_booking_id: string }
        Returns: Json
      }
      create_partner_property: {
        Args: { p_partner_id: string; p_property_data: Json }
        Returns: Json
      }
      get_partner_dashboard_data: {
        Args: { p_partner_id: string }
        Returns: Json
      }
      get_user_bookings: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      get_user_fund_balance: {
        Args: { p_user_id: string }
        Returns: Json
      }
      get_user_fund_transactions: {
        Args: { p_limit?: number; p_user_id: string }
        Returns: Json
      }
      is_admin: {
        Args: { user_id_param: string }
        Returns: boolean
      }
    }
    Enums: {
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
