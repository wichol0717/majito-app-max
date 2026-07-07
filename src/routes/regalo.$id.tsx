import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Gift, ArrowRight, MapPin } from "lucide-react";
import { supabase } from "@/api/supabase";
import { saveOrigen, saveCupon } from "@/lib/coupons";

export const Route = createFileRoute("/regalo/$id")({
  head: () => ({
    meta: [
      { title: "🎁 Tienes un regalo — Majito Cake" },
      { name: "description", content: "Alguien te envió un regalo dulce desde Majito Cake." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: TarjetaRegalo,
});

interface Regalo {
  id: string;
  mensaje: string;
  emoji: string;
  para: string | null;
  de: string | null;
  producto: string | null;
  direccion: string | null;
  delivery: string;
}

function TarjetaRegalo() {
  const { id } = Route.useParams();
  const [r, setR] = useState<Regalo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Marcar origen del visitante (destinatario o comprador que abre su tarjeta)
    saveOrigen("regalo_digital");
    saveCupon("REGALO5");
    (async () => {
      const { data } = await supabase.from("gift_orders").select("*").eq("id", id).maybeSingle();
      const row: any = data;
      if (row) {
        const items = row.gift_items ?? row.items ?? [];
        const first = Array.isArray(items) && items[0] ? items[0] : {};
        setR({
          id: row.id,
          mensaje: row.mensaje ?? row.message ?? "Un detalle con mucho cariño",
          emoji: row.emoji ?? "🎁",
          para: row.recipient_name ?? first.para ?? null,
          de: row.customer_name ?? row.buyer_name ?? null,
          producto: first.producto ?? null,
          direccion: row.direccion_texto ?? row.recipient_location ?? null,
          delivery: row.delivery_status ?? "validando_pago",
        });
      }
      setLoading(false);
    })();
  }, [id]);

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center bg-crema text-mocha">Cargando tu regalo…</div>;
  }
  if (!r) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-crema p-6 text-center">
        <p className="text-lg font-bold text-shocking">Regalo no encontrado</p>
        <Link to="/regalos" className="rounded-full bg-shocking px-4 py-2 text-sm font-bold text-white">Ver regalos disponibles</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-sweet-pink/40 via-crema to-sunset/40 px-4 py-10">
      <div className="mx-auto max-w-md">
        <div className="relative rounded-3xl bg-white p-8 text-center shadow-2xl ring-4 ring-shocking/20">
          <div className="absolute -top-6 left-1/2 -translate-x-1/2 rounded-full bg-shocking px-4 py-1 text-xs font-bold uppercase tracking-wider text-white shadow">
            Tarjeta digital
          </div>
          <p className="mt-2 text-6xl">{r.emoji}</p>
          <p className="mt-3 text-xs uppercase tracking-wide text-mocha">Para</p>
          <p className="text-2xl font-bold text-shocking">{r.para ?? "Ti"}</p>
          <div className="my-4 rounded-2xl bg-sweet-pink/20 p-4">
            <p className="text-lg font-semibold text-foreground">"{r.mensaje}"</p>
          </div>
          {r.de && (
            <p className="text-sm text-mocha">
              Con cariño, <strong className="text-shocking">{r.de}</strong>
            </p>
          )}
          {r.producto && (
            <div className="mt-4 flex items-center justify-center gap-2 rounded-full bg-crema px-4 py-2 text-xs font-semibold text-mocha">
              <Gift className="h-4 w-4 text-shocking"/> Te enviamos: <span className="text-shocking">{r.producto}</span>
            </div>
          )}
          {r.direccion && (
            <p className="mt-3 flex items-center justify-center gap-1 text-[11px] text-mocha">
              <MapPin className="h-3 w-3"/> Se entrega en: {r.direccion}
            </p>
          )}
        </div>

        <div className="mt-6 grid gap-3">
          <Link
            to="/pedido/$id"
            params={{ id: r.id }}
            className="flex items-center justify-center gap-2 rounded-full bg-shocking px-4 py-3 text-sm font-bold text-white shadow hover:bg-shocking/90"
          >
            Ver estado de tu regalo <ArrowRight className="h-4 w-4"/>
          </Link>
          <a
            href="/regalos?promo=REGALO5"
            className="flex items-center justify-center gap-2 rounded-full bg-sweet-pink px-4 py-3 text-sm font-bold text-foreground shadow hover:bg-sweet-pink/80"
          >
            <Gift className="h-4 w-4"/> ¡Regala tú también! 5% OFF con REGALO5
          </a>
        </div>

        <p className="mt-8 text-center text-[11px] text-mocha">
          Hecho con amor por <Link to="/" className="font-bold text-shocking">Majito Cake</Link> · Tuxpan, Ver.
        </p>
      </div>
    </div>
  );
}