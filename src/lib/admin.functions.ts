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

// PRODUCTS
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
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    const startDateIso = startDate.toISOString();

    // 1. Consultamos la nueva vista unificada
    const { data: orders, error: ordersError } = await s
      .from("vista_reportes_unificados")
      .select("*")
      .gte("created_at", startDateIso)
      .neq("status", "canceled");

    if (ordersError) throw ordersError;

    // Inicializamos acumuladores de datos
    let totalIngresos = 0;
    const ingresos = { mostrador: 0, regalos: 0, pasteles: 0, eventos: 0 };
    const pedidos = { mostrador: 0, regalos: 0, pasteles: 0, eventos: 0 };

    const metodosMap: Record<string, { pedidos: number; monto: number }> = {};
    const clientesMap: Record<string, { name: string; whatsapp: string; total_orders: number; total_spent: number; origen: string }> = {};

    // Rellenamos el mapa de días para garantizar una gráfica continua sin huecos temporales
    const ventasPorDiaMap: Record<string, number> = {};
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().split("T")[0];
      ventasPorDiaMap[key] = 0;
    }

    // Procesamos cada pedido de la vista unificada
    orders?.forEach((order: any) => {
      const total = Number(order.total) || 0;
      totalIngresos += total;

      // Desglose por canal
      const canal = order.canal as "mostrador" | "regalos" | "pasteles";
      if (ingresos[canal] !== undefined) {
        ingresos[canal] += total;
        pedidos[canal] += 1;
      }

      // Métodos de pago unificados
      const metodo = order.metodo_pago || "Sin especificar";
      if (!metodosMap[metodo]) {
        metodosMap[metodo] = { pedidos: 0, monto: 0 };
      }
      metodosMap[metodo].pedidos += 1;
      metodosMap[metodo].monto += total;

      // Agrupación por días
      const fecha = new Date(order.created_at).toISOString().split("T")[0];
      if (ventasPorDiaMap[fecha] !== undefined) {
        ventasPorDiaMap[fecha] += total;
      } else {
        ventasPorDiaMap[fecha] = total;
      }

      // Agrupación de clientes top (excluyendo genéricos para limpiar la tabla)
      const clienteKey = (order.cliente || "").trim();
      const esGenerico = ["Cliente Mostrador", "Cliente Regalo", "Cliente Pastel", "Cliente Desconocido", ""].includes(clienteKey);
      
      if (!esGenerico) {
        if (!clientesMap[clienteKey]) {
          clientesMap[clienteKey] = {
            name: clienteKey,
            whatsapp: order.whatsapp || "—",
            total_orders: 0,
            total_spent: 0,
            origen: order.canal === "mostrador" ? "Mostrador" : order.canal === "regalos" ? "Regalos" : "Pasteles"
          };
        }
        clientesMap[clienteKey].total_orders += 1;
        clientesMap[clienteKey].total_spent += total;
        if (order.whatsapp && clientesMap[clienteKey].whatsapp === "—") {
          clientesMap[clienteKey].whatsapp = order.whatsapp;
        }
      }
    });

    const totalPedidos = orders?.length || 0;
    const ticketPromedio = totalPedidos > 0 ? totalIngresos / totalPedidos : 0;

    // Formateamos las ventas por día ordenadas cronológicamente
    const ventasPorDia = Object.entries(ventasPorDiaMap)
      .map(([fecha, monto]) => ({ fecha, monto }))
      .sort((a, b) => a.fecha.localeCompare(b.fecha));

    // Formateamos los métodos de pago
    const metodos = Object.entries(metodosMap)
      .map(([metodo, m]) => ({ metodo, pedidos: m.pedidos, monto: m.monto }))
      .sort((a, b) => b.monto - a.monto);

    // Formateamos los clientes top ordenados descendentemente
    const topClientes = Object.values(clientesMap)
      .sort((a, b) => b.total_spent - a.total_spent)
      .slice(0, 10);

    // --- PROCESAMIENTO DE PRODUCTOS TOP ---
    const productosMap: Record<string, { nombre: string; cantidad: number; ingresos: number }> = {};

    // Consultamos los productos de regalos del periodo
    const { data: giftOrders } = await s
      .from("gift_orders")
      .select("gift_items")
      .gte("created_at", startDateIso)
      .neq("status", "canceled");

    giftOrders?.forEach((o: any) => {
      const items = Array.isArray(o.gift_items) ? o.gift_items : [];
      items.forEach((it: any) => {
        const nombre = (it.nombre || it.name || it.title || "Producto").toUpperCase();
        const cant = Number(it.qty || it.cantidad || 1);
        const precio = Number(it.precio || it.price || 0);
        if (!productosMap[nombre]) {
          productosMap[nombre] = { nombre, cantidad: 0, ingresos: 0 };
        }
        productosMap[nombre].cantidad += cant;
        productosMap[nombre].ingresos += (precio * cant);
      });
    });

    // Consultamos los productos de mostrador del periodo
    const { data: counterOrders } = await s
      .from("counter_orders")
      .select("*")
      .gte("created_at", startDateIso)
      .neq("status", "canceled");

    counterOrders?.forEach((o: any) => {
      const items = Array.isArray(o.items) ? o.items : [];
      items.forEach((it: any) => {
        const nombre = (it.nombre || it.name || it.title || "Producto").toUpperCase();
        const cant = Number(it.qty || it.cantidad || 1);
        const precio = Number(it.precio || it.price || 0);
        if (!productosMap[nombre]) {
          productosMap[nombre] = { nombre, cantidad: 0, ingresos: 0 };
        }
        productosMap[nombre].cantidad += cant;
        productosMap[nombre].ingresos += (precio * cant);
      });
    });

    const topProductos = Object.values(productosMap)
      .sort((a, b) => b.cantidad - a.cantidad)
      .slice(0, 10);

    return {
      days,
      totalIngresos,
      totalPedidos,
      ticketPromedio,
      ingresos,
      pedidos,
      ventasPorDia,
      topProductos,
      metodos,
      topClientes
    };
  });