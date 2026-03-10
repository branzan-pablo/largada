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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      affiliate_rules: {
        Row: {
          id: string
          domain: string
          param_key: string
          param_value: string
          active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          domain: string
          param_key: string
          param_value: string
          active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          domain?: string
          param_key?: string
          param_value?: string
          active?: boolean
          created_at?: string
        }
        Relationships: []
      }
      link_clicks: {
        Row: {
          id: string
          race_id: string
          user_id: string | null
          clicked_at: string
        }
        Insert: {
          id?: string
          race_id: string
          user_id?: string | null
          clicked_at?: string
        }
        Update: {
          id?: string
          race_id?: string
          user_id?: string | null
          clicked_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "link_clicks_race_id_fkey"
            columns: ["race_id"]
            isOneToOne: false
            referencedRelation: "races"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "link_clicks_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      cities: {
        Row: {
          id: string
          name: string
          slug: string
          state_code: string
          latitude: number
          longitude: number
          active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          state_code: string
          latitude: number
          longitude: number
          active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          state_code?: string
          latitude?: number
          longitude?: number
          active?: boolean
          created_at?: string
        }
        Relationships: []
      }
      push_subscriptions: {
        Row: {
          id: string
          user_id: string
          endpoint: string
          p256dh: string
          auth: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          endpoint: string
          p256dh: string
          auth: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          endpoint?: string
          p256dh?: string
          auth?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "push_subscriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          city: string | null
          city_id: string | null
          created_at: string
          full_name: string | null
          id: string
          latitude: number | null
          longitude: number | null
          notification_radius_km: number
          notifications_enabled: boolean
          onboarding_completed: boolean
          role: string
          state: string | null
          strava_athlete_id: number | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          city?: string | null
          city_id?: string | null
          created_at?: string
          full_name?: string | null
          id: string
          latitude?: number | null
          longitude?: number | null
          notification_radius_km?: number
          notifications_enabled?: boolean
          onboarding_completed?: boolean
          role?: string
          state?: string | null
          strava_athlete_id?: number | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          city?: string | null
          city_id?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          notification_radius_km?: number
          notifications_enabled?: boolean
          onboarding_completed?: boolean
          role?: string
          state?: string | null
          strava_athlete_id?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
        ]
      }
      race_suggestions: {
        Row: {
          city: string
          created_at: string
          date: string | null
          id: string
          link: string | null
          name: string
          notes: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          state: string | null
          status: string
          user_id: string
        }
        Insert: {
          city: string
          created_at?: string
          date?: string | null
          id?: string
          link?: string | null
          name: string
          notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          state?: string | null
          status?: string
          user_id: string
        }
        Update: {
          city?: string
          created_at?: string
          date?: string | null
          id?: string
          link?: string | null
          name?: string
          notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          state?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "race_suggestions_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "race_suggestions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      races: {
        Row: {
          address: string
          city: string
          city_id: string | null
          created_at: string
          created_by: string | null
          date: string
          description: string | null
          distances: string[]
          id: string
          image_url: string | null
          is_promoted: boolean
          promoted_until: string | null
          latitude: number
          longitude: number
          name: string
          organizer: string | null
          origin: string
          prize_details: string | null
          prize_type: string
          registration_deadline: string
          registration_link: string
          registration_price: string
          registration_prices: Record<string, string> | null
          registration_batches: Record<string, unknown>[] | null
          route_description: string | null
          link: string | null
          notes: string | null
          route_image_url: string | null
          rsvp_count: number
          slug: string
          start_time: string
          state: string
          status: string
          updated_at: string
        }
        Insert: {
          address: string
          city: string
          city_id?: string | null
          created_at?: string
          created_by?: string | null
          date: string
          description?: string | null
          distances: string[]
          id?: string
          image_url?: string | null
          is_promoted?: boolean
          promoted_until?: string | null
          latitude: number
          link?: string | null
          longitude: number
          name: string
          notes?: string | null
          organizer?: string | null
          origin?: string
          prize_details?: string | null
          prize_type: string
          registration_deadline: string
          registration_link: string
          registration_price: string
          registration_prices?: Record<string, string> | null
          registration_batches?: Record<string, unknown>[] | null
          route_description?: string | null
          route_image_url?: string | null
          rsvp_count?: number
          slug: string
          start_time: string
          state?: string
          status?: string
          updated_at?: string
        }
        Update: {
          address?: string
          city?: string
          city_id?: string | null
          created_at?: string
          created_by?: string | null
          date?: string
          description?: string | null
          distances?: string[]
          id?: string
          image_url?: string | null
          is_promoted?: boolean
          promoted_until?: string | null
          latitude?: number
          link?: string | null
          longitude?: number
          name?: string
          notes?: string | null
          organizer?: string | null
          origin?: string
          prize_details?: string | null
          prize_type?: string
          registration_deadline?: string
          registration_link?: string
          registration_price?: string
          registration_prices?: Record<string, string> | null
          registration_batches?: Record<string, unknown>[] | null
          route_description?: string | null
          route_image_url?: string | null
          rsvp_count?: number
          slug?: string
          start_time?: string
          state?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "races_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "races_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      rsvps: {
        Row: {
          created_at: string
          id: string
          race_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          race_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          race_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "rsvps_race_id_fkey"
            columns: ["race_id"]
            isOneToOne: false
            referencedRelation: "races"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rsvps_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_customers: {
        Row: {
          id: string
          user_id: string
          abacatepay_id: string
          email: string | null
          name: string | null
          cellphone: string | null
          tax_id: string | null
          metadata: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          abacatepay_id: string
          email?: string | null
          name?: string | null
          cellphone?: string | null
          tax_id?: string | null
          metadata?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          abacatepay_id?: string
          email?: string | null
          name?: string | null
          cellphone?: string | null
          tax_id?: string | null
          metadata?: Json
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_customers_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_orders: {
        Row: {
          id: string
          user_id: string
          abacatepay_id: string | null
          payment_url: string | null
          payment_method: string[]
          frequency: string
          order_type: string
          status: string
          amount: number
          paid_amount: number
          description: string | null
          products: Json
          br_code: string | null
          br_code_base64: string | null
          external_id: string | null
          allow_coupons: boolean
          expires_at: string | null
          paid_at: string | null
          metadata: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          abacatepay_id?: string | null
          payment_url?: string | null
          payment_method: string[]
          frequency: string
          order_type: string
          status?: string
          amount: number
          paid_amount?: number
          description?: string | null
          products?: Json
          br_code?: string | null
          br_code_base64?: string | null
          external_id?: string | null
          allow_coupons?: boolean
          expires_at?: string | null
          paid_at?: string | null
          metadata?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          abacatepay_id?: string | null
          payment_url?: string | null
          payment_method?: string[]
          frequency?: string
          order_type?: string
          status?: string
          amount?: number
          paid_amount?: number
          description?: string | null
          products?: Json
          br_code?: string | null
          br_code_base64?: string | null
          external_id?: string | null
          allow_coupons?: boolean
          expires_at?: string | null
          paid_at?: string | null
          metadata?: Json
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_orders_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_events: {
        Row: {
          id: string
          event_id: string
          event_type: string
          order_id: string | null
          raw_payload: Json
          dev_mode: boolean
          processed: boolean
          processed_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          event_id: string
          event_type: string
          order_id?: string | null
          raw_payload: Json
          dev_mode?: boolean
          processed?: boolean
          processed_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          event_id?: string
          event_type?: string
          order_id?: string | null
          raw_payload?: Json
          dev_mode?: boolean
          processed?: boolean
          processed_at?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_events_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "payment_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      organizer_subscriptions: {
        Row: {
          id: string
          user_id: string
          tier: "organizador" | "organizador_pro"
          status: string
          payment_order_id: string | null
          amount: number
          promotions_limit: number
          promotions_used: number
          current_period_start: string
          current_period_end: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          tier: "organizador" | "organizador_pro"
          status?: string
          payment_order_id?: string | null
          amount: number
          promotions_limit: number
          promotions_used?: number
          current_period_start?: string
          current_period_end: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          tier?: "organizador" | "organizador_pro"
          status?: string
          payment_order_id?: string | null
          amount?: number
          promotions_limit?: number
          promotions_used?: number
          current_period_start?: string
          current_period_end?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "organizer_subscriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organizer_subscriptions_payment_order_id_fkey"
            columns: ["payment_order_id"]
            isOneToOne: false
            referencedRelation: "payment_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      subscription_promotions: {
        Row: {
          id: string
          subscription_id: string
          race_id: string
          promoted_at: string
        }
        Insert: {
          id?: string
          subscription_id: string
          race_id: string
          promoted_at?: string
        }
        Update: {
          id?: string
          subscription_id?: string
          race_id?: string
          promoted_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscription_promotions_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "organizer_subscriptions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscription_promotions_race_id_fkey"
            columns: ["race_id"]
            isOneToOne: false
            referencedRelation: "races"
            referencedColumns: ["id"]
          },
        ]
      }
      strava_tokens: {
        Row: {
          id: string
          user_id: string
          athlete_id: number
          access_token: string
          refresh_token: string
          expires_at: number
          scope: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          athlete_id: number
          access_token: string
          refresh_token: string
          expires_at: number
          scope: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          athlete_id?: number
          access_token?: string
          refresh_token?: string
          expires_at?: number
          scope?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "strava_tokens_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_race_notification_recipients: {
        Args: { p_race_city_id: string }
        Returns: { user_id: string; distance_km: number }[]
      }
      search_cities: {
        Args: { p_query: string; p_limit?: number }
        Returns: { id: string; name: string; state_code: string; slug: string; latitude: number; longitude: number }[]
      }
      get_random_cities: {
        Args: { p_limit?: number }
        Returns: { name: string; state_code: string }[]
      }
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
