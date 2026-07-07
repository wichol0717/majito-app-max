// Cliente admin (service role) apuntando al Supabase REAL de Majito
// (jntrxjvntiwrmjzsxona), NO al Supabase de Lovable Cloud.
// Solo debe importarse desde código server-only (dentro de .handler() de
// server functions o de otros archivos *.server.ts).
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/api/database.types";

const SUPABASE_URL = "https://jntrxjvntiwrmjzsxona.supabase.co";

function build() {
  const key = process.env.MAJITO_SUPABASE_SERVICE_ROLE_KEY;
  if (!key) {
    throw new Error(
      "MAJITO_SUPABASE_SERVICE_ROLE_KEY no configurada. Añádela en Vercel → Settings → Environment Variables.",
    );
  }
  return createClient<Database>(SUPABASE_URL, key, {
    auth: { persistSession: false, autoRefreshToken: false, storage: undefined },
  });
}

let _client: ReturnType<typeof build> | undefined;
export const majitoAdmin = new Proxy({} as ReturnType<typeof build>, {
  get(_, prop, receiver) {
    if (!_client) _client = build();
    return Reflect.get(_client, prop, receiver);
  },
});