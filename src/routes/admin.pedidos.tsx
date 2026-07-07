import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { CheckCircle2, ArrowRight, ExternalLink, XCircle, RefreshCw } from "lucide-react";
import { AdminShell } from "@/features/admin/AdminShell";
import { RequireAdmin } from "@/features/admin/RequireAdmin";
import { useAdminAuth } from "@/features/admin/AdminAuth";
import {
  adminListOrders,
  adminApproveOrder,
  adminAdvanceDelivery,
  adminCancelOrder,
} from "@/lib/admin.functions";

export const Route = createFileRoute("/admin/pedidos")({
  component: () => <RequireAdmin><AdminPedidos/></RequireAdmin>,
});

type Tab = "pendientes" | "curso" | "entregados";
const LABELS: Record<string, string> = {
  validando_pago: "Validando pago",
  en_cocina: "En cocina",
  listo: "Listo",
  en_camino: "En camino",
  entregado: "Entregado",
};

function AdminPedidos() {
  const { password } = useAdminAuth();
  const list = useServerFn(adminListOrders);
  const approve = useServerFn(adminApproveOrder);
  const advance = useServerFn(adminAdvanceDelivery);
  const cancel = useServerFn(adminCancelOrder);
  const [rows, setRows] = useState<any[]>([]);
  const [tab, setTab] = useState<Tab>("pendientes");
  const [proof, setProof] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function reload() {
    setLoading(true);
    const data = await list({ data: { password: password! } });
    setRows(data as any[]);
    setLoading(false);
  }

  useEffect(() => { reload(); /* eslint-disable-next-line */ }, []);

  const filtered = rows.filter((r) => {
    if (r.status === "CANCELLED") return false;
    if (tab === "pendientes") return r.status === "PENDING";
    if (tab === "entregados") return r.status === "DELIVERED" || r.delivery_status === "entregado";
    return r.status !== "PENDING" && r.delivery_status !== "entregado";
  });

  return (
    <AdminShell title="Pedidos">
      <div className="mb-3 flex flex-wrap items-center gap-2">
        {(["pendientes", "curso", "entregados"] as Tab[]).map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`rounded-full px-4 py-1.5 text-xs font-bold ${tab === t ? "bg-shocking text-white" : "bg-white text-mocha ring-1 ring-mocha/20"}`}>
            {t === "pendientes" ? "Pendientes de pago" : t === "curso" ? "En curso" : "Entregados"}
          </button>
        ))}
        <button onClick={reload} className="ml-auto flex items-center gap-1 rounded-full bg-white px-3 py-1.5 text-xs text-mocha ring-1 ring-mocha/20 hover:bg-crema">
          <RefreshCw className={`h-3 w-3 ${loading ? "animate-spin" : ""}`}/> Actualizar
        </button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {filtered.length === 0 && (
          <p className="col-span-full rounded-2xl bg-white p-6 text-center text-sm text-mocha ring-1 ring-mocha/10">
            No hay pedidos en esta categoría.
          </p>
        )}
        {filtered.map((r) => (
          <article key={`${r.tabla}-${r.id}`} className="rounded-2xl bg-white p-4 shadow ring-1 ring-mocha/10">
            <header className="flex items-start justify-between">
              <div>
                <p className="font-mono text-xs font-bold text-shocking">{r.payment_reference ?? r.id.slice(0, 8)}</p>
                <p className="text-sm font-semibold text-foreground">{r.cliente}</p>
                <p className="text-[11px] text-mocha">{r.whatsapp} · {r.tabla === "gift_orders" ? "Regalo" : "Mostrador"} · {r.metodo?.toUpperCase()}</p>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-shocking">${Number(r.total).toFixed(2)}</p>
                <p className="text-[10px] uppercase text-mocha">{new Date(r.created_at).toLocaleString("es-MX")}</p>
              </div>
            </header>

            <div className="mt-2 flex items-center gap-2">
              <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                r.status === "PENDING" ? "bg-sunset text-mocha" :
                r.status === "VERIFIED" ? "bg-green-100 text-green-700" :
                r.status === "DELIVERED" ? "bg-shocking/10 text-shocking" : "bg-mocha/10 text-mocha"
              }`}>{r.status}</span>
              <span className="rounded-full bg-crema px-2 py-0.5 text-[10px] font-bold text-mocha">
                {LABELS[r.delivery_status] ?? r.delivery_status}
              </span>
            </div>

            {r.direccion_texto && (
              <p className="mt-2 rounded bg-crema px-2 py-1 text-[11px] text-mocha">
                📍 {r.direccion_texto}
                {r.latitud != null && (
                  <a href={`https://www.google.com/maps/search/?api=1&query=${r.latitud},${r.longitud}`}
                     target="_blank" rel="noreferrer"
                     className="ml-2 inline-flex items-center gap-0.5 text-shocking hover:underline">
                    Maps <ExternalLink className="h-3 w-3"/>
                  </a>
                )}
              </p>
            )}

            {r.proof_image_url && (
              <button
                onClick={() => setProof(r.proof_image_url)}
                className="mt-2 flex w-full items-center gap-2 rounded-lg border border-mocha/20 p-2 text-left hover:bg-crema"
              >
                <img src={r.proof_image_url} alt="Comprobante" className="h-14 w-14 rounded object-cover"/>
                <span className="text-xs text-mocha">Ver comprobante SPEI</span>
              </button>
            )}

            <div className="mt-3 flex flex-wrap gap-2">
              {r.status === "PENDING" && (
                <button
                  onClick={async () => { await approve({ data: { password: password!, id: r.id, tabla: r.tabla } }); reload(); }}
                  className="flex items-center gap-1 rounded-full bg-green-500 px-3 py-1 text-[11px] font-bold text-white">
                  <CheckCircle2 className="h-3 w-3"/> Liberar pedido
                </button>
              )}
              {r.status !== "PENDING" && r.delivery_status !== "entregado" && (
                <button
                  onClick={async () => { await advance({ data: { password: password!, id: r.id, tabla: r.tabla, current: r.delivery_status } }); reload(); }}
                  className="flex items-center gap-1 rounded-full bg-shocking px-3 py-1 text-[11px] font-bold text-white">
                  <ArrowRight className="h-3 w-3"/> Avanzar
                </button>
              )}
              <a href={`/pedido/${r.id}`} target="_blank" rel="noreferrer"
                 className="rounded-full bg-mocha/10 px-3 py-1 text-[11px] font-bold text-mocha hover:bg-mocha/20">
                Ver semáforo
              </a>
              {r.status !== "DELIVERED" && r.status !== "CANCELLED" && (
                <button
                  onClick={async () => { if (confirm("¿Cancelar pedido?")) { await cancel({ data: { password: password!, id: r.id, tabla: r.tabla } }); reload(); } }}
                  className="flex items-center gap-1 rounded-full bg-red-100 px-3 py-1 text-[11px] font-bold text-red-700 hover:bg-red-200">
                  <XCircle className="h-3 w-3"/> Cancelar
                </button>
              )}
            </div>
          </article>
        ))}
      </div>

      {proof && (
        <div
          onClick={() => setProof(null)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
        >
          <img src={proof} alt="Comprobante" className="max-h-full max-w-full rounded-lg"/>
        </div>
      )}
    </AdminShell>
  );
}