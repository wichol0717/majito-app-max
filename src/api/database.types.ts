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
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
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
          customer_name: string | null
          customer_whatsapp: string | null
          delivery_status: string
          descuento: number | null
          direccion_texto: string | null
          envio_costo: number
          id: string
          latitud: number | null
          longitud: number | null
          metodo_pago: string | null
          nombre_cliente: string | null
          notas: string | null
          payment_method: string | null
          payment_receipt_url: string | null
          payment_reference: string | null
          proof_image_url: string | null
          status: string | null
          total: number | null
          total_paid: number | null
          whatsapp: string | null
        }
        Insert: {
          created_at?: string
          cupon_codigo?: string | null
          customer_name?: string | null
          customer_whatsapp?: string | null
          delivery_status?: string
          descuento?: number | null
          direccion_texto?: string | null
          envio_costo?: number
          id?: string
          latitud?: number | null
          longitud?: number | null
          metodo_pago?: string | null
          nombre_cliente?: string | null
          notas?: string | null
          payment_method?: string | null
          payment_receipt_url?: string | null
          payment_reference?: string | null
          proof_image_url?: string | null
          status?: string | null
          total?: number | null
          total_paid?: number | null
          whatsapp?: string | null
        }
        Update: {
          created_at?: string
          cupon_codigo?: string | null
          customer_name?: string | null
          customer_whatsapp?: string | null
          delivery_status?: string
          descuento?: number | null
          direccion_texto?: string | null
          envio_costo?: number
          id?: string
          latitud?: number | null
          longitud?: number | null
          metodo_pago?: string | null
          nombre_cliente?: string | null
          notas?: string | null
          payment_method?: string | null
          payment_receipt_url?: string | null
          payment_reference?: string | null
          proof_image_url?: string | null
          status?: string | null
          total?: number | null
          total_paid?: number | null
          whatsapp?: string | null
        }
        Relationships: []
      }
      custom_cake_orders: {
        Row: {
          created_at: string | null
          customer_whatsapp: string | null
          delivery_date: string | null
          delivery_status: string | null
          detalles: string | null
          flavor_chosen: string | null
          id: string
          nombre_cliente: string | null
          payment_receipt_url: string | null
          reference_image_url: string | null
          status: string | null
          total: number | null
        }
        Insert: {
          created_at?: string | null
          customer_whatsapp?: string | null
          delivery_date?: string | null
          delivery_status?: string | null
          detalles?: string | null
          flavor_chosen?: string | null
          id?: string
          nombre_cliente?: string | null
          payment_receipt_url?: string | null
          reference_image_url?: string | null
          status?: string | null
          total?: number | null
        }
        Update: {
          created_at?: string | null
          customer_whatsapp?: string | null
          delivery_date?: string | null
          delivery_status?: string | null
          detalles?: string | null
          flavor_chosen?: string | null
          id?: string
          nombre_cliente?: string | null
          payment_receipt_url?: string | null
          reference_image_url?: string | null
          status?: string | null
          total?: number | null
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
          origen: string
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
          origen?: string
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
          origen?: string
          tags?: string[] | null
          total_orders?: number
          total_spent?: number
          whatsapp?: string
        }
        Relationships: []
      }
      event_bookings: {
        Row: {
          created_at: string | null
          detalles: string | null
          fecha_evento: string | null
          id: string
          nombre_cliente: string | null
          precio_acordado: number | null
        }
        Insert: {
          created_at?: string | null
          detalles?: string | null
          fecha_evento?: string | null
          id?: string
          nombre_cliente?: string | null
          precio_acordado?: number | null
        }
        Update: {
          created_at?: string | null
          detalles?: string | null
          fecha_evento?: string | null
          id?: string
          nombre_cliente?: string | null
          precio_acordado?: number | null
        }
        Relationships: []
      }
      event_packages: {
        Row: {
          activo: boolean
          categoria: string
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
          created_at: string | null
          cupon_codigo: string | null
          customer_name: string
          customer_whatsapp: string | null
          delivery_address: string | null
          delivery_status: string | null
          descuento: number | null
          direccion_texto: string | null
          envio_costo: number | null
          gift_items: Json | null
          gift_message: string | null
          id: string
          latitud: number | null
          longitud: number | null
          mensaje: string | null
          notas: string | null
          payment_method: string | null
          payment_receipt_url: string | null
          payment_reference: string | null
          product_id: number | null
          proof_image_url: string | null
          recipient_name: string | null
          recipient_whatsapp: string | null
          status: string | null
          tipo_tarjeta: string | null
          total_paid: number | null
        }
        Insert: {
          created_at?: string | null
          cupon_codigo?: string | null
          customer_name: string
          customer_whatsapp?: string | null
          delivery_address?: string | null
          delivery_status?: string | null
          descuento?: number | null
          direccion_texto?: string | null
          envio_costo?: number | null
          gift_items?: Json | null
          gift_message?: string | null
          id?: string
          latitud?: number | null
          longitud?: number | null
          mensaje?: string | null
          notas?: string | null
          payment_method?: string | null
          payment_receipt_url?: string | null
          payment_reference?: string | null
          product_id?: number | null
          proof_image_url?: string | null
          recipient_name?: string | null
          recipient_whatsapp?: string | null
          status?: string | null
          tipo_tarjeta?: string | null
          total_paid?: number | null
        }
        Update: {
          created_at?: string | null
          cupon_codigo?: string | null
          customer_name?: string
          customer_whatsapp?: string | null
          delivery_address?: string | null
          delivery_status?: string | null
          descuento?: number | null
          direccion_texto?: string | null
          envio_costo?: number | null
          gift_items?: Json | null
          gift_message?: string | null
          id?: string
          latitud?: number | null
          longitud?: number | null
          mensaje?: string | null
          notas?: string | null
          payment_method?: string | null
          payment_receipt_url?: string | null
          payment_reference?: string | null
          product_id?: number | null
          proof_image_url?: string | null
          recipient_name?: string | null
          recipient_whatsapp?: string | null
          status?: string | null
          tipo_tarjeta?: string | null
          total_paid?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "gift_orders_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      productos: {
        Row: {
          categoria: string | null
          id: string
          nombre: string
          precio: number
          stock: number
          stock_minimo: number
        }
        Insert: {
          categoria?: string | null
          id?: string
          nombre: string
          precio: number
          stock?: number
          stock_minimo?: number
        }
        Update: {
          categoria?: string | null
          id?: string
          nombre?: string
          precio?: number
          stock?: number
          stock_minimo?: number
        }
        Relationships: []
      }
      products: {
        Row: {
          activo: string | null
          categoria: string | null
          descripcion: string | null
          id: number
          img: string | null
          nombre: string | null
          precio: number | null
          stock: number
          updated_at: string
        }
        Insert: {
          activo?: string | null
          categoria?: string | null
          descripcion?: string | null
          id?: number
          img?: string | null
          nombre?: string | null
          precio?: number | null
          stock?: number
          updated_at?: string
        }
        Update: {
          activo?: string | null
          categoria?: string | null
          descripcion?: string | null
          id?: number
          img?: string | null
          nombre?: string | null
          precio?: number | null
          stock?: number
          updated_at?: string
        }
        Relationships: []
      }
      ventas: {
        Row: {
          cantidad: number
          fecha_venta: string
          id: string
          producto_id: string | null
          total: number
        }
        Insert: {
          cantidad: number
          fecha_venta?: string
          id?: string
          producto_id?: string | null
          total: number
        }
        Update: {
          cantidad?: number
          fecha_venta?: string
          id?: string
          producto_id?: string | null
          total?: number
        }
        Relationships: [
          {
            foreignKeyName: "ventas_producto_id_fkey"
            columns: ["producto_id"]
            isOneToOne: false
            referencedRelation: "productos"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      vista_alertas_stock: {
        Row: {
          nombre: string | null
          stock: number | null
          stock_minimo: number | null
        }
        Insert: {
          nombre?: string | null
          stock?: number | null
          stock_minimo?: number | null
        }
        Update: {
          nombre?: string | null
          stock?: number | null
          stock_minimo?: number | null
        }
        Relationships: []
      }
      vista_ventas_por_producto: {
        Row: {
          cantidad_total: number | null
          ingresos_totales: number | null
          producto: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      decrement_stock: {
        Args: { _product_id: number; _qty: number }
        Returns: {
          activo: string | null
          categoria: string | null
          descripcion: string | null
          id: number
          img: string | null
          nombre: string | null
          precio: number | null
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
      realizar_pedido: {
        Args: { p_customer_name: string; p_items: Json }
        Returns: undefined
      }
      set_customer_origen:
        | {
            Args: { _cupon?: string; _origen: string; _whatsapp: string }
            Returns: undefined
          }
        | { Args: { p_origen: string; p_whatsapp: string }; Returns: undefined }
    }
    Enums: {
      custom_cake_status:
        | "held_24h"
        | "deposit_verified"
        | "baking"
        | "ready_for_pickup"
        | "delivered"
        | "cancelled"
      event_status: "held_24h" | "deposit_verified" | "completed" | "cancelled"
      order_status_type: "pending" | "baking" | "ready" | "delivered"
      payment_method_type: "cash" | "spei" | "codi"
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      custom_cake_status: [
        "held_24h",
        "deposit_verified",
        "baking",
        "ready_for_pickup",
        "delivered",
        "cancelled",
      ],
      event_status: ["held_24h", "deposit_verified", "completed", "cancelled"],
      order_status_type: ["pending", "baking", "ready", "delivered"],
      payment_method_type: ["cash", "spei", "codi"],
    },
  },
} as const
