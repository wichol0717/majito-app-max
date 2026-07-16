// [Módulo: routes] -> [Archivo: eventos.tsx] -> [Acción: CORRECCIÓN COMPLETA]
import { createFileRoute } from "@tanstack/react-router";
import { PuertaShell } from "@/components/PuertaShell";
import { EventCalendar } from "@/features/event-booking/EventCalendar";
import { supabase } from "@/api/supabase";

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
  
  // CORRECCIÓN: Se cambió 'event_date' por 'fecha_evento' para coincidir con EventCalendar
  const handleRegisterBooking = async (bookingData: {
    client_name: string;
    client_whatsapp: string;
    fecha_evento: string; 
    event_address: string;
    package_name: string;
    total_price: number;
  }) => {
    // Mapeo definitivo a las columnas existentes en tu tabla Supabase
    const { error } = await supabase
      .from("event_bookings")
      .insert([{
        nombre_cliente: bookingData.client_name,
        fecha_evento: bookingData.fecha_evento, // Se usa la propiedad correcta
        precio_acordado: bookingData.total_price,
        detalles: `WhatsApp: ${bookingData.client_whatsapp} | Dirección: ${bookingData.event_address} | Paquete: ${bookingData.package_name}`
      }]);

    if (error) {
      console.error("Error al registrar el evento:", error);
      throw error;
    }
  };

  return (
    <PuertaShell
      letra="C"
      titulo="El Carrito en tu evento"
      subtitulo="Un solo evento por día. Aparta con el 50%."
    >
      <EventCalendar onRegister={handleRegisterBooking} />
    </PuertaShell>
  );
}