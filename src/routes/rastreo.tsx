import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";

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

    const userInput = reference.trim().toUpperCase();
    if (!userInput) {
      setError("Por favor ingresa una referencia.");
      return;
    }

    setLoading(true);

    const { data: allData, error: fetchError } = await supabase
      .from("counter_orders")
      .select("*");

    console.log("Error de conexión:", fetchError);
    console.log("Registros totales en counter_orders:", allData);

    const { data: counterData } = await supabase
      .from("counter_orders")
      .select("id")
      .ilike("payment_reference", userInput)
      .maybeSingle();

    if (counterData?.id) {
      window.location.href = `/pedido/${counterData.id}`;
      return;
    }

    const { data: giftData } = await supabase
      .from("gift_orders")
      .select("id")
      .ilike("payment_reference", userInput)
      .maybeSingle();

    if (giftData?.id) {
      window.location.href = `/regalo/${giftData.id}`;
      return;
    }

    setLoading(false);
    setError("No se encontró el pedido. Revisa la consola (F12).");
  }

  return (
    <div className="w-full max-w-md p-6 bg-white rounded-2xl shadow ring-1 ring-mocha/10 text-center">
      <h2 className="text-xl font-bold text-shocking mb-2">¿Dónde está mi pedido? 🍰</h2>
      <p className="text-xs text-mocha mb-4">Ingresa la referencia de tu compra para ver tu semáforo.</p>
      <form onSubmit={handleSearch} className="space-y-3">
        <input
          type="text"
          value={reference}
          onChange={(e) => setReference(e.target.value)}
          placeholder="Ej: MAJITO-EWGK"
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