// [Módulo: routes] -> [Archivo: personalizado.tsx]
import { createFileRoute, Outlet, useRouterState } from "@tanstack/react-router";
import { PuertaShell } from "@/components/PuertaShell";
import { CustomCakeForm } from "@/features/custom-cakes/CustomCakeForm";

export const Route = createFileRoute("/personalizado")({
  component: PersonalizadoPage,
});

function PersonalizadoPage() {
  // Obtenemos la ruta actual para saber si estamos en la raíz o en un sub-pedido
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  
  // Verificamos si estamos exactamente en la ruta base
  const isBaseRoute = pathname === "/personalizado";

  return (
    <PuertaShell
      letra="B"
      titulo={isBaseRoute ? "El pastel de tus sueños" : "Seguimiento"}
      subtitulo={isBaseRoute ? "Sube tu foto de referencia y cotiza." : "Detalle del pedido"}
    >
      {/* 
        CONDICIONAL: 
        Si estamos en /personalizado, mostramos el formulario.
        Si estamos en /personalizado/lo-que-sea, el Outlet renderiza el contenido 
        de personalizado.$orderId.tsx automáticamente.
      */}
      {isBaseRoute ? (
        <CustomCakeForm />
      ) : (
        <Outlet />
      )}
    </PuertaShell>
  );
}