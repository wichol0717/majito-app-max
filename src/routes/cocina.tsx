import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useRef, useState } from "react";
import { ArrowRight, Lock, RefreshCw } from "lucide-react";
import { verifyKdsPassword, kdsListActiveOrders, kdsAdvanceOrder } from "@/lib/kds.functions";

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
  const prevIds = useRef<Set<string>>(new Set());

  async function reload() {
    setLoading(true);
    try {
      const data = (await list({ data: { password } })) as any[];
      const currentIds = new Set(data.map((r) => `${r.tabla}-${r.id}`));
      const isNew = [...currentIds].some((id) => !prevIds.current.has(id));
      if (isNew && prevIds.current.size > 0 && typeof window !== "undefined") {
        try {
          const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
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
    } finally { setLoading(false); }
  }

  useEffect(() => {
    reload();
    const id = setInterval(reload, 4000);
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
            <button onClick={reload} className="flex items-center gap-1 rounded-full bg-white px-3 py-1 ring-1 ring-mocha/20 hover:bg-crema">
              <RefreshCw className={`h-3 w-3 ${loading ? "animate-spin" : ""}`} /> Refrescar
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
                  return (
                    <article key={`${r.tabla}-${r.id}`} className={`rounded-xl border p-3 ${late ? "border-red-400 bg-red-50" : "border-mocha/15 bg-crema/40"}`}>
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-mono text-[11px] font-bold text-shocking">{r.payment_reference ?? String(r.id).slice(0, 8)}</p>
                          <p className="text-sm font-semibold text-foreground">{r.cliente}</p>
                          <p className="text-[10px] uppercase text-mocha">
                            {r.tabla === "gift_orders" ? "Regalo" : "Mostrador"} · {r.metodo?.toUpperCase() ?? "—"}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold text-shocking">${Number(r.total).toFixed(0)}</p>
                          <p className={`text-[10px] font-bold ${late ? "text-red-600" : "text-mocha"}`}>{mins}m</p>
                        </div>
                      </div>
                      {r.items && Array.isArray(r.items) && (
                        <ul className="mt-2 space-y-0.5 text-[11px] text-mocha">
                          {r.items.slice(0, 6).map((it: any, i: number) => (
                            <li key={i}>• {it.qty ?? it.cantidad ?? 1}× {it.nombre ?? it.name ?? it.title ?? "producto"}</li>
                          ))}
                        </ul>
                      )}
                      {r.notas && <p className="mt-2 rounded bg-white px-2 py-1 text-[11px] italic text-mocha">📝 {r.notas}</p>}
                      {col.key !== "en_camino" ? (
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
        Auto-refresco cada 4s · <Link to="/" className="hover:text-shocking">Volver al sitio</Link>
      </p>
    </main>
  );
}