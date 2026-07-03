// [Módulo: routes] -> [Archivo: eventos.tsx] -> [Acción: CREAR]
import { createFileRoute } from "@tanstack/react-router";
import { PuertaShell } from "@/components/PuertaShell";
import { EventCalendar } from "@/features/event-booking/EventCalendar";

export const Route = createFileRoute("/eventos")({
  component: EventosPage,
  head: () => ({
    meta: [
      { title: "El Carrito en tu evento · Majito Cake" },
      { name: "description", content: "Aparta tu fecha en el calendario. Un evento por día en Tuxpan." },
    ],
  }),
});

function EventosPage() {
  return (
    <PuertaShell
      letra="C"
      titulo="El Carrito en tu evento"
      subtitulo="Un solo evento por día. Aparta con el 50%."
    >
      <EventCalendar />
    </PuertaShell>
  );
}