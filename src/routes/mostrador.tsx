// [Módulo: routes] -> [Archivo: mostrador.tsx] -> [Acción: CREAR]
import { createFileRoute } from "@tanstack/react-router";
// He cambiado las rutas de @/ a relativas (../) para evitar problemas de resolución de alias
import { PuertaShell } from "../components/PuertaShell";
import { CounterStore } from "../features/counter-store/CounterStore";

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