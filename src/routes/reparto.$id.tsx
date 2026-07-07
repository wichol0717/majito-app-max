import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Phone, MapPin, CheckCircle2, Package, DollarSign, Loader2, QrCode } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/api/supabase";
import { markOrderDelivered } from "@/lib/admin.functions";

export const Route = createFileRoute("/reparto/$id")({
  head: () => ({
    meta: [
      { title: "Reparto — Majito Cake" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: RepartoView,
});

interface Pedido {
  id: string;
  tabla: "counter_orders" | "gift_orders";
  cliente: string;
  whatsapp: string;
  total: number;
  metodo: string;
  ref: string | null;
  proof: string | null;
  direccion: string | null;
  lat: number | null;
  lng: number | null;
  delivery: string;
  status: string;
  esRegalo: boolean;
  paraFestejado: string | null;
  waFestejado: string | null;
}

async function fetchPedido(id: string): Promise<Pedido | null> {
  const c = await supabase.from("counter_orders").select("*").eq("id", id).maybeSingle();
  const build = (r: any, tabla: Pedido["tabla"], esRegalo: boolean): Pedido => {
    const items = r.gift_items ?? [];
    const first = Array.isArray(items) && items[0] ? items[0] : {};
    return {
      id: r.id, tabla,
      cliente: r.customer_name ?? r.buyer_name ?? "—",
      whatsapp: r.customer_whatsapp ?? r.buyer_whatsapp ?? "",
      total: Number(r.total_paid ?? r.total ?? 0),
      metodo: r.payment_method ?? "efectivo",
      ref: r.payment_reference ?? null,
      proof: r.proof_image_url ?? null,
      direccion: r.direccion_texto ?? r.recipient_location ?? null,
      lat: r.latitud ?? null, lng: r.longitud ?? null,
      delivery: r.delivery_status ?? "validando_pago",
      status: r.status ?? "PENDING",
      esRegalo,
      paraFestejado: r.recipient_name ?? first.para ?? null,
      waFestejado: r.recipient_whatsapp ?? first.wa_festejado ?? null,
    };
  };
  if (c.data) return build(c.data, "counter_orders", false);
  const g = await supabase.from("gift_orders").select("*").eq("id", id).maybeSingle();
  if (g.data) return build(g.data, "gift_orders", true);
  return null;
}

function RepartoView() {
  const { id } = Route.useParams();
  const [pedido, setPedido] = useState<Pedido | null>(null);
  const [loading, setLoading] = useState(true);
  const [confirmando, setConfirmando] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const mark = useServerFn(markOrderDelivered);

  async function reload() {
    const p = await fetchPedido(id);
    setPedido(p); setLoading(false);
  }
  useEffect(() => { reload(); /* eslint-disable-next-line */ }, [id]);

  async function marcarEntregado() {
    if (!pedido) return;
    setConfirmando(true);
    try {
      await mark({ data: { id: pedido.id, tabla: pedido.tabla } });
      setMsg("¡Entrega confirmada!");
      await reload();
    } catch {
      setMsg("No se pudo marcar. Pide a Majito confirmarlo desde el panel.");
    } finally {
      setConfirmando(false);
    }
  }

  if (loading) return <div className="flex min-h-screen items-center justify-center bg-crema text-mocha">Cargando pedido…</div>;
  if (!pedido) return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-crema p-6 text-center">
      <p className="font-bold text-shocking">Pedido no encontrado</p>
      <Link to="/" className="rounded-full bg-shocking px-4 py-2 text-sm font-bold text-white">Ir al inicio</Link>
    </div>
  );

  const mapsDir = pedido.lat != null && pedido.lng != null
    ? `https://www.google.com/maps/dir/?api=1&destination=${pedido.lat},${pedido.lng}`
    : pedido.direccion
      ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(pedido.direccion)}`
      : null;

  const yaEntregado = pedido.delivery === "entregado";
  const tarjetaUrl = typeof window !== "undefined"
    ? `${window.location.origin}/regalo/${pedido.id}`
    : `/regalo/${pedido.id}`;

  return (
    <div className="min-h-screen bg-crema px-4 py-6">
      <div className="mx-auto max-w-md space-y-4">
        <div className="rounded-2xl bg-shocking p-4 text-white shadow">
          <p className="text-xs uppercase tracking-wider opacity-80">Ruta de reparto</p>
          <p className="mt-1 text-lg font-bold">{pedido.esRegalo ? "🎁 Regalo" : "🛍️ Pedido"} · {pedido.ref ?? pedido.id.slice(0, 8)}</p>
        </div>

        <section className="rounded-2xl bg-white p-4 shadow ring-1 ring-mocha/10">
          <p className="text-xs uppercase tracking-wide text-mocha">Entregar a</p>
          <p className="text-lg font-bold text-foreground">
            {pedido.esRegalo ? (pedido.paraFestejado ?? "Festejado") : pedido.cliente}
          </p>
          {pedido.esRegalo && pedido.waFestejado && (
            <a href={`tel:${pedido.waFestejado}`} className="mt-1 inline-flex items-center gap-1 rounded-full bg-green-500 px-3 py-1 text-xs font-bold text-white">
              <Phone className="h-3 w-3"/> Llamar festejado
            </a>
          )}
          <div className="mt-2 rounded-lg bg-crema p-2 text-xs text-mocha">
            <p><strong>Comprador:</strong> {pedido.cliente}</p>
            {pedido.whatsapp && (
              <a href={`tel:${pedido.whatsapp}`} className="mt-1 inline-flex items-center gap-1 text-shocking">
                <Phone className="h-3 w-3"/> {pedido.whatsapp}
              </a>
            )}
          </div>
        </section>

        {pedido.direccion && (
          <section className="rounded-2xl bg-white p-4 shadow ring-1 ring-mocha/10">
            <p className="mb-1 flex items-center gap-1 text-xs uppercase tracking-wide text-mocha">
              <MapPin className="h-3 w-3"/> Dirección
            </p>
            <p className="text-sm text-foreground">{pedido.direccion}</p>
            {mapsDir && (
              <a href={mapsDir} target="_blank" rel="noreferrer"
                 className="mt-2 flex items-center justify-center gap-2 rounded-xl bg-shocking px-3 py-2 text-sm font-bold text-white">
                <MapPin className="h-4 w-4"/> Abrir ruta en Google Maps
              </a>
            )}
          </section>
        )}

        <section className="rounded-2xl bg-white p-4 shadow ring-1 ring-mocha/10">
          <div className="flex items-center justify-between">
            <p className="flex items-center gap-1 text-xs uppercase tracking-wide text-mocha">
              <DollarSign className="h-3 w-3"/> Total a cobrar
            </p>
            <p className="text-xl font-bold text-shocking">${pedido.total.toFixed(2)}</p>
          </div>
          <p className="mt-1 text-[11px] text-mocha">
            Método: <strong>{pedido.metodo.toUpperCase()}</strong>
            {pedido.metodo === "spei" && " · Ya pagado por SPEI"}
          </p>
          {pedido.proof && (
            <a href={pedido.proof} target="_blank" rel="noreferrer" className="mt-2 block">
              <img src={pedido.proof} alt="Comprobante" className="max-h-40 w-full rounded object-contain"/>
              <p className="text-center text-[10px] text-mocha">Comprobante SPEI · toca para ampliar</p>
            </a>
          )}
        </section>

        {pedido.esRegalo && (
          <section className="rounded-2xl bg-sweet-pink/20 p-4 shadow ring-1 ring-sweet-pink/40">
            <p className="flex items-center gap-1 text-xs uppercase tracking-wide text-shocking">
              <QrCode className="h-3 w-3"/> Tarjeta digital
            </p>
            <p className="mt-1 text-[11px] text-mocha">
              Muestra este QR al festejado o abre el enlace en su teléfono para que vea su tarjeta.
            </p>
            <img
              src={`https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(tarjetaUrl)}`}
              alt="QR de tarjeta digital"
              className="mx-auto mt-2 h-40 w-40 rounded bg-white p-2"
            />
            <a href={tarjetaUrl} target="_blank" rel="noreferrer"
               className="mt-2 block text-center text-[11px] text-shocking underline">
              {tarjetaUrl}
            </a>
          </section>
        )}

        <section className="rounded-2xl bg-white p-4 shadow ring-1 ring-mocha/10">
          <p className="text-xs uppercase tracking-wide text-mocha">Estado</p>
          <p className="text-sm font-bold text-shocking capitalize">{pedido.delivery.replace(/_/g, " ")}</p>
          {!yaEntregado ? (
            <button
              type="button"
              disabled={confirmando}
              onClick={marcarEntregado}
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-green-500 px-4 py-3 text-sm font-bold text-white shadow disabled:opacity-60"
            >
              {confirmando ? <Loader2 className="h-4 w-4 animate-spin"/> : <CheckCircle2 className="h-4 w-4"/>}
              {confirmando ? "Marcando…" : "Marcar entregado"}
            </button>
          ) : (
            <p className="mt-2 flex items-center gap-1 rounded-lg bg-green-100 p-2 text-xs font-bold text-green-700">
              <Package className="h-4 w-4"/> Entrega completada
            </p>
          )}
          {msg && <p className="mt-2 text-[11px] text-mocha">{msg}</p>}
        </section>
      </div>
    </div>
  );
}