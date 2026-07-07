import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { CheckCircle2, Circle, MapPin, ArrowLeft } from "lucide-react";
import { supabase } from "@/api/supabase";

export const Route = createFileRoute("/pedido/$id")({
  head: () => ({ meta: [{ title: "Rastreo de pedido — Majito Cake" }, { name: "robots", content: "noindex" }] }),
  component: RastreoPedido,
});

type EstadoEntrega = "validando_pago" | "en_cocina" | "listo" | "en_camino" | "entregado";

const PASOS: { key: EstadoEntrega; label: string; emoji: string }[] = [
  { key: "validando_pago", label: "Validando pago", emoji: "💳" },
  { key: "en_cocina",       label: "En cocina",       emoji: "👩‍🍳" },
  { key: "listo",           label: "Listo",           emoji: "🎂" },
  { key: "en_camino",       label: "En camino",       emoji: "🚚" },
  { key: "entregado",       label: "Entregado",       emoji: "🎉" },
];

interface Pedido {
  id: string;
  tipo: "mostrador" | "regalo";
  cliente: string;
  total: number;
  ref: string | null;
  status: string;
  delivery: EstadoEntrega;
  direccion: string | null;
  lat: number | null;
  lng: number | null;
  created_at: string;
}

async function fetchPedido(id: string): Promise<Pedido | null> {
  const c = await supabase.from("counter_orders").select("*").eq("id", id).maybeSingle();
  if (c.data) {
    const r: any = c.data;
    return {
      id: r.id, tipo: "mostrador",
      cliente: r.customer_name, total: Number(r.total_paid),
      ref: r.payment_reference, status: r.status,
      delivery: (r.delivery_status ?? "validando_pago") as EstadoEntrega,
      direccion: r.direccion_texto, lat: r.latitud, lng: r.longitud,
      created_at: r.created_at,
    };
  }
  const g = await supabase.from("gift_orders").select("*").eq("id", id).maybeSingle();
  if (g.data) {
    const r: any = g.data;
    return {
      id: r.id, tipo: "regalo",
      cliente: r.customer_name, total: Number(r.total_paid),
      ref: r.payment_reference, status: r.status,
      delivery: (r.delivery_status ?? "validando_pago") as EstadoEntrega,
      direccion: r.direccion_texto, lat: r.latitud, lng: r.longitud,
      created_at: r.created_at,
    };
  }
  return null;
}

function RastreoPedido() {
  const { id } = Route.useParams();
  const [pedido, setPedido] = useState<Pedido | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    async function load() {
      const p = await fetchPedido(id);
      if (alive) { setPedido(p); setLoading(false); }
    }
    load();
    const t = setInterval(load, 15000);
    return () => { alive = false; clearInterval(t); };
  }, [id]);

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center bg-crema text-mocha">Cargando pedido…</div>;
  }
  if (!pedido) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-crema px-4 text-center">
        <p className="text-lg font-bold text-shocking">Pedido no encontrado</p>
        <p className="text-sm text-mocha">Verifica el enlace o vuelve al inicio.</p>
        <Link to="/" className="rounded-full bg-shocking px-4 py-2 text-sm font-bold text-white">Ir al inicio</Link>
      </div>
    );
  }

  const activeIdx = PASOS.findIndex((p) => p.key === pedido.delivery);

  return (
    <div className="min-h-screen bg-crema px-4 py-6">
      <div className="mx-auto max-w-lg space-y-4">
        <Link to="/" className="inline-flex items-center gap-1 text-xs text-mocha hover:text-shocking">
          <ArrowLeft className="h-3 w-3"/> Volver
        </Link>
        <div className="rounded-2xl bg-white p-5 shadow ring-1 ring-mocha/10">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-wide text-mocha">Pedido</p>
              <p className="font-mono text-sm font-bold text-shocking">{pedido.ref ?? pedido.id.slice(0, 8)}</p>
            </div>
            <div className="text-right">
              <p className="text-xs uppercase tracking-wide text-mocha">Total</p>
              <p className="text-lg font-bold text-shocking">${pedido.total.toFixed(2)}</p>
            </div>
          </div>
          <p className="mt-2 text-xs text-mocha">Cliente: <strong>{pedido.cliente}</strong> · {pedido.tipo === "regalo" ? "Regalo" : "Mostrador"}</p>
          {pedido.status === "PENDING" && (
            <p className="mt-2 rounded bg-sunset/30 p-2 text-[11px] text-mocha">Tu comprobante está siendo revisado por Majito. En cuanto se libere, avanzará el semáforo.</p>
          )}
        </div>

        <div className="rounded-2xl bg-white p-5 shadow ring-1 ring-mocha/10">
          <p className="mb-3 text-sm font-bold text-shocking">Estado de tu pedido</p>
          <ol className="space-y-3">
            {PASOS.map((p, i) => {
              const done = i <= activeIdx;
              const now = i === activeIdx;
              return (
                <li key={p.key} className="flex items-center gap-3">
                  {done ? (
                    <CheckCircle2 className={`h-5 w-5 ${now ? "text-shocking animate-pulse" : "text-green-500"}`}/>
                  ) : (
                    <Circle className="h-5 w-5 text-mocha/30"/>
                  )}
                  <div className="flex-1">
                    <p className={`text-sm ${done ? "font-semibold text-foreground" : "text-mocha/50"}`}>
                      {p.emoji} {p.label}
                    </p>
                  </div>
                </li>
              );
            })}
          </ol>
        </div>

        {pedido.direccion && (
          <div className="rounded-2xl bg-white p-5 shadow ring-1 ring-mocha/10">
            <p className="mb-2 flex items-center gap-1 text-sm font-bold text-shocking">
              <MapPin className="h-4 w-4"/> Dirección de entrega
            </p>
            <p className="text-sm text-foreground">{pedido.direccion}</p>
            {pedido.lat != null && pedido.lng != null && (
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${pedido.lat},${pedido.lng}`}
                target="_blank" rel="noreferrer"
                className="mt-2 inline-block rounded-full bg-shocking px-3 py-1 text-[11px] font-bold text-white"
              >Ver en Google Maps</a>
            )}
          </div>
        )}
      </div>
    </div>
  );
}