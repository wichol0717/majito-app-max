import { createServerFn } from "@tanstack/react-start";
import { timingSafeEqual } from "node:crypto";

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

type Tabla = "counter_orders" | "gift_orders" | "custom_cake_orders";

export const kdsListActiveOrders = createServerFn({ method: "POST" })
  .inputValidator((d: { password: string }) => d)
  .handler(async ({ data }) => {
    const s: any = await ensureKds(data.password);
    const [c, g, cc] = await Promise.all([
      s.from("counter_orders").select("*").order("created_at", { ascending: true }).limit(200),
      s.from("gift_orders").select("*").order("created_at", { ascending: true }).limit(200),
      s.from("custom_cake_orders").select("*").order("created_at", { ascending: true }).limit(200),
    ]);
    if (c.error) throw c.error;
    if (g.error) throw g.error;
    if (cc.error) throw cc.error;

    const norm = (r: any, tabla: Tabla) => ({
      tabla,
      id: r.id,
      cliente: r.customer_name ?? r.nombre_cliente ?? "Sin nombre",
      total: Number(r.total_paid ?? r.total ?? 0),
      metodo: r.payment_method,
      status: r.status,
      delivery_status: r.delivery_status ?? "validando_pago",
      direccion_texto: r.direccion_texto,
      payment_reference: r.payment_reference,
      created_at: r.created_at,
      items: r.items ?? r.productos ?? null,
      notas: r.notas ?? r.notes ?? r.detalles ?? null,
      detalles: r.detalles ?? null,
      dedicatoria: r.dedicatoria ?? r.mensaje ?? null,
      telefono: r.phone ?? r.customer_phone ?? r.telefono ?? r.customer_whatsapp ?? null,
      recipient_whatsapp: r.recipient_whatsapp ?? null,
      customer_whatsapp: r.customer_whatsapp ?? null,
      gift_items: r.gift_items ?? null,
      flavor_chosen: r.flavor_chosen ?? null,
      delivery_date: r.delivery_date ?? null,
      reference_image_url: r.reference_image_url ?? r.reference_photo_url ?? null,
      payment_receipt_url: r.payment_receipt_url ?? r.proof_image_url ?? null,
    });
    
    const all = [
      ...(c.data ?? []).map((r: any) => norm(r, "counter_orders")),
      ...(g.data ?? []).map((r: any) => norm(r, "gift_orders")),
      ...(cc.data ?? []).map((r: any) => norm(r, "custom_cake_orders")),
    ];
    
    return all.filter(
      (r) => r.status !== "cancelled" && r.status !== "delivered" && r.delivery_status !== "entregado",
    );
  });

export const kdsAdvanceOrder = createServerFn({ method: "POST" })
  .inputValidator((d: { password: string; id: string; tabla: Tabla; current: string }) => d)
  .handler(async ({ data }) => {
    const s: any = await ensureKds(data.password);
    const next = AVANCE[data.current] ?? "en_cocina";
    const patch: any = { delivery_status: next };
    if (next === "entregado") patch.status = "delivered";
    const { error } = await s.from(data.tabla).update(patch).eq("id", data.id);
    if (error) throw error;
    return { ok: true, next };
  });

export const updateCustomOrder = createServerFn({ method: "POST" })
  .inputValidator((d: { password: string; id: string; total?: number; payment_receipt_url?: string }) => d)
  .handler(async ({ data }) => {
    const s: any = await ensureKds(data.password);
    
    const updatePayload: any = {};
    if (data.total !== undefined) updatePayload.total = data.total;
    if (data.payment_receipt_url !== undefined) updatePayload.payment_receipt_url = data.payment_receipt_url;

    const { error } = await s
      .from("custom_cake_orders")
      .update(updatePayload)
      .eq("id", data.id);
      
    if (error) throw error;
    return { ok: true };
  });

export const cancelOrder = createServerFn({ method: "POST" })
  .inputValidator((d: { password: string; id: string; tabla: Tabla }) => d)
  .handler(async ({ data }) => {
    const s: any = await ensureKds(data.password);
    const { error } = await s
      .from(data.tabla)
      .update({ status: "cancelled" })
      .eq("id", data.id);
    if (error) throw error;
    return { ok: true };
  });

export const updateOrderReceipt = createServerFn({ method: "POST" })
  .inputValidator((d: { password: string; id: string; tabla: Tabla; payment_receipt_url: string }) => d)
  .handler(async ({ data }) => {
    const s: any = await ensureKds(data.password);
    
    const { error } = await s
      .from(data.tabla)
      .update({ payment_receipt_url: data.payment_receipt_url })
      .eq("id", data.id);
      
    if (error) throw error;
    return { ok: true };
  });

export const deleteOrderReceipt = createServerFn({ method: "POST" })
  .inputValidator((d: { password: string; id: string; tabla: Tabla; url: string; bucketName: string }) => d)
  .handler(async ({ data }) => {
    const s: any = await ensureKds(data.password);
    
    const urlParts = data.url.split(`${data.bucketName}/`);
    if (urlParts.length < 2) throw new Error("No se pudo extraer la ruta del archivo");
    const filePath = urlParts[1]; 

    const { error: storageError } = await s.storage
      .from(data.bucketName)
      .remove([filePath]);
      
    if (storageError) throw storageError;

    const { error: dbError } = await s
      .from(data.tabla)
      .update({ payment_receipt_url: null })
      .eq("id", data.id);
      
    if (dbError) throw dbError;

    return { ok: true };
  });

export const batchCleanupReceipts = createServerFn({ method: "POST" })
  .inputValidator((d: { password: string }) => d)
  .handler(async ({ data }) => {
    const s: any = await ensureKds(data.password);
    const tables: Tabla[] = ["counter_orders", "gift_orders", "custom_cake_orders"];
    let totalDeleted = 0;
    const targetBucket = "comprobantes-pago";

    for (const table of tables) {
      const { data: orders, error } = await s.from(table)
        .select("id, payment_receipt_url, proof_image_url, status, delivery_status");

      if (error || !orders) continue;

      for (const order of orders) {
        const isDelivered = order.status === "delivered" || order.delivery_status === "entregado";
        
        if (!isDelivered) continue;

        const urls = [order.payment_receipt_url, order.proof_image_url].filter(Boolean);
        
        for (const url of urls) {
          if (typeof url === 'string' && url.includes(`${targetBucket}/`)) {
            try {
              const path = url.split(`${targetBucket}/`)[1];
              await s.storage.from(targetBucket).remove([path]);
              totalDeleted++;
            } catch (e) {
              console.error("Error al borrar archivo:", e);
            }
          }
        }

        await s.from(table)
          .update({ payment_receipt_url: null, proof_image_url: null })
          .eq("id", order.id);
      }
    }
    return { ok: true, totalDeleted };
  });

export const forceWipeBucket = createServerFn({ method: "POST" })
  .inputValidator((d: { password: string }) => d)
  .handler(async ({ data }) => {
    const s: any = await ensureKds(data.password);
    const bucketName = "comprobantes-pago";
    
    const { data: files, error: listError } = await s.storage
      .from(bucketName)
      .list();

    if (listError) throw listError;
    if (!files || files.length === 0) return { ok: true, totalDeleted: 0 };

    const fileNames = files
      .filter((f: any) => f.name !== 'receipts')
      .map((f: any) => f.name);

    if (fileNames.length === 0) return { ok: true, totalDeleted: 0 };

    const { error: deleteError } = await s.storage
      .from(bucketName)
      .remove(fileNames);

    if (deleteError) throw deleteError;

    return { ok: true, totalDeleted: fileNames.length };
  });

// --- BUSCADOR UNIVERSAL PARA RASTREO (BÚSQUEDA EN MEMORIA) ---
export const lookupOrder = createServerFn({ method: "POST" })
  .inputValidator((d: { orderId: string; password: string }) => d)
  .handler(async ({ data }) => {
    const s: any = await ensureKds(data.password);
    const tables: Tabla[] = ["counter_orders", "gift_orders", "custom_cake_orders"];
    const cleanId = data.orderId.trim().toLowerCase();

    console.log(`[DEBUG] Buscando ID: "${cleanId}" en toda la base de datos...`);

    for (const table of tables) {
      // Obtenemos todos los registros de la tabla (limitado a 1000 para seguridad)
      const { data: orders, error } = await s
        .from(table)
        .select("*")
        .limit(1000);

      if (error) continue;

      // Filtramos en memoria (comparando el string del ID o la referencia)
      const foundOrder = orders.find((o: any) => {
        const idMatch = String(o.id).toLowerCase().includes(cleanId);
        const refMatch = String(o.payment_reference || "").toLowerCase().includes(cleanId);
        return idMatch || refMatch;
      });

      if (foundOrder) {
        console.log(`[DEBUG] ¡Encontrado en ${table}!`, foundOrder);
        return { 
          found: true, 
          order: { ...foundOrder, tabla_origen: table }, 
          tabla: table 
        };
      }
    }
    
    console.log(`[DEBUG] No se encontró el ID "${cleanId}" en ninguna tabla.`);
    return { found: false };
  });