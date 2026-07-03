// [Módulo: routes] -> [Archivo: mostrador.tsx] -> [Acción: CREAR]
import { createFileRoute } from "@tanstack/react-router";
import { PuertaShell } from "@/components/PuertaShell";
import { CounterStore } from "@/features/counter-store/CounterStore";

export const Route = createFileRoute("/mostrador")({
  component: MostradorPage,
  head: () => ({
    meta: [
      { title: "Mostrador · Majito Cake" },
      { name: "description", content: "Galletas y pasteles de línea, entrega inmediata en Tuxpan." },
    ],
  }),
});

function MostradorPage() {
  return (
    <PuertaShell letra="A" titulo="Mostrador" subtitulo="Elige, paga y llévatelo hoy mismo.">
      <CounterStore />
    </PuertaShell>
  );
}