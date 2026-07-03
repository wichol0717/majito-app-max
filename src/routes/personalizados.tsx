// [Módulo: routes] -> [Archivo: personalizados.tsx] -> [Acción: CREAR]
import { createFileRoute } from "@tanstack/react-router";
import { PuertaShell } from "@/components/PuertaShell";
import { CustomCakeForm } from "@/features/custom-cakes/CustomCakeForm";

export const Route = createFileRoute("/personalizados")({
  component: PersonalizadosPage,
  head: () => ({
    meta: [
      { title: "Pastel Personalizado · Majito Cake" },
      { name: "description", content: "El pastel de tus sueños, hecho a mano en Tuxpan. Aparta con 50%." },
    ],
  }),
});

function PersonalizadosPage() {
  return (
    <PuertaShell
      letra="B"
      titulo="El pastel de tus sueños"
      subtitulo="Sube tu foto de referencia y aparta con el 50%."
    >
      <CustomCakeForm />
    </PuertaShell>
  );
}