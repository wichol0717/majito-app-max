// [Módulo: api] -> [Archivo: supabase.ts]
// Cliente Supabase apuntando al proyecto original (donde vive el catálogo).
// Las tablas nuevas (app_settings, event_packages, customers, etc.) deben
// crearse en este MISMO proyecto para que todo funcione con un solo cliente.

import { createClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

// IMPORTANTE: forzamos el proyecto ORIGINAL (donde vive el catálogo real de
// Majito). Ignoramos VITE_SUPABASE_URL porque Lovable Cloud lo sobreescribe
// con su propio proyecto vacío y perderíamos Galletas/Cupcakes/Pasteles/Brownies.
const SUPABASE_URL = "https://jntrxjvntiwrmjzsxona.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpudHJ4anZudGl3cm1qenN4b25hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE4MDc4MDYsImV4cCI6MjA5NzM4MzgwNn0.Q4IfYwFur9sOU3GPM88bOdlHNOMSygrtxdvei8ZUiQg";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: { persistSession: true, autoRefreshToken: true },
});

export const isSupabaseConfigured = true;