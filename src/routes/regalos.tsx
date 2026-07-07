// [Módulo: routes] -> [Archivo: regalos.tsx] -> [Acción: CREAR]
import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Ticket } from "lucide-react";
import { PuertaShell } from "@/components/PuertaShell";
import { GiftCatalog } from "@/features/gifts/GiftCatalog";
import { useAppSettings } from "@/hooks/useAppSettings";
import { findCoupon, parseCupones, saveCupon, saveOrigen } from "@/lib/coupons";

export const Route = createFileRoute("/regalos")({
  component: RegalosPage,
  head: () => ({
    meta: [
      { title: "Regalos · Majito Cake" },
      { name: "description", content: "Catálogo de regalos y detalles especiales, hechos con amor en Tuxpan." },
    ],
  }),
});

function RegalosPage() {
  const { settings } = useAppSettings();
  const [promoMsg, setPromoMsg] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const promo = params.get("promo");
    if (!promo) return;
    const cupones = parseCupones((settings as any).cupones);
    const found = findCoupon(cupones, promo);
    if (found) {
      saveCupon(found.code);
      saveOrigen(`promo_${found.code}`);
      setPromoMsg(`🎉 Cupón ${found.code} activado: ${found.pct}% de descuento en tu carrito.`);
    }
  }, [settings]);

  return (
    <PuertaShell letra="D" titulo="Regalos" subtitulo="Detalles especiales listos para sorprender.">
      {promoMsg && (
        <div className="mb-4 flex items-start gap-2 rounded-2xl border-2 border-shocking/40 bg-gradient-to-r from-sweet-pink/40 to-sunset/40 p-3 text-sm text-foreground shadow">
          <Ticket className="mt-0.5 h-5 w-5 flex-none text-shocking"/>
          <p>{promoMsg} Se aplicará automáticamente al confirmar.</p>
        </div>
      )}
      <GiftCatalog />
    </PuertaShell>
  );
}