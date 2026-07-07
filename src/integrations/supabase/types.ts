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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      app_settings: {
        Row: {
          is_public: boolean
          key: string
          updated_at: string
          value: Json
        }
        Insert: {
          is_public?: boolean
          key: string
          updated_at?: string
          value: Json
        }
        Update: {
          is_public?: boolean
          key?: string
          updated_at?: string
          value?: Json
        }
        Relationships: []
      }
      counter_orders: {
        Row: {
          created_at: string
          cupon_codigo: string | null
          customer_name: string
          customer_whatsapp: string
          delivery_address: string | null
          delivery_mode: string | null
          delivery_status: string | null
          descuento: number | null
          direccion_texto: string | null
          envio_costo: number | null
          id: string
          items: Json
          latitud: number | null
          longitud: number | null
          notas: string | null
          payment_method: string
          payment_reference: string | null
          proof_image_url: string | null
          status: string
          total_paid: number
        }
        Insert: {
          created_at?: string
          cupon_codigo?: string | null
          customer_name: string
          customer_whatsapp: string
          delivery_address?: string | null
          delivery_mode?: string | null
          delivery_status?: string | null
          descuento?: number | null
          direccion_texto?: string | null
          envio_costo?: number | null
          id?: string
          items?: Json
          latitud?: number | null
          longitud?: number | null
          notas?: string | null
          payment_method: string
          payment_reference?: string | null
          proof_image_url?: string | null
          status?: string
          total_paid: number
        }
        Update: {
          created_at?: string
          cupon_codigo?: string | null
          customer_name?: string
          customer_whatsapp?: string
          delivery_address?: string | null
          delivery_mode?: string | null
          delivery_status?: string | null
          descuento?: number | null
          direccion_texto?: string | null
          envio_costo?: number | null
          id?: string
          items?: Json
          latitud?: number | null
          longitud?: number | null
          notas?: string | null
          payment_method?: string
          payment_reference?: string | null
          proof_image_url?: string | null
          status?: string
          total_paid?: number
        }
        Relationships: []
      }
      custom_cake_orders: {
        Row: {
          created_at: string
          customer_name: string
          customer_whatsapp: string
          delivery_address: string | null
          delivery_date: string
          delivery_mode: string | null
          deposit_paid: number
          flavor_chosen: string
          id: string
          notes: string | null
          reference_photo_url: string | null
          status: string
          total_price: number
        }
        Insert: {
          created_at?: string
          customer_name: string
          customer_whatsapp: string
          delivery_address?: string | null
          delivery_date: string
          delivery_mode?: string | null
          deposit_paid?: number
          flavor_chosen: string
          id?: string
          notes?: string | null
          reference_photo_url?: string | null
          status?: string
          total_price: number
        }
        Update: {
          created_at?: string
          customer_name?: string
          customer_whatsapp?: string
          delivery_address?: string | null
          delivery_date?: string
          delivery_mode?: string | null
          deposit_paid?: number
          flavor_chosen?: string
          id?: string
          notes?: string | null
          reference_photo_url?: string | null
          status?: string
          total_price?: number
        }
        Relationships: []
      }
      customers: {
        Row: {
          created_at: string
          cupon_activo: string | null
          email: string | null
          first_order_at: string
          id: string
          last_order_at: string
          name: string | null
          notes: string | null
          origen: string | null
          tags: string[] | null
          total_orders: number
          total_spent: number
          whatsapp: string
        }
        Insert: {
          created_at?: string
          cupon_activo?: string | null
          email?: string | null
          first_order_at?: string
          id?: string
          last_order_at?: string
          name?: string | null
          notes?: string | null
          origen?: string | null
          tags?: string[] | null
          total_orders?: number
          total_spent?: number
          whatsapp: string
        }
        Update: {
          created_at?: string
          cupon_activo?: string | null
          email?: string | null
          first_order_at?: string
          id?: string
          last_order_at?: string
          name?: string | null
          notes?: string | null
          origen?: string | null
          tags?: string[] | null
          total_orders?: number
          total_spent?: number
          whatsapp?: string
        }
        Relationships: []
      }
      event_bookings: {
        Row: {
          categoria: string | null
          created_at: string
          customer_name: string
          customer_whatsapp: string
          delivery_address: string | null
          delivery_mode: string | null
          deposit_paid: number
          event_date: string
          id: string
          notes: string | null
          package_id: number | null
          personas: number | null
          status: string
          total_price: number | null
        }
        Insert: {
          categoria?: string | null
          created_at?: string
          customer_name: string
          customer_whatsapp: string
          delivery_address?: string | null
          delivery_mode?: string | null
          deposit_paid?: number
          event_date: string
          id?: string
          notes?: string | null
          package_id?: number | null
          personas?: number | null
          status?: string
          total_price?: number | null
        }
        Update: {
          categoria?: string | null
          created_at?: string
          customer_name?: string
          customer_whatsapp?: string
          delivery_address?: string | null
          delivery_mode?: string | null
          deposit_paid?: number
          event_date?: string
          id?: string
          notes?: string | null
          package_id?: number | null
          personas?: number | null
          status?: string
          total_price?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "event_bookings_package_id_fkey"
            columns: ["package_id"]
            isOneToOne: false
            referencedRelation: "event_packages"
            referencedColumns: ["id"]
          },
        ]
      }
      event_packages: {
        Row: {
          activo: boolean
          categoria: string
          created_at: string
          descripcion: string | null
          id: number
          incluye: Json | null
          nombre: string
          personas: number
          precio: number | null
          requiere_cotizacion: boolean
          updated_at: string
        }
        Insert: {
          activo?: boolean
          categoria: string
          created_at?: string
          descripcion?: string | null
          id?: number
          incluye?: Json | null
          nombre: string
          personas: number
          precio?: number | null
          requiere_cotizacion?: boolean
          updated_at?: string
        }
        Update: {
          activo?: boolean
          categoria?: string
          created_at?: string
          descripcion?: string | null
          id?: number
          incluye?: Json | null
          nombre?: string
          personas?: number
          precio?: number | null
          requiere_cotizacion?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      gift_orders: {
        Row: {
          buyer_name: string
          buyer_whatsapp: string
          created_at: string
          cupon_codigo: string | null
          customer_name: string | null
          customer_whatsapp: string | null
          delivery_status: string | null
          descuento: number | null
          direccion_texto: string | null
          emoji: string | null
          envio_costo: number | null
          gift_items: Json | null
          id: string
          items: Json
          latitud: number | null
          longitud: number | null
          mensaje: string | null
          message: string | null
          payment_method: string | null
          payment_reference: string | null
          proof_image_url: string | null
          recipient_location: string
          recipient_name: string
          recipient_whatsapp: string | null
          status: string
          total: number
          total_paid: number | null
        }
        Insert: {
          buyer_name: string
          buyer_whatsapp: string
          created_at?: string
          cupon_codigo?: string | null
          customer_name?: string | null
          customer_whatsapp?: string | null
          delivery_status?: string | null
          descuento?: number | null
          direccion_texto?: string | null
          emoji?: string | null
          envio_costo?: number | null
          gift_items?: Json | null
          id?: string
          items?: Json
          latitud?: number | null
          longitud?: number | null
          mensaje?: string | null
          message?: string | null
          payment_method?: string | null
          payment_reference?: string | null
          proof_image_url?: string | null
          recipient_location: string
          recipient_name: string
          recipient_whatsapp?: string | null
          status?: string
          total: number
          total_paid?: number | null
        }
        Update: {
          buyer_name?: string
          buyer_whatsapp?: string
          created_at?: string
          cupon_codigo?: string | null
          customer_name?: string | null
          customer_whatsapp?: string | null
          delivery_status?: string | null
          descuento?: number | null
          direccion_texto?: string | null
          emoji?: string | null
          envio_costo?: number | null
          gift_items?: Json | null
          id?: string
          items?: Json
          latitud?: number | null
          longitud?: number | null
          mensaje?: string | null
          message?: string | null
          payment_method?: string | null
          payment_reference?: string | null
          proof_image_url?: string | null
          recipient_location?: string
          recipient_name?: string
          recipient_whatsapp?: string | null
          status?: string
          total?: number
          total_paid?: number | null
        }
        Relationships: []
      }
      products: {
        Row: {
          activo: string
          categoria: string | null
          created_at: string
          descripcion: string | null
          id: number
          img: string | null
          nombre: string
          precio: number
          stock: number
          updated_at: string
        }
        Insert: {
          activo?: string
          categoria?: string | null
          created_at?: string
          descripcion?: string | null
          id?: number
          img?: string | null
          nombre: string
          precio: number
          stock?: number
          updated_at?: string
        }
        Update: {
          activo?: string
          categoria?: string | null
          created_at?: string
          descripcion?: string | null
          id?: number
          img?: string | null
          nombre?: string
          precio?: number
          stock?: number
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      decrement_stock: {
        Args: { _product_id: number; _qty: number }
        Returns: {
          activo: string
          categoria: string | null
          created_at: string
          descripcion: string | null
          id: number
          img: string | null
          nombre: string
          precio: number
          stock: number
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "products"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      set_customer_origen: {
        Args: { _cupon: string; _origen: string; _whatsapp: string }
        Returns: undefined
      }
      upsert_customer_from_order: {
        Args: { _amount: number; _name: string; _whatsapp: string }
        Returns: undefined
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
