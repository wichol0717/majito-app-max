import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/api/supabase";
import { saveOrigen, saveCupon } from "@/lib/coupons";
import { DigitalCard } from "@/components/DigitalCard";

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
  payment_reference: string;
  mensaje: string;
  emoji: string;
  para: string | null;
  de: string | null;
  producto: string | null;
  direccion: string | null;
  delivery: string;
  customer_whatsapp?: string;
  tipo_tarjeta?: string; // <-- Agregado para tipar la tarjeta
}

function TarjetaRegalo() {
  const { id } = Route.useParams();
  const [r, setR] = useState<Regalo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    saveOrigen("regalo_digital");
    saveCupon("REGALO5");
    (async () => {
      const isUuid = id.length > 20;

      const { data } = await supabase
        .from("gift_orders")
        .select("*")
        .eq((isUuid ? "id" : "payment_reference") as any, id)
        .maybeSingle();

      const row: any = data;
      if (row) {
        const items = row.gift_items ?? row.items ?? [];
        const first = Array.isArray(items) && items[0] ? items[0] : {};
        setR({
          id: row.id,
          payment_reference: row.payment_reference ?? id,
          mensaje: row.mensaje ?? row.message ?? "Un detalle con mucho cariño",
          emoji: row.emoji ?? "🎁",
          para: row.recipient_name ?? first.para ?? null,
          de: row.customer_name ?? row.buyer_name ?? null,
          producto: first.producto ?? null,
          direccion: row.direccion_texto ?? row.recipient_location ?? null,
          delivery: row.delivery_status ?? "validando_pago",
          customer_whatsapp: row.customer_whatsapp ?? "",
          tipo_tarjeta: row.tipo_tarjeta ?? first.tipo_tarjeta ?? "cumple", // <-- Leemos el tipo de tarjeta dinámico
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
        
        <DigitalCard 
          recipientName={r.para ?? "Amigo"}
          senderName={r.de ?? "Un amigo"}
          giftMessage={r.mensaje}
          senderWhatsapp={r.customer_whatsapp ?? ""}
          bakeryWhatsapp="7831450929"
          orderId={r.id}
          paymentReference={r.payment_reference}
          design={r.tipo_tarjeta ?? "cumple"} // <-- Ahora usa la tarjeta seleccionada dinámicamente
        />

        <div className="mt-6 grid gap-3">
          <Link
            to="/pedido/$id"
            params={{ id: r.id }}
            className="flex items-center justify-center gap-2 rounded-full border-2 border-mocha/20 bg-white px-4 py-3 text-sm font-bold text-mocha shadow hover:bg-mocha/5"
          >
            Ver estado de tu pedido
          </Link>
        </div>

        <p className="mt-8 text-center text-[11px] text-mocha">
          Hecho con amor por <Link to="/" className="font-bold text-shocking">Majito Cake</Link> · Tuxpan, Ver.
        </p>
      </div>
    </div>
  );
}