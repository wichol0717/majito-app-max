import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { lookupOrder } from "@/lib/kds.functions";

export const Route = createFileRoute("/rastreo")({
  component: RastreoPage,
});

function RastreoPage() {
  return (
    <main className="min-h-screen bg-crema flex flex-col items-center justify-center p-6">
      <OrderTracker />
      
      <div className="mt-8">
        <Link
          to="/"
          className="rounded-full bg-mocha px-6 py-3 text-sm font-bold text-white hover:bg-mocha/80 transition-colors"
        >
          Volver a inicio
        </Link>
      </div>
    </main>
  );
}

function OrderTracker() {
  const [reference, setReference] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    const userInput = reference.trim();
    if (!userInput) {
      setError("Por favor ingresa un ID de pedido.");
      return;
    }

    setLoading(true);

    try {
      const result = await lookupOrder({ 
        data: { 
          orderId: userInput, 
          password: "majito2005" 
        } 
      });

      // ESTO NOS DIRÁ EN LA CONSOLA (F12) SI RECIBIMOS ALGO O SI FOUND ES FALSE
      console.log("Resultado de búsqueda:", result); 

      if (result.found) {
        if (result.tabla === "counter_orders") {
          window.location.href = `/pedido/${result.order.id}`;
        } else if (result.tabla === "gift_orders") {
          window.location.href = `/regalo/${result.order.id}`;
        } else if (result.tabla === "custom_cake_orders") {
          window.location.href = `/personalizado/${result.order.id}`;
        }
        return;
      }

      setError("No se encontró el pedido con ese ID.");
    } catch (err) {
      console.error(err);
      setError("Error al buscar, intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-md p-6 bg-white rounded-2xl shadow ring-1 ring-mocha/10 text-center">
      <h2 className="text-xl font-bold text-shocking mb-2">¿Dónde está mi pedido? 🍰</h2>
      <p className="text-xs text-mocha mb-4">Ingresa el ID de tu pedido para ver su semáforo.</p>
      <form onSubmit={handleSearch} className="space-y-3">
        <input
          type="text"
          value={reference}
          onChange={(e) => setReference(e.target.value)}
          placeholder="Ej: 91c64670"
          className="w-full rounded-lg border border-mocha/20 px-4 py-3 text-center text-base font-mono uppercase outline-none focus:border-shocking"
        />
        {error && <p className="text-xs text-red-600">{error}</p>}
        <button
          disabled={loading}
          className="w-full rounded-full bg-shocking py-3 text-sm font-bold text-white disabled:opacity-60 active:scale-[0.98]"
        >
          {loading ? "Buscando..." : "Buscar Pedido"}
        </button>
      </form>
    </div>
  );
}