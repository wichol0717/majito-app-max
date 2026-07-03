// [Módulo: routes] -> [Archivo: regalos.tsx] -> [Acción: CREAR]
import { createFileRoute } from "@tanstack/react-router";
import { PuertaShell } from "@/components/PuertaShell";
import { GiftCatalog } from "@/features/gifts/GiftCatalog";

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
  return (
    <PuertaShell letra="D" titulo="Regalos" subtitulo="Detalles especiales listos para sorprender.">
      <GiftCatalog />
    </PuertaShell>
  );
}