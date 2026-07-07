import { createServerFn } from "@tanstack/react-start";
import { timingSafeEqual } from "node:crypto";

// Contraseña dedicada del KDS (cocina). Independiente del panel admin.
const KDS_PASSWORD = "majito2005";

function checkKdsPassword(input: string) {
  const a = Buffer.from(input ?? "");
  const b = Buffer.from(KDS_PASSWORD);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export const verifyKdsPassword = createServerFn({ method: "POST" })
  .inputValidator((d: { password: string }) => d)
  .handler(async ({ data }) => ({ ok: checkKdsPassword(data.password) }));

async function ensureKds(password: string) {
  if (!checkKdsPassword(password)) throw new Error("Contraseña KDS incorrecta");
  const { majitoAdmin } = await import("@/integrations/supabase/majito-admin.server");
  return majitoAdmin;
}

const AVANCE: Record<string, string> = {
  validando_pago: "en_cocina",
  en_cocina: "listo",
  listo: "en_camino",
  en_camino: "entregado",
};

type Tabla = "counter_orders" | "gift_orders";

export const kdsListActiveOrders = createServerFn({ method: "POST" })
  .inputValidator((d: { password: string }) => d)
  .handler(async ({ data }) => {
    const s: any = await ensureKds(data.password);
    const [c, g] = await Promise.all([
      s.from("counter_orders").select("*").order("created_at", { ascending: true }).limit(200),
      s.from("gift_orders").select("*").order("created_at", { ascending: true }).limit(200),
    ]);
    if (c.error) throw c.error;
    if (g.error) throw g.error;
    const norm = (r: any, tabla: Tabla) => ({
      tabla,
      id: r.id,
      cliente: r.customer_name,
      total: Number(r.total_paid ?? r.total ?? 0),
      metodo: r.payment_method,
      status: r.status,
      delivery_status: r.delivery_status ?? "validando_pago",
      direccion_texto: r.direccion_texto,
      payment_reference: r.payment_reference,
      created_at: r.created_at,
      items: r.items ?? r.productos ?? null,
      notas: r.notas ?? r.notes ?? null,
    });
    const all = [
      ...(c.data ?? []).map((r: any) => norm(r, "counter_orders")),
      ...(g.data ?? []).map((r: any) => norm(r, "gift_orders")),
    ];
    // Solo pedidos activos: no cancelados y no entregados
    return all.filter(
      (r) => r.status !== "CANCELLED" && r.status !== "DELIVERED" && r.delivery_status !== "entregado",
    );
  });

export const kdsAdvanceOrder = createServerFn({ method: "POST" })
  .inputValidator((d: { password: string; id: string; tabla: Tabla; current: string }) => d)
  .handler(async ({ data }) => {
    const s: any = await ensureKds(data.password);
    const next = AVANCE[data.current] ?? "en_cocina";
    const patch: any = { delivery_status: next };
    if (next === "entregado") patch.status = "DELIVERED";
    const { error } = await s.from(data.tabla).update(patch).eq("id", data.id);
    if (error) throw error;
    return { ok: true, next };
  });