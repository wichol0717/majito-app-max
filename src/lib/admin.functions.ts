import { createServerFn } from "@tanstack/react-start";
import { timingSafeEqual } from "node:crypto";

function checkPassword(input: string) {
  const expected = process.env.ADMIN_PANEL_PASSWORD;
  if (!expected) throw new Error("ADMIN_PANEL_PASSWORD no configurada");
  const a = Buffer.from(input);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export const verifyAdminPassword = createServerFn({ method: "POST" })
  .inputValidator((d: { password: string }) => d)
  .handler(async ({ data }) => ({ ok: checkPassword(data.password) }));

// --- Admin-authenticated data ops (each call re-checks password) ---

async function ensureAdmin(password: string) {
  if (!checkPassword(password)) throw new Error("Contraseña incorrecta");
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

// SETTINGS
export const adminListSettings = createServerFn({ method: "POST" })
  .inputValidator((d: { password: string }) => d)
  .handler(async ({ data }) => {
    const s = await ensureAdmin(data.password);
    const { data: rows, error } = await s.from("app_settings").select("*").order("key");
    if (error) throw error;
    return rows ?? [];
  });

export const adminUpdateSetting = createServerFn({ method: "POST" })
  .inputValidator((d: { password: string; key: string; value: unknown }) => d)
  .handler(async ({ data }) => {
    const s = await ensureAdmin(data.password);
    const { error } = await s
      .from("app_settings")
      .upsert({ key: data.key, value: data.value as never, is_public: true, updated_at: new Date().toISOString() });
    if (error) throw error;
    return { ok: true };
  });

// PRODUCTS (inventario)
export const adminListProducts = createServerFn({ method: "POST" })
  .inputValidator((d: { password: string }) => d)
  .handler(async ({ data }) => {
    const s = await ensureAdmin(data.password);
    const { data: rows, error } = await s.from("products").select("*").order("categoria").order("nombre");
    if (error) throw error;
    return rows ?? [];
  });

export const adminUpsertProduct = createServerFn({ method: "POST" })
  .inputValidator((d: { password: string; product: any }) => d)
  .handler(async ({ data }) => {
    const s = await ensureAdmin(data.password);
    const { error } = await s.from("products").upsert(data.product);
    if (error) throw error;
    return { ok: true };
  });

export const adminDeleteProduct = createServerFn({ method: "POST" })
  .inputValidator((d: { password: string; id: number }) => d)
  .handler(async ({ data }) => {
    const s = await ensureAdmin(data.password);
    const { error } = await s.from("products").delete().eq("id", data.id);
    if (error) throw error;
    return { ok: true };
  });

// CUSTOMERS
export const adminListCustomers = createServerFn({ method: "POST" })
  .inputValidator((d: { password: string }) => d)
  .handler(async ({ data }) => {
    const s = await ensureAdmin(data.password);
    const { data: rows, error } = await s.from("customers").select("*").order("last_order_at", { ascending: false });
    if (error) throw error;
    return rows ?? [];
  });

// EVENT PACKAGES
export const adminListPackages = createServerFn({ method: "POST" })
  .inputValidator((d: { password: string }) => d)
  .handler(async ({ data }) => {
    const s = await ensureAdmin(data.password);
    const { data: rows, error } = await s
      .from("event_packages")
      .select("*")
      .order("categoria")
      .order("personas");
    if (error) throw error;
    return rows ?? [];
  });

export const adminUpsertPackage = createServerFn({ method: "POST" })
  .inputValidator((d: { password: string; pkg: any }) => d)
  .handler(async ({ data }) => {
    const s = await ensureAdmin(data.password);
    const { error } = await s.from("event_packages").upsert(data.pkg);
    if (error) throw error;
    return { ok: true };
  });