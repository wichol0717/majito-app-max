import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useRef, useState } from "react";
import { ArrowRight, Lock, RefreshCw, Gift, MessageCircle, Camera } from "lucide-react";
import { verifyKdsPassword, kdsListActiveOrders, kdsAdvanceOrder, updateCustomOrder, updateOrderReceipt, cancelOrder, deleteOrderReceipt, batchCleanupReceipts } from "@/lib/kds.functions";
import { supabase } from "@/api/supabase";

const KEY = "majito_kds_pass";

export const Route = createFileRoute("/cocina")({
  component: CocinaPage,
  head: () => ({ meta: [{ title: "Cocina KDS · Majito Cake" }] }),
});

const LABELS: Record<string, string> = {
  validando_pago: "Validando pago",
  en_cocina: "En cocina",
  listo: "Listo",
  en_camino: "En camino",
};
const COLUMNS: { key: string; title: string; color: string }[] = [
  { key: "validando_pago", title: "Validando pago", color: "bg-sunset" },
  { key: "en_cocina", title: "En cocina", color: "bg-shocking" },
  { key: "listo", title: "Listo", color: "bg-green-500" },
  { key: "en_camino", title: "En camino", color: "bg-mocha" },
];

function CocinaPage() {
  const [password, setPassword] = useState<string | null>(null);
  useEffect(() => {
    if (typeof window !== "undefined") setPassword(sessionStorage.getItem(KEY));
  }, []);
  if (!password) return <PasswordGate onOk={(p) => { sessionStorage.setItem(KEY, p); setPassword(p); }} />;
  return <KDSBoard password={password} onLogout={() => { sessionStorage.removeItem(KEY); setPassword(null); }} />;
}

function PasswordGate({ onOk }: { onOk: (p: string) => void }) {
  const verify = useServerFn(verifyKdsPassword);
  const [value, setValue] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setErr("");
    try {
      const { ok } = await verify({ data: { password: value } });
      if (ok) onOk(value); else setErr("Contraseña incorrecta");
    } catch { setErr("Error al verificar"); }
    finally { setBusy(false); }
  }
  return (
    <main className="grid min-h-screen place-items-center bg-crema p-6">
      <form onSubmit={submit} className="w-full max-w-sm rounded-2xl bg-white p-6 shadow ring-1 ring-mocha/10">
        <div className="mb-4 flex items-center gap-2 text-shocking">
          <Lock className="h-5 w-5" />
          <h1 className="text-lg font-bold">Cocina KDS</h1>
        </div>
        <p className="mb-4 text-xs text-mocha">Acceso restringido a cocina y administración.</p>
        <input type="password" value={value} onChange={(e) => setValue(e.target.value)} autoFocus
          placeholder="Contraseña"
          className="mb-2 w-full rounded-lg border border-mocha/20 px-3 py-2 text-sm outline-none focus:border-shocking" />
        {err && <p className="mb-2 text-xs text-red-600">{err}</p>}
        <button disabled={busy || !value} className="w-full rounded-full bg-shocking py-2 text-sm font-bold text-white disabled:opacity-60">
          {busy ? "Verificando…" : "Entrar"}
        </button>
        <Link to="/" className="mt-3 block text-center text-[11px] text-mocha hover:text-shocking">← Salir</Link>
      </form>
    </main>
  );
}

function KDSBoard({ password, onLogout }: { password: string; onLogout: () => void }) {
  const list = useServerFn(kdsListActiveOrders);
  const advance = useServerFn(kdsAdvanceOrder);
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tempPrices, setTempPrices] = useState<Record<string, string>>({});
  const prevIds = useRef<Set<string>>(new Set());

  const formatWaNumber = (phone: any) => {
    if (!phone) return "";
    const cleaned = String(phone).replace(/[^0-9]/g, "");
    if (cleaned.length === 10) return `52${cleaned}`;
    if (cleaned.length === 12 && cleaned.startsWith("52")) return cleaned;
    if (cleaned.length === 13 && cleaned.startsWith("521")) return `52${cleaned.slice(3)}`;
    return cleaned;
  };

  const handleUploadReceipt = async (e: React.ChangeEvent<HTMLInputElement>, orderId: string, tabla: string) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const fileName = `receipts/${orderId}_${Date.now()}.jpg`;
      const { error: uploadError } = await supabase.storage.from("comprobantes-pago").upload(fileName, file, { upsert: true });
      if (uploadError) throw uploadError;
      const { data: { publicUrl } } = supabase.storage.from("comprobantes-pago").getPublicUrl(fileName);

      await updateOrderReceipt({ data: { password, id: orderId, tabla: tabla as any, payment_receipt_url: publicUrl } });

      setRows((prevRows) => 
        prevRows.map((r) => 
          r.id === orderId ? { ...r, payment_receipt_url: publicUrl } : r
        )
      );
      alert("Comprobante subido correctamente");
    } catch (err) {
      console.error(err);
      alert("Error al guardar: " + (err as Error).message);
    }
  };

  async function reload(silent = false) {
    if (!silent) setLoading(true);
    try {
      const data = (await list({ data: { password } })) as any[];
      const currentIds = new Set(data.map((r) => `${r.tabla}-${r.id}`));
      const isNew = [...currentIds].some((id) => !prevIds.current.has(id));
      if (isNew && prevIds.current.size > 0 && typeof window !== "undefined") {
        try {
          const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
          if (ctx.state === "suspended") {
            ctx.resume();
          }
          const o = ctx.createOscillator(); const g = ctx.createGain();
          o.frequency.value = 880; g.gain.value = 0.15;
          o.connect(g); g.connect(ctx.destination); o.start();
          setTimeout(() => { o.stop(); ctx.close(); }, 250);
        } catch {}
      }
      prevIds.current = currentIds;
      setRows(data);
      setError(null);
    } catch (e: any) {
      setError(e?.message ?? "Error");
    } finally {
      if (!silent) setLoading(false);
    }
  }

  useEffect(() => {
    reload();
    const id = setInterval(() => reload(true), 2000);
    return () => clearInterval(id);
  }, []);

  const byCol = (key: string) => rows.filter((r) => r.delivery_status === key);

  return (
    <main className="min-h-screen bg-crema pb-12">
      <header className="border-b border-mocha/20 bg-white">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-2 px-6 py-4">
          <h1 className="text-xl font-bold text-shocking">Cocina Majito · KDS</h1>
          <div className="flex items-center gap-2 text-xs text-mocha">
            <span className="inline-flex items-center gap-1">
              <span className={`h-2 w-2 rounded-full ${loading ? "bg-sunset animate-pulse" : "bg-green-500"}`} />
              {loading ? "Actualizando…" : "En vivo"}
            </span>
            <button onClick={() => reload(false)} className="flex items-center gap-1 rounded-full bg-white px-3 py-1 ring-1 ring-mocha/20 hover:bg-crema">
              <RefreshCw className={`h-3 w-3 ${loading ? "animate-spin" : ""}`} /> Refrescar
            </button>
            <button 
              onClick={async () => {
                  const confirmar = window.confirm("¿Ejecutar limpieza masiva de recibos en pedidos finalizados? Esto borrará permanentemente las imágenes de los pedidos ya entregados.");
                  if (confirmar) {
                      try {
                          const res = await batchCleanupReceipts({ data: { password } });
                          alert(`Limpieza completada. Se borraron ${res.totalDeleted} recibos.`);
                          reload();
                      } catch (e) {
                          alert("Error al limpiar: " + (e as Error).message);
                      }
                  }
              }}
              className="flex items-center gap-1 rounded-full bg-red-100 px-3 py-1 text-red-600 hover:bg-red-200 transition-all"
            >
              🧹 Limpiar
            </button>
            <button onClick={onLogout} className="rounded-full bg-mocha/10 px-3 py-1 hover:bg-mocha/20">Salir</button>
          </div>
        </div>
      </header>
      {error && <p className="mx-auto max-w-7xl px-6 pt-4 text-sm text-red-600">{error}</p>}
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-4 px-4 pt-6 md:grid-cols-2 lg:grid-cols-4">
        {COLUMNS.map((col) => {
          const items = byCol(col.key);
          return (
            <section key={col.key} className="flex min-h-[400px] flex-col rounded-2xl bg-white shadow-sm ring-1 ring-mocha/10">
              <header className={`flex items-center justify-between rounded-t-2xl ${col.color} px-4 py-3 text-white`}>
                <h3 className="text-base font-bold">{col.title}</h3>
                <span className="rounded-full bg-white/25 px-2 py-0.5 text-xs font-bold">{items.length}</span>
              </header>
              <div className="flex-1 space-y-2 p-3">
                {items.length === 0 && (
                  <p className="rounded-xl border border-dashed border-mocha/30 p-4 text-center text-xs text-mocha">Sin pedidos.</p>
                )}
                {items.map((r) => {
                  const mins = Math.floor((Date.now() - new Date(r.created_at).getTime()) / 60000);
                  const late = mins >= 20;
                  const identifier = r.payment_reference || r.id.slice(0, 8);
                  
                  return (
                    <article key={`${r.tabla}-${r.id}`} className={`rounded-xl border p-3 ${late ? "border-red-400 bg-red-50" : "border-mocha/15 bg-crema/40"}`}>
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-mono text-[11px] font-bold text-shocking">{identifier}</p>
                            {r.tabla === "custom_cake_orders" && (
                              <button onClick={async () => {
                                if (confirm("¿Cancelar este pedido?")) {
                                  await cancelOrder({ data: { password, id: r.id, tabla: r.tabla } });
                                  reload();
                                }
                              }} className="rounded-full bg-red-100 px-1.5 py-0 text-[10px] font-bold text-red-600 hover:bg-red-200">✕</button>
                            )}
                          </div>
                          <div className="flex items-center gap-1">
                            <p className="text-sm font-semibold text-foreground">{r.cliente || r.customer_name || r.nombre_cliente}</p>
                            {(r.telefono || r.customer_whatsapp) && (
                              <a href={`https://wa.me/${formatWaNumber(r.telefono || r.customer_whatsapp)}`} target="_blank" rel="noreferrer" className="text-[10px] font-bold text-green-600 underline">WP</a>
                            )}
                          </div>
                          <p className="text-[10px] uppercase text-mocha">
                            {r.tabla === "gift_orders" ? "Regalo" : r.tabla === "custom_cake_orders" ? "Personalizado" : "Mostrador"} 
                            {r.metodo ? ` · ${r.metodo.toUpperCase()}` : ""}
                          </p>
                        </div>
                        <div className="text-right">
                          {r.total > 0 && <p className="text-sm font-bold text-shocking">${Number(r.total).toFixed(0)}</p>}
                          <p className={`text-[10px] font-bold ${late ? "text-red-600" : "text-mocha"}`}>{mins}m</p>
                        </div>
                      </div>

                      {r.tabla === "custom_cake_orders" ? (
                        <div className="mt-2 space-y-2">
                          <p className="text-xs font-semibold text-shocking">Sabor: {r.flavor_chosen}</p>
                          <p className="text-xs text-mocha">Entrega: {r.delivery_date}</p>
                          {(r.detalles || r.notes) && <p className="rounded bg-white px-2 py-1 text-[11px] italic text-mocha">📝 {r.detalles || r.notes}</p>}
                          {r.total === 0 && (
                            <div className="mt-2 flex gap-1">
                               <input 
                                 type="number" 
                                 placeholder="Total ($)" 
                                 value={tempPrices[r.id] ?? ""}
                                 onChange={(e) => setTempPrices(prev => ({ ...prev, [r.id]: e.target.value }))}
                                 className="w-full rounded border border-mocha/20 px-2 py-1 text-xs outline-none focus:border-shocking" 
                               />
                               <button onClick={async () => {
                                  const val = tempPrices[r.id];
                                  if (!val) return;
                                  await updateCustomOrder({ data: { password, id: r.id, total: Number(val) } });
                                  setTempPrices(prev => {
                                    const copy = { ...prev };
                                    delete copy[r.id];
                                    return copy;
                                  });
                                  reload();
                               }} className="rounded bg-green-500 px-3 py-1 text-xs font-bold text-white hover:bg-green-600">OK</button>
                            </div>
                          )}
                          {r.reference_image_url && (
                               <a href={r.reference_image_url} target="_blank" rel="noreferrer" className="flex items-center justify-center gap-1 rounded-full bg-blue-500 py-2 text-[10px] font-bold text-white hover:bg-blue-600 transition-all">
                                  <Camera className="h-3 w-3" /> Ver Foto Referencia
                               </a>
                          )}
                        </div>
                      ) : (
                        <>
                          {/* ÍTEMS DE PEDIDOS NORMALES / MOSTRADOR */}
                          {r.items && Array.isArray(r.items) && r.items.length > 0 && (
                            <ul className="mt-2 space-y-0.5 text-[11px] text-mocha">
                              {r.items.slice(0, 6).map((it: any, i: number) => {
                                const sizeStr = it.tamano || it.tamaño || it.size || it.variante || it.variant || it.selectedSize || it.talla;
                                return (
                                  <li key={i}>
                                    • {it.qty ?? it.cantidad ?? 1}× {it.nombre ?? it.name ?? it.title ?? "producto"}
                                    {sizeStr && <span className="ml-1 font-bold text-shocking">({String(sizeStr).toUpperCase()})</span>}
                                  </li>
                                );
                              })}
                            </ul>
                          )}

                          {/* ÍTEMS DE PEDIDOS DE REGALO (gift_items) */}
                          {r.gift_items && Array.isArray(r.gift_items) && r.gift_items.length > 0 && (
                            <ul className="mt-2 space-y-0.5 text-[11px] font-semibold text-shocking">
                              {r.gift_items.map((it: any, i: number) => {
                                const sizeStr = it.tamano || it.tamaño || it.size || it.variante || it.variant || it.selectedSize || it.talla;
                                return (
                                  <li key={i}>
                                    • {it.cantidad ?? 1}× {it.producto ?? "Producto de regalo"}
                                    {sizeStr && <span className="ml-1 font-extrabold underline">({String(sizeStr).toUpperCase()})</span>}
                                    {it.mensaje ? ` [Msg: "${it.mensaje}"]` : ""}
                                  </li>
                                );
                              })}
                            </ul>
                          )}

                          {/* FALLBACK SI ES REGALO INDIVIDUAL CON 'producto' */}
                          {!r.items?.length && !r.gift_items?.length && r.producto && (
                            <p className="mt-2 text-[11px] font-semibold text-shocking">
                              • {r.cantidad ?? 1}× {r.producto}
                              {(r.tamano || r.tamaño || r.size || r.variante || r.variant) && (
                                <span className="ml-1 font-extrabold underline">
                                  ({String(r.tamano || r.tamaño || r.size || r.variante || r.variant).toUpperCase()})
                                </span>
                              )}
                            </p>
                          )}

                          {r.notas && <p className="mt-2 rounded bg-white px-2 py-1 text-[11px] italic text-mocha">📝 {r.notas}</p>}
                          {r.dedicatoria && <p className="mt-2 rounded bg-pink-50 px-2 py-1 text-[11px] italic text-rose-600">💌 {r.dedicatoria}</p>}

                          {/* DETALLES Y DESTINATARIO DEL REGALO */}
                          {r.tabla === "gift_orders" && (r.recipient_name || r.mensaje) && (
                            <div className="mt-2 rounded border border-pink-200 bg-pink-50/80 p-2 text-[11px] text-shocking">
                              <p className="font-bold flex items-center gap-1">
                                <Gift className="h-3 w-3" /> Datos del Destinatario:
                              </p>
                              {r.recipient_name && <p className="text-mocha">Para: <strong className="text-foreground">{r.recipient_name}</strong></p>}
                              {r.mensaje && <p className="mt-0.5 italic font-medium">"{r.mensaje}"</p>}
                            </div>
                          )}
                        </>
                      )}
                      
                      {/* BOTÓN UNIVERSAL DE RECIBO */}
                      <div className="mt-3">
                        {r.payment_receipt_url ? (
                            <div className="flex gap-2">
                                <a href={r.payment_receipt_url} target="_blank" rel="noreferrer" className="flex flex-1 items-center justify-center gap-1 rounded-full bg-emerald-500 py-2 text-[10px] font-bold text-white hover:bg-emerald-600 transition-all">
                                  📄 Ver Recibo
                                </a>
                                <button 
                                  onClick={async () => {
                                      if (confirm("¿Seguro que quieres borrar este recibo del servidor?")) {
                                          await deleteOrderReceipt({ 
                                            data: { 
                                              password, 
                                              id: r.id, 
                                              tabla: r.tabla, 
                                              url: r.payment_receipt_url, 
                                              bucketName: "comprobantes-pago" 
                                            } 
                                          });
                                          reload();
                                      }
                                  }}
                                  className="rounded-full bg-red-500 px-3 py-2 text-[10px] font-bold text-white hover:bg-red-600 transition-all"
                                >
                                  🗑️
                                </button>
                            </div>
                          ) : (
                            <label className="flex w-full cursor-pointer items-center justify-center gap-1 rounded-full bg-amber-500 py-2 text-[10px] font-bold text-white hover:bg-amber-600 transition-all">
                              <Camera className="h-3 w-3" /> Subir Recibo
                              <input type="file" accept="image/*" className="hidden" onChange={(e) => handleUploadReceipt(e, r.id, r.tabla)} />
                            </label>
                        )}
                      </div>

                      {r.tabla === "gift_orders" && (
                        <div className="grid grid-cols-2 gap-2 mt-2">
                            <Link to="/regalo/$id" params={{ id: identifier }} target="_blank" className="flex w-full items-center justify-center gap-1 rounded-full bg-emerald-600 py-2 text-xs font-bold text-white active:scale-[0.98]">
                                <Gift className="h-3 w-3" /> Ver
                            </Link>
                            <button onClick={() => {
                                    const phone = formatWaNumber(r.recipient_whatsapp || r.customer_whatsapp || r.telefono || "");
                                    const link = `${window.location.origin}/regalo/${identifier}`;
                                    if (phone) window.open(`https://wa.me/${phone}?text=${encodeURIComponent(`¡Hola! Tienes una sorpresa dulce de Majito Cake. Ábrela aquí: ${link}`)}`, '_blank');
                                }} className="flex w-full items-center justify-center gap-1 rounded-full bg-green-500 py-2 text-xs font-bold text-white active:scale-[0.98]">
                                <MessageCircle className="h-3 w-3" /> Enviar
                            </button>
                        </div>
                      )}

                      {col.key !== "en_camino" ? (
                        <>
                          {col.key === "listo" && (
                            <button
                              onClick={() => {
                                const phone = formatWaNumber(r.telefono || r.customer_whatsapp);
                                const message = `¡Hola! Tu pedido está listo. 🎂 Te compartimos una foto. Por favor apóyanos liquidando el saldo pendiente (Total: $${r.total}). Quedamos pendientes.`;
                                window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, '_blank');
                              }}
                              className="mt-2 flex w-full items-center justify-center gap-1 rounded-full bg-blue-500 py-2 text-xs font-bold text-white active:scale-[0.98]"
                            >
                              <MessageCircle className="h-3 w-3" /> Cobrar Saldo
                            </button>
                          )}
                          <button
                            onClick={async () => {
                              await advance({ data: { password, id: r.id, tabla: r.tabla, current: r.delivery_status } });
                              reload();
                            }}
                            className="mt-2 flex w-full items-center justify-center gap-1 rounded-full bg-shocking py-2 text-xs font-bold text-white active:scale-[0.98]">
                            <ArrowRight className="h-3 w-3" /> Avanzar a {LABELS[
                              col.key === "validando_pago" ? "en_cocina" :
                              col.key === "en_cocina" ? "listo" :
                              col.key === "listo" ? "en_camino" : "en_camino"
                            ]}
                          </button>
                        </>
                      ) : (
                        <div className="mt-2 space-y-1">
                          <p className="text-center text-[10px] text-mocha">Repartidor en ruta</p>
                          <button
                            onClick={async () => {
                              await advance({ data: { password, id: r.id, tabla: r.tabla, current: r.delivery_status } });
                              reload();
                            }}
                            className="flex w-full items-center justify-center gap-1 rounded-full bg-green-500 py-2 text-xs font-bold text-white active:scale-[0.98]">
                            Finalizar Pedido
                          </button>
                        </div>
                      )}
                    </article>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>

      <p className="mx-auto mt-6 max-w-7xl px-6 text-center text-[11px] text-mocha">
        Auto-refresco cada 2s · <Link to="/" className="hover:text-shocking">Volver al sitio</Link>
      </p>
    </main>
  );
}