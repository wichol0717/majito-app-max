// [Módulo: api] -> [Archivo: supabase.ts] -> [Acción: CREAR]
// Cliente único de conexión a Supabase (Manifiesto v2.3.0, Pilar 5).
// Toda la base de datos se maneja ÚNICAMENTE desde Supabase.

import { createClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

// Proyecto Supabase de Tuxpan (llaves publicables: la seguridad real vive en RLS).
const SUPABASE_URL = "https://jntrxjvntiwrmjzsxona.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpudHJ4anZudGl3cm1qenN4b25hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE4MDc4MDYsImV4cCI6MjA5NzM4MzgwNn0.Q4IfYwFur9sOU3GPM88bOdlHNOMSygrtxdvei8ZUiQg";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

export const isSupabaseConfigured = true;