// [Módulo: api] -> [Archivo: supabase.ts] -> [Acción: CREAR]
// Cliente único de conexión a Supabase (Manifiesto v2.3.0, Pilar 5).
// Toda la base de datos se maneja ÚNICAMENTE desde Supabase.

import { createClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined;

if (!supabaseUrl || !supabaseAnonKey) {
  // Aviso humano (Pilar 6: Transparencia Humana)
  console.warn(
    "Oye Majito, todavía no están configuradas las llaves de Supabase. " +
      "Agrega VITE_SUPABASE_URL y VITE_SUPABASE_PUBLISHABLE_KEY en las variables del proyecto.",
  );
}

export const supabase = createClient<Database>(
  supabaseUrl ?? "https://placeholder.supabase.co",
  supabaseAnonKey ?? "placeholder-anon-key",
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
  },
);

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);