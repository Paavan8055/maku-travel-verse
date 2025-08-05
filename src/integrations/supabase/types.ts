export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
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
          user_id: string
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
          user_id: string
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      cancel_booking: {
        Args: { p_booking_id: string }
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
        Args: { p_user_id: string; p_limit?: number }
        Returns: Json
      }
    }
    Enums: {
      booking_status: "pending" | "confirmed" | "cancelled"
      payment_status:
        | "requires_payment"
        | "processing"
        | "succeeded"
        | "failed"
        | "refunded"
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
      payment_status: [
        "requires_payment",
        "processing",
        "succeeded",
        "failed",
        "refunded",
      ],
    },
  },
} as const
