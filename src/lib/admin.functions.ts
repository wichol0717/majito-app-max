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
  const { majitoAdmin } = await import("@/integrations/supabase/majito-admin.server");
  return majitoAdmin;
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
    const { majitoAdmin } = await import("@/integrations/supabase/majito-admin.server");
    const s: any = majitoAdmin;
    const { error } = await s
      .from(data.tabla)
      .update({ delivery_status: "entregado", status: "DELIVERED" })
      .eq("id", data.id);
    if (error) throw error;
    return { ok: true };
  });

// ---------------- REPORTES ----------------
export const adminReports = createServerFn({ method: "POST" })
  .inputValidator((d: { password: string; days?: number }) => d)
  .handler(async ({ data }) => {
    const s: any = await ensureAdmin(data.password);
    const days = Math.max(1, Math.min(365, data.days ?? 30));
    const since = new Date(Date.now() - days * 86400000).toISOString();

    const [c, g, cake, ev, cust] = await Promise.all([
      s.from("counter_orders").select("id,total_paid,status,items,created_at,payment_method,customer_name,customer_whatsapp").gte("created_at", since),
      s.from("gift_orders").select("id,total_paid,total,status,items,created_at,payment_method,customer_name,buyer_name,customer_whatsapp,buyer_whatsapp").gte("created_at", since),
      s.from("custom_cake_orders").select("id,total_price,deposit_paid,status,created_at,customer_name,customer_whatsapp").gte("created_at", since),
      s.from("event_bookings").select("id,total_price,deposit_paid,status,categoria,personas,created_at,customer_name,customer_whatsapp").gte("created_at", since),
      s.from("customers").select("whatsapp,name,total_orders,total_spent,last_order_at,origen").order("total_spent", { ascending: false }).limit(20),
    ]);
    for (const r of [c, g, cake, ev, cust]) if (r.error) throw r.error;

    const isCancelled = (st?: string) => (st ?? "").toUpperCase() === "CANCELLED";

    const counter = (c.data ?? []).filter((r: any) => !isCancelled(r.status));
    const gifts = (g.data ?? []).filter((r: any) => !isCancelled(r.status));
    const cakes = (cake.data ?? []).filter((r: any) => !isCancelled(r.status));
    const events = (ev.data ?? []).filter((r: any) => !isCancelled(r.status));

    const sum = (arr: any[], k: string) => arr.reduce((a, r) => a + Number(r[k] ?? 0), 0);

    const ingresos = {
      mostrador: sum(counter, "total_paid"),
      regalos: gifts.reduce((a: number, r: any) => a + Number(r.total_paid ?? r.total ?? 0), 0),
      pasteles: sum(cakes, "deposit_paid"),
      eventos: sum(events, "deposit_paid"),
    };
    const totalIngresos = ingresos.mostrador + ingresos.regalos + ingresos.pasteles + ingresos.eventos;

    const pedidos = {
      mostrador: counter.length,
      regalos: gifts.length,
      pasteles: cakes.length,
      eventos: events.length,
    };
    const totalPedidos = pedidos.mostrador + pedidos.regalos + pedidos.pasteles + pedidos.eventos;

    // Ventas por día (mostrador + regalos)
    const byDay = new Map<string, number>();
    const addDay = (created: string, amount: number) => {
      const d = created.slice(0, 10);
      byDay.set(d, (byDay.get(d) ?? 0) + amount);
    };
    counter.forEach((r: any) => addDay(r.created_at, Number(r.total_paid ?? 0)));
    gifts.forEach((r: any) => addDay(r.created_at, Number(r.total_paid ?? r.total ?? 0)));
    cakes.forEach((r: any) => addDay(r.created_at, Number(r.deposit_paid ?? 0)));
    events.forEach((r: any) => addDay(r.created_at, Number(r.deposit_paid ?? 0)));
    const ventasPorDia = Array.from(byDay.entries()).map(([fecha, monto]) => ({ fecha, monto })).sort((a, b) => a.fecha.localeCompare(b.fecha));

    // Top productos (mostrador + regalos, desde items jsonb)
    const prodMap = new Map<string, { nombre: string; cantidad: number; ingresos: number }>();
    const addItems = (items: any) => {
      if (!Array.isArray(items)) return;
      for (const it of items) {
        const nombre = String(it?.nombre ?? it?.name ?? "—");
        const qty = Number(it?.cantidad ?? it?.qty ?? it?.quantity ?? 1);
        const precio = Number(it?.precio ?? it?.price ?? 0);
        const cur = prodMap.get(nombre) ?? { nombre, cantidad: 0, ingresos: 0 };
        cur.cantidad += qty;
        cur.ingresos += qty * precio;
        prodMap.set(nombre, cur);
      }
    };
    counter.forEach((r: any) => addItems(r.items));
    gifts.forEach((r: any) => addItems(r.items));
    const topProductos = Array.from(prodMap.values()).sort((a, b) => b.cantidad - a.cantidad).slice(0, 10);

    // Métodos de pago (mostrador + regalos)
    const metMap = new Map<string, { metodo: string; pedidos: number; monto: number }>();
    const addMet = (m: string, amt: number) => {
      const key = m || "—";
      const cur = metMap.get(key) ?? { metodo: key, pedidos: 0, monto: 0 };
      cur.pedidos += 1;
      cur.monto += amt;
      metMap.set(key, cur);
    };
    counter.forEach((r: any) => addMet(r.payment_method, Number(r.total_paid ?? 0)));
    gifts.forEach((r: any) => addMet(r.payment_method, Number(r.total_paid ?? r.total ?? 0)));
    const metodos = Array.from(metMap.values()).sort((a, b) => b.monto - a.monto);

    return {
      days,
      totalIngresos,
      totalPedidos,
      ticketPromedio: totalPedidos ? totalIngresos / totalPedidos : 0,
      ingresos,
      pedidos,
      ventasPorDia,
      topProductos,
      metodos,
      topClientes: cust.data ?? [],
    };
  });