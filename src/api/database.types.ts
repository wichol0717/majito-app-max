// [Módulo: api] -> [Archivo: database.types.ts] -> [Acción: CREAR]
// Tipado manual espejo del DDL de las 5 tablas del Manifiesto v2.3.0.
// Sustituir por el archivo auto-generado (`supabase gen types typescript ...`)
// una vez que corras el SQL maestro en tu panel Supabase de Tuxpan.

export type Json = string | number | boolean | null | { [k: string]: Json } | Json[];

export interface Database {
  public: {
    Tables: {
      products: {
        Row: {
          id: number;
          nombre: string;
          precio: number;
          categoria: string | null;
          activo: string; // "SI" | "NO"
          img: string | null;
          descripcion: string | null;
          stock: number;
        };
        Insert: {
          id?: number;
          nombre: string;
          precio: number;
          categoria?: string | null;
          activo?: string;
          img?: string | null;
          descripcion?: string | null;
          stock?: number;
        };
        Update: Partial<Database["public"]["Tables"]["products"]["Insert"]>;
        Relationships: [];
      };
      app_settings: {
        Row: { key: string; value: Json; is_public: boolean; updated_at: string };
        Insert: { key: string; value: Json; is_public?: boolean; updated_at?: string };
        Update: Partial<Database["public"]["Tables"]["app_settings"]["Insert"]>;
        Relationships: [];
      };
      event_packages: {
        Row: {
          id: number;
          categoria: "reposteria" | "snacks_frios";
          personas: number;
          nombre: string;
          descripcion: string | null;
          precio: number | null;
          incluye: Json;
          activo: boolean;
          requiere_cotizacion: boolean;
        };
        Insert: {
          id?: number;
          categoria: "reposteria" | "snacks_frios";
          personas: number;
          nombre: string;
          descripcion?: string | null;
          precio?: number | null;
          incluye?: Json;
          activo?: boolean;
          requiere_cotizacion?: boolean;
        };
        Update: Partial<Database["public"]["Tables"]["event_packages"]["Insert"]>;
        Relationships: [];
      };
      customers: {
        Row: {
          id: string;
          whatsapp: string;
          name: string | null;
          first_order_at: string;
          last_order_at: string;
          total_orders: number;
          total_spent: number;
          tags: string[] | null;
          notes: string | null;
        };
        Insert: Partial<Database["public"]["Tables"]["customers"]["Row"]> & { whatsapp: string };
        Update: Partial<Database["public"]["Tables"]["customers"]["Row"]>;
        Relationships: [];
      };
      counter_orders: {
        Row: {
          id: string;
          customer_name: string;
          customer_whatsapp: string;
          total_paid: number;
          payment_method: "efectivo" | "spei" | "codi";
          proof_image_url: string | null;
          status: "PENDING" | "VERIFIED" | "DELIVERED" | "CANCELLED";
          created_at: string;
        };
        Insert: {
          id?: string;
          customer_name: string;
          customer_whatsapp: string;
          total_paid: number;
          payment_method: "efectivo" | "spei" | "codi";
          proof_image_url?: string | null;
          status?: "PENDING" | "VERIFIED" | "DELIVERED" | "CANCELLED";
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["counter_orders"]["Insert"]>;
        Relationships: [];
      };
      custom_cake_orders: {
        Row: {
          id: string;
          customer_name: string;
          customer_whatsapp: string;
          delivery_date: string;
          reference_photo_url: string | null;
          flavor_chosen: string;
          notes: string | null;
          total_price: number;
          deposit_paid: number;
          status: "HELD_24H" | "VERIFIED" | "BAKING" | "READY" | "DELIVERED" | "CANCELLED";
          created_at: string;
        };
        Insert: {
          id?: string;
          customer_name: string;
          customer_whatsapp: string;
          delivery_date: string;
          reference_photo_url?: string | null;
          flavor_chosen: string;
          notes?: string | null;
          total_price: number;
          deposit_paid?: number;
          status?: "HELD_24H" | "VERIFIED" | "BAKING" | "READY" | "DELIVERED" | "CANCELLED";
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["custom_cake_orders"]["Insert"]>;
        Relationships: [];
      };
      event_bookings: {
        Row: {
          id: string;
          client_name: string;
          client_whatsapp: string;
          event_date: string;
          event_address: string;
          package_name: string;
          total_price: number;
          deposit_paid: number;
          status: "HELD_24H" | "VERIFIED" | "COMPLETED" | "CANCELLED";
          created_at: string;
        };
        Insert: {
          id?: string;
          client_name: string;
          client_whatsapp: string;
          event_date: string;
          event_address: string;
          package_name: string;
          total_price: number;
          deposit_paid?: number;
          status?: "HELD_24H" | "VERIFIED" | "COMPLETED" | "CANCELLED";
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["event_bookings"]["Insert"]>;
        Relationships: [];
      };
      gift_orders: {
        Row: {
          id: string;
          customer_name: string;
          customer_whatsapp: string;
          total_paid: number;
          gift_items: Json;
          payment_method: "efectivo" | "spei" | "codi";
          proof_image_url: string | null;
          status: "PENDING" | "VERIFIED" | "DELIVERED" | "CANCELLED";
          created_at: string;
        };
        Insert: {
          id?: string;
          customer_name: string;
          customer_whatsapp: string;
          total_paid: number;
          gift_items: Json;
          payment_method: "efectivo" | "spei" | "codi";
          proof_image_url?: string | null;
          status?: "PENDING" | "VERIFIED" | "DELIVERED" | "CANCELLED";
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["gift_orders"]["Insert"]>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
}