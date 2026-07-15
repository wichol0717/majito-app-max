// [Módulo: routes] -> [Archivo: personalizado.$orderId.tsx]
import { createFileRoute } from "@tanstack/react-router";
import { lookupOrder } from "@/lib/kds.functions";
import { useEffect, useState } from "react";

export const Route = createFileRoute("/personalizado/$orderId")({
  component: OrderStatusPage,
});

function OrderStatusPage() {
  const { orderId } = Route.useParams();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const steps = [
    { id: "pending", label: "Validando pago", icon: "💳" },
    { id: "en_cocina", label: "En cocina", icon: "👨‍🍳" },
    { id: "ready", label: "Listo", icon: "🍰" },
    { id: "out_for_delivery", label: "En camino", icon: "🚚" },
    { id: "delivered", label: "Entregado", icon: "✅" },
  ];

  useEffect(() => {
    async function fetchOrder() {
      try {
        setLoading(true);
        const result = await lookupOrder({ 
          data: { orderId: orderId, password: "majito2005" } 
        });

        if (result.found) {
          setOrder(result.order);
        } else {
          setError("No se encontró el pedido.");
        }
      } catch (err) {
        setError("Error al cargar los datos.");
      } finally {
        setLoading(false);
      }
    }

    fetchOrder();
  }, [orderId]);

  const currentStepIndex = steps.findIndex((s) => s.id === order?.delivery_status);

  return (
    <div className="p-4 space-y-6">
      {loading && <p className="text-center">Cargando...</p>}
      {error && <p className="text-center text-red-500">{error}</p>}
      
      {order && (
        <>
          {/* Tarjeta de Resumen */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-mocha/10">
            <div className="flex justify-between items-start mb-2">
              <div>
                <p className="text-xs text-mocha/60 font-bold uppercase tracking-wider">PEDIDO</p>
                <h2 className="text-lg font-bold text-shocking">MAJITO-{order.id.slice(0, 4).toUpperCase()}</h2>
              </div>
              <p className="text-lg font-bold text-shocking">${order.total || "0.00"}</p>
            </div>
            <p className="text-sm text-mocha/80">Cliente: {order.nombre_cliente} • {order.tabla_origen || "Mostrador"}</p>
            <div className="mt-4 p-3 bg-crema rounded-lg text-xs text-mocha/70">
              Tu pedido está siendo procesado por Majito. En cuanto se libere, avanzará el semáforo.
            </div>
          </div>

          {/* Tarjeta de Semáforo */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-mocha/10">
            <h3 className="font-bold text-mocha mb-4">Estado de tu pedido</h3>
            <div className="space-y-4">
              {steps.map((step, index) => {
                const isActive = index <= currentStepIndex;
                return (
                  <div key={step.id} className="flex items-center gap-3">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center border-2 
                      ${isActive ? "border-shocking bg-shocking text-white" : "border-mocha/20 text-transparent"}`}>
                      {isActive && "✓"}
                    </div>
                    <span className={`${isActive ? "text-mocha font-bold" : "text-mocha/40"}`}>
                      {step.icon} {step.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}