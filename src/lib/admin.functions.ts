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

// ---------------- PEDIDOS (mostrador + regalos) ----------------

type Tabla = "counter_orders" | "gift_orders";
const AVANCE: Record<string, string> = {
  validando_pago: "en_cocina",
  en_cocina: "listo",
  listo: "en_camino",
  en_camino: "entregado",
  entregado: "entregado",
};

export const adminListOrders = createServerFn({ method: "POST" })
  .inputValidator((d: { password: string }) => d)
  .handler(async ({ data }) => {
    const s = await ensureAdmin(data.password);
    const [c, g] = await Promise.all([
      s.from("counter_orders").select("*").order("created_at", { ascending: false }).limit(200),
      s.from("gift_orders").select("*").order("created_at", { ascending: false }).limit(200),
    ]);
    if (c.error) throw c.error;
    if (g.error) throw g.error;
    const norm = (r: any, tabla: Tabla) => ({
      tabla,
      id: r.id,
      cliente: r.customer_name,
      whatsapp: r.customer_whatsapp,
      total: Number(r.total_paid),
      metodo: r.payment_method,
      status: r.status,
      delivery_status: r.delivery_status ?? "validando_pago",
      direccion_texto: r.direccion_texto,
      latitud: r.latitud,
      longitud: r.longitud,
      payment_reference: r.payment_reference,
      proof_image_url: r.proof_image_url,
      created_at: r.created_at,
    });
    return [
      ...(c.data ?? []).map((r) => norm(r, "counter_orders")),
      ...(g.data ?? []).map((r) => norm(r, "gift_orders")),
    ].sort((a, b) => (a.created_at < b.created_at ? 1 : -1));
  });

export const adminApproveOrder = createServerFn({ method: "POST" })
  .inputValidator((d: { password: string; id: string; tabla: Tabla }) => d)
  .handler(async ({ data }) => {
    const s: any = await ensureAdmin(data.password);
    const { error } = await s.from(data.tabla)
      .update({ status: "VERIFIED", delivery_status: "en_cocina" })
      .eq("id", data.id);
    if (error) throw error;
    return { ok: true };
  });

export const adminAdvanceDelivery = createServerFn({ method: "POST" })
  .inputValidator((d: { password: string; id: string; tabla: Tabla; current: string }) => d)
  .handler(async ({ data }) => {
    const s: any = await ensureAdmin(data.password);
    const next = AVANCE[data.current] ?? "en_cocina";
    const patch: any = { delivery_status: next };
    if (next === "entregado") patch.status = "DELIVERED";
    const { error } = await s.from(data.tabla).update(patch).eq("id", data.id);
    if (error) throw error;
    return { ok: true, next };
  });

export const adminCancelOrder = createServerFn({ method: "POST" })
  .inputValidator((d: { password: string; id: string; tabla: Tabla }) => d)
  .handler(async ({ data }) => {
    const s: any = await ensureAdmin(data.password);
    const { error } = await s.from(data.tabla).update({ status: "CANCELLED" }).eq("id", data.id);
    if (error) throw error;
    return { ok: true };
  });

// ---------- Público: repartidor (link privado por WhatsApp) ----------
export const markOrderDelivered = createServerFn({ method: "POST" })
  .inputValidator((d: { id: string; tabla: Tabla }) => d)
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const s: any = supabaseAdmin;
    const { error } = await s
      .from(data.tabla)
      .update({ delivery_status: "entregado", status: "DELIVERED" })
      .eq("id", data.id);
    if (error) throw error;
    return { ok: true };
  });